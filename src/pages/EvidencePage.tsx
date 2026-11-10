import React, { useState } from 'react';
import {
  CANONICAL_REQUESTS,
  RECEIPT_BACKED_ROBUSTNESS,
  FINALIZATION_DATA,
  R6_AMENDMENT,
  EVIDENCE_META,
  RobustnessBatchResult,
} from '../data/evidenceSummary';
import { getExplorerTxUrl, ACTIVE_CONTRACTS } from '../config/deployments';
import { DecisionStamp } from '../components/DecisionStamp';
import { NoticeBanner } from '../components/NoticeBanner';

export const EvidencePage: React.FC = () => {
  const [selectedRequest, setSelectedRequest] = useState<string>('R1');
  const reqEntries = Object.entries(CANONICAL_REQUESTS);
  const activeReq = CANONICAL_REQUESTS[selectedRequest] || reqEntries[0][1];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
          On-Chain Evidence & Verification
        </h1>
        <p className="mt-2 text-slate-700">
          Cryptographically pinned execution evidence, canonical transactions, and robustness runs on GenLayer studionet.
        </p>
      </div>

      <NoticeBanner
        level="info"
        title="Source of Truth & Git Tag"
        message={`Evidence verified from contract repository ${EVIDENCE_META.source_repo} at tag ${EVIDENCE_META.source_tag} (commit ${EVIDENCE_META.source_commit.slice(0, 7)}).`}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-parchment-100 border border-parchment-400 rounded">
          <div className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Decision Parity</div>
          <div className="text-2xl font-bold font-mono text-forest-700 mt-1">{R6_AMENDMENT.decisionParity}</div>
          <div className="text-xs text-slate-600 mt-1">13 of 13 canonical requests matched expected outcome</div>
        </div>
        <div className="p-4 bg-parchment-100 border border-parchment-400 rounded">
          <div className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Reason Parity</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{R6_AMENDMENT.reasonParity}</div>
          <div className="text-xs text-slate-600 mt-1">12 of 13 matched; R6 halted safely on quote validation</div>
        </div>
        <div className="p-4 bg-parchment-100 border border-parchment-400 rounded">
          <div className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Robustness Runs</div>
          <div className="text-2xl font-bold font-mono text-forest-700 mt-1">60 / 60 (100%)</div>
          <div className="text-xs text-slate-600 mt-1">6 test targets, 10 on-chain runs each with raw receipts</div>
        </div>
        <div className="p-4 bg-parchment-100 border border-parchment-400 rounded">
          <div className="text-sm text-slate-600 font-semibold uppercase tracking-wide">Tx Status</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {FINALIZATION_DATA.finalized} / {FINALIZATION_DATA.total}
          </div>
          <div className="text-xs text-slate-600 mt-1">111 finalized on RPC; 2 deploys unindexed</div>
        </div>
      </div>

      {/* Canonical Requests R1 - R13 Table */}
      <div className="bg-parchment-100 border border-parchment-400 rounded p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-parchment-300 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">
              13 Canonical On-Chain Spend Requests (R1 – R13)
            </h2>
            <p className="text-slate-700 text-sm mt-1">
              Executed sequentially against active AllowanceVault on studionet. Click any row to inspect details.
            </p>
          </div>
          <div className="text-xs font-mono bg-parchment-200 px-3 py-1.5 rounded border border-parchment-400 text-slate-800">
            Active Vault: {ACTIVE_CONTRACTS.vault.address.slice(0, 10)}...
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-parchment-400 bg-parchment-200 text-slate-800">
                <th className="py-2.5 px-3 font-semibold">Req</th>
                <th className="py-2.5 px-3 font-semibold">Payee</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold text-right">Declared</th>
                <th className="py-2.5 px-3 font-semibold">Decision</th>
                <th className="py-2.5 px-3 font-semibold">Expected Decision</th>
                <th className="py-2.5 px-3 font-semibold">Actual Reason</th>
                <th className="py-2.5 px-3 font-semibold">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-300 font-mono text-xs">
              {reqEntries.map(([label, r]) => {
                const isSelected = selectedRequest === label;
                return (
                  <tr
                    key={label}
                    onClick={() => setSelectedRequest(label)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-100/70 font-semibold'
                        : 'hover:bg-parchment-200/60'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-900 font-bold">{label}</td>
                    <td className="py-2 px-3 text-slate-800 font-sans">{r.payee}</td>
                    <td className="py-2 px-3 text-slate-700 font-sans">{r.declaredCategory}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{r.declaredAmount}</td>
                    <td className="py-2 px-3 font-sans">
                      <DecisionStamp decision={r.actualDecision} />
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <DecisionStamp decision={r.expectedDecision} />
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      <code>{r.actualReason}</code>
                    </td>
                    <td className="py-2 px-3">
                      {r.txHash ? (
                        <a
                          href={getExplorerTxUrl(r.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-700 underline font-sans"
                        >
                          {r.txHash.slice(0, 8)}...
                        </a>
                      ) : (
                        <span className="text-slate-400 font-sans">none</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Request Deep-Dive */}
        {activeReq && (
          <div className="mt-6 p-4 bg-parchment-50 border border-parchment-300 rounded space-y-3 font-sans">
            <div className="flex items-center justify-between border-b border-parchment-200 pb-2">
              <div className="font-bold text-slate-900">
                Detail View: {selectedRequest} (Spend #{activeReq.spendId})
              </div>
              <div className="text-xs text-slate-600 font-mono">
                Latency: {activeReq.latency || 'not measured'} | Executed: {activeReq.executed}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Evidence URL:</span>
                <span className="break-all text-slate-900">{activeReq.evidenceFile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Hash:</span>
                {activeReq.txHash ? (
                  <a
                    href={getExplorerTxUrl(activeReq.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 underline break-all"
                  >
                    {activeReq.txHash}
                  </a>
                ) : (
                  <span className="text-slate-500">not recorded</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Observed Amount & Category:</span>
                <span className="text-slate-900">
                  {activeReq.observedAmount} CREDITS ({activeReq.observedCategory})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Verbatim Extracted Quote:</span>
                <span className="text-slate-800 italic">
                  "{activeReq.quote || 'none'}"
                </span>
              </div>
            </div>

            {selectedRequest === 'R6' && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 mt-2">
                <strong>R6 Honesty Note:</strong> Expected reason was <code>{R6_AMENDMENT.expectedReason}</code>, actual on-chain reason is <code>{R6_AMENDMENT.actualReason}</code>. {R6_AMENDMENT.summary}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Robustness Section */}
      <div className="bg-parchment-100 border border-parchment-400 rounded p-6">
        <h2 className="text-xl font-bold text-slate-900 font-sans mb-2">
          Robustness Evidence: 60 Raw On-Chain Consensus Transactions
        </h2>
        <p className="text-slate-700 text-sm mb-4">
          All 6 fixture targets were tested with 10 repeated on-chain transactions each (60 runs total) via <code>scripts/run_robustness_batch.mjs</code> on contract <code>{ACTIVE_CONTRACTS.probe.address}</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className="border-b border-parchment-400 bg-parchment-200 text-slate-800">
                <th className="py-2.5 px-3 font-semibold">Target Fixture</th>
                <th className="py-2.5 px-3 font-semibold text-center">Attempts</th>
                <th className="py-2.5 px-3 font-semibold text-center">RPC Success</th>
                <th className="py-2.5 px-3 font-semibold text-center">Parse Rate</th>
                <th className="py-2.5 px-3 font-semibold text-center">Expected Matches</th>
                <th className="py-2.5 px-3 font-semibold text-center">Agreement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y border-parchment-300 font-mono text-xs">
              {Object.entries(RECEIPT_BACKED_ROBUSTNESS).map(([target, data]: [string, RobustnessBatchResult]) => (
                <tr key={target}>
                  <td className="py-2 px-3 text-slate-900 font-bold">{target}</td>
                  <td className="py-2 px-3 text-center">{data.attempts}</td>
                  <td className="py-2 px-3 text-center">{data.successes} / {data.attempts}</td>
                  <td className="py-2 px-3 text-center">{data.parseSuccess} / {data.attempts}</td>
                  <td className="py-2 px-3 text-center">{data.expectedHits} / {data.attempts}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 bg-forest-100 text-forest-800 rounded font-bold font-sans">
                      {data.passed ? '100% PASS' : 'FAILED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-parchment-50 border border-parchment-300 rounded text-xs text-slate-700 space-y-2">
          <div className="font-semibold text-slate-900 text-sm">Harvested vs Receipt-Backed Distinction:</div>
          <p>
            An earlier harvesting run recorded 50 outputs via read-backs (stored state queries). To ensure verifiable provenance, the batch was completely re-executed as 60 individual write transactions, each writing its own consensus receipt with latency, block, and transaction hash saved directly into <code>docs/evidence/robustness/</code>.
          </p>
        </div>
      </div>

      {/* Contract Parity & Deploys Section */}
      <div className="bg-parchment-100 border border-parchment-400 rounded p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 font-sans">
          Contract Parity & Deployment Verification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded space-y-1">
            <div className="font-bold text-slate-900 font-sans text-sm">AllowanceVault</div>
            <div>Address: <code>{ACTIVE_CONTRACTS.vault.address}</code></div>
            <div>Local Source SHA: <code>{ACTIVE_CONTRACTS.vault.expectedSha256.slice(0, 16)}...</code></div>
            <div>Status: <span className="text-forest-700 font-bold">Byte-for-byte exact match on-chain</span></div>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded space-y-1">
            <div className="font-bold text-slate-900 font-sans text-sm">SpendGate</div>
            <div>Address: <code>{ACTIVE_CONTRACTS.gate.address}</code></div>
            <div>Local Source SHA: <code>{ACTIVE_CONTRACTS.gate.expectedSha256.slice(0, 16)}...</code></div>
            <div>Status: <span className="text-forest-700 font-bold">Byte-for-byte exact match on-chain</span></div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 space-y-2">
          <div className="font-semibold text-sm text-amber-900">Deployment Transaction Record Note:</div>
          <p>
            Deploy transactions not found on the RPC; cause not determined; source compared with the code stored on the contract address. Both contracts were confirmed identical to their repository sources using <code>gen_getContractCode</code>.
          </p>
          <p>
            <strong>Superseded Deployment:</strong> Earlier contract <code>0x63D63C490AD9Cf9C35E196D8366e23748212C5c2</code> is documented as a superseded deployment and is not used by this web application.
          </p>
        </div>
      </div>
    </div>
  );
};
