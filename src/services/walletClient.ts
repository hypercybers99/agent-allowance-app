// Wallet Client for Injected Web3 / MetaMask on GenLayer Studionet (Chain 61999)
// Provides typed write interactions with AllowanceVault and SpendGate.

import { createClient, chains } from 'genlayer-js';
import {
  ACTIVE_ALLOWANCE_VAULT,
  ACTIVE_SPEND_GATE,
  NETWORK_CONFIG,
} from '../config/deployments';
import { classifyReceipt, ReceiptClassification, RawTransactionReceipt } from '../lib/receipt';

export interface WriteProgressCallback {
  onSubmitted?: (txHash: string) => void;
  onTick?: (elapsedSeconds: number, status: string) => void;
}

export interface WriteResult {
  txHash: string;
  receipt: RawTransactionReceipt;
  classification: ReceiptClassification;
  elapsedSeconds: number;
  returnedValue?: string;
}

/**
 * Ensure browser wallet (MetaMask) is connected to Chain ID 61999
 */
export async function ensureStudionetChain(provider: any): Promise<void> {
  if (!provider?.request) {
    throw new Error('No compatible browser wallet provider found. Please install MetaMask.');
  }

  const chainIdHex = '0x' + NETWORK_CONFIG.chainId.toString(16);
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: NETWORK_CONFIG.chainName,
            rpcUrls: [NETWORK_CONFIG.rpcUrl],
            nativeCurrency: NETWORK_CONFIG.nativeCurrency,
            blockExplorerUrls: [NETWORK_CONFIG.explorerUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Internal helper to execute a contract write, wait for receipt, and classify outcome
 */
async function executeWrite(
  client: any,
  contractAddress: string,
  functionName: string,
  args: any[],
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  const t0 = Date.now();

  const txHash = await client.writeContract({
    address: contractAddress,
    functionName,
    args,
  });

  if (callbacks?.onSubmitted) {
    callbacks.onSubmitted(txHash);
  }

  // Polling with interval timer callback
  let timer: any = null;
  if (callbacks?.onTick) {
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - t0) / 1000);
      callbacks.onTick!(elapsed, 'Waiting for validator consensus...');
    }, 1000);
  }

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      retries: 120,
      interval: 3000,
    });

    if (timer) clearInterval(timer);
    const elapsedSeconds = parseFloat(((Date.now() - t0) / 1000).toFixed(2));
    const classification = classifyReceipt(receipt);

    // Extract return value if exposed by receipt
    let returnedValue: string | undefined;
    if (receipt?.consensus_data?.leader_receipt?.[0]?.result) {
      returnedValue = receipt.consensus_data.leader_receipt[0].result;
    }

    return {
      txHash,
      receipt,
      classification,
      elapsedSeconds,
      returnedValue,
    };
  } catch (err) {
    if (timer) clearInterval(timer);
    throw err;
  }
}

// ============================================================================
// Public Write Methods
// ============================================================================

export async function claimDemoCredits(
  client: any,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(client, ACTIVE_ALLOWANCE_VAULT, 'claim_demo_credits', [], callbacks);
}

export async function createAccount(
  client: any,
  name: string,
  policyJson: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'create_account',
    [name.trim(), policyJson.trim()],
    callbacks
  );
}

export async function fundAccount(
  client: any,
  accountId: string,
  amount: number,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'fund_account',
    [accountId.trim(), amount],
    callbacks
  );
}

export async function addAgent(
  client: any,
  accountId: string,
  agentAddress: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'add_agent',
    [accountId.trim(), agentAddress.trim().toLowerCase()],
    callbacks
  );
}

export async function removeAgent(
  client: any,
  accountId: string,
  agentAddress: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'remove_agent',
    [accountId.trim(), agentAddress.trim().toLowerCase()],
    callbacks
  );
}

export async function closeAccount(
  client: any,
  accountId: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'close_account',
    [accountId.trim()],
    callbacks
  );
}

export async function requestSpend(
  client: any,
  accountId: string,
  payee: string,
  amount: number,
  category: string,
  evidenceUrl: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'request_spend',
    [
      accountId.trim(),
      payee.trim().toLowerCase(),
      amount,
      category.trim().toUpperCase(),
      evidenceUrl.trim(),
    ],
    callbacks
  );
}

export async function resolveSpend(
  client: any,
  spendId: string,
  approve: boolean,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_ALLOWANCE_VAULT,
    'resolve_spend',
    [spendId.trim(), approve],
    callbacks
  );
}

export async function serve(
  client: any,
  spendId: string,
  accountId: string,
  payee: string,
  amount: number,
  policyHash: string,
  callbacks?: WriteProgressCallback
): Promise<WriteResult> {
  return executeWrite(
    client,
    ACTIVE_SPEND_GATE,
    'serve',
    [
      spendId.trim(),
      accountId.trim(),
      payee.trim().toLowerCase(),
      amount,
      policyHash.trim(),
    ],
    callbacks
  );
}
