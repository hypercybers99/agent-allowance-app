import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CONTRACT_ERRORS, resolveContractError } from '../src/lib/errors';

function extractContractErrors(filePath: string): { exact: Set<string>; prefixes: Set<string> } {
  const content = fs.readFileSync(filePath, 'utf8');
  const exact = new Set<string>();
  const prefixes = new Set<string>();

  const regex = /raise gl\.vm\.UserError\(\s*(f)?(["'])([\s\S]*?)\2\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const isFString = !!match[1];
    const raw = match[3];
    if (isFString && raw.includes('{')) {
      const pfx = raw.split('{')[0];
      prefixes.add(pfx);
    } else {
      exact.add(raw);
    }
  }

  return { exact, prefixes };
}

describe('Contract Error Mapping Bidirectional Parity', () => {
  it('should match every UserError in AllowanceVault.py and SpendGate.py with zero differences', () => {
    const vaultPath = path.resolve(__dirname, '../contracts/AllowanceVault.py');
    const gatePath = path.resolve(__dirname, '../contracts/SpendGate.py');

    expect(fs.existsSync(vaultPath)).toBe(true);
    expect(fs.existsSync(gatePath)).toBe(true);

    const vaultErrors = extractContractErrors(vaultPath);
    const gateErrors = extractContractErrors(gatePath);

    const allContractKeys = new Set<string>([
      ...vaultErrors.exact,
      ...vaultErrors.prefixes,
      ...gateErrors.exact,
      ...gateErrors.prefixes,
    ]);

    const mappedKeys = new Set<string>(Object.keys(CONTRACT_ERRORS));

    // Calculate diffs both ways
    const missingInMapping = [...allContractKeys].filter(k => !mappedKeys.has(k));
    const extraInMapping = [...mappedKeys].filter(k => !allContractKeys.has(k));

    console.log('\n=================================================');
    console.log('ERROR PARITY TEST METRICS:');
    console.log(`  AllowanceVault Unique Exact Errors: ${vaultErrors.exact.size}`);
    console.log(`  AllowanceVault Prefix Errors:       ${vaultErrors.prefixes.size}`);
    console.log(`  SpendGate Unique Exact Errors:      ${gateErrors.exact.size}`);
    console.log(`  SpendGate Prefix Errors:           ${gateErrors.prefixes.size}`);
    console.log(`  Total Unique Contract Error Keys:   ${allContractKeys.size}`);
    console.log(`  Total Mapped Errors in errors.ts:   ${mappedKeys.size}`);
    console.log(`  Missing in Mapping (Diff):         ${JSON.stringify(missingInMapping)}`);
    console.log(`  Extra in Mapping (Diff):           ${JSON.stringify(extraInMapping)}`);
    console.log('=================================================\n');

    expect(missingInMapping).toEqual([]);
    expect(extraInMapping).toEqual([]);
    expect(mappedKeys.size).toBe(allContractKeys.size);
  });

  it('should correctly resolve exact and prefix errors', () => {
    const exactRes = resolveContractError('insufficient balance');
    expect(exactRes.title).toBe('insufficient balance');
    expect(exactRes.plain).toContain('demo credits');

    const pfxRes = resolveContractError('HTTP status not 200: 404');
    expect(pfxRes.plain).toContain('HTTP error status code');

    const dupRes = resolveContractError('duplicate observation: 4');
    expect(dupRes.plain).toContain('already been recorded');
  });
});
