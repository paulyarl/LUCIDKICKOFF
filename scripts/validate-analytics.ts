#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { AnalyticsEventSchema } from '../apps/web/lib/analytics/events';
import { z } from 'zod';

// Find all TypeScript and JavaScript files in the project
function findFiles(dir: string, fileList: string[] = []) {
  const files = readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (['node_modules', '.next', '.git', 'dist', 'build'].includes(file.name)) {
        return;
      }
      findFiles(filePath, fileList);
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(file.name))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Extract all trackEvent calls from a file
function extractTrackEventCalls(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const trackEventRegex = /trackEvent\(([\s\S]*?)\)/g;
  const events: string[] = [];
  
  let match;
  while ((match = trackEventRegex.exec(content)) !== null) {
    try {
      // Try to parse the event object
      const eventStr = match[1].trim();
      // Handle multi-line objects by cleaning up whitespace and newlines
      const cleaned = eventStr
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '') // Remove line comments
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/'/g, '"') // Convert single quotes to double quotes
        .replace(/([{\[,])\s*([a-zA-Z0-9_]+):/g, '$1"$2":') // Add quotes around property names
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Handle string values with single quotes
        .replace(/,/g, ', ') // Ensure consistent spacing after commas
        .trim();
      
      // Try to parse as JSON
      const event = JSON.parse(cleaned);
      events.push(JSON.stringify(event, null, 2));
    } catch (error) {
      console.warn(`Could not parse event in ${filePath}:\n${match[0]}\nError: ${error.message}`);
    }
  }
  
  return events;
}

// Validate events against the schema
function validateEvents(events: string[]) {
  let hasErrors = false;
  
  events.forEach((eventStr, index) => {
    try {
      const event = JSON.parse(eventStr);
      const result = AnalyticsEventSchema.safeParse(event);
      
      if (!result.success) {
        hasErrors = true;
        console.error(`\n❌ Invalid event (${index + 1}/${events.length}):`);
        console.error(JSON.stringify(event, null, 2));
        console.error('\nValidation errors:');
        
        result.error.issues.forEach((issue, i) => {
          const path = issue.path.join('.');
          console.error(`  ${i + 1}. ${path}: ${issue.message}`);
        });
        console.error('---\n');
      } else {
        console.log(`✅ Valid event (${index + 1}/${events.length}): ${event.event}`);
      }
    } catch (error) {
      hasErrors = true;
      console.error(`\n❌ Failed to parse event (${index + 1}/${events.length}):`);
      console.error(eventStr);
      console.error(`Error: ${error.message}\n---\n`);
    }
  });
  
  return !hasErrors;
}

// Main function
async function main() {
  console.log('🔍 Validating analytics events...');
  
  // Find all source files
  const sourceDir = join(__dirname, '..');
  const files = findFiles(sourceDir);
  
  console.log(`📂 Found ${files.length} source files`);
  
  // Extract all trackEvent calls
  const allEvents: string[] = [];
  
  files.forEach(file => {
    const events = extractTrackEventCalls(file);
    if (events.length > 0) {
      console.log(`  📄 ${file}: ${events.length} events`);
      allEvents.push(...events);
    }
  });
  
  console.log(`\n🔎 Found ${allEvents.length} analytics events in total`);
  
  // Validate all events
  console.log('\n🔄 Validating events against schema...');
  const isValid = validateEvents(allEvents);
  
  if (isValid) {
    console.log('\n🎉 All analytics events are valid!');
    process.exit(0);
  } else {
    console.error('\n❌ Some analytics events are invalid. Please fix the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
