#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ESLint } = require('eslint');
const postcss = require('postcss');
const postcssJs = require('postcss-js');
const { program } = require('commander');

// Configuration
const CONFIG = {
  // File patterns to check
  patterns: {
    js: ['**/*.{js,jsx,ts,tsx}'],
    css: ['**/*.{css,scss}'],
    html: ['**/*.{html,jsx,tsx}'],
  },
  
  // Banned patterns with error messages
  bannedPatterns: [
    {
      pattern: /aspect-ratio:\s*1\s*\/\s*1/g,
      message: 'Use 16:10 or 19.5:9 aspect ratios instead of 1:1',
      severity: 'error'
    },
    {
      pattern: /service_role/g,
      message: 'Direct client usage of service_role is forbidden',
      severity: 'error',
      exclude: ['**/migrations/**', '**/tests/**']
    },
    {
      pattern: /<img(?!.*?alt=)/g,
      message: 'Missing alt attribute on img tag',
      severity: 'error'
    },
    {
      pattern: /<div[^>]*role=["']?button["']?[^>]*>/g,
      message: 'Use <button> or <Button> instead of role="button"',
      severity: 'warning'
    },
  ],
  
  // Required event properties for analytics
  requiredEventProperties: {
    'page_view': ['url', 'title', 'referrer'],
    'button_click': ['label', 'action'],
    'form_submit': ['form_name', 'status']
  }
};

// Initialize results
const results = {
  errors: [],
  warnings: [],
  suggestions: []
};

// Parse command line arguments
program
  .option('--diff <ref>', 'Git reference to compare against (e.g., main, HEAD~1)')
  .option('--fix', 'Automatically fix fixable issues')
  .parse(process.argv);

const options = program.opts();

/**
 * Get list of changed files
 */
async function getChangedFiles() {
  try {
    const diffCommand = `git diff --name-only --diff-filter=ACMRTUXB ${options.diff || 'HEAD~1'}`;
    const output = execSync(diffCommand).toString().trim();
    return output ? output.split('\n') : [];
  } catch (error) {
    console.error('Error getting changed files:', error.message);
    process.exit(1);
  }
}

/**
 * Check file for banned patterns
 */
async function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const ext = path.extname(filePath).toLowerCase();
  
  // Check for banned patterns
  CONFIG.bannedPatterns.forEach(rule => {
    if (rule.exclude && rule.exclude.some(pattern => 
      filePath.includes(pattern.replace('**', ''))
    )) return;
    
    const matches = content.match(rule.pattern);
    if (matches) {
      const lines = content.split('\n');
      const lineNumbers = [];
      
      // Find line numbers where pattern occurs
      lines.forEach((line, index) => {
        if (rule.pattern.test(line)) {
          lineNumbers.push(index + 1);
        }
      });
      
      const result = {
        file: filePath,
        message: rule.message,
        lines: lineNumbers,
        severity: rule.severity,
        fix: rule.fix
      };
      
      if (rule.severity === 'error') {
        results.errors.push(result);
      } else {
        results.warnings.push(result);
      }
    }
  });
  
  // Run specific checks based on file type
  if (ext.match(/\.(js|jsx|ts|tsx)$/)) {
    await checkJavaScriptFile(filePath, content);
  } else if (ext === '.css') {
    await checkCssFile(filePath, content);
  } else if (ext === '.html' || ext === '.jsx' || ext === '.tsx') {
    await checkHtmlFile(filePath, content);
  }
}

/**
 * Check JavaScript/TypeScript files
 */
async function checkJavaScriptFile(filePath, content) {
  // Check for analytics events
  const eventCalls = content.match(/track\(['"]([^'"]+)['"](?:,\s*({[^}]*}))?/g) || [];
  
  eventCalls.forEach(call => {
    const match = call.match(/track\(['"]([^'"]+)['"](?:,\s*({[^}]*}))?/);
    if (!match) return;
    
    const eventName = match[1];
    const eventProps = match[2] ? match[2].trim() : '{}';
    
    if (CONFIG.requiredEventProperties[eventName]) {
      const requiredProps = CONFIG.requiredEventProperties[eventName];
      const missingProps = requiredProps.filter(prop => 
        !eventProps.includes(`"${prop}"`) && !eventProps.includes(`'${prop}'`)
      );
      
      if (missingProps.length > 0) {
        results.errors.push({
          file: filePath,
          message: `Event "${eventName}" is missing required properties: ${missingProps.join(', ')}`,
          severity: 'error',
          fix: `Add missing properties: ${missingProps.map(p => `'${p}'`).join(', ')}`
        });
      }
    }
  });
  
  // Check for RLS bypass patterns
  if (content.includes('rpc(') || content.includes('.rpc(')) {
    results.warnings.push({
      file: filePath,
      message: 'Direct RPC calls should be wrapped in server functions with proper auth checks',
      severity: 'warning'
    });
  }
}

/**
 * Check CSS files
 */
