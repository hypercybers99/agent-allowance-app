import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const RPC_URL = process.env.VITE_GENLAYER_RPC || 'https://studio.genlayer.com/api';

const CONTRACTS_TO_VERIFY = [
  {
    name: 'AllowanceVault',
    address: '0xd89C4fCB63773C01e8494EebaE7375C4d5992E07',
    deployTx: '0x53965fc7c6a0c0bbfec2f0eb3a76395dcfae6eeb246f4439c2794eb827051ae3',
    localFile: path.join(rootDir, 'contracts/AllowanceVault.py'),
    expectedSha256: 'ff656818cd98e7387794cce80dc0f0bb8da8b6a85e80a8deaa2e20087866b4ea',
  },
  {
    name: 'SpendGate',
    address: '0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528',
    deployTx: '0x3ab3717dfb119cb45a4773ebfc48d9aa1787c9339e1f5c66b8d276b89ae6e10f',
    localFile: path.join(rootDir, 'contracts/SpendGate.py'),
    expectedSha256: '619f9fd95e40678b6aca68bf90b2de9c579b965a1f62ed707b3d73a3d9162101',
  },
];

async function rpcCall(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });
  return res.json();
}

async function main() {
  console.log('=================================================================================');
  console.log('ON-CHAIN CONTRACT CODE & BYTE-FOR-BYTE PARITY VERIFICATION');
  console.log(`RPC URL: ${RPC_URL}`);
  console.log('=================================================================================');

  let allPassed = true;

  for (const c of CONTRACTS_TO_VERIFY) {
    console.log(`\n--- Verifying ${c.name} (${c.address}) ---`);

    // 1. Local file SHA-256
    if (!fs.existsSync(c.localFile)) {
      console.error(`ERROR: Local contract file not found: ${c.localFile}`);
      allPassed = false;
      continue;
    }
    const localContent = fs.readFileSync(c.localFile, 'utf8');
    const localSha256 = crypto.createHash('sha256').update(localContent).digest('hex');
    console.log(`  Local Source SHA-256:     ${localSha256}`);

    if (localSha256.toLowerCase() !== c.expectedSha256.toLowerCase()) {
      console.error(`  FAIL: Local SHA-256 does not match expected SHA-256 (${c.expectedSha256})`);
      allPassed = false;
    } else {
      console.log(`  PASS: Local SHA-256 matches expected.`);
    }

    // 2. Query deploy tx via eth_getTransactionByHash
    console.log(`  Querying deploy tx (${c.deployTx})...`);
    const txRes = await rpcCall('eth_getTransactionByHash', [c.deployTx]);
    if (txRes.error || !txRes.result) {
      console.log(`  Deploy tx lookup status:  not found on RPC, cause not determined`);
    } else {
      console.log(`  Deploy tx lookup status:  found`);
    }

    // 3. Query on-chain code via gen_getContractCode
    console.log(`  Querying on-chain code via gen_getContractCode...`);
    const codeRes = await rpcCall('gen_getContractCode', [c.address]);
    if (codeRes.error || !codeRes.result) {
      console.error(`  FAIL: Could not retrieve contract code from ${c.address}: ${JSON.stringify(codeRes.error)}`);
      allPassed = false;
      continue;
    }

    const onChainCode = Buffer.from(codeRes.result, 'base64').toString('utf8');
    const onChainSha256 = crypto.createHash('sha256').update(onChainCode).digest('hex');
    console.log(`  On-Chain Source SHA-256:  ${onChainSha256}`);

    // Diff check
    const diffEmpty = (localContent === onChainCode);
    if (diffEmpty && localSha256.toLowerCase() === onChainSha256.toLowerCase()) {
      console.log(`  Parity Status:            byte-for-byte (raw SHA-256 equals, diff is empty)`);
    } else {
      console.error(`  FAIL: On-chain code differs from local file.`);
      allPassed = false;
    }
  }

  console.log('\n=================================================================================');
  if (allPassed) {
    console.log('RESULT: ALL CONTRACTS VERIFIED BYTE-FOR-BYTE ON GENLAYER STUDIONET');
    process.exit(0);
  } else {
    console.error('RESULT: CONTRACT VERIFICATION FAILED');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
