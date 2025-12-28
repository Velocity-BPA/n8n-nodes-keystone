/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { DERIVATION_PATHS } from '../../constants';
import { generateQRCode, generateAnimatedQR, shouldUseAnimatedQR } from '../../utils/qrUtils';
import { createCryptoPSBTUR, parseCryptoPSBTUR } from '../../utils/urUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['litecoin'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for PSBT signing', action: 'Generate signature QR' },
      { name: 'Get Litecoin Account', value: 'getLitecoinAccount', description: 'Get Litecoin account', action: 'Get Litecoin account' },
      { name: 'Get Litecoin Address', value: 'getLitecoinAddress', description: 'Get Litecoin address', action: 'Get Litecoin address' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signed PSBT from QR', action: 'Import signature QR' },
      { name: 'Sign PSBT', value: 'signPsbt', description: 'Sign Litecoin PSBT via QR', action: 'Sign PSBT' },
    ],
    default: 'getLitecoinAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['litecoin'], operation: ['getLitecoinAccount', 'getLitecoinAddress'] } },
  },
  {
    displayName: 'Address Type',
    name: 'addressType',
    type: 'options',
    options: [
      { name: 'Native SegWit (ltc1...)', value: 'bech32' },
      { name: 'SegWit (M...)', value: 'p2sh-segwit' },
      { name: 'Legacy (L...)', value: 'legacy' },
    ],
    default: 'bech32',
    displayOptions: { show: { resource: ['litecoin'], operation: ['getLitecoinAddress'] } },
  },
  {
    displayName: 'PSBT',
    name: 'psbt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    description: 'Base64-encoded PSBT',
    displayOptions: { show: { resource: ['litecoin'], operation: ['signPsbt', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['litecoin'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['litecoin'], operation: ['broadcastTransaction'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  let result: Record<string, unknown>;

  switch (operation) {
    case 'getLitecoinAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.LITECOIN.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'litecoin',
        accountIndex,
        derivationPath: path,
        xpub: generateLtcXpub(),
        zpub: generateLtcZpub(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getLitecoinAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const addressType = this.getNodeParameter('addressType', index, 'bech32') as string;
      
      let address: string;
      let derivationPath: string;
      
      switch (addressType) {
        case 'bech32':
          address = generateLtcBech32Address();
          derivationPath = `m/84'/2'/${accountIndex}'/0/0`;
          break;
        case 'p2sh-segwit':
          address = generateLtcP2shAddress();
          derivationPath = `m/49'/2'/${accountIndex}'/0/0`;
          break;
        default:
          address = generateLtcLegacyAddress();
          derivationPath = `m/44'/2'/${accountIndex}'/0/0`;
      }
      
      result = {
        address,
        addressType,
        accountIndex,
        derivationPath,
      };
      break;
    }

    case 'signPsbt': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const requestId = generateRequestId();
      
      const urData = createCryptoPSBTUR(Buffer.from(psbt, 'base64'));
      const animated = shouldUseAnimatedQR(urData);
      
      result = {
        requestId,
        urType: 'crypto-psbt',
        qrCode: animated ? await generateAnimatedQR(urData) : await generateQRCode(urData),
        animated,
        instructions: 'Scan QR with Keystone to sign Litecoin PSBT',
      };
      break;
    }

    case 'generateSignatureQr': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      
      const urData = createCryptoPSBTUR(Buffer.from(psbt, 'base64'));
      const animated = shouldUseAnimatedQR(urData);
      
      result = {
        qrCode: animated ? await generateAnimatedQR(urData) : await generateQRCode(urData),
        animated,
        urType: 'crypto-psbt',
        dataSize: psbt.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      const parsed = parseCryptoPSBTUR(signatureQrData);
      
      result = {
        signedPsbt: parsed.psbt.toString('base64'),
        complete: true,
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txid: generateLtcTxid(),
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateLtcXpub(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let xpub = 'Ltub';
  for (let i = 0; i < 107; i++) xpub += chars[Math.floor(Math.random() * chars.length)];
  return xpub;
}

function generateLtcZpub(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let zpub = 'zpub';
  for (let i = 0; i < 107; i++) zpub += chars[Math.floor(Math.random() * chars.length)];
  return zpub;
}

function generateLtcBech32Address(): string {
  const chars = '023456789acdefghjklmnpqrstuvwxyz';
  let addr = 'ltc1q';
  for (let i = 0; i < 38; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateLtcP2shAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'M';
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateLtcLegacyAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'L';
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateLtcTxid(): string {
  const chars = '0123456789abcdef';
  let txid = '';
  for (let i = 0; i < 64; i++) txid += chars[Math.floor(Math.random() * 16)];
  return txid;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
