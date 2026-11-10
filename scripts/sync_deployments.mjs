import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Contract repository source path
const contractRepoPath = process.env.CONTRACT_REPO_PATH || 'E:/Agent Allowance_V2.2';

console.log('======================================================');
console.log('SYNC DEPLOYMENTS: Source of Truth Verification');
console.log(`Contract repository path: ${contractRepoPath}`);
console.log('======================================================');

if (!fs.existsSync(contractRepoPath)) {
  console.error(`Error: Contract repository path not found at ${contractRepoPath}`);
  process.exit(1);
}

// 1. Read docs/ADDRESS_REGISTRY.md from contract repo
const regPath = path.join(contractRepoPath, 'docs/ADDRESS_REGISTRY.md');
if (!fs.existsSync(regPath)) {
  console.error(`Error: ADDRESS_REGISTRY.md not found at ${regPath}`);
  process.exit(1);
}
const regMd = fs.readFileSync(regPath, 'utf8');

// Parse addresses and hashes from ADDRESS_REGISTRY.md
function extractRegistryContract(text, sectionHeading) {
  const escaped = sectionHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const secRegex = new RegExp(`### ${escaped}(?:\\s*\\([\\s\\S]*?\\))?[\\r\\n]+([\\s\\S]*?)(?=###|## 2|$)`);
  const match = text.match(secRegex);
  if (!match) return null;
  const block = match[1];

  const addrMatch = block.match(/-\s*\*\*Contract Address\*\*:\s*`([^`]+)`/);
  const txMatch = block.match(/-\s*\*\*Deploy Transaction Hash\*\*:\s*`([^`]+)`/);
  const shaMatch = block.match(/-\s*\*\*Source SHA-256\*\*:\s*`([^`]+)`/);
  const promptShaMatch = block.match(/-\s*\*\*Prompt SHA-256\*\*:\s*`([^`]+)`/);

  return {
    address: addrMatch ? addrMatch[1].trim() : '',
    deployTx: txMatch ? txMatch[1].trim() : '',
    sourceSha: shaMatch ? shaMatch[1].trim() : '',
    promptSha: promptShaMatch ? promptShaMatch[1].trim() : '',
  };
}

const regVault = extractRegistryContract(regMd, 'AllowanceVault');
const regGate = extractRegistryContract(regMd, 'SpendGate');
const regProbeExtract = extractRegistryContract(regMd, 'ProbeExtract');
const regProbe = extractRegistryContract(regMd, 'Probe');

