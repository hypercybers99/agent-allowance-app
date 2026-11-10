import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { listAccountsByOwner, getAccount } from '../services/readClient';
import type { AccountRecord } from '../types/contract';
import { Search, Plus, ArrowRight, AlertCircle } from 'lucide-react';

export const AccountsListPage: React.FC = () => {
  const { address } = useWallet();
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupOwner, setLookupOwner] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Load accounts for connected owner or default canonical owner
  useEffect(() => {
    async function loadInitial() {
      const targetOwner = address || '0x1d539fb3ded5bb5b6d68414238ece9a972a35921';
      setLookupOwner(targetOwner);
      setLoading(true);
      try {
        const list = await listAccountsByOwner(targetOwner, 20);
        setAccounts(list);
      } catch (err) {
        console.warn('Failed to load accounts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [address]);

  const handleSearchOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupOwner || !lookupOwner.trim().startsWith('0x')) {
      setLookupError('Please enter a valid 0x Ethereum address.');
      return;
    }
    setLookupError(null);
    setLoading(true);
    try {
      const list = await listAccountsByOwner(lookupOwner.trim(), 20);
      setAccounts(list);
    } catch (err: any) {
      setLookupError(err?.message || 'Error querying accounts for address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId || lookupId.trim() === '') {
      setLookupError('Please enter a numeric account ID.');
      return;
    }
    setLookupError(null);
    setLoading(true);
    try {
      const acct = await getAccount(lookupId.trim());
      if (acct) {
        setAccounts([acct]);
      } else {
        setAccounts([]);
        setLookupError(`Account ID "${lookupId}" not found on-chain.`);
      }
    } catch (err: any) {
      setLookupError(err?.message || 'Error fetching account by ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Spending Accounts</h1>
        <p className="text-xl text-ink-muted">
          Inspect, manage, and fund spending accounts registered on the AllowanceVault intelligent contract.
        </p>
      </div>

      {/* Action Bar & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lookup by Owner */}
        <form onSubmit={handleSearchOwner} className="bg-sand p-4 rounded border border-sand-border space-y-2">
          <label htmlFor="owner-search" className="block text-sm font-semibold text-ink">
            Look up by Owner Address (Zero-Wallet Read)
          </label>
          <div className="flex gap-2">
            <input
              id="owner-search"
              type="text"
              value={lookupOwner}
              onChange={e => setLookupOwner(e.target.value)}
              placeholder="0x..."
              className="flex-1 px-3 py-2 rounded border border-sand-border bg-page text-ink text-base"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-contrast rounded font-medium hover:bg-primary-hover transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Search size={18} aria-hidden="true" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Lookup by Account ID */}
        <form onSubmit={handleSearchId} className="bg-sand p-4 rounded border border-sand-border space-y-2">
          <label htmlFor="id-search" className="block text-sm font-semibold text-ink">
            Direct Account ID Lookup
          </label>
          <div className="flex gap-2">
            <input
              id="id-search"
              type="text"
              value={lookupId}
              onChange={e => setLookupId(e.target.value)}
              placeholder="e.g. 1"
              className="flex-1 px-3 py-2 rounded border border-sand-border bg-page text-ink text-base"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-contrast rounded font-medium hover:bg-primary-hover transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Search size={18} aria-hidden="true" />
              <span>Find</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {lookupError && (
        <div className="bg-brick-bg text-brick border border-brick/30 p-4 rounded flex items-center gap-2">
          <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
          <span>{lookupError}</span>
        </div>
      )}

      {/* Account Creation Prompt */}
      <div className="flex justify-between items-center bg-sand p-4 rounded border border-sand-border">
        <div>
          <div className="font-semibold text-ink">Need a new spending account for an agent?</div>
          <div className="text-sm text-ink-muted">Set immutable budget limits and payee prefix rules.</div>
        </div>
        <Link
          to="/accounts/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-contrast font-medium px-4 py-2.5 rounded transition-colors"
        >
          <Plus size={18} aria-hidden="true" />
          <span>New Account</span>
        </Link>
      </div>

      {/* Accounts List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-ink">Registered Accounts ({accounts.length})</h2>

        {loading ? (
          <div className="bg-sand p-8 rounded border border-sand-border text-center text-ink-muted">
            Querying GenLayer Studionet contract state...
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-sand p-8 rounded border border-sand-border text-center text-ink-muted space-y-2">
            <div>No accounts found for the specified owner or query.</div>
            <div className="text-sm">Try searching for canonical owner <code>0x1d539fb3ded5bb5b6d68414238ece9a972a35921</code> or account ID 1.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map(acct => (
              <div
                key={acct.id}
                className="bg-sand p-6 rounded border border-sand-border space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-clay bg-clay-bg px-2.5 py-0.5 rounded border border-clay/30">
                      Account #{acct.id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        acct.status === 'OPEN'
                          ? 'bg-sage text-sage-text'
                          : 'bg-brick-bg text-brick'
                      }`}
                    >
                      {acct.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-ink">{acct.name}</h3>

                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-sand-border">
                    <div>
                      <div className="text-ink-muted">Balance:</div>
                      <div className="font-semibold text-ink text-base">
                        {acct.balance} {acct.currency}
                      </div>
                      <div className="text-xs text-ink-muted">Demo credits</div>
                    </div>
                    <div>
                      <div className="text-ink-muted">Spent / Budget:</div>
                      <div className="font-semibold text-ink text-base">
                        {acct.spent} / {acct.total_budget} {acct.currency}
                      </div>
                      <div className="text-xs text-ink-muted">{acct.spend_count} / {acct.max_spends} spends</div>
                    </div>
                  </div>

                  <div className="text-sm text-ink-muted pt-1">
                    <div>Per-Spend Cap: <strong className="text-ink">{acct.per_spend_cap} {acct.currency}</strong></div>
                    <div>Authorized Agents: <strong className="text-ink">{acct.agents.length} agent(s)</strong></div>
                    <div>Registered Payees: <strong className="text-ink">{acct.payees.length} payee(s)</strong></div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/accounts/${acct.id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-page hover:bg-sand text-ink font-semibold rounded border border-sand-border transition-colors"
                  >
                    <span>View Account Details</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
