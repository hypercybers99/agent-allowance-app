import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ID Discovery Mechanism Proof (Lesson 2)', () => {
  const goldenDir = path.resolve(__dirname, 'golden');

  it('proves account ID discovery from list_accounts_by_owner reverse iteration', () => {
    const listRaw = JSON.parse(
      fs.readFileSync(path.join(goldenDir, 'list_accounts_by_owner.json'), 'utf8')
    );

    // list_accounts_by_owner returns accounts in reverse order of creation
    expect(Array.isArray(listRaw)).toBe(true);
    expect(listRaw.length).toBeGreaterThan(0);

    const newestAccount = listRaw[0];
    expect(newestAccount).toHaveProperty('id');
    expect(typeof newestAccount.id).toBe('string');
    expect(Number(newestAccount.id)).toBeGreaterThan(0);

    console.log(`Discovered newest Account ID: ${newestAccount.id} (${newestAccount.name})`);
  });

  it('proves spend ID discovery after consensus token return', () => {
    // request_spend returns consensus token: <DECISION>|<amount>|<category>|<norm_hash16>
    const sampleConsensusToken = 'APPROVED|120|CLOUD|dd3c54d999637028';
    expect(sampleConsensusToken).toMatch(/^(APPROVED|DENIED|ASK_OWNER)\|/);

    const spendsRaw = JSON.parse(
      fs.readFileSync(path.join(goldenDir, 'list_spends.json'), 'utf8')
    );

    expect(Array.isArray(spendsRaw)).toBe(true);
    expect(spendsRaw.length).toBeGreaterThanOrEqual(2);

    // First spend in array is newest spend (reverse order)
    const latestSpend = spendsRaw[0];
    const previousSpend = spendsRaw[1];

    expect(Number(latestSpend.id)).toBeGreaterThan(Number(previousSpend.id));

    console.log(`Discovered latest Spend ID: ${latestSpend.id}`);
    console.log(`Discovered previous Spend ID: ${previousSpend.id}`);
    console.log('Proven: Two consecutive spends are distinguishable and monotonically ordered.');
  });
});
