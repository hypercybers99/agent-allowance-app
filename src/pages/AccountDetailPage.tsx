import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getAccount, listSpends } from '../services/readClient';
import { fundAccount, addAgent, removeAgent, closeAccount } from '../services/walletClient';
import { resolveContractError } from '../lib/errors';
import { DecisionStamp } from '../components/DecisionStamp';
import type { AccountRecord, SpendRecord } from '../types/contract';
import {
  Coins,
  UserCheck,
  Plus,
  Send,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, connectWallet, getClient, refreshBalance } = useWallet();

  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [spends, setSpends] = useState<SpendRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Funding Form State
  const [fundAmount, setFundAmount] = useState<number>(100);
  const [showFundModal, setShowFundModal] = useState(false);

  // Add Agent State
  const [newAgentAddress, setNewAgentAddress] = useState('');
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Operation State
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<{ title: string; plain: string; next: string } | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadAccountData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [acct, sp] = await Promise.all([getAccount(id), listSpends(id, 20)]);
      setAccount(acct);
      setSpends(sp);
    } catch (err) {
      console.warn('Error loading account:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData]);

  const isOwner = !!(
    address &&
    account &&
    address.toLowerCase() === account.owner.toLowerCase()
  );

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !account) return;
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    setActionInProgress('funding');
    setElapsed(0);
    setErrorMessage(null);
    setSuccessNotice(null);

    const client = getClient();
    try {
      const res = await fundAccount(client, id, fundAmount, {
        onTick: s => setElapsed(s),
      });

      if (res.classification.isRulePassed) {
        setSuccessNotice(`Successfully funded account with ${fundAmount} ${account.currency} demo credits.`);
        setShowFundModal(false);
        await Promise.all([loadAccountData(), refreshBalance()]);
      } else {
        setErrorMessage({
          title: 'Funding Refused',
          plain: res.classification.explanation,
          next: 'Ensure wallet holds sufficient demo credits and total funded amount does not exceed total budget.',
        });
      }
    } catch (err: any) {
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!newAgentAddress.trim().startsWith('0x') || newAgentAddress.trim().length !== 42) {
      setErrorMessage({
        title: 'bad agent address',
        plain: 'Agent address must be a valid 42-character 0x hex Ethereum address.',
        next: 'Check the agent address format before submitting.',
      });
      return;
    }

    setActionInProgress('adding-agent');
    setElapsed(0);
    setErrorMessage(null);

    const client = getClient();
    try {
      const res = await addAgent(client, id, newAgentAddress.trim(), {
        onTick: s => setElapsed(s),
      });

      if (res.classification.isRulePassed) {
        setSuccessNotice(`Agent ${newAgentAddress} successfully authorized.`);
        setNewAgentAddress('');
        setShowAgentModal(false);
        await loadAccountData();
      } else {
        setErrorMessage({
          title: 'Add Agent Refused',
          plain: res.classification.explanation,
          next: 'Confirm you are the account owner and account has fewer than 5 authorized agents.',
        });
      }
    } catch (err: any) {
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRemoveAgent = async (agentAddr: string) => {
    if (!id || !confirm(`Revoke authorization for agent ${agentAddr}?`)) return;

    setActionInProgress(`removing-${agentAddr}`);
    setElapsed(0);
    setErrorMessage(null);

    const client = getClient();
    try {
      const res = await removeAgent(client, id, agentAddr, {
        onTick: s => setElapsed(s),
      });

      if (res.classification.isRulePassed) {
        setSuccessNotice(`Authorization revoked for agent ${agentAddr}.`);
        await loadAccountData();
      } else {
        setErrorMessage({
          title: 'Remove Agent Refused',
          plain: res.classification.explanation,
          next: 'Ensure caller is the registered account owner.',
        });
      }
    } catch (err: any) {
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCloseAccount = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to close this account? Remaining balance will be refunded to your address.')) {
      return;
    }

    setActionInProgress('closing');
    setElapsed(0);
    setErrorMessage(null);

    const client = getClient();
    try {
      const res = await closeAccount(client, id, {
        onTick: s => setElapsed(s),
      });

      if (res.classification.isRulePassed) {
        setSuccessNotice('Account successfully closed on-chain. Remaining demo credits refunded.');
        await Promise.all([loadAccountData(), refreshBalance()]);
      } else {
        setErrorMessage({
          title: 'Close Account Refused',
          plain: res.classification.explanation,
          next: 'Only the registered account owner can close an active account.',
        });
      }
    } catch (err: any) {
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center text-ink-muted">
        Loading spending account #{id} from GenLayer Studionet...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-4 text-center">
        <h1 className="text-3xl font-extrabold text-ink">Account #{id} Not Found</h1>
        <p className="text-lg text-ink-muted">The requested spending account does not exist on-chain.</p>
        <Link to="/accounts" className="inline-block px-4 py-2 bg-primary text-primary-contrast rounded font-medium">
          Back to Accounts List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-ink">{account.name}</h1>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                account.status === 'OPEN' ? 'bg-sage text-sage-text' : 'bg-brick-bg text-brick'
              }`}
            >
              {account.status}
            </span>
          </div>
          <p className="text-xl text-ink-muted mt-1">
            Account #{account.id} overview, live balance, authorized agents, and invoice spend records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {account.status === 'OPEN' && (
            <>
              <Link
                to={`/accounts/${account.id}/spend`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-contrast rounded font-semibold transition-colors"
              >
                <Send size={18} />
                <span>Request Spend</span>
              </Link>
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowFundModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sand hover:bg-sand-border text-ink rounded font-semibold border border-sand-border transition-colors"
                  >
                    <Coins size={18} />
                    <span>Fund Account</span>
                  </button>
                  <button
                    onClick={handleCloseAccount}
                    disabled={!!actionInProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-brick-bg text-brick hover:bg-brick/20 rounded font-semibold border border-brick/30 transition-colors"
                  >
                    <Lock size={16} />
                    <span>Close Account</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notices & Alerts */}
      {successNotice && (
        <div className="bg-sage text-sage-text border border-sage-text/30 p-4 rounded flex items-center gap-2">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-brick-bg text-brick border border-brick/30 p-4 rounded space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle size={18} />
            <span>{errorMessage.title}</span>
          </div>
          <div className="text-sm">{errorMessage.plain}</div>
          <div className="text-xs text-ink-muted pt-1">
            <strong>Next steps:</strong> {errorMessage.next}
          </div>
        </div>
      )}

      {/* Financial State Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-sand p-6 rounded border border-sand-border">
          <div className="text-sm font-semibold text-ink-muted">Available Balance</div>
          <div className="text-3xl font-extrabold text-ink mt-2">
            {account.balance} {account.currency}
          </div>
          <div className="text-xs text-ink-muted mt-1">Demo accounting credits (not money)</div>
        </div>

        <div className="bg-sand p-6 rounded border border-sand-border">
          <div className="text-sm font-semibold text-ink-muted">Total Spent / Budget</div>
          <div className="text-3xl font-extrabold text-ink mt-2">
            {account.spent} / {account.total_budget} {account.currency}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            Remaining Budget: {Number(account.total_budget) - Number(account.spent)} {account.currency}
          </div>
        </div>

        <div className="bg-sand p-6 rounded border border-sand-border">
          <div className="text-sm font-semibold text-ink-muted">Spends Executed</div>
          <div className="text-3xl font-extrabold text-ink mt-2">
            {account.spend_count} / {account.max_spends}
          </div>
          <div className="text-xs text-ink-muted mt-1">
            Remaining Spends: {Number(account.max_spends) - Number(account.spend_count)}
          </div>
        </div>
      </div>

      {/* Immutable Policy Table */}
      <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
        <h2 className="text-xl font-bold text-ink">Immutable Account Policy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div>
            <div className="text-sm text-ink-muted">Owner Address:</div>
            <div className="font-mono text-sm break-all font-semibold text-ink">{account.owner}</div>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Policy Hash:</div>
            <div className="font-mono text-sm break-all font-semibold text-ink">{account.policy_hash}</div>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Per-Spend Cap:</div>
            <div className="font-semibold text-ink">{account.per_spend_cap} {account.currency}</div>
          </div>
          <div>
            <div className="text-sm text-ink-muted">Allowed Categories:</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {account.categories.map(c => (
                <span key={c} className="text-xs font-semibold bg-page px-2 py-0.5 rounded border border-sand-border text-ink">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Authorized Agents Section */}
      <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-ink">Authorized AI Agents ({account.agents.length} / 5)</h2>
            <div className="text-sm text-ink-muted">Addresses permitted to submit spend requests for this account.</div>
          </div>
          {isOwner && account.status === 'OPEN' && account.agents.length < 5 && (
            <button
              onClick={() => setShowAgentModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-page hover:bg-sand text-ink rounded border border-sand-border text-sm font-semibold"
            >
              <Plus size={16} />
              <span>Add Agent</span>
            </button>
          )}
        </div>

        {account.agents.length === 0 ? (
          <div className="text-base text-ink-muted py-2">
            No agents registered yet. The owner can add up to 5 agent wallet addresses.
          </div>
        ) : (
          <ul className="divide-y divide-sand-border">
            {account.agents.map(a => (
              <li key={a} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-sage-text shrink-0" />
                  <span className="font-mono text-sm text-ink break-all">{a}</span>
                  {address && address.toLowerCase() === a.toLowerCase() && (
                    <span className="text-xs font-bold text-clay bg-clay-bg px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                {isOwner && account.status === 'OPEN' && (
                  <button
                    onClick={() => handleRemoveAgent(a)}
                    disabled={!!actionInProgress}
                    className="text-brick hover:underline text-sm font-semibold shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registered Payees & Prefix Roots */}
      <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
        <h2 className="text-xl font-bold text-ink">Registered Payees &amp; Evidence Prefixes</h2>
        <div className="space-y-3">
          {account.payees.map((p, idx) => (
            <div key={idx} className="bg-page p-4 rounded border border-sand-border space-y-1">
              <div className="text-xs text-ink-muted font-bold">Payee Address:</div>
              <div className="font-mono text-sm text-ink break-all font-semibold">{p.payee}</div>
              <div className="text-xs text-ink-muted font-bold pt-2">Evidence HTTPS Prefix Root:</div>
              <div className="font-mono text-xs text-primary break-all">{p.prefix}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Spend History with Decision Stamps */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-ink">Spend Requests ({spends.length})</h2>
          {account.status === 'OPEN' && (
            <Link
              to={`/accounts/${account.id}/spend`}
              className="inline-flex items-center gap-1.5 text-base font-semibold text-primary hover:underline"
            >
              <span>Submit Spend Request</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {spends.length === 0 ? (
          <div className="bg-sand p-8 rounded border border-sand-border text-center text-ink-muted">
            No spends have been requested for this account yet.
          </div>
        ) : (
          <div className="space-y-3">
            {spends.map(sp => (
              <div
                key={sp.id}
                className="bg-sand p-5 rounded border border-sand-border flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-ink">Spend #{sp.id}</span>
                    <DecisionStamp decision={sp.decision} size="sm" />
                    <span className="text-xs text-ink-muted font-semibold bg-page px-2 py-0.5 rounded border border-sand-border">
                      {sp.declared_category}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-ink">
                    {sp.declared_amount} {account.currency}
                    {sp.reason && sp.reason !== '-' && (
                      <span className="text-sm font-normal text-clay ml-2">({sp.reason})</span>
                    )}
                  </div>
                  <div className="text-xs text-ink-muted break-all">
                    Evidence: <code>{sp.evidence_url}</code>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/spends/${sp.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-page hover:bg-sand text-ink text-sm font-semibold rounded border border-sand-border transition-colors"
                  >
                    <span>View Spend &amp; Receipt</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Funding Modal / Dialog */}
      {showFundModal && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-page border border-sand-border rounded p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-ink">Fund Account #{account.id}</h3>
            <p className="text-sm text-ink-muted">
              Transfer demo credits from your wallet to this spending account. (Demo credits only; not money).
            </p>
            <form onSubmit={handleFund} className="space-y-4">
              <div>
                <label htmlFor="fund-amount-input" className="block text-sm font-semibold text-ink mb-1">
                  Amount ({account.currency})
                </label>
                <input
                  id="fund-amount-input"
                  type="number"
                  min="1"
                  value={fundAmount}
                  onChange={e => setFundAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="px-4 py-2 border border-sand-border rounded font-medium text-ink hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === 'funding'}
                  className="px-4 py-2 bg-primary text-primary-contrast rounded font-bold hover:bg-primary-hover disabled:opacity-50"
                >
                  {actionInProgress === 'funding' ? `Funding (${elapsed}s)...` : 'Confirm Funding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
          <div className="bg-page border border-sand-border rounded p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-ink">Authorize AI Agent</h3>
            <p className="text-sm text-ink-muted">
              Enter the wallet address of the agent that will be permitted to request spends.
            </p>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label htmlFor="agent-address-input" className="block text-sm font-semibold text-ink mb-1">
                  Agent Address (0x format)
                </label>
                <input
                  id="agent-address-input"
                  type="text"
                  value={newAgentAddress}
                  onChange={e => setNewAgentAddress(e.target.value)}
                  placeholder="0x..."
                  required
                  className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-4 py-2 border border-sand-border rounded font-medium text-ink hover:bg-sand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === 'adding-agent'}
                  className="px-4 py-2 bg-primary text-primary-contrast rounded font-bold hover:bg-primary-hover disabled:opacity-50"
                >
                  {actionInProgress === 'adding-agent' ? `Adding (${elapsed}s)...` : 'Authorize Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
