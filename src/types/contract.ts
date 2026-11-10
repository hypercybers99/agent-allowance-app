// Exact contract types verified against tests/golden/ on-chain responses
// Zero invented fields (no dates, no expires, no daily limit)

export interface PayeeRecord {
  payee: string;
  prefix: string;
}

export interface AccountRecord {
  id: string;
  owner: string;
  name: string;
  balance: string;
  spent: string;
  spend_count: string;
  per_spend_cap: string;
  total_budget: string;
  max_spends: string;
  currency: string;
  categories: string[];
  payees: PayeeRecord[];
  agents: string[];
  policy_hash: string;
  status: 'OPEN' | 'CLOSED';
  seq: string;
  schema_version: string;
}

export interface SpendRecord {
  id: string;
  account_id: string;
  agent: string;
  payee: string;
  declared_amount: string;
  declared_category: string;
  evidence_url: string;
  decision: 'APPROVED' | 'DENIED' | 'PENDING' | 'OWNER_APPROVED' | 'OWNER_REJECTED';
  reason: string;
  observed_amount: string;
  observed_category: string;
  quote: string;
  norm_hash16: string;
  tripwire: boolean;
  leader_reported: string;
  executed: string;
  seq: string;
  schema_version: string;
}

export interface SpendReceiptRecord {
  spend_id: string;
  account_id: string;
  payee: string;
  amount: string;
  category: string;
  decision: string;
  executed: string;
  policy_hash: string;
}

export interface ContractLimits {
  max_agents: string;
  max_list_limit: string;
  max_page_bytes: string;
  max_payees: string;
  max_url_len: string;
  min_text_chars: string;
  schema_version: string;
}

export interface ContractStats {
  next_account: string;
  next_spend: string;
  schema_version: string;
  total_minted: string;
}

export interface SpendGateServiceRecord {
  spend_id: string;
  service: string;
}

export interface ReceiptTriple {
  status_name: string;
  result_name: string;
  leader_execution_result: string;
}

export interface TransactionReceiptClassification {
  isAccepted: boolean;
  isSuccess: boolean;
  isUndetermined: boolean;
  isDisagree: boolean;
  explanation: string;
}
