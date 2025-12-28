/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  coinType: number;
  derivationPath: string;
  network: 'mainnet' | 'testnet' | 'both';
  type: 'utxo' | 'evm' | 'solana' | 'cosmos' | 'other';
  chainId?: number;
  bech32Prefix?: string;
  explorerUrl?: string;
  supportsMultiSig?: boolean;
  supportsWatchOnly?: boolean;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  bitcoin: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', coinType: 0, derivationPath: "m/84'/0'/0'", network: 'both', type: 'utxo', explorerUrl: 'https://blockstream.info', supportsMultiSig: true, supportsWatchOnly: true },
  litecoin: { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', coinType: 2, derivationPath: "m/84'/2'/0'", network: 'both', type: 'utxo', explorerUrl: 'https://blockchair.com/litecoin', supportsMultiSig: true, supportsWatchOnly: true },
  ethereum: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 1, explorerUrl: 'https://etherscan.io', supportsWatchOnly: true },
  polygon: { id: 'polygon', name: 'Polygon', symbol: 'MATIC', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 137, explorerUrl: 'https://polygonscan.com', supportsWatchOnly: true },
  bsc: { id: 'bsc', name: 'BNB Smart Chain', symbol: 'BNB', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 56, explorerUrl: 'https://bscscan.com', supportsWatchOnly: true },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum One', symbol: 'ETH', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 42161, explorerUrl: 'https://arbiscan.io', supportsWatchOnly: true },
  optimism: { id: 'optimism', name: 'Optimism', symbol: 'ETH', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 10, explorerUrl: 'https://optimistic.etherscan.io', supportsWatchOnly: true },
  avalanche: { id: 'avalanche', name: 'Avalanche C-Chain', symbol: 'AVAX', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 43114, explorerUrl: 'https://snowtrace.io', supportsWatchOnly: true },
  base: { id: 'base', name: 'Base', symbol: 'ETH', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 8453, explorerUrl: 'https://basescan.org', supportsWatchOnly: true },
  fantom: { id: 'fantom', name: 'Fantom', symbol: 'FTM', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'both', type: 'evm', chainId: 250, explorerUrl: 'https://ftmscan.com', supportsWatchOnly: true },
  cronos: { id: 'cronos', name: 'Cronos', symbol: 'CRO', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'mainnet', type: 'evm', chainId: 25, explorerUrl: 'https://cronoscan.com', supportsWatchOnly: true },
  okx: { id: 'okx', name: 'OKX Chain', symbol: 'OKT', coinType: 60, derivationPath: "m/44'/60'/0'/0", network: 'mainnet', type: 'evm', chainId: 66, explorerUrl: 'https://www.okx.com/explorer/oktc', supportsWatchOnly: true },
  solana: { id: 'solana', name: 'Solana', symbol: 'SOL', coinType: 501, derivationPath: "m/44'/501'/0'/0'", network: 'both', type: 'solana', explorerUrl: 'https://explorer.solana.com', supportsWatchOnly: true },
  cosmos: { id: 'cosmos', name: 'Cosmos Hub', symbol: 'ATOM', coinType: 118, derivationPath: "m/44'/118'/0'/0/0", network: 'both', type: 'cosmos', bech32Prefix: 'cosmos', explorerUrl: 'https://www.mintscan.io/cosmos', supportsWatchOnly: true },
  osmosis: { id: 'osmosis', name: 'Osmosis', symbol: 'OSMO', coinType: 118, derivationPath: "m/44'/118'/0'/0/0", network: 'mainnet', type: 'cosmos', bech32Prefix: 'osmo', explorerUrl: 'https://www.mintscan.io/osmosis', supportsWatchOnly: true },
  aptos: { id: 'aptos', name: 'Aptos', symbol: 'APT', coinType: 637, derivationPath: "m/44'/637'/0'/0'/0'", network: 'both', type: 'other', explorerUrl: 'https://explorer.aptoslabs.com', supportsWatchOnly: true },
  sui: { id: 'sui', name: 'Sui', symbol: 'SUI', coinType: 784, derivationPath: "m/44'/784'/0'/0'/0'", network: 'both', type: 'other', explorerUrl: 'https://suiscan.xyz', supportsWatchOnly: true },
  near: { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', coinType: 397, derivationPath: "m/44'/397'/0'", network: 'both', type: 'other', explorerUrl: 'https://explorer.near.org', supportsWatchOnly: true },
  tron: { id: 'tron', name: 'TRON', symbol: 'TRX', coinType: 195, derivationPath: "m/44'/195'/0'/0/0", network: 'both', type: 'other', explorerUrl: 'https://tronscan.org', supportsWatchOnly: true },
  xrp: { id: 'xrp', name: 'XRP Ledger', symbol: 'XRP', coinType: 144, derivationPath: "m/44'/144'/0'/0/0", network: 'both', type: 'other', explorerUrl: 'https://xrpscan.com', supportsWatchOnly: true },
  cardano: { id: 'cardano', name: 'Cardano', symbol: 'ADA', coinType: 1815, derivationPath: "m/1852'/1815'/0'", network: 'both', type: 'other', explorerUrl: 'https://cardanoscan.io', supportsWatchOnly: true },
};

export const EVM_CHAINS = Object.values(SUPPORTED_CHAINS).filter((c) => c.type === 'evm');
export const COSMOS_CHAINS = Object.values(SUPPORTED_CHAINS).filter((c) => c.type === 'cosmos');
export const UTXO_CHAINS = Object.values(SUPPORTED_CHAINS).filter((c) => c.type === 'utxo');
export const getChainById = (id: string): ChainConfig | undefined => SUPPORTED_CHAINS[id.toLowerCase()];
export const getChainsByType = (type: ChainConfig['type']): ChainConfig[] => Object.values(SUPPORTED_CHAINS).filter((c) => c.type === type);
export const getSupportedChainIds = (): string[] => Object.keys(SUPPORTED_CHAINS);
export const getEvmChainId = (name: string): number | undefined => SUPPORTED_CHAINS[name.toLowerCase()]?.chainId;
