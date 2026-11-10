import { describe, it, expect } from 'vitest';
import { classifyReceipt, RawTransactionReceipt } from '../src/lib/receipt';

describe('Receipt Classification Unit Tests', () => {
  it('classifies valid ACCEPTED + MAJORITY_AGREE + SUCCESS receipt as passed', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'ACCEPTED',
      result_name: 'MAJORITY_AGREE',
      consensus_data: {
        leader_receipt: [{ execution_result: 'SUCCESS' }],
      },
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(true);
    expect(c.isFailed).toBe(false);
    expect(c.explanation).toContain('Transaction verified');
  });

  it('classifies valid FINALIZED + MAJORITY_AGREE + SUCCESS receipt as passed', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'FINALIZED',
      result_name: 'MAJORITY_AGREE',
      leader_execution_result: 'SUCCESS',
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(true);
    expect(c.isAccepted).toBe(true);
  });

  it('classifies UNDETERMINED receipt as no change', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'ACCEPTED',
      result_name: 'UNDETERMINED',
      leader_execution_result: 'SUCCESS',
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(false);
    expect(c.isUndetermined).toBe(true);
    expect(c.explanation).toBe('No change: the state was not updated (validator consensus undetermined or disagreed).');
  });

  it('classifies MAJORITY_DISAGREE receipt as no change', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'ACCEPTED',
      result_name: 'MAJORITY_DISAGREE',
      leader_execution_result: 'SUCCESS',
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(false);
    expect(c.isMajorityDisagree).toBe(true);
    expect(c.explanation).toBe('No change: the state was not updated (validator consensus undetermined or disagreed).');
  });

  it('classifies leader ERROR as failed', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'ACCEPTED',
      result_name: 'MAJORITY_AGREE',
      consensus_data: {
        leader_receipt: [{ execution_result: 'ERROR' }],
      },
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(false);
    expect(c.isLeaderSuccess).toBe(false);
    expect(c.explanation).toContain('Leader execution failed');
  });

  it('classifies REJECTED status as failed', () => {
    const rcpt: RawTransactionReceipt = {
      status_name: 'REJECTED',
      result_name: 'MAJORITY_AGREE',
      leader_execution_result: 'SUCCESS',
    };
    const c = classifyReceipt(rcpt);
    expect(c.isRulePassed).toBe(false);
    expect(c.isAccepted).toBe(false);
    expect(c.explanation).toContain('rather than ACCEPTED or FINALIZED');
  });

  it('classifies null or undefined receipt safely', () => {
    const c = classifyReceipt(null);
    expect(c.isRulePassed).toBe(false);
    expect(c.isFailed).toBe(true);
    expect(c.explanation).toContain('No transaction receipt');
  });
});
