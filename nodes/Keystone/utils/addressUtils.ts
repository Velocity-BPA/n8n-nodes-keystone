/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { SUPPORTED_CHAINS } from '../constants/chains';

/**
 * Address Validation and Conversion Utilities
 *
 * Utilities for validating and converting blockchain addresses
 * across different formats and chains.
 */

/**
 * Address Validation Result
 */
export interface AddressValidationResult {
  valid: boolean;
  chain?: string;
  format?: string;
  error?: string;
}

/**
 * Bitcoin address prefixes
 */
const BITCOIN_PREFIXES = {
  mainnet: {
    p2pkh: ['1'],
    p2sh: ['3'],
    bech32: ['bc1q'],
    bech32m: ['bc1p'],
  },
  testnet: {
    p2pkh: ['m', 'n'],
    p2sh: ['2'],
    bech32: ['tb1q'],
    bech32m: ['tb1p'],
  },
};

/**
 * Validate Bitcoin address
 */
export const validateBitcoinAddress = (
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
): AddressValidationResult => {
  if (!address || address.length === 0) {
    return { valid: false, error: 'Empty address' };
  }

  const prefixes = BITCOIN_PREFIXES[network];

  // Check P2PKH (Legacy)
  if (prefixes.p2pkh.some((p) => address.startsWith(p))) {
    if (address.length >= 26 && address.length <= 35) {
      if (isBase58Check(address)) {
        return { valid: true, chain: 'bitcoin', format: 'p2pkh' };
      }
    }
    return { valid: false, error: 'Invalid P2PKH address' };
  }

  // Check P2SH (Wrapped SegWit)
  if (prefixes.p2sh.some((p) => address.startsWith(p))) {
    if (address.length >= 26 && address.length <= 35) {
      if (isBase58Check(address)) {
        return { valid: true, chain: 'bitcoin', format: 'p2sh' };
      }
    }
    return { valid: false, error: 'Invalid P2SH address' };
  }

  // Check Bech32 (Native SegWit)
  if (prefixes.bech32.some((p) => address.toLowerCase().startsWith(p))) {
    if (isValidBech32(address)) {
      return { valid: true, chain: 'bitcoin', format: 'p2wpkh' };
    }
    return { valid: false, error: 'Invalid Bech32 address' };
  }

  // Check Bech32m (Taproot)
  if (prefixes.bech32m.some((p) => address.toLowerCase().startsWith(p))) {
    if (isValidBech32(address)) {
      return { valid: true, chain: 'bitcoin', format: 'p2tr' };
    }
    return { valid: false, error: 'Invalid Bech32m address' };
  }

  return { valid: false, error: 'Unknown Bitcoin address format' };
};

/**
 * Validate Ethereum/EVM address
 */
export const validateEthereumAddress = (address: string): AddressValidationResult => {
  if (!address || address.length === 0) {
    return { valid: false, error: 'Empty address' };
  }

  const cleanAddress = address.toLowerCase().replace('0x', '');

  if (cleanAddress.length !== 40) {
    return { valid: false, error: 'Invalid address length' };
  }

  if (!/^[0-9a-f]+$/i.test(cleanAddress)) {
    return { valid: false, error: 'Invalid hex characters' };
  }

  return { valid: true, chain: 'ethereum', format: 'hex' };
};

/**
 * Validate Solana address
 */
export const validateSolanaAddress = (address: string): AddressValidationResult => {
  if (!address || address.length === 0) {
    return { valid: false, error: 'Empty address' };
  }

  if (address.length < 32 || address.length > 44) {
    return { valid: false, error: 'Invalid address length' };
  }

  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
    return { valid: false, error: 'Invalid Base58 characters' };
  }

  return { valid: true, chain: 'solana', format: 'base58' };
};

/**
 * Validate Cosmos address
 */
export const validateCosmosAddress = (
  address: string,
  prefix: string = 'cosmos',
): AddressValidationResult => {
  if (!address || address.length === 0) {
    return { valid: false, error: 'Empty address' };
  }

  if (!address.toLowerCase().startsWith(prefix)) {
    return { valid: false, error: `Invalid prefix, expected ${prefix}` };
  }

  if (!isValidBech32(address)) {
    return { valid: false, error: 'Invalid Bech32 encoding' };
  }

  return { valid: true, chain: 'cosmos', format: 'bech32' };
};

/**
 * Validate Litecoin address
 */
export const validateLitecoinAddress = (
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  if (network === 'mainnet') {
    if (address.startsWith('L') || address.startsWith('M')) {
      return { valid: true, chain: 'litecoin', format: 'p2pkh' };
    }
    if (address.startsWith('3')) {
      return { valid: true, chain: 'litecoin', format: 'p2sh' };
    }
    if (address.toLowerCase().startsWith('ltc1q')) {
      return { valid: true, chain: 'litecoin', format: 'p2wpkh' };
    }
  }

  return { valid: false, error: 'Invalid Litecoin address' };
};

/**
 * Validate Cardano address
 */
export const validateCardanoAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  if (address.startsWith('addr')) {
    return { valid: true, chain: 'cardano', format: 'shelley' };
  }

  if (address.startsWith('Ae2') || address.startsWith('DdzFF')) {
    return { valid: true, chain: 'cardano', format: 'byron' };
  }

  return { valid: false, error: 'Invalid Cardano address' };
};

/**
 * Validate XRP address
 */
