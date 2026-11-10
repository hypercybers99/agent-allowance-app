import { describe, it, expect } from 'vitest';
import {
  buildPolicyJson,
  validateAccountName,
  validatePayeePrefix,
  validatePolicyParams,
  PolicyParams,
  ALLOWED_CATEGORIES,
} from '../src/lib/policy';

describe('Policy Builder & Validator Table-Driven Tests', () => {
  const validBaseParams: PolicyParams = {
    per_spend_cap: 200,
    total_budget: 500,
    max_spends: 6,
    currency: 'USD',
    categories: ['CLOUD', 'DATA', 'SOFTWARE'],
    payees: [
      {
        payee: '0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d',
        prefix: 'https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/cloudco/',
      },
    ],
  };

  it('builds canonical policy JSON matching exact expected keys', () => {
    const jsonStr = buildPolicyJson(validBaseParams);
    const parsed = JSON.parse(jsonStr);

    const keys = Object.keys(parsed);
    expect(keys).toEqual([
      'per_spend_cap',
      'total_budget',
      'max_spends',
      'currency',
      'categories',
      'payees',
    ]);
    expect(keys.length).toBe(6);
    expect(parsed.per_spend_cap).toBe(200);
    expect(parsed.total_budget).toBe(500);
    expect(parsed.max_spends).toBe(6);
    expect(parsed.currency).toBe('USD');
  });

  const testCases: { name: string; mutate: (p: PolicyParams) => void; expectedError: string }[] = [
    {
      name: 'bad per_spend_cap: zero',
      mutate: p => { p.per_spend_cap = 0; },
      expectedError: 'bad per_spend_cap',
    },
    {
      name: 'bad per_spend_cap: negative',
      mutate: p => { p.per_spend_cap = -50; },
      expectedError: 'bad per_spend_cap',
    },
    {
      name: 'bad per_spend_cap: exceeds total budget',
      mutate: p => { p.per_spend_cap = 600; p.total_budget = 500; },
      expectedError: 'bad per_spend_cap',
    },
    {
      name: 'bad total_budget: zero',
      mutate: p => { p.total_budget = 0; },
      expectedError: 'bad total_budget',
    },
    {
      name: 'bad total_budget: negative',
      mutate: p => { p.total_budget = -100; },
      expectedError: 'bad total_budget',
    },
    {
      name: 'bad max_spends: zero',
      mutate: p => { p.max_spends = 0; },
      expectedError: 'bad max_spends',
    },
    {
      name: 'bad currency: lowercase',
      mutate: p => { p.currency = 'usd'; },
      expectedError: 'bad currency',
    },
    {
      name: 'bad currency: wrong length',
      mutate: p => { p.currency = 'US'; },
      expectedError: 'bad currency',
    },
    {
      name: 'bad categories: empty',
      mutate: p => { p.categories = []; },
      expectedError: 'bad categories',
    },
    {
      name: 'bad category: unallowed category string',
      mutate: p => { p.categories = ['CLOUD', 'INVALID_CAT']; },
      expectedError: 'bad category',
    },
    {
      name: 'bad categories: duplicate category',
      mutate: p => { p.categories = ['CLOUD', 'CLOUD']; },
      expectedError: 'bad categories',
    },
    {
      name: 'bad payees: empty list',
      mutate: p => { p.payees = []; },
      expectedError: 'bad payees',
    },
    {
      name: 'bad payees: invalid 0x address',
      mutate: p => { p.payees[0].payee = 'not-an-address'; },
      expectedError: 'bad payees',
    },
    {
      name: 'bad payees: duplicate payee address',
      mutate: p => {
        p.payees = [
          { payee: '0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d', prefix: 'https://raw.githubusercontent.com/a/' },
          { payee: '0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d', prefix: 'https://raw.githubusercontent.com/b/' },
        ];
      },
      expectedError: 'bad payees',
    },
    {
      name: 'bad prefix: trailing slash missing',
      mutate: p => { p.payees[0].prefix = 'https://raw.githubusercontent.com/cloudco'; },
      expectedError: 'bad prefix: trailing slash',
    },
    {
      name: 'bad prefix: scheme http',
      mutate: p => { p.payees[0].prefix = 'http://raw.githubusercontent.com/cloudco/'; },
      expectedError: 'bad prefix: scheme',
    },
    {
      name: 'bad prefix: userinfo',
      mutate: p => { p.payees[0].prefix = 'https://user:pass@raw.githubusercontent.com/cloudco/'; },
      expectedError: 'bad prefix: userinfo',
    },
    {
      name: 'bad prefix: port',
      mutate: p => { p.payees[0].prefix = 'https://raw.githubusercontent.com:8080/cloudco/'; },
      expectedError: 'bad prefix: port',
    },
    {
      name: 'bad prefix: query',
      mutate: p => { p.payees[0].prefix = 'https://raw.githubusercontent.com/cloudco/?v=1/'; },
      expectedError: 'bad prefix: query',
    },
    {
      name: 'bad prefix: fragment',
      mutate: p => { p.payees[0].prefix = 'https://raw.githubusercontent.com/cloudco/#frag/'; },
      expectedError: 'bad prefix: fragment',
    },
    {
      name: 'bad prefix: length exceeding 300 chars',
      mutate: p => { p.payees[0].prefix = 'https://raw.githubusercontent.com/' + 'a'.repeat(280) + '/'; },
      expectedError: 'bad prefix: length',
    },
  ];

  testCases.forEach(({ name, mutate, expectedError }) => {
    it(`fails with "${expectedError}" on: ${name}`, () => {
      const clone: PolicyParams = JSON.parse(JSON.stringify(validBaseParams));
      mutate(clone);
      const res = validatePolicyParams(clone);
      expect(res.valid).toBe(false);
      expect(res.error).toBe(expectedError);
      expect(() => buildPolicyJson(clone)).toThrow(expectedError);
    });
  });

  it('validates account names strictly (3-60 ASCII)', () => {
    expect(validateAccountName('AB').valid).toBe(false);
    expect(validateAccountName('Valid Account Name').valid).toBe(true);
    expect(validateAccountName('A'.repeat(61)).valid).toBe(false);
    expect(validateAccountName('Name with emoji 😊').valid).toBe(false);
  });
});
