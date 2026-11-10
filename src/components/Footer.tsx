import React from 'react';
import { ExternalLink, Github } from 'lucide-react';
import { CONTRACT_DEPLOYMENTS, NETWORK_CONFIG } from '../config/deployments';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-sand border-t border-sand-border mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: App Info */}
          <div>
            <h3 className="font-bold text-lg text-ink mb-2">Agent Allowance (Preview)</h3>
            <p className="text-base text-ink-muted mb-4">
              A spending account for an AI agent: it pays only when a validator-checked invoice page matches the request.
            </p>
            <p className="text-sm text-ink-muted">
              Operating on GenLayer Studionet (Chain ID {NETWORK_CONFIG.chainId}). Credits are demo credits, not money.
            </p>
          </div>

          {/* Column 2: Contract Deployments */}
          <div>
            <h3 className="font-bold text-lg text-ink mb-2">Active Intelligent Contracts</h3>
            <ul className="space-y-2 text-base text-ink-muted">
              <li>
                <span className="font-medium text-ink">AllowanceVault:</span>
                <a
                  href={CONTRACT_DEPLOYMENTS.allowanceVault.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-1 text-primary hover:underline break-all"
                >
                  <span>{CONTRACT_DEPLOYMENTS.allowanceVault.address.slice(0, 10)}...</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
              <li>
                <span className="font-medium text-ink">SpendGate:</span>
                <a
                  href={CONTRACT_DEPLOYMENTS.spendGate.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-1 text-primary hover:underline break-all"
                >
                  <span>{CONTRACT_DEPLOYMENTS.spendGate.address.slice(0, 10)}...</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
              <li className="text-sm pt-1">
                Source parity verified byte-for-byte on GenLayer Studionet.
              </li>
            </ul>
          </div>

          {/* Column 3: Repositories */}
          <div>
            <h3 className="font-bold text-lg text-ink mb-2">Source Repositories</h3>
            <ul className="space-y-2 text-base">
              <li>
                <a
                  href="https://github.com/hypercybers99/agent-allowance-genlayer/tree/aa-v1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Github size={16} aria-hidden="true" />
                  <span>Contract Repo (tag aa-v1)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/hypercybers99/agent-allowance-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Github size={16} aria-hidden="true" />
                  <span>Web App Repo (agent-allowance-app)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/hypercybers99/agent-allowance-fixtures"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  <span>Pinned Invoice Fixtures</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-sand-border text-center text-sm text-ink-muted">
          MIT License &copy; 2026 Hyper. Built for GenLayer Studionet (Chain 61999).
        </div>
      </div>
    </footer>
  );
};
