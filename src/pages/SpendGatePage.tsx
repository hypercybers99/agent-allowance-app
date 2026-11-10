import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getSpend, getAccount, isSpendValidFor, getService } from '../services/readClient';
import { serve } from '../services/walletClient';
import { resolveContractError } from '../lib/errors';
import { CONTRACT_DEPLOYMENTS } from '../config/deployments';
import type { SpendRecord, AccountRecord } from '../types/contract';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Code2,
  Search,
  PackageCheck,
} from 'lucide-react';

export const SpendGatePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpendId = searchParams.get('spendId') || '1';

  const { address, isConnected, connectWallet, getClient } = useWallet();

  const [inputSpendId, setInputSpendId] = useState(initialSpendId);
  const [spend, setSpend] = useState<SpendRecord | null>(null);
  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [serviceStatus, setServiceStatus] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Serve Execution State
  const [isServing, setIsServing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [serveSuccess, setServeSuccess] = useState<string | null>(null);
  const [serveError, setServeError] = useState<{ title: string; plain: string; next: string } | null>(null);

  const queryGate = useCallback(async (sid: string) => {
    if (!sid || sid.trim() === '') return;
    setLoading(true);
    setQueryError(null);
    setServeSuccess(null);
    setServeError(null);

    try {
      const sp = await getSpend(sid.trim());
      setSpend(sp);
      if (!sp) {
        setIsValid(null);
        setServiceStatus('');
        setQueryError(`Spend #${sid} not found in AllowanceVault.`);
        return;
      }

      const acct = await getAccount(sp.account_id);
      setAccount(acct);

      const [validRes, srv] = await Promise.all([
        acct
          ? isSpendValidFor(
              sp.id,
              sp.account_id,
              sp.payee,
              Number(sp.declared_amount),
              acct.policy_hash
            )
          : false,
        getService(sp.id),
      ]);

      setIsValid(validRes);
      setServiceStatus(srv);
    } catch (err: any) {
      setQueryError(err?.message || 'Error querying SpendGate contract view.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queryGate(initialSpendId);
  }, [initialSpendId, queryGate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSpendId.trim()) return;
    setSearchParams({ spendId: inputSpendId.trim() });
    queryGate(inputSpendId.trim());
  };

  const isPayeeWallet = !!(
    address &&
    spend &&
    address.toLowerCase() === spend.payee.toLowerCase()
  );

  const handleServe = async () => {
    if (!spend || !account) return;
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    setIsServing(true);
    setElapsed(0);
    setServeError(null);
    setServeSuccess(null);

    const client = getClient();
    try {
      const res = await serve(
        client,
        spend.id,
        spend.account_id,
        spend.payee,
        Number(spend.declared_amount),
        account.policy_hash,
        {
          onTick: s => setElapsed(s),
        }
      );

      if (res.classification.isRulePassed) {
        setServeSuccess(`Service fulfillment successfully recorded on SpendGate for Spend #${spend.id}.`);
        const updatedSrv = await getService(spend.id);
        setServiceStatus(updatedSrv);
      } else {
        setServeError({
          title: 'Serve Refusal',
          plain: res.classification.explanation,
          next: 'Confirm sender wallet equals payee and spend has not already been marked as served.',
        });
      }
    } catch (err: any) {
      setServeError(resolveContractError(err?.message || err?.details || String(err)));
    } finally {
      setIsServing(false);
    }
  };

  // Exact integrator code sample extracted from SpendGate.py signature
  const integratorCodeSnippet = `// SpendGate Integration Snippet (GenLayer Studionet)
// Downstream merchant verification and service fulfillment

import { createClient, chains } from 'genlayer-js';

const client = createClient({ chain: chains.studionet });
const SPENDGATE_ADDRESS = '${CONTRACT_DEPLOYMENTS.spendGate.address}';

// 1. Cross-Contract Verification (Read-Only View)
const isValid = await client.readContract({
  address: SPENDGATE_ADDRESS,
  functionName: 'is_spend_valid_for',
  args: [
    '${spend?.id || '1'}',                // spend_id: str
    '${spend?.account_id || '1'}',        // account_id: str
    '${spend?.payee || '0x6ecb277...'}',  // payee: str
    ${spend ? Number(spend.declared_amount) : 120},                    // amount: int
    '${account?.policy_hash || 'c26a372...'}', // policy_hash: str
  ],
});

// 2. Fulfill & Prevent Double-Service (Payee Write)
if (isValid) {
  const txHash = await client.writeContract({
    address: SPENDGATE_ADDRESS,
    functionName: 'serve',
    args: [
      '${spend?.id || '1'}',
      '${spend?.account_id || '1'}',
      '${spend?.payee || '0x6ecb277...'}',
      ${spend ? Number(spend.declared_amount) : 120},
      '${account?.policy_hash || 'c26a372...'}',
    ],
  });
}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4">
        <h1 className="text-3xl font-extrabold text-ink mb-2">SpendGate Merchant Portal</h1>
        <p className="text-xl text-ink-muted">
          Merchants verify on-chain spend receipts cross-contract and record service delivery to prevent double-service.
        </p>
      </div>

      {/* Spend Lookup Form */}
      <form onSubmit={handleSearch} className="bg-sand p-6 rounded border border-sand-border space-y-3">
        <label htmlFor="spend-id-input" className="block text-base font-bold text-ink">
          Verify Spend ID
        </label>
        <div className="flex gap-2">
          <input
            id="spend-id-input"
            type="text"
            value={inputSpendId}
            onChange={e => setInputSpendId(e.target.value)}
            placeholder="Enter spend ID (e.g. 1)"
            className="flex-1 px-4 py-3 rounded border border-sand-border bg-page text-ink text-base"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-primary-contrast rounded font-bold hover:bg-primary-hover transition-colors shrink-0 flex items-center gap-2"
          >
            <Search size={18} />
            <span>Verify Spend</span>
          </button>
        </div>
      </form>

      {queryError && (
        <div className="bg-brick-bg text-brick border border-brick/30 p-4 rounded flex items-center gap-2">
          <AlertCircle size={20} className="shrink-0" />
          <span>{queryError}</span>
        </div>
      )}

      {/* Verification Card */}
      {spend && (
        <div className="space-y-6">
          <div className="bg-sand p-6 rounded border border-sand-border space-y-4">
            <div className="flex justify-between items-center border-b border-sand-border pb-3">
              <div>
                <h2 className="text-xl font-bold text-ink">Cross-Contract Verification Result</h2>
                <div className="text-sm text-ink-muted">SpendGate view check: <code>is_spend_valid_for</code></div>
              </div>

              {loading ? (
                <span className="text-sm text-ink-muted">Checking on-chain...</span>
              ) : isValid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage text-sage-text rounded font-bold border border-sage-text/30">
                  <CheckCircle2 size={18} />
                  <span>VALID RECEIPT (true)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brick-bg text-brick rounded font-bold border border-brick/30">
                  <XCircle size={18} />
                  <span>INVALID OR UNSETTLED (false)</span>
                </span>
              )}
            </div>

            {/* Read-Only Invariants Table (Lesson 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-page p-3 rounded border border-sand-border">
                <div className="text-xs text-ink-muted font-bold">Spend ID (read-only):</div>
                <div className="font-mono text-base font-bold text-ink">{spend.id}</div>
              </div>

              <div className="bg-page p-3 rounded border border-sand-border">
                <div className="text-xs text-ink-muted font-bold">Account ID (read-only):</div>
                <div className="font-mono text-base font-bold text-ink">{spend.account_id}</div>
              </div>

              <div className="bg-page p-3 rounded border border-sand-border md:col-span-2">
                <div className="text-xs text-ink-muted font-bold">Payee Address (read-only):</div>
                <div className="font-mono text-sm break-all font-semibold text-ink">{spend.payee}</div>
              </div>

              <div className="bg-page p-3 rounded border border-sand-border">
                <div className="text-xs text-ink-muted font-bold">Amount (read-only):</div>
                <div className="font-mono text-base font-bold text-ink">
                  {spend.declared_amount} {account?.currency || 'USD'}
                </div>
              </div>

              <div className="bg-page p-3 rounded border border-sand-border">
                <div className="text-xs text-ink-muted font-bold">Fulfillment Status:</div>
                <div className="font-semibold text-base mt-0.5">
                  {serviceStatus ? (
                    <span className="text-sage-text font-bold">&check; Already Served</span>
                  ) : (
                    <span className="text-clay font-bold">Awaiting Service Delivery</span>
                  )}
                </div>
              </div>

              <div className="bg-page p-3 rounded border border-sand-border md:col-span-2">
                <div className="text-xs text-ink-muted font-bold">Account Policy Hash (read-only):</div>
                <div className="font-mono text-xs break-all text-ink mt-0.5">
                  {account?.policy_hash || 'Loading policy hash...'}
                </div>
              </div>
            </div>

            {/* Alerts */}
            {serveSuccess && (
              <div className="bg-sage text-sage-text border border-sage-text/30 p-4 rounded flex items-center gap-2">
                <CheckCircle2 size={20} className="shrink-0" />
                <span>{serveSuccess}</span>
              </div>
            )}

            {serveError && (
              <div className="bg-brick-bg text-brick border border-brick/30 p-4 rounded space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={18} />
                  <span>{serveError.title}</span>
                </div>
                <div className="text-sm">{serveError.plain}</div>
                <div className="text-xs text-ink-muted pt-1">
                  <strong>Next steps:</strong> {serveError.next}
                </div>
              </div>
            )}

            {/* Serve Action Section */}
            <div className="pt-4 border-t border-sand-border space-y-3">
              <div className="text-sm text-ink-muted">
                <strong>Payee Delivery Rules:</strong> Only the payee wallet (<code>{spend.payee.slice(0, 8)}...</code>) can execute <code>serve</code>. Once fulfilled, duplicate calls fail with <code>spend already served</code>.
              </div>

              {serviceStatus ? (
                <div className="p-4 bg-sage text-sage-text rounded font-semibold text-center border border-sage-text/30 flex items-center justify-center gap-2">
                  <PackageCheck size={20} />
                  <span>This spend was fulfilled on SpendGate and cannot be served again.</span>
                </div>
              ) : isPayeeWallet ? (
                <button
                  onClick={handleServe}
                  disabled={isServing || !isValid}
                  className="w-full py-4 bg-primary text-primary-contrast rounded font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isServing ? `Fulfilling Service (${elapsed}s)...` : 'Mark Service as Fulfilled (serve)'}
                </button>
              ) : (
                <div className="p-4 bg-sand border border-sand-border rounded text-center text-sm space-y-2">
                  <div className="text-ink-muted">Connected address is not the designated payee.</div>
                  <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-primary text-primary-contrast rounded font-semibold text-sm"
                  >
                    Connect Payee Wallet to Serve
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Integrator Code Snippet (Lesson 4) */}
          <section className="bg-sand p-6 rounded border border-sand-border space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="text-primary" size={20} />
              <h2 className="text-xl font-bold text-ink">Merchant Integration Code Sample</h2>
            </div>
            <p className="text-sm text-ink-muted">
              Contract signature verified against <code>contracts/SpendGate.py</code>.
            </p>
            <pre className="bg-page p-4 rounded border border-sand-border text-xs sm:text-sm text-ink overflow-x-auto font-mono">
              {integratorCodeSnippet}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
};
