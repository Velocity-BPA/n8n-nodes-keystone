/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface URType {
  type: string;
  tag: number;
  description: string;
  category: 'crypto' | 'eth' | 'sol' | 'btc' | 'cosmos' | 'other';
  isRequest?: boolean;
  isResponse?: boolean;
}

export const UR_CORE_TYPES: Record<string, URType> = {
  bytes: { type: 'bytes', tag: 0, description: 'Raw byte data', category: 'crypto' },
  cryptoHDKey: { type: 'crypto-hdkey', tag: 303, description: 'HD Key', category: 'crypto' },
  cryptoKeypath: { type: 'crypto-keypath', tag: 304, description: 'Key derivation path', category: 'crypto' },
  cryptoCoinInfo: { type: 'crypto-coin-info', tag: 305, description: 'Cryptocurrency info', category: 'crypto' },
  cryptoECKey: { type: 'crypto-eckey', tag: 306, description: 'Elliptic curve key', category: 'crypto' },
  cryptoOutput: { type: 'crypto-output', tag: 308, description: 'Output descriptor', category: 'crypto' },
  cryptoPSBT: { type: 'crypto-psbt', tag: 310, description: 'Partially Signed Bitcoin Transaction', category: 'btc' },
  cryptoAccount: { type: 'crypto-account', tag: 311, description: 'Account descriptor', category: 'crypto' },
  cryptoMultiAccounts: { type: 'crypto-multi-accounts', tag: 312, description: 'Multiple accounts', category: 'crypto' },
};

export const UR_ETH_TYPES: Record<string, URType> = {
  ethSignRequest: { type: 'eth-sign-request', tag: 401, description: 'Ethereum signing request', category: 'eth', isRequest: true },
  ethSignature: { type: 'eth-signature', tag: 402, description: 'Ethereum signature', category: 'eth', isResponse: true },
};

export const UR_SOL_TYPES: Record<string, URType> = {
  solSignRequest: { type: 'sol-sign-request', tag: 1101, description: 'Solana signing request', category: 'sol', isRequest: true },
  solSignature: { type: 'sol-signature', tag: 1102, description: 'Solana signature', category: 'sol', isResponse: true },
};

export const UR_BTC_TYPES: Record<string, URType> = {
  btcSignRequest: { type: 'btc-sign-request', tag: 501, description: 'Bitcoin signing request', category: 'btc', isRequest: true },
  btcSignature: { type: 'btc-signature', tag: 502, description: 'Bitcoin signature', category: 'btc', isResponse: true },
};

export const UR_COSMOS_TYPES: Record<string, URType> = {
  cosmosSignRequest: { type: 'cosmos-sign-request', tag: 4101, description: 'Cosmos signing request', category: 'cosmos', isRequest: true },
  cosmosSignature: { type: 'cosmos-signature', tag: 4102, description: 'Cosmos signature', category: 'cosmos', isResponse: true },
};

export const UR_KEYSTONE_TYPES: Record<string, URType> = {
  keystoneSignRequest: { type: 'keystone-sign-request', tag: 7101, description: 'Generic signing request', category: 'other', isRequest: true },
  keystoneSignResult: { type: 'keystone-sign-result', tag: 7102, description: 'Generic signing result', category: 'other', isResponse: true },
  aptosSignRequest: { type: 'aptos-sign-request', tag: 3101, description: 'Aptos signing request', category: 'other', isRequest: true },
  aptosSignature: { type: 'aptos-signature', tag: 3102, description: 'Aptos signature', category: 'other', isResponse: true },
  suiSignRequest: { type: 'sui-sign-request', tag: 3201, description: 'Sui signing request', category: 'other', isRequest: true },
  suiSignature: { type: 'sui-signature', tag: 3202, description: 'Sui signature', category: 'other', isResponse: true },
  nearSignRequest: { type: 'near-sign-request', tag: 2101, description: 'NEAR signing request', category: 'other', isRequest: true },
  nearSignature: { type: 'near-signature', tag: 2102, description: 'NEAR signature', category: 'other', isResponse: true },
  cardanoSignRequest: { type: 'cardano-sign-request', tag: 2201, description: 'Cardano signing request', category: 'other', isRequest: true },
  cardanoSignature: { type: 'cardano-signature', tag: 2202, description: 'Cardano signature', category: 'other', isResponse: true },
};

export const ALL_UR_TYPES: Record<string, URType> = { ...UR_CORE_TYPES, ...UR_ETH_TYPES, ...UR_SOL_TYPES, ...UR_BTC_TYPES, ...UR_COSMOS_TYPES, ...UR_KEYSTONE_TYPES };
export const getURType = (type: string): URType | undefined => Object.values(ALL_UR_TYPES).find((ur) => ur.type === type);
export const getURTypeByTag = (tag: number): URType | undefined => Object.values(ALL_UR_TYPES).find((ur) => ur.tag === tag);
export const getRequestTypes = (): URType[] => Object.values(ALL_UR_TYPES).filter((ur) => ur.isRequest);
export const getResponseTypes = (): URType[] => Object.values(ALL_UR_TYPES).filter((ur) => ur.isResponse);

export const UR_CBOR_TAGS = {
  UUID: 37, DATE: 100, BYTES: 0, CRYPTO_HDKEY: 303, CRYPTO_KEYPATH: 304, CRYPTO_COIN_INFO: 305,
  CRYPTO_ECKEY: 306, CRYPTO_OUTPUT: 308, CRYPTO_PSBT: 310, CRYPTO_ACCOUNT: 311, CRYPTO_MULTI_ACCOUNTS: 312,
  ETH_SIGN_REQUEST: 401, ETH_SIGNATURE: 402, SOL_SIGN_REQUEST: 1101, SOL_SIGNATURE: 1102,
} as const;

export const ETH_DATA_TYPES = { TRANSACTION: 1, TYPED_DATA: 2, PERSONAL_MESSAGE: 3, TYPED_TRANSACTION: 4 } as const;
export const SOL_SIGNATURE_TYPES = { TRANSACTION: 1, MESSAGE: 2 } as const;
