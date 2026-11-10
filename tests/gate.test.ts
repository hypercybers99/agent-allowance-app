import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { AccountRecord, SpendRecord } from '../src/types/contract';

describe('SpendGate is_spend_valid_for Argument Derivation Tests (Lesson 4)', () => {
  const goldenDir = path.resolve(__dirname, 'golden');

  it('proves arguments for is_spend_valid_for are derived directly from records', () => {
    const account: AccountRecord = JSON.parse(
      fs.readFileSync(path.join(goldenDir, 'get_account.json'), 'utf8')
    );
    const spend: SpendRecord = JSON.parse(
      fs.readFileSync(path.join(goldenDir, 'get_spend.json'), 'utf8')
    );

    // Derivation from record
    const spendId = spend.id;
    const accountId = spend.account_id;
    const payee = spend.payee;
    const amount = Number(spend.declared_amount);
    const policyHash = account.policy_hash;

    expect(spendId).toBe('1');
    expect(accountId).toBe('1');
    expect(payee.toLowerCase()).toBe('0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d');
    expect(amount).toBe(120);
    expect(policyHash).toBe('c26a3721cf849ba2c8202a91d4122b530bd5f1c21f5a36c87e0c0690c83c5538');

    // Expected shape matches SpendGate.py is_spend_valid_for signature
    const callArgs = [spendId, accountId, payee, amount, policyHash];
    expect(callArgs.length).toBe(5);
    expect(typeof callArgs[0]).toBe('string');
    expect(typeof callArgs[1]).toBe('string');
    expect(typeof callArgs[2]).toBe('string');
    expect(typeof callArgs[3]).toBe('number');
    expect(typeof callArgs[4]).toBe('string');
  });
});
