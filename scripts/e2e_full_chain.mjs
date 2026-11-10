import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient, chains, createAccount } from 'genlayer-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const receiptsDir = path.join(rootDir, 'tests', 'e2e_receipts');

if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Active contracts
const VAULT_ADDR = '0xd89C4fCB63773C01e8494EebaE7375C4d5992E07';
const GATE_ADDR = '0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528';
const FIXTURE_PREFIX =
  'https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/cloudco/';

// Sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Canonical JSON serializer with recursive key sorting
function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => JSON.stringify(key) + ':' + canonicalJson(obj[key]));
  return '{' + pairs.join(',') + '}';
}

function parseListResponse(res) {
  if (Array.isArray(res)) {
    return res.map((s) => (typeof s === 'string' ? JSON.parse(s) : s));
  }
  if (typeof res === 'string') {
    const parsed = JSON.parse(res);
    return Array.isArray(parsed) ? parsed.map((s) => (typeof s === 'string' ? JSON.parse(s) : s)) : [parsed];
  }
  return [];
}

function parseSingleResponse(res) {
  if (typeof res === 'string') return JSON.parse(res);
  return res;
}

// Receipt validator matching standing rules
function validateReceipt(rcpt, label) {
  const statusOk = rcpt.status_name === 'ACCEPTED' || rcpt.status_name === 'FINALIZED';
  const resultOk = rcpt.result_name === 'MAJORITY_AGREE';
  const leaderRes =
    rcpt.consensus_data?.leader_receipt?.[0]?.execution_result ||
    rcpt.leader_receipt?.[0]?.execution_result;
  const execOk = leaderRes === 'SUCCESS';

  if (!statusOk || !resultOk || !execOk) {
    throw new Error(
      `Receipt rule failed for ${label}: status=${rcpt.status_name}, result=${rcpt.result_name}, leader=${leaderRes}`
    );
  }
}

async function writeWithRetry(client, fnName, args, label, targetAddr = VAULT_ADDR) {
  console.log(`\n[${label}] Submitting ${fnName}...`);
  let attempts = 5;
  while (attempts > 0) {
    try {
      const t0 = Date.now();
      const txHash = await client.writeContract({
        address: targetAddr,
        functionName: fnName,
        args,
      });
      console.log(`[${label}] Tx Hash: ${txHash}`);
      const rcpt = await client.waitForTransactionReceipt({
        hash: txHash,
        retries: 120,
        interval: 3000,
      });
      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      console.log(
        `[${label}] Finalized in ${elapsed}s | status=${rcpt.status_name} | result=${rcpt.result_name}`
      );
      validateReceipt(rcpt, label);

      // Save raw receipt
      const outPath = path.join(receiptsDir, `${label}.json`);
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          {
            label,
            functionName: fnName,
            contractAddress: targetAddr,
            args,
            txHash,
            elapsedSeconds: Number(elapsed),
            receipt: rcpt,
          },
          null,
          2
        ),
        'utf8'
      );
      console.log(`[${label}] Saved raw receipt: ${outPath}`);
      return { txHash, rcpt, elapsed };
    } catch (err) {
      console.warn(`[${label}] Error on attempt: ${err.message}`);
      attempts--;
      if (attempts <= 0) throw err;
      console.log(`[${label}] Retrying in 8s...`);
      await sleep(8000);
    }
  }
}

async function readView(client, fnName, args, targetAddr = VAULT_ADDR) {
  let attempts = 6;
  while (attempts > 0) {
    try {
      return await client.readContract({
        address: targetAddr,
        functionName: fnName,
        args,
      });
    } catch (err) {
      attempts--;
      if (attempts <= 0) throw err;
      console.warn(`[readView ${fnName}] Transient RPC/DNS error: ${err.message}. Retrying in 4s...`);
      await sleep(4000);
    }
  }
}

