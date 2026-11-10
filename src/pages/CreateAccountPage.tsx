import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import {
  ALLOWED_CATEGORIES,
  PolicyParams,
  validateAccountName,
  validatePolicyParams,
  buildPolicyJson,
} from '../lib/policy';
import { createAccount } from '../services/walletClient';
import { listAccountsByOwner } from '../services/readClient';
import { resolveContractError } from '../lib/errors';
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock, Wallet } from 'lucide-react';

export const CreateAccountPage: React.FC = () => {
  const { address, isConnected, connectWallet, getClient } = useWallet();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('Production Allowance Account');
  const [perSpendCap, setPerSpendCap] = useState(200);
  const [totalBudget, setTotalBudget] = useState(500);
  const [maxSpends, setMaxSpends] = useState(6);
  const [currency, setCurrency] = useState('USD');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['CLOUD', 'DATA', 'SOFTWARE']);
  const [payees, setPayees] = useState<Array<{ payee: string; prefix: string }>>([
    {
      payee: '0x6ecb277c73b68db5edbc6c79cd3b63d80d75376d',
      prefix: 'https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/cloudco/',
    },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<{ title: string; plain: string; next: string } | null>(null);

  // Compute canonical JSON preview
  const currentPolicyParams: PolicyParams = {
    per_spend_cap: perSpendCap,
    total_budget: totalBudget,
    max_spends: maxSpends,
    currency,
    categories: selectedCategories,
    payees,
  };

  let policyJsonPreview = '';
  let clientValidationError = '';
  const nameValidation = validateAccountName(name);
  if (!nameValidation.valid) {
    clientValidationError = nameValidation.error || 'bad name';
  } else {
    const policyValidation = validatePolicyParams(currentPolicyParams);
    if (!policyValidation.valid) {
      clientValidationError = policyValidation.error || 'bad policy JSON';
    } else {
      try {
        policyJsonPreview = buildPolicyJson(currentPolicyParams);
      } catch (err: any) {
        clientValidationError = err?.message || 'Error generating policy JSON';
      }
    }
  }

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const addPayee = () => {
    if (payees.length < 5) {
      setPayees([...payees, { payee: '', prefix: 'https://raw.githubusercontent.com/hypercybers99/agent-allowance-fixtures/17d05116617effeaa127249914f3b4e691ecad40/' }]);
    }
  };

  const removePayee = (idx: number) => {
    if (payees.length > 1) {
      setPayees(payees.filter((_, i) => i !== idx));
    }
  };

  const updatePayee = (idx: number, field: 'payee' | 'prefix', val: string) => {
    const copy = [...payees];
    copy[idx][field] = val;
    setPayees(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      await connectWallet();
      return;
    }

    if (clientValidationError) {
      return;
    }

    setIsSubmitting(true);
    setElapsed(0);
    setStatusMessage('Broadcasting transaction to GenLayer Studionet...');
    setErrorMessage(null);

    const client = getClient();
    try {
      const result = await createAccount(client, name, policyJsonPreview, {
        onSubmitted: txHash => {
          setStatusMessage(`Transaction submitted: ${txHash.slice(0, 10)}... Waiting for validator consensus.`);
        },
        onTick: (seconds, status) => {
          setElapsed(seconds);
          setStatusMessage(status);
        },
      });

      if (result.classification.isRulePassed) {
        setStatusMessage('Account created successfully! Resolving assigned account ID...');

        // Lesson 2: Discover account ID from receipt or reverse lookup
        let newAccountId: string | null = null;
        if (result.returnedValue) {
          // If return value is clean string
          const parsedId = result.returnedValue.replace(/[^0-9]/g, '');
          if (parsedId.length > 0) newAccountId = parsedId;
        }

        if (!newAccountId) {
          // Documented fallback: query list_accounts_by_owner (latest account is at index 0)
          const myAccounts = await listAccountsByOwner(address, 5);
          if (myAccounts.length > 0) {
            newAccountId = myAccounts[0].id;
          }
        }

        if (newAccountId) {
          navigate(`/accounts/${newAccountId}`);
        } else {
          navigate('/accounts');
        }
      } else {
        setErrorMessage({
          title: 'Transaction Consensus Refusal',
          plain: result.classification.explanation,
          next: 'Review transaction on explorer and ensure account parameters satisfy contract invariants.',
        });
      }
    } catch (err: any) {
      console.error('Error creating account:', err);
      const parsed = resolveContractError(err?.message || err?.details || String(err));
      setErrorMessage(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Opening Sentence */}
      <div className="border-b border-sand-border pb-4">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Create Spending Account</h1>
        <p className="text-xl text-ink-muted">
          Define immutable spending limits, currency caps, and authorized payee prefixes for your AI agent.
        </p>
      </div>

      {/* Contract Rule Integrity Note */}
      <div className="bg-sand p-4 rounded border border-sand-border text-sm text-ink-muted space-y-1">
        <div className="font-semibold text-ink">Contract Enforcement Guarantee:</div>
        <div>
          Every input below maps directly to an on-chain invariant enforced by <code>contracts/AllowanceVault.py</code>.
          Zero invented or unenforced controls.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Name */}
        <div className="bg-sand p-6 rounded border border-sand-border space-y-2">
          <label htmlFor="account-name" className="block text-base font-bold text-ink">
            Account Name (3 to 60 printable ASCII characters)
          </label>
          <input
            id="account-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={60}
            className="w-full px-4 py-3 rounded border border-sand-border bg-page text-ink text-base"
          />
        </div>

        {/* Budget Rules Grid */}
        <div className="bg-sand p-6 rounded border border-sand-border space-y-4">
          <h2 className="text-xl font-bold text-ink">Allowance & Budget Limits</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="per-spend-cap" className="block text-sm font-semibold text-ink mb-1">
                Per-Spend Cap (Demo Credits)
              </label>
              <input
                id="per-spend-cap"
                type="number"
                min="1"
                value={perSpendCap}
                onChange={e => setPerSpendCap(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded border border-sand-border bg-page text-ink text-base"
              />
              <div className="text-xs text-ink-muted mt-1">Maximum amount for a single invoice spend.</div>
            </div>

            <div>
              <label htmlFor="total-budget" className="block text-sm font-semibold text-ink mb-1">
                Total Budget (Demo Credits)
              </label>
              <input
                id="total-budget"
                type="number"
                min={perSpendCap}
                value={totalBudget}
                onChange={e => setTotalBudget(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded border border-sand-border bg-page text-ink text-base"
              />
              <div className="text-xs text-ink-muted mt-1">Lifetime credit limit (must be &ge; per-spend cap).</div>
            </div>

            <div>
              <label htmlFor="max-spends" className="block text-sm font-semibold text-ink mb-1">
                Max Spends Count
              </label>
              <input
                id="max-spends"
                type="number"
                min="1"
                value={maxSpends}
                onChange={e => setMaxSpends(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded border border-sand-border bg-page text-ink text-base"
              />
              <div className="text-xs text-ink-muted mt-1">Total number of spend operations permitted.</div>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-semibold text-ink mb-1">
                Currency Code (3-letter uppercase ASCII)
              </label>
              <input
                id="currency"
                type="text"
                maxLength={3}
                value={currency}
                onChange={e => setCurrency(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 rounded border border-sand-border bg-page text-ink text-base uppercase"
              />
              <div className="text-xs text-ink-muted mt-1">Standard 3-letter currency (e.g. USD, EUR).</div>
            </div>
          </div>
        </div>

        {/* Categories Selector */}
        <div className="bg-sand p-6 rounded border border-sand-border space-y-3">
          <label className="block text-base font-bold text-ink">
            Allowed Categories (select at least one, max 6)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALLOWED_CATEGORIES.map(cat => {
              const selected = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`py-3 px-4 rounded border text-base font-medium flex items-center justify-between transition-colors ${
                    selected
                      ? 'bg-primary text-primary-contrast border-primary'
                      : 'bg-page text-ink border-sand-border hover:bg-sand'
                  }`}
                >
                  <span>{cat}</span>
                  {selected && <CheckCircle2 size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Registered Payees & URL Prefixes */}
        <div className="bg-sand p-6 rounded border border-sand-border space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-ink">Registered Payees &amp; URL Prefixes (1 to 5)</h2>
              <div className="text-sm text-ink-muted">
                Invoice URLs requested by agents must start with the exact registered prefix.
              </div>
            </div>
            {payees.length < 5 && (
              <button
                type="button"
                onClick={addPayee}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-page hover:bg-sand text-ink rounded border border-sand-border text-sm font-semibold"
              >
                <Plus size={16} />
                <span>Add Payee</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {payees.map((p, idx) => (
              <div key={idx} className="bg-page p-4 rounded border border-sand-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-ink">Payee #{idx + 1}</span>
                  {payees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePayee(idx)}
                      className="text-brick hover:underline text-sm font-semibold flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div>
                  <label htmlFor={`payee-addr-${idx}`} className="block text-xs font-semibold text-ink-muted mb-1">
                    Payee Address (0x format, 42 chars)
                  </label>
                  <input
                    id={`payee-addr-${idx}`}
                    type="text"
                    value={p.payee}
                    onChange={e => updatePayee(idx, 'payee', e.target.value)}
                    placeholder="0x..."
                    required
                    className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
                  />
                </div>

                <div>
                  <label htmlFor={`payee-prefix-${idx}`} className="block text-xs font-semibold text-ink-muted mb-1">
                    Evidence HTTPS Prefix Root (must end with '/')
                  </label>
                  <input
                    id={`payee-prefix-${idx}`}
                    type="text"
                    value={p.prefix}
                    onChange={e => updatePayee(idx, 'prefix', e.target.value)}
                    placeholder="https://..."
                    required
                    className="w-full px-3 py-2.5 rounded border border-sand-border bg-page text-ink text-base"
                  />
                  <div className="text-xs text-ink-muted mt-1">
                    Rule: https only, no query (?), no fragment (#), no port, no userinfo, ends with forward slash.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only Policy JSON Preview */}
        <div className="bg-sand p-6 rounded border border-sand-border space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-ink">Canonical Policy JSON Preview</span>
            <span className="text-xs text-ink-muted">Exactly 6 canonical keys</span>
          </div>
          <pre className="bg-page p-4 rounded border border-sand-border text-xs sm:text-sm text-ink overflow-x-auto font-mono">
            {policyJsonPreview || 'Complete valid parameters to view canonical policy JSON.'}
          </pre>
        </div>

        {/* Validation Errors Display */}
        {clientValidationError && (
          <div className="bg-clay-bg text-clay border border-clay/30 p-4 rounded flex items-center gap-2">
            <AlertCircle size={20} className="shrink-0" aria-hidden="true" />
            <div>
              <strong>Validation Rule:</strong> {clientValidationError}
            </div>
          </div>
        )}

        {/* Contract Execution Error Display */}
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

        {/* Submit Button & Progress */}
        <div className="space-y-3">
          {!isConnected ? (
            <button
              type="button"
              onClick={connectWallet}
              className="w-full py-4 bg-primary text-primary-contrast rounded font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
            >
              <Wallet size={20} aria-hidden="true" />
              <span>Connect Wallet to Deploy Account</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !!clientValidationError}
              className="w-full py-4 bg-primary text-primary-contrast rounded font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Clock size={20} className="animate-spin" />
                  <span>Creating Account ({elapsed}s elapsed)...</span>
                </span>
              ) : (
                <span>Sign &amp; Deploy Spending Account</span>
              )}
            </button>
          )}

          {isSubmitting && (
            <div className="text-center text-sm text-ink-muted animate-pulse">
              {statusMessage}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
