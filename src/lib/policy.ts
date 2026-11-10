// Client-side policy builder and validator for AllowanceVault
// Mirrors exact contract rules in contracts/AllowanceVault.py

export const ALLOWED_CATEGORIES = [
  'SOFTWARE',
  'CLOUD',
  'DATA',
  'MARKETING',
  'TRAVEL',
  'OTHER',
] as const;

export type Category = (typeof ALLOWED_CATEGORIES)[number];

export interface PayeeInput {
  payee: string;
  prefix: string;
}

export interface PolicyParams {
  per_spend_cap: number;
  total_budget: number;
  max_spends: number;
  currency: string;
  categories: string[];
  payees: PayeeInput[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates account name according to contract: 3-60 printable ASCII characters
 */
export function validateAccountName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'bad name', field: 'name' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 60) {
    return { valid: false, error: 'bad name', field: 'name' };
  }
  // Printable ASCII 32..126
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i);
    if (code < 32 || code > 126) {
      return { valid: false, error: 'bad name', field: 'name' };
    }
  }
  return { valid: true };
}

/**
 * Validates payee prefix URL against contract prefix rules
 */
export function validatePayeePrefix(prefix: string): ValidationResult {
  if (!prefix || typeof prefix !== 'string') {
    return { valid: false, error: 'bad prefix: trailing slash', field: 'prefix' };
  }
  const clean = prefix.trim();
  if (clean.length > 300) {
    return { valid: false, error: 'bad prefix: length', field: 'prefix' };
  }
  if (!clean.endsWith('/')) {
    return { valid: false, error: 'bad prefix: trailing slash', field: 'prefix' };
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { valid: false, error: 'bad prefix: url', field: 'prefix' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'bad prefix: scheme', field: 'prefix' };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'bad prefix: userinfo', field: 'prefix' };
  }
  if (!parsed.hostname || parsed.hostname.length === 0) {
    return { valid: false, error: 'bad prefix: host', field: 'prefix' };
  }
  if (parsed.port && parsed.port !== '' && parsed.port !== '443') {
    return { valid: false, error: 'bad prefix: port', field: 'prefix' };
  }
  if (parsed.search && parsed.search !== '') {
    return { valid: false, error: 'bad prefix: query', field: 'prefix' };
  }
  if (parsed.hash && parsed.hash !== '') {
    return { valid: false, error: 'bad prefix: fragment', field: 'prefix' };
  }

  return { valid: true };
}

/**
 * Validates the full policy parameters against all contract invariants
 */
export function validatePolicyParams(params: PolicyParams): ValidationResult {
  if (!params || typeof params !== 'object') {
    return { valid: false, error: 'bad policy JSON' };
  }

  // 1. per_spend_cap
  if (
    typeof params.per_spend_cap !== 'number' ||
    !Number.isInteger(params.per_spend_cap) ||
    params.per_spend_cap <= 0
  ) {
    return { valid: false, error: 'bad per_spend_cap', field: 'per_spend_cap' };
  }

  // 2. total_budget
  if (
    typeof params.total_budget !== 'number' ||
    !Number.isInteger(params.total_budget) ||
    params.total_budget <= 0
  ) {
    return { valid: false, error: 'bad total_budget', field: 'total_budget' };
  }

  // per_spend_cap <= total_budget rule
  if (params.per_spend_cap > params.total_budget) {
    return { valid: false, error: 'bad per_spend_cap', field: 'per_spend_cap' };
  }

  // 3. max_spends
  if (
    typeof params.max_spends !== 'number' ||
    !Number.isInteger(params.max_spends) ||
    params.max_spends <= 0
  ) {
    return { valid: false, error: 'bad max_spends', field: 'max_spends' };
  }

  // 4. currency
  if (
    typeof params.currency !== 'string' ||
    params.currency.length !== 3 ||
    params.currency !== params.currency.toUpperCase() ||
    !/^[A-Z]{3}$/.test(params.currency)
  ) {
    return { valid: false, error: 'bad currency', field: 'currency' };
  }

  // 5. categories
  if (!Array.isArray(params.categories) || params.categories.length === 0 || params.categories.length > 6) {
    return { valid: false, error: 'bad categories', field: 'categories' };
  }
  const seenCats = new Set<string>();
  for (const c of params.categories) {
    if (typeof c !== 'string' || !ALLOWED_CATEGORIES.includes(c as Category)) {
      return { valid: false, error: 'bad category', field: 'categories' };
    }
    if (seenCats.has(c)) {
      return { valid: false, error: 'bad categories', field: 'categories' };
    }
    seenCats.add(c);
  }

  // 6. payees
  if (!Array.isArray(params.payees) || params.payees.length === 0 || params.payees.length > 5) {
    return { valid: false, error: 'bad payees', field: 'payees' };
  }
  const seenPayees = new Set<string>();
  for (const p of params.payees) {
    if (!p || typeof p !== 'object' || typeof p.payee !== 'string' || typeof p.prefix !== 'string') {
      return { valid: false, error: 'bad payees', field: 'payees' };
    }
    const cleanPayee = p.payee.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(cleanPayee)) {
      return { valid: false, error: 'bad payees', field: 'payees' };
    }
    if (seenPayees.has(cleanPayee)) {
      return { valid: false, error: 'bad payees', field: 'payees' };
    }
    seenPayees.add(cleanPayee);

    // Validate prefix
    const pfxRes = validatePayeePrefix(p.prefix);
    if (!pfxRes.valid) {
      return pfxRes;
    }
  }

  return { valid: true };
}

/**
 * Serializes policy parameters into canonical JSON string expected by contract
 * Exactly six required keys in strict order:
 * per_spend_cap, total_budget, max_spends, currency, categories, payees
 */
export function buildPolicyJson(params: PolicyParams): string {
  const validation = validatePolicyParams(params);
  if (!validation.valid) {
    throw new Error(`Policy validation failed: ${validation.error}`);
  }

  const canonicalObj = {
    per_spend_cap: params.per_spend_cap,
    total_budget: params.total_budget,
    max_spends: params.max_spends,
    currency: params.currency.trim().toUpperCase(),
    categories: [...params.categories],
    payees: params.payees.map(p => ({
      payee: p.payee.trim().toLowerCase(),
      prefix: p.prefix.trim(),
    })),
  };

  return JSON.stringify(canonicalObj, null, 2);
}
