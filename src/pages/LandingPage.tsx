import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { getStats, getLimits } from '../services/readClient';
import { CONTRACT_DEPLOYMENTS } from '../config/deployments';
import type { ContractStats, ContractLimits } from '../types/contract';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [limits, setLimits] = useState<ContractLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [s, l] = await Promise.all([getStats(), getLimits()]);
        setStats(s);
        setLimits(l);
      } catch (e) {
        console.warn('Failed to load stats on landing page:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-12 py-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 bg-clay-bg text-clay px-3.5 py-1.5 rounded text-sm font-semibold border border-clay/30 uppercase tracking-wider">
          <Sparkles size={16} aria-hidden="true" />
          <span>GenLayer Studionet Preview</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-tight max-w-4xl mx-auto">
          A spending account for an AI agent: it pays only when a validator-checked invoice page matches the request.
        </h1>

        <p className="text-xl text-ink-muted max-w-2xl mx-auto">
          Enforce spending budgets, payee allowlists, and distributed LLM consensus on raw web invoices before settling.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/accounts/new"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-contrast text-lg font-semibold px-6 py-3.5 rounded transition-colors shadow"
          >
            <span>Create Spending Account</span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
          <Link
            to="/accounts"
            className="inline-flex items-center gap-2 bg-sand hover:bg-sand-border text-ink text-lg font-semibold px-6 py-3.5 rounded border border-sand-border transition-colors"
          >
            <span>Explore Accounts</span>
          </Link>
          <Link
            to="/evidence"
            className="inline-flex items-center gap-2 bg-page hover:bg-sand text-ink text-lg font-semibold px-6 py-3.5 rounded border border-sand-border transition-colors"
          >
            <span>View Chain Evidence</span>
          </Link>
        </div>
      </section>

      {/* 3-Step Explainer */}
      <section className="bg-sand rounded p-8 border border-sand-border space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink mb-1">How Agent Allowance Works</h2>
          <p className="text-base text-ink-muted">Three simple phases protect your budget while enabling AI agent operations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-page p-6 rounded border border-sand-border space-y-3">
            <div className="w-12 h-12 rounded bg-clay-bg text-clay font-bold text-xl flex items-center justify-center">
              1
            </div>
            <h3 className="text-xl font-bold text-ink">Set the rules</h3>
            <p className="text-base text-ink-muted">
              Owner configures per-spend cap, total budget, allowed categories, and payee URL prefix bindings.
            </p>
          </div>

          <div className="bg-page p-6 rounded border border-sand-border space-y-3">
            <div className="w-12 h-12 rounded bg-clay-bg text-clay font-bold text-xl flex items-center justify-center">
              2
            </div>
            <h3 className="text-xl font-bold text-ink">Agent asks</h3>
            <p className="text-base text-ink-muted">
              Authorized AI agent requests spend with payee, amount, category, and public invoice evidence URL.
            </p>
          </div>

          <div className="bg-page p-6 rounded border border-sand-border space-y-3">
            <div className="w-12 h-12 rounded bg-sage text-sage-text font-bold text-xl flex items-center justify-center">
              3
            </div>
            <h3 className="text-xl font-bold text-ink">Validators check</h3>
            <p className="text-base text-ink-muted">
              Distributed validators fetch the invoice, extract verbatim numbers, and reach consensus before paying.
            </p>
          </div>
        </div>
      </section>

      {/* Preview On-Chain Parameters & State Snapshot */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-ink">On-Chain Ledger State (Studionet Chain 61999)</h2>
        <p className="text-base text-ink-muted">
          Read directly from AllowanceVault contract <code>{CONTRACT_DEPLOYMENTS.allowanceVault.address}</code>.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-sand p-5 rounded border border-sand-border">
            <div className="text-sm text-ink-muted">Total Minted</div>
            <div className="text-2xl font-bold text-ink mt-1">
              {loading ? '...' : `${stats?.total_minted || '0'} credits`}
            </div>
            <div className="text-xs text-ink-muted mt-1">Demo accounting tokens</div>
          </div>

          <div className="bg-sand p-5 rounded border border-sand-border">
            <div className="text-sm text-ink-muted">Accounts Opened</div>
            <div className="text-2xl font-bold text-ink mt-1">
              {loading ? '...' : (stats ? String(Number(stats.next_account) - 1) : '-')}
            </div>
            <div className="text-xs text-ink-muted mt-1">Immutable policies</div>
          </div>

          <div className="bg-sand p-5 rounded border border-sand-border">
            <div className="text-sm text-ink-muted">Spends Requested</div>
            <div className="text-2xl font-bold text-ink mt-1">
              {loading ? '...' : (stats ? String(Number(stats.next_spend) - 1) : '-')}
            </div>
            <div className="text-xs text-ink-muted mt-1">Processed on-chain</div>
          </div>

          <div className="bg-sand p-5 rounded border border-sand-border">
            <div className="text-sm text-ink-muted">Max Payees / Acct</div>
            <div className="text-2xl font-bold text-ink mt-1">
              {loading ? '...' : (limits?.max_payees || '5')}
            </div>
            <div className="text-xs text-ink-muted mt-1">Strict URL prefixes</div>
          </div>
        </div>
      </section>

      {/* Key Architectural Guarantees */}
      <section className="bg-sand rounded p-8 border border-sand-border space-y-4">
        <h2 className="text-2xl font-bold text-ink">Enforced Architectural Guarantees</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base text-ink">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-sage-text shrink-0 mt-1" size={20} aria-hidden="true" />
            <span><strong>Verbatim Quote Matching:</strong> Validators verify exact invoice text quotes containing declared amounts.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-sage-text shrink-0 mt-1" size={20} aria-hidden="true" />
            <span><strong>Prompt Injection Tripwires:</strong> Malicious text attempting prompt override automatically halts to owner review.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-sage-text shrink-0 mt-1" size={20} aria-hidden="true" />
            <span><strong>Prefix Binding:</strong> Spends are rejected unless the evidence URL matches the registered payee host.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="text-sage-text shrink-0 mt-1" size={20} aria-hidden="true" />
            <span><strong>SpendGate Guard:</strong> Merchants query verified receipts cross-contract before serving downstream assets.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