// Superseded Vault
const supersededMatch = regMd.match(/### AllowanceVault \(Initial Incomplete Deployment\)[\s\S]*?(?=###|$)/);
let regSuperseded = { address: '', deployTx: '' };
if (supersededMatch) {
  const sBlock = supersededMatch[0];
  const sAddr = sBlock.match(/-\s*\*\*Contract Address\*\*:\s*`([^`]+)`/);
  const sTx = sBlock.match(/-\s*\*\*Deploy Transaction Hash\*\*:\s*`([^`]+)`/);
  regSuperseded = {
    address: sAddr ? sAddr[1].trim() : '',
    deployTx: sTx ? sTx[1].trim() : '',
  };
}

console.log('Values from ADDRESS_REGISTRY.md:');
console.log('  AllowanceVault:  ', regVault);
console.log('  SpendGate:       ', regGate);
console.log('  ProbeExtract:    ', regProbeExtract);
console.log('  Probe (M0):      ', regProbe);
console.log('  Superseded:      ', regSuperseded);

// 2. Read live_evidence.json
const liveEvidencePath = path.join(contractRepoPath, 'docs/evidence/live_evidence.json');
let liveEvidence = null;
if (fs.existsSync(liveEvidencePath)) {
  liveEvidence = JSON.parse(fs.readFileSync(liveEvidencePath, 'utf8'));
}

// 3. Verify against actual files on disk
const vaultFile = path.join(contractRepoPath, 'contracts/AllowanceVault.py');
const gateFile = path.join(contractRepoPath, 'contracts/SpendGate.py');
const vaultSha = crypto.createHash('sha256').update(fs.readFileSync(vaultFile)).digest('hex');
const gateSha = crypto.createHash('sha256').update(fs.readFileSync(gateFile)).digest('hex');

const errors = [];
if (regVault.address.toLowerCase() !== '0xd89c4fcb63773c01e8494eebae7375c4d5992e07'.toLowerCase()) {
  errors.push(`Vault address mismatch: ${regVault.address} != 0xd89C4fCB63773C01e8494EebaE7375C4d5992E07`);
}
if (regGate.address.toLowerCase() !== '0xae5ad4f836f199b56307b5e018ef3be8b8dd0528'.toLowerCase()) {
  errors.push(`SpendGate address mismatch: ${regGate.address} != 0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528`);
}
if (regVault.sourceSha.toLowerCase() !== vaultSha.toLowerCase()) {
  errors.push(`Vault source SHA mismatch: registry (${regVault.sourceSha}) != local file (${vaultSha})`);
}
if (regGate.sourceSha.toLowerCase() !== gateSha.toLowerCase()) {
  errors.push(`Gate source SHA mismatch: registry (${regGate.sourceSha}) != local file (${gateSha})`);
}

if (liveEvidence && liveEvidence.contracts) {
  if (liveEvidence.contracts.AllowanceVault.address.toLowerCase() !== regVault.address.toLowerCase()) {
    errors.push(`live_evidence Vault address mismatch`);
  }
  if (liveEvidence.contracts.SpendGate.address.toLowerCase() !== regGate.address.toLowerCase()) {
    errors.push(`live_evidence SpendGate address mismatch`);
  }
}

if (errors.length > 0) {
  console.error('\nSYNCHRONIZATION ERRORS FOUND:');
  for (const err of errors) console.error(` - ${err}`);
  process.exit(1);
}

console.log('\nAll addresses and source SHA-256 hashes verified in 100% agreement!');

// 4. Generate src/config/deployments.ts
const configDir = path.join(rootDir, 'src/config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

const deploymentsCode = `// Generated automatically by scripts/sync_deployments.mjs
// Source of truth: docs/ADDRESS_REGISTRY.md (tag aa-v1)

export interface ContractDeployment {
  name: string;
  address: \`0x\${string}\`;
  deployTx: string;
  sourceSha256: string;
  promptSha256?: string;
  status: 'active' | 'superseded' | 'probe';
  explorerUrl: string;
  description: string;
}

export const NETWORK_CONFIG = {
  chainId: 61999,
  chainName: 'GenLayer Studionet (Preview)',
  rpcUrl: 'https://studio.genlayer.com/api',
  explorerUrl: 'https://explorer-studio.genlayer.com',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
} as const;

export const CONTRACT_DEPLOYMENTS = {
  allowanceVault: {
    name: 'AllowanceVault',
    address: '${regVault.address}',
    deployTx: '${regVault.deployTx}',
    sourceSha256: '${regVault.sourceSha}',
    status: 'active',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/${regVault.address}',
    description: 'Primary intelligent contract holding account configurations, spending policies, and ledger.',
  },
  spendGate: {
    name: 'SpendGate',
    address: '${regGate.address}',
    deployTx: '${regGate.deployTx}',
    sourceSha256: '${regGate.sourceSha}',
    status: 'active',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/${regGate.address}',
    description: 'Downstream merchant consumer contract recording service delivery (serve).',
  },
  probeExtract: {
    name: 'ProbeExtract',
    address: '${regProbeExtract.address}',
    deployTx: '${regProbeExtract.deployTx}',
    sourceSha256: '${regProbeExtract.sourceSha}',
    promptSha256: '${regProbeExtract.promptSha}',
    status: 'probe',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/${regProbeExtract.address}',
    description: 'Empirical robustness harness used for repeated on-chain invoice extraction runs.',
  },
  probeM0: {
    name: 'Probe (Milestone 0)',
    address: '${regProbe.address}',
    deployTx: '${regProbe.deployTx}',
    sourceSha256: '${regProbe.sourceSha}',
    status: 'probe',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/${regProbe.address}',
    description: 'Milestone 0 environment probe validating GenLayer views, writes, and nondet regex execution.',
  },
  supersededVault: {
    name: 'AllowanceVault (Initial Attempt)',
    address: '${regSuperseded.address}',
    deployTx: '${regSuperseded.deployTx}',
    sourceSha256: 'superseded',
    status: 'superseded',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/${regSuperseded.address}',
    description: 'Initial deployment attempt superseded due to RPC rate limiting before canonical run.',
  },
} as const;

export const ACTIVE_ALLOWANCE_VAULT = CONTRACT_DEPLOYMENTS.allowanceVault.address;
export const ACTIVE_SPEND_GATE = CONTRACT_DEPLOYMENTS.spendGate.address;
`;

fs.writeFileSync(path.join(configDir, 'deployments.ts'), deploymentsCode, 'utf8');
console.log('Successfully wrote src/config/deployments.ts');
