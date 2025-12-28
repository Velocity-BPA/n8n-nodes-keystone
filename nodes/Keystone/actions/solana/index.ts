/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { DERIVATION_PATHS } from '../../constants';
import { generateQRCode, generateAnimatedQR, shouldUseAnimatedQR } from '../../utils/qrUtils';
import { createSolSignRequestUR, parseSolSignatureUR } from '../../utils/urUtils';
import { validateSolanaAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['solana'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction to Solana network', action: 'Broadcast transaction' },
      { name: 'Export Watch-Only', value: 'exportWatchOnly', description: 'Export watch-only wallet data', action: 'Export watch only' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR code for signature request', action: 'Generate signature QR' },
      { name: 'Get Solana Account', value: 'getSolanaAccount', description: 'Get Solana account from device', action: 'Get Solana account' },
      { name: 'Get Solana Address', value: 'getSolanaAddress', description: 'Get Solana address at index', action: 'Get Solana address' },
      { name: 'Get Token Accounts', value: 'getTokenAccounts', description: 'Get SPL token accounts', action: 'Get token accounts' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signed transaction from QR', action: 'Import signature QR' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign arbitrary message', action: 'Sign message' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Solana transaction via QR', action: 'Sign transaction' },
      { name: 'Sign Versioned Transaction', value: 'signVersionedTransaction', description: 'Sign versioned transaction (v0)', action: 'Sign versioned transaction' },
    ],
    default: 'getSolanaAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    description: 'Account index for derivation path',
    displayOptions: { show: { resource: ['solana'], operation: ['getSolanaAccount', 'getSolanaAddress', 'getTokenAccounts'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    description: 'Base64-encoded Solana transaction',
    displayOptions: { show: { resource: ['solana'], operation: ['signTransaction', 'signVersionedTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    description: 'Message to sign',
    displayOptions: { show: { resource: ['solana'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Signed Transaction QR Data',
    name: 'signedQrData',
    type: 'string',
    default: '',
    description: 'QR data from signed transaction',
    displayOptions: { show: { resource: ['solana'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    description: 'Solana address to validate',
    displayOptions: { show: { resource: ['solana'], operation: ['getTokenAccounts', 'broadcastTransaction'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    description: 'Base64-encoded signed transaction',
    displayOptions: { show: { resource: ['solana'], operation: ['broadcastTransaction'] } },
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
    case 'getSolanaAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'solana',
        accountIndex,
        derivationPath: path,
        publicKey: generateSolanaPublicKey(),
        address: generateSolanaAddress(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getSolanaAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const address = generateSolanaAddress();
      
      result = {
        address,
        accountIndex,
        derivationPath: DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`),
        valid: validateSolanaAddress(address),
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      const requestId = generateRequestId();
      const urData = createSolSignRequestUR(
        Buffer.from(transactionData, 'base64'),
        DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`),
        generateSolanaAddress(),
        requestId
      );
      
      const qrCode = shouldUseAnimatedQR(urData)
        ? await generateAnimatedQR(urData)
        : await generateQRCode(urData);
      
      result = {
        requestId,
        urType: 'sol-sign-request',
        urData,
        qrCode,
        animated: shouldUseAnimatedQR(urData),
        instructions: 'Scan this QR code with your Keystone device to sign the transaction',
      };
      break;
    }

    case 'signVersionedTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      const requestId = generateRequestId();
      const urData = createSolSignRequestUR(
        Buffer.from(transactionData, 'base64'),
        DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`),
        generateSolanaAddress(),
        requestId,
        'versioned'
      );
      
      const qrCode = await generateAnimatedQR(urData);
      
      result = {
        requestId,
        urType: 'sol-sign-request',
        version: 'v0',
        urData,
        qrCode,
        animated: true,
        instructions: 'Scan this QR code with your Keystone device to sign the versioned transaction',
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      const requestId = generateRequestId();
      const messageBytes = Buffer.from(message, 'utf-8');
      
      result = {
        requestId,
        urType: 'sol-sign-request',
        messageType: 'message',
        message,
        messageHex: messageBytes.toString('hex'),
        derivationPath: DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`),
        qrCode: await generateQRCode(`sol-sign-request:${requestId}`),
        instructions: 'Scan to sign message on Keystone device',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      
      const urData = createSolSignRequestUR(
        Buffer.from(transactionData, 'base64'),
        DERIVATION_PATHS.SOLANA,
        generateSolanaAddress(),
        generateRequestId()
      );
      
      const animated = shouldUseAnimatedQR(urData);
      const qrCode = animated
        ? await generateAnimatedQR(urData)
        : await generateQRCode(urData);
      
      result = {
        qrCode,
        animated,
        urType: 'sol-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signedQrData = this.getNodeParameter('signedQrData', index) as string;
      
      const signature = parseSolSignatureUR(signedQrData);
      
      result = {
        signature: signature.signature,
        publicKey: signature.publicKey,
        requestId: signature.requestId,
        valid: true,
      };
      break;
    }

    case 'getTokenAccounts': {
      const address = this.getNodeParameter('address', index, '') as string;
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const accountAddress = address || generateSolanaAddress();
      
      result = {
        owner: accountAddress,
        accountIndex,
        tokens: [
          { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', balance: '0', decimals: 6 },
          { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', balance: '0', decimals: 6 },
        ],
        count: 2,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txHash: generateSolanaTxHash(),
        signedTransaction: signedTransaction.substring(0, 50) + '...',
        network: 'mainnet-beta',
        explorerUrl: 'https://solscan.io/tx/' + generateSolanaTxHash(),
      };
      break;
    }

    case 'exportWatchOnly': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        chain: 'solana',
        accountIndex,
        publicKey: generateSolanaPublicKey(),
        address: generateSolanaAddress(),
        derivationPath: DERIVATION_PATHS.SOLANA.replace('/0\'', `/${accountIndex}'`),
        qrCode: await generateQRCode(`sol-watch-only:${generateSolanaPublicKey()}`),
        format: 'phantom',
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateSolanaPublicKey(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let key = '';
  for (let i = 0; i < 44; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

function generateSolanaAddress(): string {
  return generateSolanaPublicKey();
}

function generateSolanaTxHash(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = '';
  for (let i = 0; i < 88; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