export const validateXRPAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  if (!address.startsWith('r')) {
    return { valid: false, error: 'XRP address must start with r' };
  }

  if (address.length < 25 || address.length > 35) {
    return { valid: false, error: 'Invalid XRP address length' };
  }

  return { valid: true, chain: 'xrp', format: 'base58' };
};

/**
 * Validate Tron address
 */
export const validateTronAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  if (!address.startsWith('T')) {
    return { valid: false, error: 'Tron address must start with T' };
  }

  if (address.length !== 34) {
    return { valid: false, error: 'Invalid Tron address length' };
  }

  return { valid: true, chain: 'tron', format: 'base58check' };
};

/**
 * Validate Near address
 */
export const validateNearAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  if (/^[a-z0-9_\-\.]+$/.test(address)) {
    return { valid: true, chain: 'near', format: 'named' };
  }

  if (/^[0-9a-f]{64}$/i.test(address)) {
    return { valid: true, chain: 'near', format: 'hex' };
  }

  return { valid: false, error: 'Invalid Near address' };
};

/**
 * Validate Aptos address
 */
export const validateAptosAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  const cleanAddress = address.replace('0x', '');

  if (cleanAddress.length !== 64) {
    return { valid: false, error: 'Invalid Aptos address length' };
  }

  if (!/^[0-9a-f]+$/i.test(cleanAddress)) {
    return { valid: false, error: 'Invalid hex characters' };
  }

  return { valid: true, chain: 'aptos', format: 'hex' };
};

/**
 * Validate Sui address
 */
export const validateSuiAddress = (address: string): AddressValidationResult => {
  if (!address) {
    return { valid: false, error: 'Empty address' };
  }

  const cleanAddress = address.replace('0x', '');

  if (cleanAddress.length !== 64) {
    return { valid: false, error: 'Invalid Sui address length' };
  }

  if (!/^[0-9a-f]+$/i.test(cleanAddress)) {
    return { valid: false, error: 'Invalid hex characters' };
  }

  return { valid: true, chain: 'sui', format: 'hex' };
};

/**
 * Validate address for any supported chain
 */
export const validateAddress = (address: string, chain: string): AddressValidationResult => {
  const chainConfig = SUPPORTED_CHAINS[chain];

  if (!chainConfig) {
    return { valid: false, error: `Unsupported chain: ${chain}` };
  }

  if (chainConfig.isEvm) {
    return validateEthereumAddress(address);
  }

  switch (chain) {
    case 'bitcoin':
      return validateBitcoinAddress(address);
    case 'litecoin':
      return validateLitecoinAddress(address);
    case 'solana':
      return validateSolanaAddress(address);
    case 'cosmos':
      return validateCosmosAddress(address, 'cosmos');
    case 'osmosis':
      return validateCosmosAddress(address, 'osmo');
    case 'cardano':
      return validateCardanoAddress(address);
    case 'xrp':
      return validateXRPAddress(address);
    case 'tron':
      return validateTronAddress(address);
    case 'near':
      return validateNearAddress(address);
    case 'aptos':
      return validateAptosAddress(address);
    case 'sui':
      return validateSuiAddress(address);
    default:
      return { valid: false, error: 'Address validation not implemented for this chain' };
  }
};

/**
 * Convert address between formats
 */
export const convertAddressFormat = (
  address: string,
  fromFormat: string,
  toFormat: string,
): { address?: string; error?: string } => {
  if (fromFormat === 'hex' && toFormat === 'checksum') {
    return { address: toChecksumAddress(address) };
  }

  if (fromFormat === 'checksum' && toFormat === 'hex') {
    return { address: address.toLowerCase() };
  }

  return { error: `Conversion from ${fromFormat} to ${toFormat} not supported` };
};

/**
 * Derive address from xpub
 */
export const deriveAddressFromXpub = (
  xpub: string,
  chain: string,
  index: number = 0,
): { address?: string; error?: string } => {
  return { error: 'Derivation requires full key implementation' };
};

// Helper functions

/**
 * Check if string is valid Base58Check
 */
export const isBase58Check = (str: string): boolean => {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(str);
};

/**
 * Check if string is valid Bech32
 */
export const isValidBech32 = (str: string): boolean => {
  const lower = str.toLowerCase();
  const sepIndex = lower.lastIndexOf('1');
  if (sepIndex === -1) return false;

  const dataPart = lower.slice(sepIndex + 1);
  const bech32Chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

  for (const char of dataPart) {
    if (!bech32Chars.includes(char)) return false;
  }

  return true;
};

/**
 * Convert to checksum address (EIP-55)
 */
const toChecksumAddress = (address: string): string => {
  const lower = address.toLowerCase().replace('0x', '');
  // Simplified - full implementation would use keccak256
  return '0x' + lower;
};

/**
 * Get address type label
 */
export const getAddressTypeLabel = (format: string): string => {
  const labels: Record<string, string> = {
    p2pkh: 'Legacy',
    p2sh: 'Wrapped SegWit (P2SH)',
    p2wpkh: 'Native SegWit (Bech32)',
    p2tr: 'Taproot (Bech32m)',
    hex: 'Hexadecimal',
    base58: 'Base58',
    base58check: 'Base58Check',
    bech32: 'Bech32',
    shelley: 'Shelley Era',
    byron: 'Byron Era',
    named: 'Named Account',
  };

  return labels[format] || format;
};
