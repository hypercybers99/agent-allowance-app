import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function extractErrorsFromContract(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  // Match raise gl.vm.UserError(...)
  const regex = /raise gl\.vm\.UserError\(\s*(f?["'])([\s\S]*?)\1\s*\)/g;
  const list = [];
  let match;
  while ((match = regex.exec(code)) !== null) {
    const isFString = match[1].startsWith('f');
    let raw = match[2];
    list.push({
      full: match[0],
      rawText: raw,
      isFString,
      prefix: isFString && raw.includes('{') ? raw.split('{')[0] : raw,
    });
  }
  return list;
}

const vaultPath = path.join(rootDir, 'contracts/AllowanceVault.py');
const gatePath = path.join(rootDir, 'contracts/SpendGate.py');

const vaultErrors = extractErrorsFromContract(vaultPath);
const gateErrors = extractErrorsFromContract(gatePath);

console.log(`AllowanceVault (${vaultErrors.length} errors):`);
for (const e of vaultErrors) {
  console.log(`  - "${e.rawText}" [prefix: "${e.prefix}"]`);
}

console.log(`\nSpendGate (${gateErrors.length} errors):`);
for (const e of gateErrors) {
  console.log(`  - "${e.rawText}" [prefix: "${e.prefix}"]`);
}
