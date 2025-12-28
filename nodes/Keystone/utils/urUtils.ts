/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { UR_TYPES, CBOR_TAGS } from '../constants/urTypes';

/**
 * UR (Uniform Resource) Utilities
 *
 * Utilities for encoding and decoding Uniform Resource format
 * used by Keystone and other hardware wallets for QR communication.
 *
 * UR format specification: https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md
 */

/**
 * Bytewords encoding alphabet
 * Used for encoding binary data in UR format
 */
const BYTEWORDS = [
  'able', 'acid', 'also', 'apex', 'aqua', 'arch', 'atom', 'aunt',
  'away', 'axis', 'back', 'bald', 'barn', 'belt', 'beta', 'bias',
  'blue', 'body', 'brag', 'brew', 'bulb', 'buzz', 'calm', 'cash',
  'cats', 'chef', 'city', 'claw', 'code', 'cola', 'cook', 'cost',
  'crux', 'curl', 'cusp', 'cyan', 'dark', 'data', 'days', 'deli',
  'dice', 'diet', 'door', 'down', 'draw', 'drop', 'drum', 'dull',
  'duty', 'each', 'easy', 'echo', 'edge', 'epic', 'even', 'exam',
  'exit', 'eyes', 'fact', 'fair', 'fern', 'figs', 'film', 'fish',
  'fizz', 'flap', 'flew', 'flux', 'foxy', 'free', 'frog', 'fuel',
  'fund', 'gala', 'game', 'gear', 'gems', 'gift', 'girl', 'glow',
  'good', 'gray', 'grim', 'guru', 'gush', 'gyro', 'half', 'hang',
  'hard', 'hawk', 'heat', 'help', 'high', 'hill', 'holy', 'hope',
  'horn', 'huts', 'iced', 'idea', 'idle', 'inch', 'inky', 'into',
  'iris', 'iron', 'item', 'jade', 'jazz', 'join', 'jolt', 'jowl',
  'judo', 'jugs', 'jump', 'junk', 'jury', 'keep', 'keno', 'kept',
  'keys', 'kick', 'kiln', 'king', 'kite', 'kiwi', 'knob', 'lamb',
  'lava', 'lazy', 'leaf', 'legs', 'liar', 'limp', 'lion', 'list',
  'logo', 'loud', 'love', 'luau', 'luck', 'lung', 'main', 'many',
  'math', 'maze', 'memo', 'menu', 'meow', 'mild', 'mint', 'miss',
  'monk', 'nail', 'navy', 'need', 'news', 'next', 'noon', 'note',
  'numb', 'obey', 'oboe', 'omit', 'onyx', 'open', 'oval', 'owls',
  'paid', 'part', 'peck', 'play', 'plus', 'poem', 'pool', 'pose',
  'puff', 'puma', 'purr', 'quad', 'quiz', 'race', 'ramp', 'real',
  'redo', 'rich', 'road', 'rock', 'roof', 'ruby', 'ruin', 'runs',
  'rust', 'safe', 'saga', 'scar', 'sets', 'silk', 'skew', 'slot',
  'soap', 'solo', 'song', 'stub', 'surf', 'swan', 'taco', 'task',
  'taxi', 'tent', 'tied', 'time', 'tiny', 'toil', 'tomb', 'toys',
  'trip', 'tuna', 'twin', 'ugly', 'undo', 'unit', 'urge', 'user',
  'vast', 'very', 'veto', 'vial', 'vibe', 'view', 'visa', 'void',
  'vows', 'wall', 'wand', 'warm', 'wasp', 'wave', 'waxy', 'webs',
  'what', 'when', 'whiz', 'wolf', 'work', 'yank', 'yawn', 'yell',
  'yoga', 'yurt', 'zaps', 'zero', 'zest', 'zinc', 'zone', 'zoom',
];

/**
 * UR Creation Result
 */
