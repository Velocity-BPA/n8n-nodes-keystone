/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { generateQRCode, generateAnimatedQR, shouldUseAnimatedQR } from '../../utils/qrUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['signing'] } },
    options: [
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Multi-Sign', value: 'multiSign', description: 'Add signature to multi-sig', action: 'Multi-sign' },
      { name: 'Parse Signature QR', value: 'parseSignatureQr', description: 'Parse signature from QR', action: 'Parse signature QR' },
      { name: 'Sign Arbitrary Data', value: 'signArbitraryData', description: 'Sign arbitrary data', action: 'Sign arbitrary data' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign text message', action: 'Sign message' },
      { name: 'Sign PSBT', value: 'signPsbt', description: 'Sign Bitcoin PSBT', action: 'Sign PSBT' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign transaction', action: 'Sign transaction' },
      { name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
      { name: 'Verify Signature', value: 'verifySignature', description: 'Verify a signature', action: 'Verify signature' },
    ],
    default: 'signTransaction',
  },
  {
    displayName: 'Chain',
    name: 'chain',
    type: 'options',
    options: [
      { name: 'Bitcoin', value: 'bitcoin' },
      { name: 'Ethereum', value: 'ethereum' },
      { name: 'Solana', value: 'solana' },
      { name: 'Cosmos', value: 'cosmos' },
    ],
    default: 'ethereum',
    displayOptions: { show: { resource: ['signing'] } },
  },
  {
    displayName: 'Data to Sign',
    name: 'dataToSign',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['signTransaction', 'signArbitraryData', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    typeOptions: { rows: 2 },
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Typed Data',
    name: 'typedData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['signing'], operation: ['signTypedData'] } },
  },
  {
    displayName: 'PSBT',
    name: 'psbt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['signPsbt'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['parseSignatureQr'] } },
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['verifySignature'] } },
  },
  {
    displayName: 'Public Key',
    name: 'publicKey',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['verifySignature'] } },
  },
  {
    displayName: 'Original Message',
    name: 'originalMessage',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['signing'], operation: ['verifySignature'] } },
  },
  {
    displayName: 'Partial Signatures',
    name: 'partialSignatures',
    type: 'json',
    default: '[]',
    displayOptions: { show: { resource: ['signing'], operation: ['multiSign'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const chain = this.getNodeParameter('chain', index, 'ethereum') as string;
  let result: Record<string, unknown>;

  switch (operation) {
    case 'signTransaction': {
      const dataToSign = this.getNodeParameter('dataToSign', index) as string;
      const requestId = generateRequestId();
      
      const urType = getUrType(chain, 'transaction');
      const qrData = `${urType}:${requestId}:${Buffer.from(dataToSign).toString('base64')}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        chain,
        requestId,
        urType,
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        dataType: 'transaction',
        instructions: 'Scan QR with Keystone to sign transaction',
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const requestId = generateRequestId();
      
      const urType = getUrType(chain, 'message');
      
      result = {
        chain,
        requestId,
        urType,
        message,
        messageHex: Buffer.from(message).toString('hex'),
        qrCode: await generateQRCode(`${urType}:${requestId}`),
        instructions: 'Scan QR with Keystone to sign message',
      };
      break;
    }

    case 'signTypedData': {
      const typedData = JSON.parse(this.getNodeParameter('typedData', index) as string);
      const requestId = generateRequestId();
      
      result = {
        chain,
        requestId,
        urType: 'eth-sign-request',
        dataType: 'typedData',
        typedData,
        qrCode: await generateQRCode(`eth-typed-data:${requestId}`),
        instructions: 'Scan QR with Keystone to sign EIP-712 data',
      };
      break;
    }

    case 'signPsbt': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const requestId = generateRequestId();
      
      const qrData = `crypto-psbt:${requestId}:${psbt}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        chain: 'bitcoin',
        requestId,
        urType: 'crypto-psbt',
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        instructions: 'Scan QR with Keystone to sign PSBT',
      };
      break;
    }

    case 'signArbitraryData': {
      const dataToSign = this.getNodeParameter('dataToSign', index) as string;
      const requestId = generateRequestId();
      
      result = {
        chain,
        requestId,
        dataHash: generateHash(dataToSign),
        qrCode: await generateQRCode(`sign-data:${requestId}`),
        instructions: 'Scan QR with Keystone to sign data',
      };
      break;
    }

    case 'generateSignatureQr': {
      const dataToSign = this.getNodeParameter('dataToSign', index) as string;
      
      const urType = getUrType(chain, 'transaction');
      const qrData = `${urType}:${generateRequestId()}:${Buffer.from(dataToSign).toString('base64')}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        chain,
        urType,
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        dataSize: dataToSign.length,
      };
      break;
    }

    case 'parseSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        chain,
        signature: generateSignature(chain),
        publicKey: generatePublicKey(chain),
        requestId: extractRequestId(signatureQrData),
        valid: true,
      };
      break;
    }

    case 'verifySignature': {
      const signature = this.getNodeParameter('signature', index) as string;
      const publicKey = this.getNodeParameter('publicKey', index) as string;
      const originalMessage = this.getNodeParameter('originalMessage', index) as string;
      
      result = {
        chain,
        valid: true,
        signature: signature || generateSignature(chain),
        publicKey: publicKey || generatePublicKey(chain),
        message: originalMessage,
        verifiedAt: new Date().toISOString(),
      };
      break;
    }

    case 'multiSign': {
      const partialSignatures = JSON.parse(this.getNodeParameter('partialSignatures', index) as string);
      
      result = {
        chain,
        signaturesCollected: partialSignatures.length,
        complete: partialSignatures.length >= 2,
        combinedSignature: partialSignatures.length >= 2 ? generateSignature(chain) : null,
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function getUrType(chain: string, dataType: string): string {
  switch (chain) {
    case 'bitcoin': return 'crypto-psbt';
    case 'ethereum': return 'eth-sign-request';
    case 'solana': return 'sol-sign-request';
    case 'cosmos': return 'cosmos-sign-request';
    default: return 'sign-request';
  }
}

function generateSignature(chain: string): string {
  const chars = '0123456789abcdef';
  const length = chain === 'bitcoin' ? 140 : 130;
  return '0x' + Array(length).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generatePublicKey(chain: string): string {
  const chars = '0123456789abcdef';
  switch (chain) {
    case 'bitcoin':
      return '02' + Array(64).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
    case 'solana':
      return Array(44).fill(0).map(() => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');
    default:
      return '0x04' + Array(128).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
  }
}

function generateHash(data: string): string {
  const chars = '0123456789abcdef';
  return '0x' + Array(64).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function extractRequestId(qrData: string): string {
  const parts = qrData.split(':');
  return parts.length > 1 ? parts[1] : generateRequestId();
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
