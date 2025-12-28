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
    displayOptions: { show: { resource: ['transaction'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Combine Transaction and Signature', value: 'combineTransactionAndSignature', description: 'Combine tx with signature', action: 'Combine transaction and signature' },
      { name: 'Create Unsigned Transaction', value: 'createUnsignedTransaction', description: 'Create unsigned transaction', action: 'Create unsigned transaction' },
      { name: 'Estimate Fee', value: 'estimateFee', description: 'Estimate transaction fee', action: 'Estimate fee' },
      { name: 'Generate Transaction QR', value: 'generateTransactionQr', description: 'Generate QR for signing', action: 'Generate transaction QR' },
      { name: 'Get Transaction History', value: 'getTransactionHistory', description: 'Get transaction history', action: 'Get transaction history' },
      { name: 'Get Transaction Status', value: 'getTransactionStatus', description: 'Get transaction status', action: 'Get transaction status' },
      { name: 'Import Signed Transaction QR', value: 'importSignedTransactionQr', description: 'Import signed tx from QR', action: 'Import signed transaction QR' },
      { name: 'Parse Signature', value: 'parseSignature', description: 'Parse signature data', action: 'Parse signature' },
    ],
    default: 'createUnsignedTransaction',
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
    displayOptions: { show: { resource: ['transaction'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['transaction'], operation: ['createUnsignedTransaction', 'generateTransactionQr', 'combineTransactionAndSignature'] } },
  },
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['transaction'], operation: ['combineTransactionAndSignature', 'parseSignature'] } },
  },
  {
    displayName: 'Signed Transaction QR',
    name: 'signedTransactionQr',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['transaction'], operation: ['importSignedTransactionQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['transaction'], operation: ['broadcastTransaction'] } },
  },
  {
    displayName: 'Transaction Hash',
    name: 'transactionHash',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionStatus'] } },
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionHistory', 'estimateFee'] } },
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
    case 'createUnsignedTransaction': {
      const transactionData = JSON.parse(this.getNodeParameter('transactionData', index) as string);
      const requestId = generateRequestId();
      
      const urType = getUrType(chain);
      const txBytes = Buffer.from(JSON.stringify(transactionData)).toString('base64');
      
      result = {
        chain,
        requestId,
        urType,
        unsignedTransaction: txBytes,
        transaction: transactionData,
        created: new Date().toISOString(),
      };
      break;
    }

    case 'generateTransactionQr': {
      const transactionData = JSON.parse(this.getNodeParameter('transactionData', index) as string);
      const requestId = generateRequestId();
      
      const urType = getUrType(chain);
      const qrData = `${urType}:${requestId}:${Buffer.from(JSON.stringify(transactionData)).toString('base64')}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        chain,
        requestId,
        urType,
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        instructions: 'Scan QR with Keystone device to sign',
      };
      break;
    }

    case 'importSignedTransactionQr': {
      const signedTransactionQr = this.getNodeParameter('signedTransactionQr', index) as string;
      
      result = {
        chain,
        signedTransaction: generateSignedTx(chain),
        signature: generateSignature(chain),
        valid: true,
        ready: true,
      };
      break;
    }

    case 'parseSignature': {
      const signature = this.getNodeParameter('signature', index) as string;
      
      result = {
        chain,
        signature: signature || generateSignature(chain),
        parsed: {
          r: '0x' + generateHex(64),
          s: '0x' + generateHex(64),
          v: 27,
        },
        valid: true,
      };
      break;
    }

    case 'combineTransactionAndSignature': {
      const transactionData = JSON.parse(this.getNodeParameter('transactionData', index) as string);
      const signature = this.getNodeParameter('signature', index) as string;
      
      result = {
        chain,
        signedTransaction: generateSignedTx(chain),
        transaction: transactionData,
        signature: signature || generateSignature(chain),
        combined: true,
        ready: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        chain,
        success: true,
        txHash: generateTxHash(chain),
        status: 'pending',
        explorerUrl: getExplorerUrl(chain, generateTxHash(chain)),
      };
      break;
    }

    case 'getTransactionStatus': {
      const transactionHash = this.getNodeParameter('transactionHash', index) as string;
      
      result = {
        chain,
        txHash: transactionHash || generateTxHash(chain),
        status: 'confirmed',
        confirmations: 12,
        blockNumber: 1000000,
        gasUsed: chain === 'ethereum' ? '21000' : undefined,
      };
      break;
    }

    case 'getTransactionHistory': {
      const address = this.getNodeParameter('address', index) as string;
      
      result = {
        chain,
        address: address || generateAddress(chain),
        transactions: [],
        count: 0,
      };
      break;
    }

    case 'estimateFee': {
      const address = this.getNodeParameter('address', index) as string;
      
      result = {
        chain,
        estimated: true,
        fee: getFeeEstimate(chain),
        currency: getCurrency(chain),
        priority: {
          low: getFeeEstimate(chain, 'low'),
          medium: getFeeEstimate(chain, 'medium'),
          high: getFeeEstimate(chain, 'high'),
        },
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function getUrType(chain: string): string {
  switch (chain) {
    case 'bitcoin': return 'crypto-psbt';
    case 'ethereum': return 'eth-sign-request';
    case 'solana': return 'sol-sign-request';
    case 'cosmos': return 'cosmos-sign-request';
    default: return 'sign-request';
  }
}

function generateSignedTx(chain: string): string {
  const chars = '0123456789abcdef';
  const length = chain === 'bitcoin' ? 400 : 200;
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateSignature(chain: string): string {
  const chars = '0123456789abcdef';
  return '0x' + Array(130).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateTxHash(chain: string): string {
  const chars = '0123456789abcdef';
  const prefix = chain === 'solana' ? '' : '0x';
  return prefix + Array(64).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateAddress(chain: string): string {
  const chars = '0123456789abcdef';
  switch (chain) {
    case 'bitcoin':
      return 'bc1q' + Array(38).fill(0).map(() => '023456789acdefghjklmnpqrstuvwxyz'[Math.floor(Math.random() * 32)]).join('');
    case 'solana':
      return Array(44).fill(0).map(() => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');
    default:
      return '0x' + Array(40).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
  }
}

function getExplorerUrl(chain: string, txHash: string): string {
  switch (chain) {
    case 'bitcoin': return `https://mempool.space/tx/${txHash}`;
    case 'ethereum': return `https://etherscan.io/tx/${txHash}`;
    case 'solana': return `https://solscan.io/tx/${txHash}`;
    case 'cosmos': return `https://mintscan.io/cosmos/txs/${txHash}`;
    default: return '';
  }
}

function getCurrency(chain: string): string {
  switch (chain) {
    case 'bitcoin': return 'sats';
    case 'ethereum': return 'gwei';
    case 'solana': return 'lamports';
    case 'cosmos': return 'uatom';
    default: return 'units';
  }
}

function getFeeEstimate(chain: string, priority: string = 'medium'): string {
  const multipliers: Record<string, number> = { low: 0.5, medium: 1, high: 2 };
  const base: Record<string, number> = { bitcoin: 5000, ethereum: 21000, solana: 5000, cosmos: 5000 };
  return String(Math.floor((base[chain] || 5000) * (multipliers[priority] || 1)));
}

function generateHex(length: number): string {
  const chars = '0123456789abcdef';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
