import fs from 'fs';
import path from 'path';
import { createClient, chains } from 'genlayer-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const VAULT_ADDRESS = '0xd89C4fCB63773C01e8494EebaE7375C4d5992E07';
const GATE_ADDRESS = '0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528';
const OWNER_ADDRESS = '0x1d539fb3ded5bb5b6d68414238ece9a972a35921';
const AGENT_ADDRESS = '0xea35967eb5440bd52de0d4c09804361e9f12bab7';
const PAYEE_ADDRESS = '0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d';

async function main() {
  console.log('=================================================================================');
  console.log('CAPTURE GOLDEN CONTRACT OUTPUTS (tests/golden/)');
  console.log('=================================================================================');

  const client = createClient({ chain: chains.studionet });
  const goldenDir = path.join(rootDir, 'tests/golden');
  if (!fs.existsSync(goldenDir)) {
    fs.mkdirSync(goldenDir, { recursive: true });
  }

  // 1. get_stats
  console.log('Reading get_stats()...');
  const statsRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'get_stats',
    args: [],
  });
  const statsJson = JSON.parse(statsRaw);
  fs.writeFileSync(path.join(goldenDir, 'get_stats.json'), JSON.stringify(statsJson, null, 2));

  // 2. get_limits
  console.log('Reading get_limits()...');
  const limitsRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'get_limits',
    args: [],
  });
  const limitsJson = JSON.parse(limitsRaw);
  fs.writeFileSync(path.join(goldenDir, 'get_limits.json'), JSON.stringify(limitsJson, null, 2));

  // 3. get_account
  console.log('Reading get_account("1")...');
  const accountRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'get_account',
    args: ['1'],
  });
  const accountJson = JSON.parse(accountRaw);
  fs.writeFileSync(path.join(goldenDir, 'get_account.json'), JSON.stringify(accountJson, null, 2));

  // 4. get_spend
  console.log('Reading get_spend("1")...');
  const spendRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'get_spend',
    args: ['1'],
  });
  const spendJson = JSON.parse(spendRaw);
  fs.writeFileSync(path.join(goldenDir, 'get_spend.json'), JSON.stringify(spendJson, null, 2));

  // 5. spend_receipt
  console.log('Reading spend_receipt("1")...');
  const receiptRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'spend_receipt',
    args: ['1'],
  });
  const receiptJson = JSON.parse(receiptRaw);
  fs.writeFileSync(path.join(goldenDir, 'spend_receipt.json'), JSON.stringify(receiptJson, null, 2));

  // 6. balance_of
  console.log('Reading balance_of(owner)...');
  const balanceRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'balance_of',
    args: [OWNER_ADDRESS],
  });
  fs.writeFileSync(path.join(goldenDir, 'balance_of.json'), JSON.stringify({ balance: balanceRaw, owner: OWNER_ADDRESS }, null, 2));

  // 7. list_accounts_by_owner
  console.log('Reading list_accounts_by_owner(owner)...');
  const listAccountsRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'list_accounts_by_owner',
    args: [OWNER_ADDRESS, 10],
  });
  const listAccountsJson = listAccountsRaw.map(s => JSON.parse(s));
  fs.writeFileSync(path.join(goldenDir, 'list_accounts_by_owner.json'), JSON.stringify(listAccountsJson, null, 2));

  // 8. list_spends
  console.log('Reading list_spends("1")...');
  const listSpendsRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'list_spends',
    args: ['1', 10],
  });
  const listSpendsJson = listSpendsRaw.map(s => JSON.parse(s));
  fs.writeFileSync(path.join(goldenDir, 'list_spends.json'), JSON.stringify(listSpendsJson, null, 2));

  // 9. list_spends_by_agent
  console.log('Reading list_spends_by_agent(agent)...');
  const listSpendsAgentRaw = await client.readContract({
    address: VAULT_ADDRESS,
    functionName: 'list_spends_by_agent',
    args: [AGENT_ADDRESS, 10],
  });
  const listSpendsAgentJson = listSpendsAgentRaw.map(s => JSON.parse(s));
  fs.writeFileSync(path.join(goldenDir, 'list_spends_by_agent.json'), JSON.stringify(listSpendsAgentJson, null, 2));

  // 10. SpendGate get_service
  console.log('Reading SpendGate get_service("1")...');
  const getServiceRaw = await client.readContract({
    address: GATE_ADDRESS,
    functionName: 'get_service',
    args: ['1'],
  });
  fs.writeFileSync(path.join(goldenDir, 'get_service.json'), JSON.stringify({ spend_id: '1', service: getServiceRaw }, null, 2));

  // 11. SpendGate is_spend_valid_for
  console.log('Reading SpendGate is_spend_valid_for("1", ...)...');
  const isValid = await client.readContract({
    address: GATE_ADDRESS,
    functionName: 'is_spend_valid_for',
    args: ['1', '1', PAYEE_ADDRESS, 120, accountJson.policy_hash],
  });
  fs.writeFileSync(path.join(goldenDir, 'is_spend_valid_for.json'), JSON.stringify({
    spend_id: '1',
    account_id: '1',
    payee: PAYEE_ADDRESS,
    amount: 120,
    policy_hash: accountJson.policy_hash,
    valid: isValid,
  }, null, 2));

  console.log('Successfully captured all golden contract responses into tests/golden/');
}

main().catch(err => {
  console.error('Error capturing golden outputs:', err);
  process.exit(1);
});
