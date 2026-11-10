import React, { useState, useEffect } from 'react';
import { getLimits } from '../services/readClient';
import type { ContractLimits } from '../types/contract';
import { NoticeBanner } from '../components/NoticeBanner';

export const LimitsPage: React.FC = () => {
  const [contractLimits, setContractLimits] = useState<ContractLimits | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchLimits = async () => {
      setLoading(true);
      try {
        const lim = await getLimits();
        if (mounted && lim) {
          setContractLimits(lim);
        }
      } catch (err) {
        console.warn('Could not read limits from chain:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLimits();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
          Technical & Security Limitations
        </h1>
        <p className="mt-2 text-slate-700">
          Transparent disclosure of the trust model, intelligent contract boundaries, and architectural trade-offs.
        </p>
      </div>

      <NoticeBanner
        level="warning"
        title="Credits are demo credits, not money"
        message="Balances on studionet represent demonstration accounting units. Do not rely on them for commercial transfers or actual value settlement."
      />

      {/* Dynamic Contract Limits */}
      <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-4">
        <div className="flex items-center justify-between border-b border-parchment-300 pb-3">
          <h2 className="text-xl font-bold text-slate-900 font-sans">
            On-Chain Numerical Limits (from <code>get_limits()</code>)
          </h2>
          <span className="text-xs font-mono text-slate-700 font-medium">
            {loading ? 'Reading on-chain...' : 'Source: AllowanceVault.py'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Max Page Size</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.max_page_bytes ? Number(contractLimits.max_page_bytes).toLocaleString() : '400,000'} bytes
            </span>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Min Rendered Text</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.min_text_chars ?? '100'} chars
            </span>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Max URL Length</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.max_url_len ?? '300'} chars
            </span>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Max Payees / Account</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.max_payees ?? '10'}
            </span>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Max List Limit</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.max_list_limit ?? '100'}
            </span>
          </div>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded">
            <span className="text-xs text-slate-700 font-sans block uppercase font-semibold">Max Agents / Account</span>
            <span className="text-lg font-bold text-slate-900">
              {contractLimits?.max_agents ?? '10'}
            </span>
          </div>
        </div>
      </div>

      {/* Limitation Deep Dives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. JS Rendered Pages */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            1. JavaScript-Rendered Single-Page Apps Cannot Be Read
          </h3>
          <p className="text-sm text-slate-700">
            The intelligent contract relies on <code>gl.nondet.web.render(url)</code> to scrape invoice evidence. Dynamic client-side SPAs that render content via JavaScript execution return empty HTML shells.
          </p>
          <div className="p-3 bg-clay-50 border border-clay-300 rounded text-xs text-clay-950 font-mono">
            if len(rendered_text.strip()) &lt; 100:
            <br />
            &nbsp;&nbsp;raise gl.vm.UserError("empty_page")
          </div>
          <p className="text-xs text-slate-700">
            If a site requires authentication or JavaScript evaluation, the transaction will fail before consensus.
          </p>
        </div>

        {/* 2. Strict Payee Prefix Matching */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            2. Strict Payee URL Prefix Restrictions
          </h3>
          <p className="text-sm text-slate-700">
            Policy definitions require exact URL prefix matching to prevent SSRF and phishing attacks.
          </p>
          <ul className="text-xs text-slate-700 list-disc pl-5 space-y-1">
            <li>Scheme must strictly be <code>https://</code>.</li>
            <li>No query parameters allowed (e.g. <code>?id=123</code> is rejected).</li>
            <li>No hash fragments allowed (e.g. <code>#invoice</code> is rejected).</li>
            <li>Must end with a trailing slash <code>/</code>.</li>
            <li>Port must be default 443 or omitted.</li>
          </ul>
        </div>

        {/* 3. Non-deterministic Leader vs Deterministic Strict Eq */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            3. Model Extraction vs Validator Verification
          </h3>
          <p className="text-sm text-slate-700">
            The lead validator executes LLM extraction. Other validators in consensus run the deterministic comparison principle to prevent LLM non-determinism from splitting the network.
          </p>
          <div className="p-3 bg-parchment-50 border border-parchment-300 rounded text-xs text-slate-800 font-mono overflow-x-auto">
            <div className="text-slate-700 font-medium">// Validator verification principle</div>
            result = gl.eq_principle.strict_eq(
            <br />
            &nbsp;&nbsp;lambda: run_extraction(evidence_url, prompt)
            <br />
            )
          </div>
          <p className="text-xs text-slate-700">
            Validators must observe identical extracted outputs or consensus fails to majority agree.
          </p>
        </div>

        {/* 4. Owner Resolution of Ambiguous Spends */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            4. Owner Fallback for Ambiguous Evidence
          </h3>
          <p className="text-sm text-slate-700">
            When invoice evidence lacks an explicit total or contains contradictory information, the model returns <code>ASK_OWNER</code>.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950">
            The spend request transitions to state <code>PENDING</code>. The human account owner must explicitly review and call <code>resolve_spend(spend_id, approve)</code> to either approve the payment or decline it.
          </div>
        </div>

        {/* 5. No Rolling Calendar Reset Windows */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            5. No Calendar-Based Allowance Reset
          </h3>
          <p className="text-sm text-slate-700">
            Allowances are strictly lifetime-cumulative or per-request caps. The contract does not implement cron jobs, calendar month rollovers, or automatic balance renewals.
          </p>
          <p className="text-xs text-slate-700">
            Once an agent reaches their total allocated allowance cap, the account owner must explicitly deposit additional demo credits.
          </p>
        </div>

        {/* 6. Historical Fixture Repository Origins */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">
            6. Fixture Pinning & Repository Context
          </h3>
          <p className="text-sm text-slate-700">
            Historical validation runs referenced test fixtures under user <code>huzyow155</code>. Current deployments reference pinned fixtures under canonical organization <code>hypercybers99</code>.
          </p>
          <p className="text-xs text-slate-700">
            Fixtures contain static synthetic invoices hosted in public GitHub raw markdown files.
          </p>
        </div>
      </div>
    </div>
  );
};
