import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs', 'FINAL_REPORT_APP.md');

if (!fs.existsSync(reportPath)) {
  console.error('docs/FINAL_REPORT_APP.md does not exist!');
  process.exit(1);
}

const reportContent = fs.readFileSync(reportPath, 'utf8');

// Collect all files in repo to search in
function getAllFiles(dir) {
  const res = [];
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === 'docs/screens') continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      res.push(...getAllFiles(full));
    } else {
      res.push(full);
    }
  }
  return res;
}

const allFiles = getAllFiles(rootDir).filter(f => !f.endsWith('FINAL_REPORT_APP.md'));
const allContents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// 1. Check all 0x addresses (40 hex chars)
const addressRegex = /0x[a-fA-F0-9]{40}/g;
const addresses = Array.from(new Set(reportContent.match(addressRegex) || []));

// 2. Check all 0x tx hashes (64 hex chars)
const txRegex = /0x[a-fA-F0-9]{64}/g;
const txHashes = Array.from(new Set(reportContent.match(txRegex) || []));

// 3. Check all SHA-256 digests (64 hex chars without 0x)
const shaRegex = /\b[a-f0-9]{64}\b/g;
const shaDigests = Array.from(new Set(reportContent.match(shaRegex) || []));

console.log('=================================================================================');
console.log('FINAL REPORT HASH & ADDRESS INTEGRITY VERIFIER');
console.log('=================================================================================');
console.log(`Addresses found:   ${addresses.length}`);
console.log(`Tx Hashes found:   ${txHashes.length}`);
console.log(`SHA digests found: ${shaDigests.length}\n`);

let missingCount = 0;

console.log('--- Verifying Addresses ---');
for (const addr of addresses) {
  if (allContents.includes(addr)) {
    console.log(`  PASS: ${addr}`);
  } else {
    console.error(`  FAIL: Missing address in repo files: ${addr}`);
    missingCount++;
  }
}

console.log('\n--- Verifying Transaction Hashes ---');
for (const tx of txHashes) {
  if (allContents.includes(tx)) {
    console.log(`  PASS: ${tx}`);
  } else {
    console.error(`  FAIL: Missing tx hash in repo files: ${tx}`);
    missingCount++;
  }
}

console.log('\n--- Verifying SHA-256 Digests ---');
for (const sha of shaDigests) {
  if (allContents.includes(sha)) {
    console.log(`  PASS: ${sha}`);
  } else {
    console.error(`  FAIL: Missing SHA digest in repo files: ${sha}`);
    missingCount++;
  }
}

console.log('=================================================================================');
if (missingCount === 0) {
  console.log('VERIFICATION RESULT: ALL HASHES, ADDRESSES, AND DIGESTS VERIFIED ON DISK!');
} else {
  console.error(`VERIFICATION FAILED: ${missingCount} hashes missing from repository files!`);
  process.exit(1);
}
console.log('=================================================================================');