export interface URResult {
  type: string;
  data: string;
  ur: string;
}

/**
 * ETH Sign Request
 */
export interface EthSignRequest {
  requestId: string;
  signData: string;
  dataType: 'transaction' | 'typed-data' | 'personal-message' | 'message';
  chainId?: number;
  derivationPath: string;
  address?: string;
}

/**
 * SOL Sign Request
 */
export interface SolSignRequest {
  requestId: string;
  signData: string;
  dataType: 'transaction' | 'message';
  derivationPath: string;
  address?: string;
}

/**
 * Encode bytes to bytewords
 *
 * @param bytes - Bytes to encode
 * @returns Bytewords encoded string
 */
export const encodeBytewords = (bytes: Uint8Array): string => {
  const words: string[] = [];
  for (const byte of bytes) {
    words.push(BYTEWORDS[byte]);
  }
  return words.join('');
};

/**
 * Decode bytewords to bytes
 *
 * @param bytewords - Bytewords string
 * @returns Decoded bytes
 */
export const decodeBytewords = (bytewords: string): Uint8Array => {
  // Extract 4-character words
  const words: string[] = [];
  for (let i = 0; i < bytewords.length; i += 4) {
    words.push(bytewords.slice(i, i + 4).toLowerCase());
  }
  
  const bytes: number[] = [];
  for (const word of words) {
    const index = BYTEWORDS.indexOf(word);
    if (index === -1) {
      throw new Error(`Invalid byteword: ${word}`);
    }
    bytes.push(index);
  }
  
  return new Uint8Array(bytes);
};

/**
 * Create UR string from type and data
 *
 * @param type - UR type
 * @param data - Bytewords encoded data
 * @returns UR string
 */
export const createURString = (type: string, data: string): string => {
  return `ur:${type}/${data}`;
};

/**
 * Parse UR string
 *
 * @param urString - UR string to parse
 * @returns Parsed components
 */
export const parseURString = (urString: string): {
  type: string;
  data: string;
} => {
  const lower = urString.toLowerCase();
  
  if (!lower.startsWith('ur:')) {
    throw new Error('Invalid UR string: must start with "ur:"');
  }
  
  const content = lower.slice(3);
  const separatorIndex = content.indexOf('/');
  
  if (separatorIndex === -1) {
    throw new Error('Invalid UR string: missing type/data separator');
  }
  
  return {
    type: content.slice(0, separatorIndex),
    data: content.slice(separatorIndex + 1),
  };
};

/**
 * Create ETH Sign Request UR
 *
 * @param request - ETH sign request data
 * @returns UR result
 */
export const createEthSignRequestUR = (request: EthSignRequest): URResult => {
  // Build CBOR-like structure (simplified)
  const payload = {
    requestId: request.requestId,
    signData: request.signData,
    dataType: request.dataType,
    chainId: request.chainId,
    derivationPath: request.derivationPath,
    address: request.address,
  };
  
  // Encode to hex, then to bytewords
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  const bytewords = encodeBytewords(bytes);
  
  const ur = createURString('eth-sign-request', bytewords);
  
  return {
    type: 'eth-sign-request',
    data: bytewords,
    ur,
  };
};

/**
 * Parse ETH Signature UR
 *
 * @param urString - UR string containing signature
 * @returns Signature data
 */
export const parseEthSignatureUR = (urString: string): {
  requestId: string;
  signature: string;
} => {
  const { type, data } = parseURString(urString);
  
  if (type !== 'eth-signature') {
    throw new Error(`Expected eth-signature, got ${type}`);
  }
  
  // Decode bytewords to bytes, then parse
  const bytes = decodeBytewords(data);
  const jsonStr = new TextDecoder().decode(bytes);
  const payload = JSON.parse(jsonStr);
  
  return {
    requestId: payload.requestId,
    signature: payload.signature,
  };
};

/**
 * Create SOL Sign Request UR
 *
 * @param request - SOL sign request data
 * @returns UR result
 */
