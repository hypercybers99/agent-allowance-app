import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  AccountRecord,
  SpendRecord,
  SpendReceiptRecord,
  ContractLimits,
  ContractStats,
} from '../src/types/contract';

describe('Golden Contract Schema Parity Tests', () => {
  const goldenDir = path.resolve(__dirname, 'golden');

  it('validates AccountRecord keys against get_account.json', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, 'get_account.json'), 'utf8'));
    const goldenKeys = Object.keys(raw).sort();

    // Mock an object that strictly satisfies AccountRecord
    const dummyAccount: AccountRecord = {
      id: '',
      owner: '',
      name: '',
      balance: '',
      spent: '',
      spend_count: '',
      per_spend_cap: '',
      total_budget: '',
      max_spends: '',
      currency: '',
      categories: [],
      payees: [],
      agents: [],
      policy_hash: '',
      status: 'OPEN',
      seq: '',
      schema_version: '',
    };

    const typeKeys = Object.keys(dummyAccount).sort();
    expect(typeKeys).toEqual(goldenKeys);

    // Assert absence of invented fields
    const inventedFields = ['expires', 'daily_limit', 'daily_cap', 'created_at', 'expiry', 'role', 'reset_window'];
    for (const f of inventedFields) {
      expect(goldenKeys).not.toContain(f);
      expect(typeKeys).not.toContain(f);
    }
  });

  it('validates SpendRecord keys against get_spend.json', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, 'get_spend.json'), 'utf8'));
    const goldenKeys = Object.keys(raw).sort();

    const dummySpend: SpendRecord = {
      id: '',
      account_id: '',
      agent: '',
      payee: '',
      declared_amount: '',
      declared_category: '',
      evidence_url: '',
      decision: 'APPROVED',
      reason: '',
      observed_amount: '',
      observed_category: '',
      quote: '',
      norm_hash16: '',
      tripwire: false,
      leader_reported: '',
      executed: '',
      seq: '',
      schema_version: '',
    };

    const typeKeys = Object.keys(dummySpend).sort();
    expect(typeKeys).toEqual(goldenKeys);
  });

  it('validates SpendReceiptRecord keys against spend_receipt.json', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, 'spend_receipt.json'), 'utf8'));
    const goldenKeys = Object.keys(raw).sort();

    const dummyReceipt: SpendReceiptRecord = {
      spend_id: '',
      account_id: '',
      payee: '',
      amount: '',
      category: '',
      decision: '',
      executed: '',
      policy_hash: '',
    };

    const typeKeys = Object.keys(dummyReceipt).sort();
    expect(typeKeys).toEqual(goldenKeys);
  });

  it('validates ContractLimits keys against get_limits.json', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, 'get_limits.json'), 'utf8'));
    const goldenKeys = Object.keys(raw).sort();

    const dummyLimits: ContractLimits = {
      max_agents: '',
      max_list_limit: '',
      max_page_bytes: '',
      max_payees: '',
      max_url_len: '',
      min_text_chars: '',
      schema_version: '',
    };

    const typeKeys = Object.keys(dummyLimits).sort();
    expect(typeKeys).toEqual(goldenKeys);
  });

  it('validates ContractStats keys against get_stats.json', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(goldenDir, 'get_stats.json'), 'utf8'));
    const goldenKeys = Object.keys(raw).sort();

    const dummyStats: ContractStats = {
      next_account: '',
      next_spend: '',
      schema_version: '',
      total_minted: '',
    };

    const typeKeys = Object.keys(dummyStats).sort();
    expect(typeKeys).toEqual(goldenKeys);
  });
});
