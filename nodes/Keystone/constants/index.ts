/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Keystone Constants Index
 *
 * Central export for all constants used in Keystone node operations.
 */

export * from './chains';
export * from './urTypes';
export * from './derivationPaths';
export * from './wallets';
export * from './qrSettings';

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Device errors
  DEVICE_NOT_FOUND: 'E001',
  DEVICE_CONNECTION_FAILED: 'E002',
  DEVICE_TIMEOUT: 'E003',
  DEVICE_BUSY: 'E004',

  // QR errors
  QR_GENERATION_FAILED: 'E010',
  QR_PARSE_FAILED: 'E011',
  QR_INVALID_FORMAT: 'E012',
  QR_DATA_TOO_LARGE: 'E013',
  QR_ANIMATED_INCOMPLETE: 'E014',

  // UR errors
  UR_ENCODE_FAILED: 'E020',
  UR_DECODE_FAILED: 'E021',
  UR_INVALID_TYPE: 'E022',
  UR_CHECKSUM_FAILED: 'E023',

  // Signing errors
  SIGNING_REJECTED: 'E030',
  SIGNING_TIMEOUT: 'E031',
  SIGNING_INVALID_DATA: 'E032',
  SIGNATURE_INVALID: 'E033',

  // Transaction errors
  TX_INVALID: 'E040',
  TX_BROADCAST_FAILED: 'E041',
  TX_REJECTED: 'E042',

  // Account errors
  ACCOUNT_NOT_FOUND: 'E050',
  ACCOUNT_IMPORT_FAILED: 'E051',
  DERIVATION_FAILED: 'E052',

  // Network errors
  NETWORK_ERROR: 'E060',
  RPC_ERROR: 'E061',
  API_ERROR: 'E062',

  // Validation errors
  INVALID_ADDRESS: 'E070',
  INVALID_CHAIN: 'E071',
  INVALID_PARAMETERS: 'E072',

  // Multi-sig errors
  MULTISIG_INCOMPLETE: 'E080',
  MULTISIG_THRESHOLD_NOT_MET: 'E081',
  MULTISIG_INVALID_COSIGNER: 'E082',
} as const;

/**
 * Device Models
 */
export const DEVICE_MODELS = {
  KEYSTONE_3_PRO: {
    id: 'keystone-3-pro',
    name: 'Keystone 3 Pro',
    features: ['usb', 'qr', 'se', 'nfc', 'fingerprint'],
    maxFirmware: '2.0.0',
    usbSupport: true,
  },
  KEYSTONE_ESSENTIAL: {
    id: 'keystone-essential',
    name: 'Keystone Essential',
    features: ['qr', 'se'],
    maxFirmware: '2.0.0',
    usbSupport: false,
  },
  KEYSTONE_PRO: {
    id: 'keystone-pro',
    name: 'Keystone Pro',
    features: ['qr', 'se', 'fingerprint'],
    maxFirmware: '1.5.0',
    usbSupport: false,
  },
} as const;

/**
 * Connection Types
 */
export const CONNECTION_TYPES = {
  QR: 'qr',
  USB: 'usb',
  SDK: 'sdk',
} as const;

/**
 * Sign Request Types
 */
export const SIGN_REQUEST_TYPES = {
  TRANSACTION: 'transaction',
  MESSAGE: 'message',
  TYPED_DATA: 'typed-data',
  PSBT: 'psbt',
} as const;

/**
 * Message Encoding Types
 */
export const MESSAGE_ENCODING = {
  UTF8: 'utf8',
  HEX: 'hex',
  BASE64: 'base64',
} as const;
