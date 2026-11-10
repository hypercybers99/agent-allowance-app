// Generated automatically by scripts/sync_deployments.mjs
// Source of truth: docs/ADDRESS_REGISTRY.md (tag aa-v1)

export interface ContractDeployment {
  name: string;
  address: `0x${string}`;
  deployTx: string;
  sourceSha256: string;
  promptSha256?: string;
  status: 'active' | 'superseded' | 'probe';
  explorerUrl: string;
  description: string;
}

export const NETWORK_CONFIG = {
  chainId: 61999,
  chainName: 'GenLayer Studionet (Preview)',
  rpcUrl: 'https://studio.genlayer.com/api',
  explorerUrl: 'https://explorer-studio.genlayer.com',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18,
  },
} as const;

export const CONTRACT_DEPLOYMENTS = {
  allowanceVault: {
    name: 'AllowanceVault',
    address: '0xd89C4fCB63773C01e8494EebaE7375C4d5992E07',
    deployTx: '0x53965fc7c6a0c0bbfec2f0eb3a76395dcfae6eeb246f4439c2794eb827051ae3',
    sourceSha256: 'ff656818cd98e7387794cce80dc0f0bb8da8b6a85e80a8deaa2e20087866b4ea',
    status: 'active',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/0xd89C4fCB63773C01e8494EebaE7375C4d5992E07',
    description: 'Primary intelligent contract holding account configurations, spending policies, and ledger.',
  },
  spendGate: {
    name: 'SpendGate',
    address: '0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528',
    deployTx: '0x3ab3717dfb119cb45a4773ebfc48d9aa1787c9339e1f5c66b8d276b89ae6e10f',
    sourceSha256: '619f9fd95e40678b6aca68bf90b2de9c579b965a1f62ed707b3d73a3d9162101',
    status: 'active',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/0xAe5aD4f836f199B56307b5E018eF3be8b8dd0528',
    description: 'Downstream merchant consumer contract recording service delivery (serve).',
  },
  probeExtract: {
    name: 'ProbeExtract',
    address: '0x9EBE36E328c1A4b8609c8dcB300eF4DF90db8997',
    deployTx: '0xdb335abaca6e9c82b1d56a809ccb5aee66d378a49225a0b61b1ef34c6f238831',
    sourceSha256: '34b23f6e846a9caeecf7dabb480f987224f28a8ab58f31230152f377c74e9f0c',
    promptSha256: '990f3801f114c0a5a22839b2ae82c0f99a5e82b794129994c5e3d74da05f31eb',
    status: 'probe',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/0x9EBE36E328c1A4b8609c8dcB300eF4DF90db8997',
    description: 'Empirical robustness harness used for repeated on-chain invoice extraction runs.',
  },
  probeM0: {
    name: 'Probe (Milestone 0)',
    address: '0x0DB3Eb197eb49D93dA6B53B8DCb9fD789B42E2B3',
    deployTx: '0x17f3674c6e12e0594442ca3cafb1e0f59e3a3de2e82d02662bc9e14cc9cbf4fe',
    sourceSha256: '5d6ea5507b39f9013090f4c24b2e8dd984ea516534fa8d8314a8630f2dcce68b',
    status: 'probe',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/0x0DB3Eb197eb49D93dA6B53B8DCb9fD789B42E2B3',
    description: 'Milestone 0 environment probe validating GenLayer views, writes, and nondet regex execution.',
  },
  supersededVault: {
    name: 'AllowanceVault (Initial Attempt)',
    address: '0x63D63C490AD9Cf9C35E196D8366e23748212C5c2',
    deployTx: '0xba40c31c067912e8a5f425f69b4f068a4007c6f555262594517829777c327a9f',
    sourceSha256: 'superseded',
    status: 'superseded',
    explorerUrl: 'https://explorer-studio.genlayer.com/address/0x63D63C490AD9Cf9C35E196D8366e23748212C5c2',
    description: 'Initial deployment attempt superseded due to RPC rate limiting before canonical run.',
  },
} as const;

export const ACTIVE_ALLOWANCE_VAULT = CONTRACT_DEPLOYMENTS.allowanceVault.address;
export const ACTIVE_SPEND_GATE = CONTRACT_DEPLOYMENTS.spendGate.address;
