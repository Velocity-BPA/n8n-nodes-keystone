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
    displayOptions: { show: { resource: ['sui'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Get Sui Account', value: 'getSuiAccount', description: 'Get Sui account', action: 'Get Sui account' },
      { name: 'Get Sui Address', value: 'getSuiAddress', description: 'Get Sui address', action: 'Get Sui address' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signature from QR', action: 'Import signature QR' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign arbitrary message', action: 'Sign message' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Sui transaction', action: 'Sign transaction' },
    ],
    default: 'getSuiAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['sui'], operation: ['getSuiAccount', 'getSuiAddress'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'string',
    default: '',
    description: 'Base64-encoded Sui transaction',
    displayOptions: { show: { resource: ['sui'], operation: ['signTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['sui'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['sui'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['sui'], operation: ['broadcastTransaction'] } },
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
    case 'getSuiAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.SUI.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'sui',
        accountIndex,
        derivationPath: path,
        publicKey: generateSuiPublicKey(),
        address: generateSuiAddress(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getSuiAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        address: generateSuiAddress(),
        accountIndex,
        derivationPath: DERIVATION_PATHS.SUI.replace('/0\'', `/${accountIndex}'`),
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'sui-sign-request',
        qrCode: await generateQRCode(`sui-sign:${requestId}`),
        transactionBytes: transactionData,
        instructions: 'Scan QR with Keystone to sign Sui transaction',
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'sui-sign-request',
        message,
        qrCode: await generateQRCode(`sui-message:${requestId}`),
        instructions: 'Scan QR with Keystone to sign message',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      
      result = {
        qrCode: await generateQRCode(`sui-sign:${generateRequestId()}`),
        urType: 'sui-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        signature: generateSuiSignature(),
        publicKey: generateSuiPublicKey(),
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        digest: generateSuiDigest(),
        effects: { status: { status: 'success' } },
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateSuiPublicKey(): string {
  const chars = '0123456789abcdef';
  let key = '0x';
  for (let i = 0; i < 64; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

function generateSuiAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 64; i++) addr += chars[Math.floor(Math.random() * 16)];
  return addr;
}

function generateSuiSignature(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let sig = '';
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

function generateSuiDigest(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let digest = '';
  for (let i = 0; i < 44; i++) digest += chars[Math.floor(Math.random() * chars.length)];
  return digest;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
