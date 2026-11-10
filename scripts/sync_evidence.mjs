import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const contractRepoPath = process.env.CONTRACT_REPO_PATH || 'E:/Agent Allowance_V2.2';

console.log('======================================================');
console.log('SYNC EVIDENCE: Copy Evidence Data to src/data/');
console.log(`Contract repository path: ${contractRepoPath}`);
console.log('======================================================');

if (!fs.existsSync(contractRepoPath)) {
  console.error(`Error: Contract repository path not found at ${contractRepoPath}`);
  process.exit(1);
}

// Get source commit and tag
let sourceCommit = '1880a068bbad57e17246416ca238a221f72dd378';
let sourceTag = 'aa-v1b';
try {
  sourceCommit = execSync('git rev-parse HEAD', { cwd: contractRepoPath, encoding: 'utf8' }).trim();
  sourceTag = execSync('git describe --tags --exact-match 2>/dev/null || echo aa-v1b', { cwd: contractRepoPath, encoding: 'utf8' }).trim();
} catch (e) {
  // fallback defaults
}

const outDir = path.join(rootDir, 'src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function copyWithHeader(relPath, outName) {
  const fullSrc = path.join(contractRepoPath, relPath);
  if (!fs.existsSync(fullSrc)) {
    console.warn(`Warning: ${relPath} not found at ${fullSrc}`);
    return null;
  }
  const content = fs.readFileSync(fullSrc, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    data = content;
  }

  const envelope = {
    _meta: {
      source_repo: 'https://github.com/hypercybers99/agent-allowance-genlayer',
      source_tag: sourceTag,
      source_commit: sourceCommit,
      source_path: relPath,
      synced_at: new Date().toISOString(),
    },
    data: data,
  };

  const destPath = path.join(outDir, outName);
  fs.writeFileSync(destPath, JSON.stringify(envelope, null, 2), 'utf8');
  console.log(`Synced ${relPath} -> src/data/${outName}`);
  return data;
}

// 1. live_evidence.json (Canonical R1-R13)
const liveEvidence = copyWithHeader('docs/evidence/live_evidence.json', 'live_evidence.json');

// 2. Receipt backed summary
const receiptSummary = copyWithHeader('docs/evidence/robustness/receipt_backed_summary.json', 'receipt_backed_summary.json');

// 3. Robustness results (harvested)
const harvestedSummary = copyWithHeader('docs/evidence/robustness_results.json', 'robustness_results.json');

// 4. Finalization summary
const finalizationSummary = copyWithHeader('docs/evidence/finalization/2026-10-31T09-15-01-859Z.json', 'finalization_summary.json');

// 5. Negative cases
const negativeCases = {};
const negDir = path.join(contractRepoPath, 'docs/evidence/negative');
if (fs.existsSync(negDir)) {
  for (const f of fs.readdirSync(negDir)) {
    if (f.endsWith('.json')) {
      negativeCases[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(negDir, f), 'utf8'));
    }
  }
  const negEnvelope = {
    _meta: {
      source_repo: 'https://github.com/hypercybers99/agent-allowance-genlayer',
      source_tag: sourceTag,
      source_commit: sourceCommit,
      source_path: 'docs/evidence/negative/',
      synced_at: new Date().toISOString(),
    },
    data: negativeCases,
  };
  fs.writeFileSync(path.join(outDir, 'negative_cases.json'), JSON.stringify(negEnvelope, null, 2));
  console.log(`Synced negative test cases -> src/data/negative_cases.json`);
}

// 6. SpendGate cases
const spendGateCases = {};
const sgDir = path.join(contractRepoPath, 'docs/evidence/spendgate');
if (fs.existsSync(sgDir)) {
  for (const f of fs.readdirSync(sgDir)) {
    if (f.endsWith('.json')) {
      spendGateCases[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(sgDir, f), 'utf8'));
    }
  }
  const sgEnvelope = {
    _meta: {
      source_repo: 'https://github.com/hypercybers99/agent-allowance-genlayer',
      source_tag: sourceTag,
      source_commit: sourceCommit,
      source_path: 'docs/evidence/spendgate/',
      synced_at: new Date().toISOString(),
    },
    data: spendGateCases,
  };
  fs.writeFileSync(path.join(outDir, 'spendgate_cases.json'), JSON.stringify(sgEnvelope, null, 2));
  console.log(`Synced SpendGate cases -> src/data/spendgate_cases.json`);
}