async function checkCssFile(filePath, content) {
  try {
    const root = postcss.parse(content);
    
    root.walkDecls(decl => {
      // Check for hardcoded colors
      if (decl.prop === 'color' || decl.prop.includes('background') || decl.prop.includes('border')) {
        if (decl.value.match(/^#[0-9a-fA-F]{3,6}$/)) {
          results.suggestions.push({
            file: filePath,
            message: `Use CSS variables for colors instead of hex codes (${decl.value})`,
            severity: 'suggestion',
            fix: 'Define color in theme variables and use var(--color-name)'
          });
        }
      }
      
      // Check for fixed dimensions
      if ((decl.prop === 'width' || decl.proc === 'height') && 
          !decl.value.includes('var(') && 
          !decl.value.includes('calc(')) {
        results.suggestions.push({
          file: filePath,
          message: `Consider using relative units or container queries instead of fixed ${decl.prop}`,
          severity: 'suggestion'
        });
      }
    });
  } catch (error) {
    console.error(`Error parsing CSS in ${filePath}:`, error.message);
  }
}

/**
 * Check HTML/JSX/TSX files
 */
async function checkHtmlFile(filePath, content) {
  // Check for missing aria-labels on interactive elements
  const interactiveElements = content.match(/<(button|a|input|select|textarea)[^>]*>/g) || [];
  
  interactiveElements.forEach(tag => {
    const hasAriaLabel = tag.includes('aria-label=') || 
                        tag.includes('aria-labelledby=') ||
                        (tag.includes('alt=') && tag.includes('<img'));
                        
    const hasTextContent = tag.match(/>(.*?)<\//) && tag.match(/>(.*?)<\//)[1].trim().length > 0;
    
    if (!hasAriaLabel && !hasTextContent) {
      results.warnings.push({
        file: filePath,
        message: 'Interactive element is missing accessible name',
        severity: 'warning',
        fix: 'Add aria-label, aria-labelledby, or visible text content'
      });
    }
  });
  
  // Check for missing focus styles
  if (content.includes(':focus') && !content.includes(':focus-visible')) {
    results.suggestions.push({
      file: filePath,
      message: 'Use :focus-visible instead of :focus for better keyboard navigation',
      severity: 'suggestion',
      fix: 'Replace :focus with :focus-visible'
    });
  }
  
  // Check for missing reduced motion media query
  if (content.includes('@media') && !content.includes('prefers-reduced-motion')) {
    results.suggestions.push({
      file: filePath,
      message: 'Consider adding reduced motion support',
      severity: 'suggestion',
      fix: 'Add @media (prefers-reduced-motion: reduce) { /* reduced motion styles */ }'
    });
  }
}

/**
 * Run ESLint on the codebase
 */
async function runEslint() {
  const eslint = new ESLint({
    fix: options.fix,
    overrideConfig: {
      extends: ['eslint:recommended', 'plugin:react/recommended'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'react-hooks'],
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'react/prop-types': 'off',
        'react/react-in-jsx-scope': 'off',
      },
    },
  });
  
  const results = await eslint.lintFiles(CONFIG.patterns.js);
  
  if (options.fix) {
    await ESLint.outputFixes(results);
  }
  
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  
  if (resultText) {
    console.log(resultText);
  }
  
  return results.some(result => result.errorCount > 0);
}

/**
 * Generate a report of all issues found
 */
function generateReport() {
  let output = '';
  let hasErrors = false;
  
  // Group issues by file
  const allIssues = {
    error: results.errors,
    warning: results.warnings,
    suggestion: results.suggestions
  };
  
  // Print issues by severity
  Object.entries(allIssues).forEach(([severity, issues]) => {
    if (issues.length === 0) return;
    
    if (severity === 'error') hasErrors = true;
    
    output += `\n${severity.toUpperCase()}S (${issues.length}):\n`;
    
    issues.forEach(issue => {
      const location = issue.lines ? `:${issue.lines.join(',')}` : '';
      output += `  ${issue.file}${location}: ${issue.message}\n`;
      if (issue.fix) {
        output += `  💡 Fix: ${issue.fix}\n`;
      }
    });
  });
  
  // Print summary
  const summary = `\nPR Review Summary:
  Errors: ${results.errors.length}
  Warnings: ${results.warnings.length}
  Suggestions: ${results.suggestions.length}
`;
  
  console.log(summary + output);
  
  if (hasErrors) {
    console.log('❌ PR review failed. Please fix the errors above.');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('⚠️  PR review completed with warnings.');
  } else {
    console.log('✅ PR review passed!');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting PR review...');
  
  // Get changed files
  const changedFiles = await getChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('No files changed.');
    return;
  }
  
  console.log(`Found ${changedFiles.length} changed files.`);
  
  // Check each file
  for (const file of changedFiles) {
    await checkFile(file);
  }
  
  // Run ESLint
  const hasLintErrors = await runEslint();
  if (hasLintErrors) {
    results.errors.push({
      file: 'Multiple files',
      message: 'ESLint found errors in the code',
      severity: 'error'
    });
  }
  
  // Generate and print report
  generateReport();
}

// Run the main function
main().catch(error => {
  console.error('Error during PR review:', error);
  process.exit(1);
});
