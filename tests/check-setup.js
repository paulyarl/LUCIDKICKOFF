// Simple script to verify Node.js and npm setup
const fs = require('fs');
const path = require('path');

console.log('=== Environment Check ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);

// Check package.json
console.log('\n=== package.json ===');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Project: ${pkg.name} v${pkg.version}`);
  console.log('Scripts:', Object.keys(pkg.scripts).join(', '));
} catch (err) {
  console.error('Error reading package.json:', err.message);
}

// Check test files
console.log('\n=== Test Files ===');
const testDir = path.join(__dirname, 'high-value');
try {
  const files = fs.readdirSync(testDir);
  console.log(`Found ${files.length} test files in ${testDir}:`);
  files.forEach(file => console.log(`- ${file}`));
} catch (err) {
  console.error(`Error reading test directory (${testDir}):`, err.message);
}

console.log('\n=== Next Steps ===');
console.log('1. Run: npm install --save-dev @playwright/test');
console.log('2. Run: npx playwright install');
console.log('3. Run: npx playwright test tests/smoke-test.spec.ts');
