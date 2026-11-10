import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { getBalanceOf } from '../services/readClient';
import { claimDemoCredits } from '../services/walletClient';
import { getExplorerAccountUrl, getExplorerTxUrl } from '../config/deployments';
import { NoticeBanner } from '../components/NoticeBanner';
import { resolveContractError } from '../lib/errors';

export const CreditsPage: React.FC = () => {
  const { address, isConnected, connectWallet, getClient, refreshBalance } = useWallet();
  const [manualAddress, setManualAddress] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAddress = isConnected && address ? address : manualAddress.trim();

  const loadAccountCredits = async (addr: string) => {
    if (!addr.startsWith('0x') || addr.length !== 42) {
      setBalance(null);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const bal = await getBalanceOf(addr);
      setBalance(bal);
    } catch (err: any) {
      console.error('Failed to load credit status:', err);
      setErrorMsg(err.message || 'Failed to query credit balance from contract.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAddress) {
      loadAccountCredits(activeAddress);
    }
  }, [activeAddress]);

  const handleClaim = async () => {
    if (!isConnected) {
      setErrorMsg('Connect wallet to claim demo credits.');
      return;
    }
    const client = getClient();
    if (!client) {
      setErrorMsg('Wallet client not ready. Please connect MetaMask.');
      return;
    }
    setClaiming(true);
    setErrorMsg(null);
    setClaimTxHash(null);
    try {
      const res = await claimDemoCredits(client);
      setClaimTxHash(res.txHash);
      await refreshBalance();
      if (address) {
        await loadAccountCredits(address);
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      const parsed = resolveContractError(err.message || String(err));
      setErrorMsg(`${parsed.title}: ${parsed.plain}`);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">
          Demo Credits Faucet
        </h1>
        <p className="mt-2 text-slate-700">
          Obtain demo credits on GenLayer studionet to fund allowance accounts and test policy rules.
        </p>
      </div>

      <NoticeBanner
        level="warning"
        title="Credits are demo credits, not money"
        message="Demo credits on studionet have zero economic value and cannot be exchanged, traded, or redeemed. They exist solely to test and demonstrate intelligent contract constraints and payment gating."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded">
          <h2 className="text-xl font-bold text-slate-900 mb-4 font-sans">
            Credit Balance Check
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="address-lookup" className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Target Address
              </label>
              {isConnected && address ? (
                <div className="mt-1 flex items-center justify-between p-3 bg-parchment-50 border border-parchment-300 rounded font-mono text-sm break-all text-slate-900">
                  <span>{address}</span>
                  <span className="text-xs text-forest-700 font-sans font-medium px-2 py-0.5 bg-forest-100 rounded ml-2 whitespace-nowrap">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <input
                    id="address-lookup"
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full min-h-[48px] px-3 border border-parchment-400 bg-parchment-50 text-slate-900 rounded font-mono text-sm focus:outline-none focus:ring-3 focus:ring-indigo-700"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Zero-wallet lookup supported</span>
                    <button
                      type="button"
                      onClick={() => connectWallet()}
                      className="text-indigo-700 font-semibold underline hover:text-indigo-900 min-h-[40px] px-2 py-1"
                    >
                      Connect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-4 bg-parchment-50 border border-parchment-300 rounded text-slate-600 font-mono text-sm">
                Querying AllowanceVault on studionet...
              </div>
            ) : activeAddress ? (
              <div className="space-y-3 p-4 bg-parchment-50 border border-parchment-300 rounded font-mono text-sm">
                <div className="flex justify-between items-center py-1 border-b border-parchment-200">
                  <span className="text-slate-600">Credit Balance:</span>
                  <span className="font-bold text-slate-900 text-lg">
                    {balance !== null ? `${balance} CREDITS` : 'Not loaded'}
                  </span>
                </div>
                <div className="pt-1 text-xs text-slate-500 font-sans">
                  Explorer link:{' '}
                  <a
                    href={getExplorerAccountUrl(activeAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 underline font-mono break-all"
                  >
                    {activeAddress}
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-parchment-50 border border-parchment-300 rounded text-slate-600 text-sm">
                Connect your browser wallet or paste an address to inspect on-chain balance and claim eligibility.
              </div>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-parchment-100 border border-parchment-400 p-6 rounded flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2 font-sans">
              One-Time Demo Claim
            </h2>
            <p className="text-slate-700 text-sm mb-4">
              Each address on GenLayer studionet is entitled to claim <strong>1,000 demo credits</strong> directly from the AllowanceVault intelligent contract via <code>claim_demo_credits()</code>.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-300 rounded text-xs text-amber-950 space-y-2 mb-4">
              <div className="font-semibold text-sm text-amber-900">Faucet Rules:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Fixed allocation: exactly 1,000 demo credits per address.</li>
                <li>Single claim per lifetime (contract reverts with <code>already claimed demo credits</code>).</li>
                <li>Used to fund allowance accounts created via the web interface.</li>
              </ul>
            </div>

            {errorMsg && (
              <div className="p-4 bg-clay-50 border border-clay-400 text-clay-950 rounded text-sm mb-4">
                {errorMsg}
              </div>
            )}

            {claimTxHash && (
              <div className="p-4 bg-forest-50 border border-forest-400 text-forest-950 rounded text-sm mb-4 space-y-1">
                <div className="font-bold text-forest-900">Claim Successful!</div>
                <div className="text-xs font-mono break-all">
                  Receipt Tx:{' '}
                  <a
                    href={getExplorerTxUrl(claimTxHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-700 underline"
                  >
                    {claimTxHash}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            {!isConnected ? (
              <button
                type="button"
                onClick={() => connectWallet()}
                className="w-full min-h-[48px] px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded text-center transition-colors focus:outline-none focus:ring-3 focus:ring-indigo-700"
              >
                Connect Wallet to Claim
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming}
                className="w-full min-h-[48px] px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded text-center transition-colors focus:outline-none focus:ring-3 focus:ring-forest-700 disabled:opacity-50"
              >
                {claiming ? 'Submitting claim_demo_credits() to studionet...' : 'Claim 1,000 Demo Credits'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
