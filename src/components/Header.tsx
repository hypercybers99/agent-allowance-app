import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Wallet, Menu, X, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { address, isConnected, isConnecting, demoBalance, connectWallet, disconnectWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/accounts', label: 'Accounts' },
    { to: '/accounts/new', label: 'Create Account' },
    { to: '/gate', label: 'SpendGate' },
    { to: '/credits', label: 'Demo Credits' },
    { to: '/evidence', label: 'Evidence' },
    { to: '/limits', label: 'Limits' },
  ];

  const formatAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="bg-sand border-b border-sand-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Preview Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-2xl text-ink hover:text-primary transition-colors">
              <ShieldCheck className="text-primary w-6 h-6 sm:w-8 sm:h-8 shrink-0" aria-hidden="true" />
              <span className="truncate">Agent Allowance</span>
            </Link>
            <span className="inline-block bg-clay-bg text-clay text-xs font-semibold px-2 py-0.5 rounded border border-clay/30 uppercase tracking-wider shrink-0">
              Preview
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded font-medium text-base transition-colors ${
                    active
                      ? 'bg-primary text-primary-contrast'
                      : 'text-ink hover:bg-page hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Controls: Theme & Wallet */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded border border-sand-border bg-page text-ink hover:bg-sand transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {isConnected && address ? (
              <div className="flex items-center gap-2 bg-page border border-sand-border rounded px-3 py-1.5">
                <div className="text-right">
                  <div className="text-xs text-ink-muted">Demo Balance</div>
                  <div className="font-semibold text-sm text-ink">{demoBalance} credits</div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-sand hover:bg-sand-border text-ink text-sm font-medium px-2.5 py-1.5 rounded transition-colors"
                  title="Click to disconnect"
                >
                  {formatAddr(address)}
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-contrast font-medium px-4 py-2.5 rounded transition-colors shadow-sm disabled:opacity-50"
              >
                <Wallet size={18} aria-hidden="true" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded border border-sand-border bg-page text-ink"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2.5 rounded border border-sand-border bg-page text-ink"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-sand-border bg-sand px-4 pt-3 pb-6 space-y-2">
          {navLinks.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded text-lg font-medium ${
                  active ? 'bg-primary text-primary-contrast' : 'text-ink hover:bg-page'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-sand-border">
            {isConnected && address ? (
              <div className="space-y-2">
                <div className="text-sm text-ink-muted">Connected: {formatAddr(address)}</div>
                <div className="text-sm font-semibold text-ink">Balance: {demoBalance} demo credits</div>
                <button
                  onClick={disconnectWallet}
                  className="w-full text-center py-2.5 bg-page text-ink border border-sand-border rounded font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full py-3 bg-primary text-primary-contrast rounded font-medium text-center"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