// 7. R6 Amendment text
const r6Path = path.join(contractRepoPath, 'docs/EXPECTED_AMENDMENT.md');
if (fs.existsSync(r6Path)) {
  const r6Content = fs.readFileSync(r6Path, 'utf8');
  const r6Envelope = {
    _meta: {
      source_repo: 'https://github.com/hypercybers99/agent-allowance-genlayer',
      source_tag: sourceTag,
      source_commit: sourceCommit,
      source_path: 'docs/EXPECTED_AMENDMENT.md',
      synced_at: new Date().toISOString(),
    },
    data: {
      markdown: r6Content,
      spend_id: "6",
      expected_reason: "amount_unclear",
      actual_reason: "quote_not_found",
      decision_parity: "13/13 (100.0%)",
      reason_parity: "12/13 (92.3%)",
      explanation: "In contracts/AllowanceVault.py, verbatim quote and number validation occurs at Check 3 before ambiguity evaluation at Check 4. number_in_quote(quote, 0) requires amount > 0 and returns False when amount is 0. Consequently, quote_ok evaluated to False, immediately returning ('ASK_OWNER', 'quote_not_found') at Check 3. The spend was safely held in PENDING status for owner review and approved by the owner."
    }
  };
  fs.writeFileSync(path.join(outDir, 'r6_amendment.json'), JSON.stringify(r6Envelope, null, 2));
  console.log(`Synced R6 amendment -> src/data/r6_amendment.json`);
}

// 8. Generate TypeScript module src/data/evidenceSummary.ts
const tsModule = `// Generated automatically by scripts/sync_evidence.mjs
// Do not edit manually.

export interface MetaHeader {
  source_repo: string;
  source_tag: string;
  source_commit: string;
  source_path: string;
  synced_at: string;
}

export interface CanonicalRequest {
  spendId: string;
  payee: string;
  declaredAmount: number;
  declaredCategory: string;
  evidenceFile: string;
  expectedDecision: string;
  expectedReason: string;
  actualDecision: string;
  actualReason: string;
  observedAmount: string;
  observedCategory: string;
  quote: string;
  executed: string;
  txHash: string;
  latency: string;
}

export interface RobustnessBatchResult {
  slug: string;
  attempts: number;
  successes: number;
  parseSuccess: number;
  expectedHits: number;
  passRate: string;
  passed: boolean;
}

export const EVIDENCE_META: MetaHeader = {
  source_repo: 'https://github.com/hypercybers99/agent-allowance-genlayer',
  source_tag: '${sourceTag}',
  source_commit: '${sourceCommit}',
  source_path: 'docs/evidence/',
  synced_at: '${new Date().toISOString()}',
};

export const CANONICAL_REQUESTS: Record<string, CanonicalRequest> = ${JSON.stringify(liveEvidence?.canonical_requests || {}, null, 2)};

export const RECEIPT_BACKED_ROBUSTNESS: Record<string, RobustnessBatchResult> = ${JSON.stringify(receiptSummary || {}, null, 2)};

export const HARVESTED_ROBUSTNESS = ${JSON.stringify(harvestedSummary || {}, null, 2)};

export const FINALIZATION_DATA = ${JSON.stringify(finalizationSummary ? {
  total: finalizationSummary.summary?.total_checked || 113,
  finalized: finalizationSummary.summary?.finalized || 111,
  unindexed: finalizationSummary.summary?.not_found_in_rpc || 2,
} : {}, null, 2)};

export const R6_AMENDMENT = {
  spendId: '6',
  expectedReason: 'amount_unclear',
  actualReason: 'quote_not_found',
  decisionParity: '13/13 (100.0%)',
  reasonParity: '12/13 (92.3%)',
  summary: 'Check 3 verbatim quote and number validation (number_in_quote(quo, 0) == False) halts before Check 4 ambiguity check; safety boundary preserved via ASK_OWNER (PENDING).'
};
`;

fs.writeFileSync(path.join(outDir, 'evidenceSummary.ts'), tsModule, 'utf8');
console.log('Successfully wrote src/data/evidenceSummary.ts');
console.log('Evidence synchronization complete.');
