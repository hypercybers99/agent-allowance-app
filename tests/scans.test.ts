import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

describe('Static Scanners Automated Suite', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('runs banned words scan with zero violations', () => {
    const res = execSync('node scripts/scan_banned.mjs', { cwd: rootDir, encoding: 'utf8' });
    expect(res).toContain('Banned words scan passed: 0 occurrences.');
  });

  it('runs visual styling scan with zero gradients or glassmorphism', () => {
    const res = execSync('node scripts/scan_gradients.mjs', { cwd: rootDir, encoding: 'utf8' });
    expect(res).toContain('Visual styling scan passed: 0 gradients, 0 glassmorphism.');
  });

  it('runs contrast audit with 100% WCAG AA compliance (>= 4.5:1)', () => {
    const res = execSync('node scripts/scan_contrast.mjs', { cwd: rootDir, encoding: 'utf8' });
    expect(res).toContain('Contrast audit passed');
  });

  it('verifies byte-for-byte contract parity against on-chain code', () => {
    const res = execSync('node scripts/verify_contracts.mjs', { cwd: rootDir, encoding: 'utf8' });
    expect(res).toContain('RESULT: ALL CONTRACTS VERIFIED BYTE-FOR-BYTE ON GENLAYER STUDIONET');
  });
});