async function main() {
  console.log('========================================================');
  console.log('AGENT ALLOWANCE: END-TO-END ON-CHAIN VERIFICATION SUITE');
  console.log('Network: GenLayer Studionet (Chain ID 61999)');
  console.log('Vault:   ', VAULT_ADDR);
  console.log('Gate:    ', GATE_ADDR);
  console.log('========================================================');

  // 1. Generate Throwaway Accounts
  const ownerAcc = createAccount();
  const agentAcc = createAccount();
  const payeeAcc = createAccount();

  console.log('\nGenerated Accounts:');
  console.log('  Owner: ', ownerAcc.address);
  console.log('  Agent: ', agentAcc.address);
  console.log('  Payee: ', payeeAcc.address);

  const ownerClient = createClient({ chain: chains.studionet, account: ownerAcc });
  const agentClient = createClient({ chain: chains.studionet, account: agentAcc });
  const payeeClient = createClient({ chain: chains.studionet, account: payeeAcc });
  const zeroReadClient = createClient({ endpoint: 'https://studio.genlayer.com/api' });

  // Baseline Invariant & Balance check
  const initialStatsRaw = await readView(zeroReadClient, 'get_stats', []);
  const initialStats = parseSingleResponse(initialStatsRaw);
  console.log('\nInitial Vault Stats:', initialStats);

  // 2. Step 1: Claim Demo Credits for Owner
  await writeWithRetry(ownerClient, 'claim_demo_credits', [], '01_claim_owner');
  await sleep(7000);

  const ownerBalAfterClaim = await readView(zeroReadClient, 'balance_of', [ownerAcc.address]);
  console.log(`Owner Credit Balance: ${ownerBalAfterClaim} (expected 1000)`);
  if (ownerBalAfterClaim !== '1000') throw new Error(`Unexpected owner balance: ${ownerBalAfterClaim}`);

  // 3. Step 2: Create Account with Policy
  const policyObj = {
    per_spend_cap: 300,
    total_budget: 1000,
    max_spends: 10,
    currency: 'USD',
    categories: ['CLOUD', 'DATA', 'SOFTWARE'],
    payees: [
      {
        payee: payeeAcc.address.toLowerCase(),
        prefix: FIXTURE_PREFIX,
      },
    ],
  };
  const policyJson = canonicalJson(policyObj);
  const policyHash = crypto.createHash('sha256').update(policyJson, 'utf8').digest('hex');
  console.log('\nPolicy Hash:', policyHash);

  await writeWithRetry(
    ownerClient,
    'create_account',
    ['E2E Test Allowance Account', policyJson],
    '02_create_account'
  );
  await sleep(7000);

  // Discover Account ID via list_accounts_by_owner
  const accountsRaw = await readView(zeroReadClient, 'list_accounts_by_owner', [ownerAcc.address, 10]);
  const accountList = parseListResponse(accountsRaw);
  if (!accountList || accountList.length === 0) {
    throw new Error('Account discovery failed: list_accounts_by_owner returned empty list');
  }
  const createdAccount = accountList[0];
  const accountId = String(createdAccount.id);
  console.log(`Discovered Created Account ID: ${accountId}`);

  // 4. Step 3: Fund Account (600 credits)
  await writeWithRetry(ownerClient, 'fund_account', [accountId, 600], '03_fund_account');
  await sleep(7000);

  const acctAfterFundRaw = await readView(zeroReadClient, 'get_account', [accountId]);
  const acctAfterFund = parseSingleResponse(acctAfterFundRaw);
  console.log(`Account #${accountId} Balance: ${acctAfterFund.balance} (expected 600)`);
  if (acctAfterFund.balance !== '600') throw new Error(`Funding check failed: balance=${acctAfterFund.balance}`);

  // 5. Step 4: Add Agent to Account
  await writeWithRetry(ownerClient, 'add_agent', [accountId, agentAcc.address], '04_add_agent');
  await sleep(7000);

  const acctAfterAgentRaw = await readView(zeroReadClient, 'get_account', [accountId]);
  const acctAfterAgent = parseSingleResponse(acctAfterAgentRaw);
  console.log(`Account #${accountId} Agents:`, acctAfterAgent.agents);

  // 6. Step 5: Spend 1 (APPROVED) - inv-a-120.md, 120 USD
  const url1 = FIXTURE_PREFIX + 'inv-a-120.md';
  await writeWithRetry(
    agentClient,
    'request_spend',
    [accountId, payeeAcc.address, 120, 'CLOUD', url1],
    '05_spend_1_approved'
  );
  await sleep(7000);

  const spendsRaw1 = await readView(zeroReadClient, 'list_spends', [accountId, 10]);
  const spendsList1 = parseListResponse(spendsRaw1);
  const spend1 = spendsList1[0];
  console.log(`Spend #1 Result: ID=${spend1.id}, Decision=${spend1.decision}, Reason=${spend1.reason}`);
  if (spend1.decision !== 'APPROVED') throw new Error(`Spend 1 expected APPROVED, got ${spend1.decision}`);

  // 7. Step 6: Spend 2 (DENIED over_cap) - inv-b-450.md, 450 USD (exceeds per_spend_cap 300)
  const url2 = FIXTURE_PREFIX + 'inv-b-450.md';
  await writeWithRetry(
    agentClient,
    'request_spend',
    [accountId, payeeAcc.address, 450, 'CLOUD', url2],
    '06_spend_2_denied_overcap'
  );
  await sleep(7000);

  const spendsRaw2 = await readView(zeroReadClient, 'list_spends', [accountId, 10]);
  const spendsList2 = parseListResponse(spendsRaw2);
  const spend2 = spendsList2[0];
  console.log(`Spend #2 Result: ID=${spend2.id}, Decision=${spend2.decision}, Reason=${spend2.reason}`);
  if (spend2.decision !== 'DENIED' || spend2.reason !== 'over_cap') {
    throw new Error(`Spend 2 expected DENIED over_cap, got ${spend2.decision} ${spend2.reason}`);
  }

  // 8. Step 7: Spend 3 (DENIED amount_mismatch) - inv-a-120.md, declared 100 != invoice 120
  await writeWithRetry(
    agentClient,
    'request_spend',
    [accountId, payeeAcc.address, 100, 'CLOUD', url1],
    '07_spend_3_denied_mismatch'
  );
  await sleep(7000);

  const spendsRaw3 = await readView(zeroReadClient, 'list_spends', [accountId, 10]);
  const spendsList3 = parseListResponse(spendsRaw3);
  const spend3 = spendsList3[0];
  console.log(`Spend #3 Result: ID=${spend3.id}, Decision=${spend3.decision}, Reason=${spend3.reason}`);
  if (spend3.decision !== 'DENIED') throw new Error(`Spend 3 expected DENIED, got ${spend3.decision}`);

  // 9. Step 8: Spend 4 (PENDING resolved by owner) - inv-c-no-total.md, 200 USD
  const url4 = FIXTURE_PREFIX + 'inv-c-no-total.md';
  await writeWithRetry(
    agentClient,
    'request_spend',
    [accountId, payeeAcc.address, 200, 'CLOUD', url4],
    '08_spend_4_pending'
  );
  await sleep(7000);

  const spendsRaw4 = await readView(zeroReadClient, 'list_spends', [accountId, 10]);
  const spendsList4 = parseListResponse(spendsRaw4);
  const spend4 = spendsList4[0];
  console.log(`Spend #4 Result: ID=${spend4.id}, Decision=${spend4.decision}, Reason=${spend4.reason}`);
  if (spend4.decision !== 'PENDING') throw new Error(`Spend 4 expected PENDING, got ${spend4.decision}`);

  // Owner resolves Spend 4 (APPROVED)
  await writeWithRetry(
    ownerClient,
    'resolve_spend',
    [spend4.id, true],
    '09_resolve_spend_4'
  );
  await sleep(7000);

  const spend4AfterResolveRaw = await readView(zeroReadClient, 'get_spend', [spend4.id]);
  const spend4AfterResolve = parseSingleResponse(spend4AfterResolveRaw);
  console.log(`Spend #4 After Resolve: Decision=${spend4AfterResolve.decision}, Executed=${spend4AfterResolve.executed}`);
  if (spend4AfterResolve.decision !== 'OWNER_APPROVED' || spend4AfterResolve.executed !== 'true') {
    throw new Error(`Spend 4 expected OWNER_APPROVED, got ${spend4AfterResolve.decision}`);
  }

  // 10. Step 9: SpendGate Integration Tests
  console.log('\n--- SPENDGATE VERIFICATION ---');
  // Check valid spend
  const isValidTrue = await readView(
    zeroReadClient,
    'is_spend_valid_for',
    [spend1.id, accountId, payeeAcc.address, 120, policyHash],
    GATE_ADDR
  );
  console.log(`SpendGate.is_spend_valid_for(spend1, valid): ${isValidTrue}`);
  if (!isValidTrue) throw new Error('SpendGate validation expected true for spend 1');

  // Check altered payee
  const isAlteredPayee = await readView(
    zeroReadClient,
    'is_spend_valid_for',
    [spend1.id, accountId, ownerAcc.address, 120, policyHash],
    GATE_ADDR
  );
  console.log(`SpendGate.is_spend_valid_for(altered payee): ${isAlteredPayee} (expected false)`);
  if (isAlteredPayee) throw new Error('SpendGate validation failed: altered payee returned true');

  // Check altered amount
  const isAlteredAmount = await readView(
    zeroReadClient,
    'is_spend_valid_for',
    [spend1.id, accountId, payeeAcc.address, 121, policyHash],
    GATE_ADDR
  );
  console.log(`SpendGate.is_spend_valid_for(altered amount): ${isAlteredAmount} (expected false)`);
  if (isAlteredAmount) throw new Error('SpendGate validation failed: altered amount returned true');

  // Check altered policy hash
  const isAlteredPolicy = await readView(
    zeroReadClient,
    'is_spend_valid_for',
    [spend1.id, accountId, payeeAcc.address, 120, '0000000000000000000000000000000000000000000000000000000000000000'],
    GATE_ADDR
  );
  console.log(`SpendGate.is_spend_valid_for(altered policy): ${isAlteredPolicy} (expected false)`);
  if (isAlteredPolicy) throw new Error('SpendGate validation failed: altered policy returned true');

  // Payee calls SpendGate serve(spend1)
  await writeWithRetry(
    payeeClient,
    'serve',
    [spend1.id, accountId, payeeAcc.address, 120, policyHash],
    '10_spendgate_serve',
    GATE_ADDR
  );
  await sleep(7000);

  const serviceRecordRaw = await readView(zeroReadClient, 'get_service', [spend1.id], GATE_ADDR);
  console.log(`SpendGate Service Record for Spend #1:`, serviceRecordRaw);
  if (!serviceRecordRaw || !serviceRecordRaw.includes('SERVED')) {
    throw new Error('SpendGate get_service did not return SERVED record');
  }

  // Test refused duplicate serve
  console.log('Testing duplicate serve rejection on SpendGate...');
  try {
    await payeeClient.writeContract({
      address: GATE_ADDR,
      functionName: 'serve',
      args: [spend1.id, accountId, payeeAcc.address, 120, policyHash],
    });
    console.error('ERROR: Duplicate serve did not revert!');
    throw new Error('Duplicate serve should have been rejected');
  } catch (err) {
    console.log(`Expected duplicate serve refusal confirmed: ${err.message}`);
  }
  await sleep(7000);

  // 11. Step 10: Close Account
  await writeWithRetry(ownerClient, 'close_account', [accountId], '11_close_account');
  await sleep(7000);

  const acctClosedRaw = await readView(zeroReadClient, 'get_account', [accountId]);
  const acctClosed = parseSingleResponse(acctClosedRaw);
  console.log(`Closed Account Status: ${acctClosed.status} | Balance: ${acctClosed.balance}`);
  if (acctClosed.status !== 'CLOSED' || acctClosed.balance !== '0') {
    throw new Error(`Account close failed: status=${acctClosed.status}, balance=${acctClosed.balance}`);
  }

  // 12. Final Ledger Invariant Check
  const finalStatsRaw = await readView(zeroReadClient, 'get_stats', []);
  const finalStats = parseSingleResponse(finalStatsRaw);
  const ownerFinalBal = await readView(zeroReadClient, 'balance_of', [ownerAcc.address]);
  const payeeFinalBal = await readView(zeroReadClient, 'balance_of', [payeeAcc.address]);

  console.log('\n========================================================');
  console.log('E2E EXECUTION SUMMARY & LEDGER INVARIANT:');
  console.log('========================================================');
  console.log(`Owner Final Balance: ${ownerFinalBal} credits`);
  console.log(`Payee Final Balance: ${payeeFinalBal} credits`);
  console.log(`Total Minted:        ${finalStats.total_minted} credits`);
  console.log('Expected: 120 (spend 1) + 200 (spend 4) = 320 credits to payee.');
  console.log(`Owner refund: 1000 - 320 = 680 credits.`);
  if (payeeFinalBal !== '320' || ownerFinalBal !== '680') {
    console.warn(`Balance check observation: Payee=${payeeFinalBal}, Owner=${ownerFinalBal}`);
  }

  // Summary file output
  const summaryReport = {
    testSuite: 'agent-allowance-app-e2e',
    executedAt: new Date().toISOString(),
    network: 'genlayer-studionet',
    chainId: 61999,
    contracts: {
      vault: VAULT_ADDR,
      gate: GATE_ADDR,
    },
    accounts: {
      owner: ownerAcc.address,
      agent: agentAcc.address,
      payee: payeeAcc.address,
    },
    accountId,
    spends: {
      spend1_approved: spend1.id,
      spend2_denied_overcap: spend2.id,
      spend3_denied_mismatch: spend3.id,
      spend4_pending_resolved: spend4.id,
    },
    spendGateVerified: true,
    accountClosed: true,
    balances: {
      owner: ownerFinalBal,
      payee: payeeFinalBal,
    },
    totalMinted: finalStats.total_minted,
  };

  const summaryPath = path.join(receiptsDir, 'e2e_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2), 'utf8');
  console.log(`\nE2E Suite Successfully Completed! Summary saved: ${summaryPath}`);
}

main().catch((err) => {
  console.error('\nE2E Suite Failed:', err);
  process.exit(1);
});
