import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getSpend, spendReceipt, getAccount } from '../services/readClient';
import { resolveSpend } from '../services/walletClient';
import { resolveContractError } from '../lib/errors';
import { DecisionStamp } from '../components/DecisionStamp';
import type { SpendRecord, SpendReceiptRecord, AccountRecord } from '../types/contract';
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const SpendDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected, connectWallet, getClient, refreshBalance } = useWallet();

  const [spend, setSpend] = useState<SpendRecord | null>(null);
  const [receipt, setReceipt] = useState<SpendReceiptRecord | null>(null);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolution State
  const [isResolving, setIsResolving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ title: string; plain: string; next: string } | null>(null);

  const loadSpendData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [sp, rc] = await Promise.all([getSpend(id), spendReceipt(id)]);
      setSpend(sp);
      setReceipt(rc);
      if (sp) {
        const acct = await getAccount(sp.account_id);
        setAccount(acct);
      }
    } catch (err) {
      console.warn('Failed to load spend detail:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSpendData();
  }, [loadSpendData]);

  const isOwner = !!(
    address &&
    account &&
    address.toLowerCase() === account.owner.toLowerCase()
  );

  const handleResolve = async (approve: boolean) => {
    if (!id) return;
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    setIsResolving(true);
    setElapsed(0);
    setErrorMessage(null);
    setResolutionSuccess(null);

    const client = getClient();
    try {
      const res = await resolveSpend(client, id, approve, {
        onTick: s => setElapsed(s),
      });

      if (res.classification.isRulePassed) {
        setResolutionSuccess(
          `Spend #${id} successfully ${approve ? 'APPROVED' : 'REJECTED'} by owner.`
        );
        await Promise.all([loadSpendData(), refreshBalance()]);
      } else {
        setErrorMessage({
          title: 'Resolution Refusal',
          plain: res.classification.explanation,
          next: 'Only the account owner can resolve pending spends. Ensure account has sufficient balance if approving.',
        });
      }
    } catch (err: any) {
      setErrorMessage(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-ink-muted">
        Loading spend #{id} on-chain records...
      </div>
    );
  }

  if (!spend) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-ink">Spend #{id} Not Found</h1>
        <p className="text-lg text-ink-muted">The requested spend record does not exist on-chain.</p>
        <Link to="/accounts" className="inline-block px-4 py-2 bg-primary text-primary-contrast rounded font-medium">
          View Accounts
        </Link>
      </div>
    );
  }

  const isPending = spend.decision === 'PENDING';

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-ink">Spend #{spend.id}</h1>
            <DecisionStamp decision={spend.decision} size="md" />
          </div>
          <p className="text-xl text-ink-muted mt-1">
            Complete transaction record, validator observation, verbatim quote, and downstream receipt.
          </p>
        </div>

        <div>
          <Link
            to={`/accounts/${spend.account_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sand hover:bg-sand-border text-ink rounded font-semibold border border-sand-border transition-colors text-sm"
          >
            <span>Account #{spend.account_id}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Resolution Alerts */}
      {resolutionSuccess && (
        <div className="bg-sage text-sage-text border border-sage-text/30 p-4 rounded flex items-center gap-2">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{resolutionSuccess}</span>
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

      {/* Owner Resolution Banner for PENDING spends */}
      {isPending && (
        <div className="bg-clay-bg border border-clay/30 p-6 rounded space-y-4">
          <div className="flex items-start gap-3">
            <Clock size={24} className="text-clay shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-ink">Awaiting Owner Manual Resolution</h2>
              <p className="text-base text-ink-muted">
                Validators safely held this spend in PENDING review due to reason: <code>{spend.reason}</code>.
                Only the account owner ({account?.owner ? `${account.owner.slice(0, 10)}...` : 'owner'}) can approve or reject.
              </p>
            </div>
          </div>

          <div className="bg-page p-3 rounded border border-sand-border text-xs text-ink-muted space-y-1">
            <div><strong>Contract Pinned Invariants:</strong></div>
            <div>&bull; <code>spend not pending</code>: Rejected if already resolved.</div>
            <div>&bull; <code>limits no longer hold on resolve</code>: Approval checks account balance and max spends at the moment of resolution.</div>
          </div>

          {isOwner ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleResolve(true)}
                disabled={isResolving}
                className="px-5 py-3 bg-primary hover:bg-primary-hover text-primary-contrast rounded font-bold text-base flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                <span>{isResolving ? `Approving (${elapsed}s)...` : 'Approve & Release Payment'}</span>
              </button>
              <button
                onClick={() => handleResolve(false)}
                disabled={isResolving}
                className="px-5 py-3 bg-brick-bg hover:bg-brick/20 text-brick border border-brick/30 rounded font-bold text-base flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle size={18} />
                <span>{isResolving ? `Rejecting (${elapsed}s)...` : 'Reject Spend'}</span>
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-primary text-primary-contrast rounded font-semibold text-sm"
              >
                Connect Owner Wallet to Resolve
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spend Details Table */}
      <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
        <h2 className="text-xl font-bold text-ink">Validator Verdict &amp; Request Data</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
          <div>
            <div className="text-sm text-ink-muted">Decision &amp; Reason:</div>
            <div className="font-bold text-ink mt-0.5">
              {spend.decision} (reason: <code>{spend.reason}</code>)
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Settlement Status:</div>
            <div className="font-semibold text-ink mt-0.5">
              {spend.executed === 'true' ? (
                <span className="text-sage-text font-bold">&check; Credits Transferred to Payee</span>
              ) : (
                <span className="text-ink-muted">No Credits Transferred</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Declared Amount &amp; Category:</div>
            <div className="font-semibold text-ink mt-0.5">
              {spend.declared_amount} {account?.currency || 'USD'} ({spend.declared_category})
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Observed Amount &amp; Category:</div>
            <div className="font-semibold text-ink mt-0.5">
              {spend.observed_amount} {account?.currency || 'USD'} ({spend.observed_category})
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Requesting Agent Address:</div>
            <div className="font-mono text-xs break-all text-ink mt-0.5">{spend.agent}</div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Payee Address:</div>
            <div className="font-mono text-xs break-all text-ink mt-0.5">{spend.payee}</div>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm text-ink-muted">Public Invoice Evidence URL:</div>
            <a
              href={spend.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline break-all mt-0.5"
            >
              <span>{spend.evidence_url}</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm text-ink-muted">Extracted Verbatim Quote:</div>
            <div className="bg-page p-3 rounded border border-sand-border font-mono text-sm text-ink mt-1">
              "{spend.quote || 'No quote extracted'}"
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Prompt Injection Tripwire:</div>
            <div className="font-semibold text-ink mt-0.5">
              {spend.tripwire ? (
                <span className="text-brick flex items-center gap-1">
                  <ShieldAlert size={16} /> Triggered (Prompt Injection Contained)
                </span>
              ) : (
                <span className="text-sage-text">&check; Clean (No Tripwire)</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-ink-muted">Leader Consensus Reported:</div>
            <div className="font-mono text-sm text-ink mt-0.5">{spend.leader_reported}</div>
          </div>

          <div className="md:col-span-2">
            <div className="text-sm text-ink-muted">Normalized Text Hash (16 hex chars):</div>
            <div className="font-mono text-xs text-ink-muted break-all mt-0.5">{spend.norm_hash16}</div>
          </div>
        </div>
      </section>

      {/* Downstream Spend Receipt for SpendGate */}
      {receipt && (
        <section className="bg-sand p-6 rounded border border-sand-border space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-ink">Downstream Merchant Spend Receipt</h2>
            <Link
              to={`/gate?spendId=${spend.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <span>Verify on SpendGate</span>
              <ExternalLink size={14} />
            </Link>
          </div>
          <p className="text-sm text-ink-muted">
            Compact receipt structure consumed by SpendGate cross-contract view checks (<code>spend_receipt</code>).
          </p>

          <pre className="bg-page p-4 rounded border border-sand-border text-xs sm:text-sm text-ink overflow-x-auto font-mono">
            {JSON.stringify(receipt, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
};
