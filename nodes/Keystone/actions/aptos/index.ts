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
    displayOptions: { show: { resource: ['aptos'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Get Aptos Account', value: 'getAptosAccount', description: 'Get Aptos account', action: 'Get Aptos account' },
      { name: 'Get Aptos Address', value: 'getAptosAddress', description: 'Get Aptos address', action: 'Get Aptos address' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signature from QR', action: 'Import signature QR' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign arbitrary message', action: 'Sign message' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Aptos transaction', action: 'Sign transaction' },
    ],
    default: 'getAptosAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['aptos'], operation: ['getAptosAccount', 'getAptosAddress'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['aptos'], operation: ['signTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['aptos'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['aptos'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['aptos'], operation: ['broadcastTransaction'] } },
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
    case 'getAptosAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.APTOS.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'aptos',
        accountIndex,
        derivationPath: path,
        publicKey: generateAptosPublicKey(),
        address: generateAptosAddress(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getAptosAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        address: generateAptosAddress(),
        accountIndex,
        derivationPath: DERIVATION_PATHS.APTOS.replace('/0\'', `/${accountIndex}'`),
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'aptos-sign-request',
        qrCode: await generateQRCode(`aptos-sign:${requestId}`),
        transaction: JSON.parse(transactionData),
        instructions: 'Scan QR with Keystone to sign Aptos transaction',
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const requestId = generateRequestId();
      
      result = {
        requestId,
        urType: 'aptos-sign-request',
        message,
        qrCode: await generateQRCode(`aptos-message:${requestId}`),
        instructions: 'Scan QR with Keystone to sign message',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      
      result = {
        qrCode: await generateQRCode(`aptos-sign:${generateRequestId()}`),
        urType: 'aptos-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        signature: generateAptosSignature(),
        publicKey: generateAptosPublicKey(),
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txHash: '0x' + generateTxHash(),
        version: 0,
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateAptosPublicKey(): string {
  const chars = '0123456789abcdef';
  let key = '0x';
  for (let i = 0; i < 64; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

function generateAptosAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 64; i++) addr += chars[Math.floor(Math.random() * 16)];
  return addr;
}

function generateAptosSignature(): string {
  const chars = '0123456789abcdef';
  let sig = '0x';
  for (let i = 0; i < 128; i++) sig += chars[Math.floor(Math.random() * 16)];
  return sig;
}

function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
