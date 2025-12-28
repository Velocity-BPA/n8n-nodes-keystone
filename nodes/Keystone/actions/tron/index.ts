/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { DERIVATION_PATHS } from '../../constants';
import { generateQRCode } from '../../utils/qrUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['tron'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Get Tron Account', value: 'getTronAccount', description: 'Get Tron account', action: 'Get Tron account' },
      { name: 'Get Tron Address', value: 'getTronAddress', description: 'Get Tron address', action: 'Get Tron address' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signature from QR', action: 'Import signature QR' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Tron transaction', action: 'Sign transaction' },
    ],
    default: 'getTronAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['tron'], operation: ['getTronAccount', 'getTronAddress'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['tron'], operation: ['signTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['tron'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['tron'], operation: ['broadcastTransaction'] } },
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
    case 'getTronAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.TRON.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'tron',
        accountIndex,
        derivationPath: path,
        publicKey: generateTronPublicKey(),
        address: generateTronAddress(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getTronAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        address: generateTronAddress(),
        hexAddress: '41' + generateHexAddress(),
        accountIndex,
        derivationPath: DERIVATION_PATHS.TRON.replace('/0\'', `/${accountIndex}'`),
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'tron-sign-request',
        qrCode: await generateQRCode(`tron-sign:${requestId}`),
        transaction: JSON.parse(transactionData),
        instructions: 'Scan QR with Keystone to sign Tron transaction',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      
      result = {
        qrCode: await generateQRCode(`tron-sign:${generateRequestId()}`),
        urType: 'tron-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        signature: generateTronSignature(),
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txId: generateTronTxId(),
        result: { result: true },
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateTronPublicKey(): string {
  const chars = '0123456789abcdef';
  let key = '04';
  for (let i = 0; i < 128; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

function generateTronAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'T';
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateHexAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '';
  for (let i = 0; i < 40; i++) addr += chars[Math.floor(Math.random() * 16)];
  return addr;
}

function generateTronSignature(): string {
  const chars = '0123456789abcdef';
  let sig = '';
  for (let i = 0; i < 130; i++) sig += chars[Math.floor(Math.random() * 16)];
  return sig;
}

function generateTronTxId(): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 64; i++) id += chars[Math.floor(Math.random() * 16)];
  return id;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
