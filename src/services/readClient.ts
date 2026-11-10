// Zero-Wallet Public Read Client for GenLayer Studionet (Chain 61999)
// Provides typed view access to AllowanceVault and SpendGate without wallet requirements.

import { createClient, chains } from 'genlayer-js';
import {
  ACTIVE_ALLOWANCE_VAULT,
  ACTIVE_SPEND_GATE,
  NETWORK_CONFIG,
} from '../config/deployments';
import type {
  AccountRecord,
  SpendRecord,
  SpendReceiptRecord,
  ContractLimits,
  ContractStats,
} from '../types/contract';

export const readClient = createClient({
  chain: chains.studionet,
  endpoint: NETWORK_CONFIG.rpcUrl,
});

function safeParse<T>(raw: unknown): T | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// AllowanceVault Views
// ============================================================================

export async function getStats(): Promise<ContractStats | null> {
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'get_stats',
      args: [],
    });
    return safeParse<ContractStats>(raw);
  } catch (err) {
    console.warn('Failed to read get_stats:', err);
    return null;
  }
}

export async function getLimits(): Promise<ContractLimits | null> {
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'get_limits',
      args: [],
    });
    return safeParse<ContractLimits>(raw);
  } catch (err) {
    console.warn('Failed to read get_limits:', err);
    return null;
  }
}

export async function getBalanceOf(address: string): Promise<string> {
  if (!address || !address.trim().startsWith('0x')) return '0';
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'balance_of',
      args: [address.trim().toLowerCase()],
    });
    return String(raw || '0');
  } catch (err) {
    console.warn(`Failed to read balance_of for ${address}:`, err);
    return '0';
  }
}

export async function getAccount(accountId: string): Promise<AccountRecord | null> {
  if (!accountId || accountId.trim() === '') return null;
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'get_account',
      args: [accountId.trim()],
    });
    return safeParse<AccountRecord>(raw);
  } catch (err) {
    console.warn(`Failed to read get_account(${accountId}):`, err);
    return null;
  }
}

export async function listAccountsByOwner(ownerAddress: string, limit: number = 20): Promise<AccountRecord[]> {
  if (!ownerAddress || !ownerAddress.trim().startsWith('0x')) return [];
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'list_accounts_by_owner',
      args: [ownerAddress.trim().toLowerCase(), limit],
    });
    if (!Array.isArray(raw)) return [];
    return raw
      .map(item => safeParse<AccountRecord>(item))
      .filter((item): item is AccountRecord => item !== null);
  } catch (err) {
    console.warn(`Failed to read list_accounts_by_owner for ${ownerAddress}:`, err);
    return [];
  }
}

export async function getSpend(spendId: string): Promise<SpendRecord | null> {
  if (!spendId || spendId.trim() === '') return null;
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'get_spend',
      args: [spendId.trim()],
    });
    return safeParse<SpendRecord>(raw);
  } catch (err) {
    console.warn(`Failed to read get_spend(${spendId}):`, err);
    return null;
  }
}

export async function listSpends(accountId: string, limit: number = 20): Promise<SpendRecord[]> {
  if (!accountId || accountId.trim() === '') return [];
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'list_spends',
      args: [accountId.trim(), limit],
    });
    if (!Array.isArray(raw)) return [];
    return raw
      .map(item => safeParse<SpendRecord>(item))
      .filter((item): item is SpendRecord => item !== null);
  } catch (err) {
    console.warn(`Failed to read list_spends for account ${accountId}:`, err);
    return [];
  }
}

export async function listSpendsByAgent(agentAddress: string, limit: number = 20): Promise<SpendRecord[]> {
  if (!agentAddress || !agentAddress.trim().startsWith('0x')) return [];
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'list_spends_by_agent',
      args: [agentAddress.trim().toLowerCase(), limit],
    });
    if (!Array.isArray(raw)) return [];
    return raw
      .map(item => safeParse<SpendRecord>(item))
      .filter((item): item is SpendRecord => item !== null);
  } catch (err) {
    console.warn(`Failed to read list_spends_by_agent for ${agentAddress}:`, err);
    return [];
  }
}

export async function spendReceipt(spendId: string): Promise<SpendReceiptRecord | null> {
  if (!spendId || spendId.trim() === '') return null;
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_ALLOWANCE_VAULT,
      functionName: 'spend_receipt',
      args: [spendId.trim()],
    });
    return safeParse<SpendReceiptRecord>(raw);
  } catch (err) {
    console.warn(`Failed to read spend_receipt(${spendId}):`, err);
    return null;
  }
}

// ============================================================================
// SpendGate Views
// ============================================================================

export async function isSpendValidFor(
  spendId: string,
  accountId: string,
  payee: string,
  amount: number,
  policyHash: string
): Promise<boolean> {
  try {
    const res = await readClient.readContract({
      address: ACTIVE_SPEND_GATE,
      functionName: 'is_spend_valid_for',
      args: [
        spendId.trim(),
        accountId.trim(),
        payee.trim().toLowerCase(),
        amount,
        policyHash.trim(),
      ],
    });
    return Boolean(res);
  } catch (err) {
    console.warn(`is_spend_valid_for failed:`, err);
    return false;
  }
}

export async function getService(spendId: string): Promise<string> {
  if (!spendId || spendId.trim() === '') return '';
  try {
    const raw = await readClient.readContract({
      address: ACTIVE_SPEND_GATE,
      functionName: 'get_service',
      args: [spendId.trim()],
    });
    return String(raw || '');
  } catch (err) {
    console.warn(`Failed to read get_service(${spendId}):`, err);
    return '';
  }
}
