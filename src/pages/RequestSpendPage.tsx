import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getAccount, listSpends } from '../services/readClient';
import { requestSpend } from '../services/walletClient';
import { resolveContractError } from '../lib/errors';
import { DecisionStamp } from '../components/DecisionStamp';
import type { AccountRecord, SpendRecord } from '../types/contract';
import { Clock, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export const RequestSpendPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, connectWallet, getClient } = useWallet();

  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [selectedPayeeIdx, setSelectedPayeeIdx] = useState(0);
  const [amount, setAmount] = useState<number>(120);
  const [category, setCategory] = useState<string>('CLOUD');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');

  // Execution State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<{ title: string; plain: string; next: string } | null>(null);
  const [consensusToken, setConsensusToken] = useState<string | null>(null);
  const [resultSpend, setResultSpend] = useState<SpendRecord | null>(null);

  useEffect(() => {
    async function loadAccount() {
      if (!id) return;
      setLoading(true);
      try {
        const acct = await getAccount(id);
        setAccount(acct);
        if (acct) {
          if (acct.categories.length > 0) setCategory(acct.categories[0]);
          if (acct.payees.length > 0) {
            setSelectedPayeeIdx(0);
            setEvidenceUrl(`${acct.payees[0].prefix}inv-a-120.md`);
          }
        }
      } catch (err) {
        console.warn('Failed to load account for spend:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAccount();
  }, [id]);

  const activePayee = account?.payees[selectedPayeeIdx] || null;

  const handlePayeeChange = (idx: number) => {
    setSelectedPayeeIdx(idx);
    if (account?.payees[idx]) {
      setEvidenceUrl(`${account.payees[idx].prefix}inv-a-120.md`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !account || !activePayee) return;
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    // Prefix validation check
    if (!evidenceUrl.startsWith(activePayee.prefix)) {
      setErrorMessage({
        title: 'bad payee prefix',
        plain: `The invoice URL must begin with registered payee prefix: ${activePayee.prefix}`,
        next: 'Update the evidence URL to match the required prefix.',
      });
      return;
    }

    setIsSubmitting(true);
    setElapsed(0);
    setStatusMessage('Broadcasting spend request to GenLayer Studionet validators...');
    setErrorMessage(null);
    setConsensusToken(null);
    setResultSpend(null);

    const client = getClient();
    try {
      const res = await requestSpend(
        client,
        id,
        activePayee.payee,
        amount,
        category,
        evidenceUrl.trim(),
        {
          onSubmitted: txHash => {
            setStatusMessage(`Submitted tx ${txHash.slice(0, 10)}... Validators fetching invoice & verifying.`);
          },
          onTick: (seconds, status) => {
            setElapsed(seconds);
            setStatusMessage(status);
          },
        }
      );

      if (res.classification.isRulePassed) {
        setConsensusToken(res.returnedValue || 'APPROVED');
        setStatusMessage('Validator consensus complete! Querying on-chain spend record...');

        // Discover latest spend on this account
        const updatedSpends = await listSpends(id, 5);
        if (updatedSpends.length > 0) {
          setResultSpend(updatedSpends[0]);
        }
      } else {
        // Handle undetermined or consensus failure
        setErrorMessage({
          title: 'Transaction Consensus Refusal',
          plain: res.classification.explanation,
          next: 'No state was altered. Counters and balances remain unchanged.',
        });
      }
    } catch (err: any) {
      console.error('Error requesting spend:', err);
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-ink-muted">
        Loading spend configuration for account #{id}...
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-ink">Account Not Found</h1>
        <Link to="/accounts" className="inline-block px-4 py-2 bg-primary text-primary-contrast rounded font-medium">
          Back to Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Request Agent Spend</h1>
        <p className="text-xl text-ink-muted">
          Submit an invoice URL spend request for validation by distributed GenLayer nodes.
        </p>
      </div>

      {/* Account Info Pill */}
      <div className="bg-sand p-4 rounded border border-sand-border flex flex-wrap items-center justify-between gap-4 text-sm">
        <div>
          <span className="font-semibold text-ink">Account:</span> {account.name} (#{account.id})
        </div>
        <div>
          <span className="font-semibold text-ink">Available:</span> {account.balance} {account.currency}
        </div>
        <div>
          <span className="font-semibold text-ink">Per-Spend Cap:</span> {account.per_spend_cap} {account.currency}
        </div>
      </div>

      {/* Spend Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-sand p-6 rounded border border-sand-border space-y-4">
          <h2 className="text-xl font-bold text-ink">Spend Parameters</h2>

          {/* Payee Selection */}
          <div>
            <label htmlFor="select-payee" className="block text-sm font-semibold text-ink mb-1">
              Designated Payee
            </label>
            <select
              id="select-payee"
              value={selectedPayeeIdx}
              onChange={e => handlePayeeChange(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
            >
              {account.payees.map((p, idx) => (
                <option key={idx} value={idx}>
                  Payee #{idx + 1}: {p.payee}
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spend-amount" className="block text-sm font-semibold text-ink mb-1">
                Declared Amount ({account.currency})
              </label>
              <input
                id="spend-amount"
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
              />
              <div className="text-xs text-ink-muted mt-1">Must match verbatim invoice text.</div>
            </div>

            <div>
              <label htmlFor="spend-category" className="block text-sm font-semibold text-ink mb-1">
                Category
              </label>
              <select
                id="spend-category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
              >
                {account.categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evidence URL */}
          <div>
            <label htmlFor="evidence-url" className="block text-sm font-semibold text-ink mb-1">
              Public Invoice Evidence URL
            </label>
            <input
              id="evidence-url"
              type="text"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
            />
            {activePayee && (
              <div className="text-xs text-ink-muted mt-1 break-all">
                <strong>Prefix Rule:</strong> Must start with <code>{activePayee.prefix}</code>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
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

        {/* Action Button */}
        <div>
          {!isConnected ? (
            <button
              type="button"
              onClick={connectWallet}
              className="w-full py-4 bg-primary text-primary-contrast rounded font-bold text-lg hover:bg-primary-hover transition-colors"
            >
              Connect Wallet as Agent
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-primary text-primary-contrast rounded font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Clock size={20} className="animate-spin" />
                  <span>Validating Spend ({elapsed}s elapsed)...</span>
                </span>
              ) : (
                <span>Submit Spend Request to Validators</span>
              )}
            </button>
          )}

          {isSubmitting && (
            <div className="text-center text-sm text-ink-muted mt-2 animate-pulse">
              {statusMessage}
            </div>
          )}
        </div>
      </form>

      {/* Result Card */}
      {resultSpend && (
        <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
          <div className="flex justify-between items-center border-b border-sand-border pb-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Validator Verdict: Spend #{resultSpend.id}</h2>
              <div className="text-sm text-ink-muted">
                Recorded immutably in AllowanceVault state. {consensusToken ? `(Consensus Token: ${consensusToken})` : ''}
              </div>
            </div>
            <DecisionStamp decision={resultSpend.decision} size="lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
            <div>
              <div className="text-sm text-ink-muted">Decision Reason Code:</div>
              <div className="font-semibold text-ink">{resultSpend.reason}</div>
            </div>
            <div>
              <div className="text-sm text-ink-muted">Observed vs Declared Amount:</div>
              <div className="font-semibold text-ink">
                Observed: {resultSpend.observed_amount} {account.currency} | Declared: {resultSpend.declared_amount} {account.currency}
              </div>
            </div>
            <div>
              <div className="text-sm text-ink-muted">Observed Category:</div>
              <div className="font-semibold text-ink">{resultSpend.observed_category}</div>
            </div>
            <div>
              <div className="text-sm text-ink-muted">Tripwire Triggered:</div>
              <div className="font-semibold text-ink">
                {resultSpend.tripwire ? (
                  <span className="text-brick font-bold flex items-center gap-1">
                    <ShieldAlert size={16} /> Yes (Prompt Injection Attempt Detected)
                  </span>
                ) : (
                  <span className="text-sage-text">No (Clean Document)</span>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-sm text-ink-muted">Extracted Verbatim Quote:</div>
              <div className="bg-page p-3 rounded border border-sand-border font-mono text-sm text-ink mt-1">
                "{resultSpend.quote || 'None'}"
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-sm text-ink-muted">Normalized Text Hash (16 hex):</div>
              <div className="font-mono text-xs text-ink-muted break-all mt-1">
                {resultSpend.norm_hash16}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Link
              to={`/spends/${resultSpend.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-page hover:bg-sand text-ink rounded border border-sand-border font-semibold transition-colors"
            >
              <span>View Spend &amp; Receipt Detail</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};
