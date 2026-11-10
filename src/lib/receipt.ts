// Receipt Rule and Classification for GenLayer Studionet
// Receipt rule: status_name in ('ACCEPTED', 'FINALIZED')
//           AND result_name == 'MAJORITY_AGREE'
//           AND leader_receipt[0].execution_result == 'SUCCESS'

export interface RawTransactionReceipt {
  hash?: string;
  txHash?: string;
  status_name?: string;
  result_name?: string;
  consensus_data?: {
    leader_receipt?: Array<{
      execution_result?: string;
    }>;
  };
  leader_execution_result?: string;
}

export interface ReceiptClassification {
  isAccepted: boolean;
  isMajorityAgree: boolean;
  isLeaderSuccess: boolean;
  isRulePassed: boolean;
  isUndetermined: boolean;
  isMajorityDisagree: boolean;
  isFailed: boolean;
  explanation: string;
}

/**
 * Classifies any GenLayer transaction receipt into structured status flags and user-facing explanation.
 */
export function classifyReceipt(receipt: RawTransactionReceipt | null | undefined): ReceiptClassification {
  if (!receipt) {
    return {
      isAccepted: false,
      isMajorityAgree: false,
      isLeaderSuccess: false,
      isRulePassed: false,
      isUndetermined: false,
      isMajorityDisagree: false,
      isFailed: true,
      explanation: 'No transaction receipt was received.',
    };
  }

  const status = (receipt.status_name || '').toUpperCase();
  const result = (receipt.result_name || '').toUpperCase();
  const leaderExec = (
    receipt.consensus_data?.leader_receipt?.[0]?.execution_result ||
    receipt.leader_execution_result ||
    ''
  ).toUpperCase();

  const isAccepted = status === 'ACCEPTED' || status === 'FINALIZED';
  const isMajorityAgree = result === 'MAJORITY_AGREE';
  const isLeaderSuccess = leaderExec === 'SUCCESS';
  const isRulePassed = isAccepted && isMajorityAgree && isLeaderSuccess;

  const isUndetermined = result === 'UNDETERMINED' || status === 'UNDETERMINED';
  const isMajorityDisagree = result === 'MAJORITY_DISAGREE';
  const isFailed = !isRulePassed;

  let explanation = '';
  if (isRulePassed) {
    explanation = 'Transaction verified by validators and committed to on-chain state.';
  } else if (isUndetermined || isMajorityDisagree) {
    explanation = 'No change: the state was not updated (validator consensus undetermined or disagreed).';
  } else if (!isAccepted) {
    explanation = `Transaction status was "${status}" rather than ACCEPTED or FINALIZED.`;
  } else if (!isLeaderSuccess) {
    explanation = `Leader execution failed with "${leaderExec}".`;
  } else {
    explanation = 'Transaction failed validator consensus receipt requirements.';
  }

  return {
    isAccepted,
    isMajorityAgree,
    isLeaderSuccess,
    isRulePassed,
    isUndetermined,
    isMajorityDisagree,
    isFailed,
    explanation,
  };
}
