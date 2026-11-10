import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('RUNNING BROWSER AUTOMATION & ACCESSIBILITY AUDITS');
console.log('======================================================');

try {
  const output = execSync('npx playwright test --reporter=list', {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  console.log('\nPlaywright E2E and Axe accessibility audits passed cleanly!');
} catch (err) {
  console.error('\nPlaywright E2E test execution failed:', err.message);
  process.exit(1);
}
