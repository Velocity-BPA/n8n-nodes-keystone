/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Wallet Integration Constants
 *
 * Configuration for software wallet integrations that support
 * Keystone hardware wallet via QR code communication.
 */

/**
 * Wallet Integration Configuration
 */
export interface WalletIntegration {
  id: string;
  name: string;
  description: string;
  website: string;
  supportedChains: string[];
  syncFormat: 'ur' | 'json' | 'cbor';
  urTypes: string[];
  features: string[];
  qrSettings: {
    maxSize: number;
    animated: boolean;
  };
}

/**
 * Supported Wallet Integrations
 */
export const WALLET_INTEGRATIONS: Record<string, WalletIntegration> = {
  metamask: {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Popular Ethereum browser extension wallet',
    website: 'https://metamask.io',
    supportedChains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche', 'base'],
    syncFormat: 'ur',
    urTypes: ['crypto-hdkey', 'eth-sign-request', 'eth-signature'],
    features: ['account-sync', 'transaction-signing', 'message-signing', 'typed-data'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  rabby: {
    id: 'rabby',
    name: 'Rabby Wallet',
    description: 'Multi-chain DeFi wallet with security features',
    website: 'https://rabby.io',
    supportedChains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche', 'base', 'fantom'],
    syncFormat: 'ur',
    urTypes: ['crypto-hdkey', 'eth-sign-request', 'eth-signature'],
    features: ['account-sync', 'transaction-signing', 'message-signing', 'typed-data', 'security-check'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  okx: {
    id: 'okx',
    name: 'OKX Wallet',
    description: 'Multi-chain wallet by OKX exchange',
    website: 'https://www.okx.com/web3',
    supportedChains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'okx', 'solana', 'bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-hdkey', 'crypto-account', 'eth-sign-request', 'eth-signature'],
    features: ['account-sync', 'transaction-signing', 'message-signing', 'multi-chain'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  bluewallet: {
    id: 'bluewallet',
    name: 'BlueWallet',
    description: 'Bitcoin and Lightning wallet for mobile',
    website: 'https://bluewallet.io',
    supportedChains: ['bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-psbt', 'crypto-account', 'crypto-output'],
    features: ['watch-only', 'psbt-signing', 'multi-sig', 'lightning'],
    qrSettings: {
      maxSize: 300,
      animated: true,
    },
  },
  sparrow: {
    id: 'sparrow',
    name: 'Sparrow Wallet',
    description: 'Desktop Bitcoin wallet with full node support',
    website: 'https://sparrowwallet.com',
    supportedChains: ['bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-psbt', 'crypto-account', 'crypto-output', 'crypto-hdkey'],
    features: ['watch-only', 'psbt-signing', 'multi-sig', 'coin-control', 'full-node'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  specter: {
    id: 'specter',
    name: 'Specter Desktop',
    description: 'Multi-sig Bitcoin wallet with node integration',
    website: 'https://specter.solutions',
    supportedChains: ['bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-psbt', 'crypto-account', 'crypto-output'],
    features: ['watch-only', 'psbt-signing', 'multi-sig', 'full-node', 'airgap'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  electrum: {
    id: 'electrum',
    name: 'Electrum',
    description: 'Lightweight Bitcoin wallet',
    website: 'https://electrum.org',
    supportedChains: ['bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-psbt', 'crypto-account'],
    features: ['watch-only', 'psbt-signing', 'multi-sig', 'hardware-wallet'],
    qrSettings: {
      maxSize: 300,
      animated: true,
    },
  },
  core: {
    id: 'core',
    name: 'Core (Avalanche)',
    description: 'Avalanche ecosystem wallet',
    website: 'https://core.app',
    supportedChains: ['avalanche', 'ethereum', 'bitcoin'],
    syncFormat: 'ur',
    urTypes: ['crypto-hdkey', 'eth-sign-request', 'eth-signature'],
    features: ['account-sync', 'transaction-signing', 'cross-chain', 'defi'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  keplr: {
    id: 'keplr',
    name: 'Keplr',
    description: 'Inter-blockchain communication wallet for Cosmos',
    website: 'https://www.keplr.app',
    supportedChains: ['cosmos', 'osmosis'],
    syncFormat: 'ur',
    urTypes: ['cosmos-sign-request', 'cosmos-signature'],
    features: ['account-sync', 'transaction-signing', 'ibc', 'staking'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    description: 'Solana and multi-chain wallet',
    website: 'https://phantom.app',
    supportedChains: ['solana', 'ethereum', 'polygon', 'bitcoin'],
    syncFormat: 'ur',
    urTypes: ['sol-sign-request', 'sol-signature'],
    features: ['account-sync', 'transaction-signing', 'nft', 'swap'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
  solflare: {
    id: 'solflare',
    name: 'Solflare',
    description: 'Solana-focused wallet with staking',
    website: 'https://solflare.com',
    supportedChains: ['solana'],
    syncFormat: 'ur',
    urTypes: ['sol-sign-request', 'sol-signature'],
    features: ['account-sync', 'transaction-signing', 'staking', 'nft'],
    qrSettings: {
      maxSize: 400,
      animated: true,
    },
  },
};

/**
 * Get wallet by ID
 */
export const getWallet = (walletId: string): WalletIntegration | undefined => {
  return WALLET_INTEGRATIONS[walletId];
};

/**
 * Get wallets by chain
 */
export const getWalletsByChain = (chain: string): WalletIntegration[] => {
  return Object.values(WALLET_INTEGRATIONS).filter(wallet =>
    wallet.supportedChains.includes(chain)
  );
};

/**
 * Get all wallet IDs
 */
export const getWalletIds = (): string[] => {
  return Object.keys(WALLET_INTEGRATIONS);
};

/**
 * Wallet Features
 */
export const WALLET_FEATURES = {
  ACCOUNT_SYNC: 'account-sync',
  TRANSACTION_SIGNING: 'transaction-signing',
  MESSAGE_SIGNING: 'message-signing',
  TYPED_DATA: 'typed-data',
  WATCH_ONLY: 'watch-only',
  PSBT_SIGNING: 'psbt-signing',
  MULTI_SIG: 'multi-sig',
  STAKING: 'staking',
  NFT: 'nft',
  DEFI: 'defi',
  SWAP: 'swap',
  FULL_NODE: 'full-node',
  LIGHTNING: 'lightning',
  IBC: 'ibc',
  CROSS_CHAIN: 'cross-chain',
  SECURITY_CHECK: 'security-check',
  COIN_CONTROL: 'coin-control',
  AIRGAP: 'airgap',
  HARDWARE_WALLET: 'hardware-wallet',
} as const;

/**
 * Sync Methods
 */
export const SYNC_METHODS = {
  QR_ANIMATED: 'qr-animated',
  QR_SINGLE: 'qr-single',
  FILE_JSON: 'file-json',
  FILE_CBOR: 'file-cbor',
  CLIPBOARD: 'clipboard',
} as const;
