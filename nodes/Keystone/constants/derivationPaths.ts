/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface DerivationPath {
  id: string;
  name: string;
  path: string;
  purpose: number;
  coinType: number;
  addressType: string;
  description: string;
}

export const BTC_DERIVATION_PATHS: Record<string, DerivationPath> = {
  legacy: { id: 'btc-legacy', name: 'Legacy (P2PKH)', path: "m/44'/0'/0'", purpose: 44, coinType: 0, addressType: 'P2PKH', description: 'Legacy addresses starting with 1' },
  segwitWrapped: { id: 'btc-segwit-wrapped', name: 'SegWit Wrapped', path: "m/49'/0'/0'", purpose: 49, coinType: 0, addressType: 'P2SH-P2WPKH', description: 'Wrapped SegWit starting with 3' },
  nativeSegwit: { id: 'btc-native-segwit', name: 'Native SegWit', path: "m/84'/0'/0'", purpose: 84, coinType: 0, addressType: 'P2WPKH', description: 'Native SegWit starting with bc1q' },
  taproot: { id: 'btc-taproot', name: 'Taproot (P2TR)', path: "m/86'/0'/0'", purpose: 86, coinType: 0, addressType: 'P2TR', description: 'Taproot addresses starting with bc1p' },
  multiSig: { id: 'btc-multisig', name: 'Multi-Sig', path: "m/48'/0'/0'/2'", purpose: 48, coinType: 0, addressType: 'P2WSH', description: 'Native SegWit multi-sig' },
};

export const ETH_DERIVATION_PATHS: Record<string, DerivationPath> = {
  standard: { id: 'eth-standard', name: 'Standard', path: "m/44'/60'/0'/0", purpose: 44, coinType: 60, addressType: 'ETH', description: 'Standard Ethereum path' },
  legacy: { id: 'eth-legacy', name: 'Legacy', path: "m/44'/60'/0'", purpose: 44, coinType: 60, addressType: 'ETH', description: 'Legacy path' },
};

export const SOL_DERIVATION_PATHS: Record<string, DerivationPath> = {
  standard: { id: 'sol-standard', name: 'Standard', path: "m/44'/501'/0'/0'", purpose: 44, coinType: 501, addressType: 'ED25519', description: 'Standard Solana path' },
};

export const COSMOS_DERIVATION_PATHS: Record<string, DerivationPath> = {
  atom: { id: 'cosmos-atom', name: 'Cosmos Hub', path: "m/44'/118'/0'/0/0", purpose: 44, coinType: 118, addressType: 'SECP256K1', description: 'Cosmos Hub path' },
};

export const OTHER_DERIVATION_PATHS: Record<string, DerivationPath> = {
  aptos: { id: 'aptos', name: 'Aptos', path: "m/44'/637'/0'/0'/0'", purpose: 44, coinType: 637, addressType: 'ED25519', description: 'Aptos path' },
  sui: { id: 'sui', name: 'Sui', path: "m/44'/784'/0'/0'/0'", purpose: 44, coinType: 784, addressType: 'ED25519', description: 'Sui path' },
  near: { id: 'near', name: 'NEAR', path: "m/44'/397'/0'", purpose: 44, coinType: 397, addressType: 'ED25519', description: 'NEAR path' },
  tron: { id: 'tron', name: 'TRON', path: "m/44'/195'/0'/0/0", purpose: 44, coinType: 195, addressType: 'SECP256K1', description: 'TRON path' },
  xrp: { id: 'xrp', name: 'XRP', path: "m/44'/144'/0'/0/0", purpose: 44, coinType: 144, addressType: 'SECP256K1', description: 'XRP path' },
  cardano: { id: 'cardano', name: 'Cardano', path: "m/1852'/1815'/0'", purpose: 1852, coinType: 1815, addressType: 'ED25519', description: 'Cardano Shelley path' },
  litecoin: { id: 'litecoin', name: 'Litecoin', path: "m/84'/2'/0'", purpose: 84, coinType: 2, addressType: 'P2WPKH', description: 'Litecoin path' },
};

export const ALL_DERIVATION_PATHS: Record<string, DerivationPath> = { ...BTC_DERIVATION_PATHS, ...ETH_DERIVATION_PATHS, ...SOL_DERIVATION_PATHS, ...COSMOS_DERIVATION_PATHS, ...OTHER_DERIVATION_PATHS };
export const getDerivationPath = (chainId: string): string => ALL_DERIVATION_PATHS[chainId]?.path || '';
export const getDerivationPathInfo = (chainId: string): DerivationPath | undefined => ALL_DERIVATION_PATHS[chainId];

export const parseDerivationPath = (path: string): { purpose: number; coinType: number; account: number; change?: number; addressIndex?: number } | null => {
  const regex = /m\/(\d+)'?\/(\d+)'?\/(\d+)'?(?:\/(\d+))?(?:\/(\d+))?/;
  const match = path.match(regex);
  if (!match) return null;
  return { purpose: parseInt(match[1]), coinType: parseInt(match[2]), account: parseInt(match[3]), change: match[4] ? parseInt(match[4]) : undefined, addressIndex: match[5] ? parseInt(match[5]) : undefined };
};
