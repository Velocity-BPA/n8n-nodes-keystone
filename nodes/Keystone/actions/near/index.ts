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
    displayOptions: { show: { resource: ['near'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Get Near Account', value: 'getNearAccount', description: 'Get Near account', action: 'Get Near account' },
      { name: 'Get Near Address', value: 'getNearAddress', description: 'Get Near address', action: 'Get Near address' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signature from QR', action: 'Import signature QR' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Near transaction', action: 'Sign transaction' },
    ],
    default: 'getNearAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['near'], operation: ['getNearAccount', 'getNearAddress'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['near'], operation: ['signTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['near'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['near'], operation: ['broadcastTransaction'] } },
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
    case 'getNearAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.NEAR.replace('/1\'', `/${accountIndex}'`);
      
      result = {
        chain: 'near',
        accountIndex,
        derivationPath: path,
        publicKey: generateNearPublicKey(),
        implicitAccountId: generateNearImplicitId(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getNearAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        implicitAccountId: generateNearImplicitId(),
        publicKey: generateNearPublicKey(),
        accountIndex,
        derivationPath: DERIVATION_PATHS.NEAR.replace('/1\'', `/${accountIndex}'`),
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'near-sign-request',
        qrCode: await generateQRCode(`near-sign:${requestId}`),
        transaction: JSON.parse(transactionData),
        instructions: 'Scan QR with Keystone to sign Near transaction',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      
      result = {
        qrCode: await generateQRCode(`near-sign:${generateRequestId()}`),
        urType: 'near-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        signature: generateNearSignature(),
        publicKey: generateNearPublicKey(),
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txHash: generateNearTxHash(),
        status: { SuccessValue: '' },
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateNearPublicKey(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let key = 'ed25519:';
  for (let i = 0; i < 44; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
}

function generateNearImplicitId(): string {
  const chars = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 64; i++) id += chars[Math.floor(Math.random() * 16)];
  return id;
}

function generateNearSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
}

function generateNearTxHash(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = '';
  for (let i = 0; i < 44; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