export const createSolSignRequestUR = (request: SolSignRequest): URResult => {
  const payload = {
    requestId: request.requestId,
    signData: request.signData,
    dataType: request.dataType,
    derivationPath: request.derivationPath,
    address: request.address,
  };
  
  const jsonStr = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(jsonStr);
  const bytewords = encodeBytewords(bytes);
  
  const ur = createURString('sol-sign-request', bytewords);
  
  return {
    type: 'sol-sign-request',
    data: bytewords,
    ur,
  };
};

/**
 * Parse SOL Signature UR
 *
 * @param urString - UR string containing signature
 * @returns Signature data
 */
export const parseSolSignatureUR = (urString: string): {
  requestId: string;
  signature: string;
} => {
  const { type, data } = parseURString(urString);
  
  if (type !== 'sol-signature') {
    throw new Error(`Expected sol-signature, got ${type}`);
  }
  
  const bytes = decodeBytewords(data);
  const jsonStr = new TextDecoder().decode(bytes);
  const payload = JSON.parse(jsonStr);
  
  return {
    requestId: payload.requestId,
    signature: payload.signature,
  };
};

/**
 * Create Crypto-PSBT UR
 *
 * @param psbtHex - PSBT in hex format
 * @returns UR result
 */
export const createCryptoPSBTUR = (psbtHex: string): URResult => {
  // Convert hex to bytes
  const bytes = new Uint8Array(
    psbtHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) ?? []
  );
  
  const bytewords = encodeBytewords(bytes);
  const ur = createURString('crypto-psbt', bytewords);
  
  return {
    type: 'crypto-psbt',
    data: bytewords,
    ur,
  };
};

/**
 * Parse Crypto-PSBT UR
 *
 * @param urString - UR string containing PSBT
 * @returns PSBT hex
 */
export const parseCryptoPSBTUR = (urString: string): string => {
  const { type, data } = parseURString(urString);
  
  if (type !== 'crypto-psbt') {
    throw new Error(`Expected crypto-psbt, got ${type}`);
  }
  
  const bytes = decodeBytewords(data);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Validate UR string
 *
 * @param urString - UR string to validate
 * @returns Validation result
 */
export const validateURString = (urString: string): {
  valid: boolean;
  type?: string;
  error?: string;
} => {
  try {
    const { type } = parseURString(urString);
    return { valid: true, type };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
};

/**
 * Get CBOR tag for UR type
 *
 * @param urType - UR type
 * @returns CBOR tag number
 */
export const getCBORTagForType = (urType: string): number | undefined => {
  return CBOR_TAGS[urType as keyof typeof CBOR_TAGS];
};

/**
 * Create request ID
 *
 * @returns UUID-like request ID
 */
export const createRequestId = (): string => {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
};

/**
 * Create Cosmos Sign Request UR
 */
export const createCosmosSignRequestUR = (request: {
  requestId: string;
  signData: string;
  dataType: 'amino' | 'direct';
  accounts: Array<{ path: string; address: string }>;
}): URResult => {
  const jsonStr = JSON.stringify(request);
  const bytes = new TextEncoder().encode(jsonStr);
  const bytewords = encodeBytewords(bytes);
  
  const ur = createURString('cosmos-sign-request', bytewords);
  
  return {
    type: 'cosmos-sign-request',
    data: bytewords,
    ur,
  };
};

/**
 * Parse Cosmos Signature UR
 */
export const parseCosmosSignatureUR = (urString: string): {
  requestId: string;
  signature: string;
  publicKey: string;
} => {
  const { type, data } = parseURString(urString);
  
  if (type !== 'cosmos-signature') {
    throw new Error(`Expected cosmos-signature, got ${type}`);
  }
  
  const bytes = decodeBytewords(data);
  const jsonStr = new TextDecoder().decode(bytes);
  return JSON.parse(jsonStr);
};
