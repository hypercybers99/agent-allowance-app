// Mapping of all UserError strings from AllowanceVault.py and SpendGate.py
// Enforced by automated bidirectional parity tests against contract sources.

export interface ContractErrorInfo {
  key: string;
  contract: 'AllowanceVault' | 'SpendGate';
  isPrefix: boolean;
  plain: string;
  next: string;
}

export const CONTRACT_ERRORS: Record<string, ContractErrorInfo> = {
  // AllowanceVault - Demo Credits
  'already claimed demo credits': {
    key: 'already claimed demo credits',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'This address has already received its one-time 1,000 demo credits provision.',
    next: 'Use an alternate wallet address if you need additional demo testing credits.',
  },

  // AllowanceVault - Account Creation Rules
  'bad name': {
    key: 'bad name',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Account name must be between 3 and 60 printable ASCII characters.',
    next: 'Provide a valid account name between 3 and 60 characters without non-ASCII characters.',
  },
  'bad policy JSON': {
    key: 'bad policy JSON',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The policy payload is not valid JSON or contains duplicate or unexpected keys.',
    next: 'Ensure the policy contains exactly the six canonical keys without duplicates.',
  },
  'bad per_spend_cap': {
    key: 'bad per_spend_cap',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Per-spend cap must be an integer greater than zero and at most total budget.',
    next: 'Set per_spend_cap to a positive number less than or equal to total_budget.',
  },
  'bad total_budget': {
    key: 'bad total_budget',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Total budget must be an integer strictly greater than zero.',
    next: 'Enter a positive whole number for the total account budget.',
  },
  'bad max_spends': {
    key: 'bad max_spends',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Maximum spends must be an integer strictly greater than zero.',
    next: 'Set max_spends to at least 1.',
  },
  'bad currency': {
    key: 'bad currency',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Currency code must be a 3-letter uppercase ASCII string (e.g., USD or EUR).',
    next: 'Specify a standard 3-character currency code like USD or EUR.',
  },
  'bad categories': {
    key: 'bad categories',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Categories must be a non-empty list of allowed categories without duplicates.',
    next: 'Select at least one allowed category from SOFTWARE, CLOUD, DATA, MARKETING, TRAVEL, OTHER.',
  },
  'bad category': {
    key: 'bad category',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The requested category is not in the allowed list for this system.',
    next: 'Choose an allowed category: SOFTWARE, CLOUD, DATA, MARKETING, TRAVEL, or OTHER.',
  },
  'bad payees': {
    key: 'bad payees',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Payees list must contain between 1 and 5 unique payee entries.',
    next: 'Add between 1 and 5 distinct registered payees with valid 0x addresses.',
  },

  // AllowanceVault - URL Prefix Validation
  'bad prefix: length': {
    key: 'bad prefix: length',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The payee evidence URL prefix is too short or exceeds 300 characters.',
    next: 'Ensure the prefix URL is between 12 and 300 characters.',
  },
  'bad prefix: trailing slash': {
    key: 'bad prefix: trailing slash',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The evidence prefix must end with a trailing forward slash.',
    next: 'Append a trailing slash "/" to the payee evidence prefix.',
  },
  'bad prefix: url': {
    key: 'bad prefix: url',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The URL prefix is malformed or could not be parsed.',
    next: 'Enter a valid, absolute HTTPS URL prefix.',
  },
  'bad prefix: scheme': {
    key: 'bad prefix: scheme',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The evidence URL prefix scheme must be https.',
    next: 'Change the prefix scheme to https://.',
  },
  'bad prefix: userinfo': {
    key: 'bad prefix: userinfo',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The evidence URL prefix must not contain embedded user credentials.',
    next: 'Remove any username or password from the prefix URL.',
  },
  'bad prefix: host': {
    key: 'bad prefix: host',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The evidence URL prefix is missing a valid host name.',
    next: 'Provide a valid hostname in the prefix (e.g. raw.githubusercontent.com).',
  },
  'bad prefix: port': {
    key: 'bad prefix: port',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Explicit ports are not allowed in the evidence URL prefix.',
    next: 'Remove port numbers from the prefix URL; standard HTTPS (443) is required.',
  },
  'bad prefix: query': {
    key: 'bad prefix: query',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Query parameters are not allowed in the payee URL prefix.',
    next: 'Remove query strings (anything after "?") from the prefix.',
  },
  'bad prefix: fragment': {
    key: 'bad prefix: fragment',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'URL fragments (#) are not allowed in the evidence prefix.',
    next: 'Remove hash fragments from the prefix URL.',
  },

  // AllowanceVault - Account State & Access Control
  'unknown account': {
    key: 'unknown account',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The requested account id does not exist on-chain.',
    next: 'Verify the account id number and confirm it was created on-chain.',
  },
  'not owner': {
    key: 'not owner',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The caller is not the registered owner of this account.',
    next: 'Switch to the wallet address that created this spending account.',
  },
  'account closed': {
    key: 'account closed',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'This account has been closed and cannot accept new actions.',
    next: 'Create a new spending account to resume agent operations.',
  },

  // AllowanceVault - Funding
  'bad amount': {
    key: 'bad amount',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Amount must be an integer strictly greater than zero.',
    next: 'Enter a positive integer amount.',
  },
  'funding exceeds the budget rule': {
    key: 'funding exceeds the budget rule',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Funding this amount would cause total funded credits to exceed total budget.',
    next: 'Fund only up to the remaining budget ceiling for this account.',
  },
  'insufficient balance': {
    key: 'insufficient balance',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Your address does not hold enough demo credits to fund this account.',
    next: 'Claim 1,000 demo credits on the credits page before funding.',
  },

  // AllowanceVault - Agent Management
  'bad agent address': {
    key: 'bad agent address',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The provided agent address is invalid or already registered.',
    next: 'Provide a valid, unique 40-hex character Ethereum address for the agent.',
  },
  'too many agents': {
    key: 'too many agents',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The account has already reached the maximum limit of 5 authorized agents.',
    next: 'Remove an inactive agent before adding a new one.',
  },

  // AllowanceVault - Spend Resolution
  'unknown spend': {
    key: 'unknown spend',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The specified spend id does not exist.',
    next: 'Check the spend id in your account spends list.',
  },
  'spend not pending': {
    key: 'spend not pending',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The spend is not in PENDING status and cannot be resolved by owner.',
    next: 'Only spends held in PENDING (ASK_OWNER) status can be reviewed and resolved.',
  },
  'limits no longer hold on resolve': {
    key: 'limits no longer hold on resolve',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The account has insufficient balance or reached its spend ceiling since creation.',
    next: 'Fund the account with sufficient credits before approving the pending spend.',
  },

  // AllowanceVault - Request Spend Pre-flight & Execution
  'not a registered agent': {
    key: 'not a registered agent',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The calling address is not an authorized agent for this account.',
    next: 'Have the account owner register your address in the account agent list.',
  },
  'bad payee address': {
    key: 'bad payee address',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'Payee address is invalid or not in the account payee allowlist.',
    next: 'Select a payee registered in the account policy allowlist.',
  },
  'evidence source unreachable': {
    key: 'evidence source unreachable',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The invoice evidence URL could not be reached or timed out.',
    next: 'Check that the invoice URL is publicly reachable without authentication.',
  },
  'HTTP status not 200: ': {
    key: 'HTTP status not 200: ',
    contract: 'AllowanceVault',
    isPrefix: true,
    plain: 'The invoice URL returned an HTTP error status code.',
    next: 'Verify that the server hosts the file and returns HTTP status 200.',
  },
  'page too large': {
    key: 'page too large',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The invoice page content exceeds the maximum size limit of 400,000 bytes.',
    next: 'Reduce the page size or use a clean static text or markdown document.',
  },
  'page unreadable (too little text; it may need JavaScript)': {
    key: 'page unreadable (too little text; it may need JavaScript)',
    contract: 'AllowanceVault',
    isPrefix: false,
    plain: 'The document yielded fewer than 100 characters of readable text; SPAs not supported.',
    next: 'Ensure invoice content is pre-rendered static HTML or plain markdown.',
  },
  'duplicate observation: ': {
    key: 'duplicate observation: ',
    contract: 'AllowanceVault',
    isPrefix: true,
    plain: 'This invoice evidence URL has already been recorded for an executed spend.',
    next: 'Each spend must reference a distinct invoice URL; reuse is prohibited.',
  },

  // SpendGate - Merchant Fulfillment
  'sender must equal payee': {
    key: 'sender must equal payee',
    contract: 'SpendGate',
    isPrefix: false,
    plain: 'Only the registered payee address can execute the service fulfillment.',
    next: 'Connect the wallet matching the designated payee address.',
  },
  'spend already served': {
    key: 'spend already served',
    contract: 'SpendGate',
    isPrefix: false,
    plain: 'This spend has already been marked as fulfilled on SpendGate.',
    next: 'Each verified spend receipt can be served exactly once.',
  },
  'spend not valid for these parameters': {
    key: 'spend not valid for these parameters',
    contract: 'SpendGate',
    isPrefix: false,
    plain: 'The parameters provided do not match the on-chain verified spend receipt.',
    next: 'Verify the spend id, payee, amount, account id, and policy hash.',
  },
};

/**
 * Resolves a raw contract UserError string into plain language and action steps.
 */
export function resolveContractError(rawError: string): { title: string; plain: string; next: string } {
  if (!rawError) {
    return {
      title: 'Unknown Error',
      plain: 'An unexpected transaction error occurred.',
      next: 'Check browser console and transaction status on explorer.',
    };
  }

  // Exact match
  if (CONTRACT_ERRORS[rawError]) {
    return {
      title: rawError,
      plain: CONTRACT_ERRORS[rawError].plain,
      next: CONTRACT_ERRORS[rawError].next,
    };
  }

  // Prefix match (for f-string formatted messages)
  for (const [key, info] of Object.entries(CONTRACT_ERRORS)) {
    if (info.isPrefix && rawError.startsWith(key)) {
      return {
        title: rawError,
        plain: info.plain,
        next: info.next,
      };
    }
  }

  // Fallback
  return {
    title: rawError,
    plain: `Contract returned: "${rawError}"`,
    next: 'Review parameters and account requirements before retrying.',
  };
}
