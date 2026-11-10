import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, chains } from 'genlayer-js';
import { ensureStudionetChain } from '../services/walletClient';
import { getBalanceOf } from '../services/readClient';
import { NETWORK_CONFIG } from '../config/deployments';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  demoBalance: string;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  getClient: () => any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [demoBalance, setDemoBalance] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setDemoBalance('0');
      return;
    }
    const bal = await getBalanceOf(address);
    setDemoBalance(bal);
  }, [address]);

  useEffect(() => {
    if (address) {
      refreshBalance();
    }
  }, [address, refreshBalance]);

  // Check if wallet is already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0].toLowerCase());
          }
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0].toLowerCase());
        } else {
          setAddress(null);
        }
      };

      eth.on?.('accountsChanged', handleAccountsChanged);
      return () => {
        eth.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('No browser wallet detected. Please install MetaMask to perform on-chain writes.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      const provider = (window as any).ethereum;
      await ensureStudionetChain(provider);

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0].toLowerCase());
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setDemoBalance('0');
  };

  const getClient = () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return createClient({
        chain: chains.studionet,
        endpoint: NETWORK_CONFIG.rpcUrl,
        account: address as `0x${string}`,
      });
    }
    // Fallback client
    return createClient({
      chain: chains.studionet,
      endpoint: NETWORK_CONFIG.rpcUrl,
    });
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        demoBalance,
        error,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        getClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
