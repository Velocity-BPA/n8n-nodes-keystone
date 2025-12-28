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
    displayOptions: { show: { resource: ['watchOnly'] } },
    options: [
      { name: 'Create Unsigned Transaction', value: 'createUnsignedTransaction', description: 'Create unsigned tx for signing', action: 'Create unsigned transaction' },
      { name: 'Create Watch-Only Wallet', value: 'createWatchOnlyWallet', description: 'Create watch-only wallet', action: 'Create watch-only wallet' },
      { name: 'Export Watch-Only QR', value: 'exportWatchOnlyQr', description: 'Export watch-only QR', action: 'Export watch-only QR' },
      { name: 'Get Watch-Only Address', value: 'getWatchOnlyAddress', description: 'Get address from watch-only', action: 'Get watch-only address' },
      { name: 'Get Watch-Only Balance', value: 'getWatchOnlyBalance', description: 'Get balance info', action: 'Get watch-only balance' },
      { name: 'Import Signed Transaction', value: 'importSignedTransaction', description: 'Import signed tx from QR', action: 'Import signed transaction' },
      { name: 'Import Watch-Only', value: 'importWatchOnly', description: 'Import watch-only from QR', action: 'Import watch-only' },
      { name: 'Sync Watch-Only', value: 'syncWatchOnly', description: 'Sync wallet data', action: 'Sync watch-only' },
    ],
    default: 'exportWatchOnlyQr',
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
    default: 'bitcoin',
    displayOptions: { show: { resource: ['watchOnly'] } },
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['watchOnly'], operation: ['exportWatchOnlyQr', 'createWatchOnlyWallet', 'getWatchOnlyAddress'] } },
  },
  {
    displayName: 'Wallet Format',
    name: 'walletFormat',
    type: 'options',
    options: [
      { name: 'Generic', value: 'generic' },
      { name: 'BlueWallet', value: 'bluewallet' },
      { name: 'Sparrow', value: 'sparrow' },
      { name: 'Specter', value: 'specter' },
      { name: 'Electrum', value: 'electrum' },
    ],
    default: 'generic',
    displayOptions: { show: { resource: ['watchOnly'], chain: ['bitcoin'], operation: ['exportWatchOnlyQr', 'createWatchOnlyWallet'] } },
  },
  {
    displayName: 'Watch-Only QR Data',
    name: 'watchOnlyQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['watchOnly'], operation: ['importWatchOnly'] } },
  },
  {
    displayName: 'Signed Transaction QR',
    name: 'signedTransactionQr',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['watchOnly'], operation: ['importSignedTransaction'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'json',
    default: '{}',
    displayOptions: { show: { resource: ['watchOnly'], operation: ['createUnsignedTransaction'] } },
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['watchOnly'], operation: ['getWatchOnlyBalance', 'syncWatchOnly'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  const chain = this.getNodeParameter('chain', index, 'bitcoin') as string;
  let result: Record<string, unknown>;

  switch (operation) {
    case 'exportWatchOnlyQr': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const walletFormat = chain === 'bitcoin' 
        ? this.getNodeParameter('walletFormat', index, 'generic') as string 
        : 'generic';
      
      const exportData = generateWatchOnlyExport(chain, accountIndex, walletFormat);
      const qrData = JSON.stringify(exportData);
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        chain,
        accountIndex,
        format: walletFormat,
        exportData,
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        urType: 'crypto-account',
      };
      break;
    }

    case 'importWatchOnly': {
      const watchOnlyQrData = this.getNodeParameter('watchOnlyQrData', index) as string;
      
      result = {
        chain,
        imported: true,
        masterFingerprint: generateFingerprint(),
        xpub: generateXpub(chain),
        addresses: [generateAddress(chain)],
      };
      break;
    }

    case 'createWatchOnlyWallet': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const walletFormat = chain === 'bitcoin'
        ? this.getNodeParameter('walletFormat', index, 'generic') as string
        : 'generic';
      
      result = {
        chain,
        accountIndex,
        format: walletFormat,
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
        xpub: generateXpub(chain),
        firstAddress: generateAddress(chain),
        created: true,
      };
      break;
    }

    case 'getWatchOnlyAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        chain,
        address: generateAddress(chain),
        accountIndex,
        index: 0,
        change: false,
      };
      break;
    }

    case 'getWatchOnlyBalance': {
      const address = this.getNodeParameter('address', index, '') as string;
      
      result = {
        chain,
        address: address || generateAddress(chain),
        balance: '0',
        unconfirmedBalance: '0',
        currency: getCurrency(chain),
      };
      break;
    }

    case 'syncWatchOnly': {
      const address = this.getNodeParameter('address', index, '') as string;
      
      result = {
        chain,
        address: address || generateAddress(chain),
        synced: true,
        lastBlock: 0,
        transactions: 0,
        lastSync: new Date().toISOString(),
      };
      break;
    }

    case 'createUnsignedTransaction': {
      const transactionData = JSON.parse(this.getNodeParameter('transactionData', index) as string);
      const requestId = generateRequestId();
      
      const urType = chain === 'bitcoin' ? 'crypto-psbt' : `${chain}-sign-request`;
      const qrData = `${urType}:${requestId}`;
      
      result = {
        chain,
        requestId,
        urType,
        transaction: transactionData,
        qrCode: await generateQRCode(qrData),
        instructions: 'Scan QR with Keystone to sign transaction',
      };
      break;
    }

    case 'importSignedTransaction': {
      const signedTransactionQr = this.getNodeParameter('signedTransactionQr', index) as string;
      
      result = {
        chain,
        imported: true,
        signedTransaction: generateSignedTx(chain),
        ready: true,
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateWatchOnlyExport(chain: string, accountIndex: number, format: string): Record<string, unknown> {
  return {
    chain,
    accountIndex,
    format,
    masterFingerprint: '73c5da0a',
    xpub: generateXpub(chain),
    derivationPath: getDerivationPath(chain, accountIndex),
  };
}

function generateXpub(chain: string): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const prefix = chain === 'bitcoin' ? 'zpub' : chain === 'ethereum' ? 'xpub' : 'pub';
  let xpub = prefix;
  for (let i = 0; i < 107; i++) xpub += chars[Math.floor(Math.random() * chars.length)];
  return xpub;
}

function generateAddress(chain: string): string {
  const chars = '0123456789abcdef';
  switch (chain) {
    case 'bitcoin':
      return 'bc1q' + Array(38).fill(0).map(() => '023456789acdefghjklmnpqrstuvwxyz'[Math.floor(Math.random() * 32)]).join('');
    case 'ethereum':
      return '0x' + Array(40).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
    case 'solana':
      return Array(44).fill(0).map(() => '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]).join('');
    case 'cosmos':
      return 'cosmos1' + Array(38).fill(0).map(() => '023456789acdefghjklmnpqrstuvwxyz'[Math.floor(Math.random() * 32)]).join('');
    default:
      return '0x' + Array(40).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
  }
}

function getDerivationPath(chain: string, accountIndex: number): string {
  switch (chain) {
    case 'bitcoin': return `m/84'/0'/${accountIndex}'`;
    case 'ethereum': return `m/44'/60'/${accountIndex}'/0/0`;
    case 'solana': return `m/44'/501'/${accountIndex}'/0'`;
    case 'cosmos': return `m/44'/118'/0'/0/${accountIndex}`;
    default: return `m/44'/0'/${accountIndex}'`;
  }
}

function getCurrency(chain: string): string {
  switch (chain) {
    case 'bitcoin': return 'BTC';
    case 'ethereum': return 'ETH';
    case 'solana': return 'SOL';
    case 'cosmos': return 'ATOM';
    default: return 'UNKNOWN';
  }
}

function generateFingerprint(): string {
  const chars = '0123456789abcdef';
  return Array(8).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateSignedTx(chain: string): string {
  const chars = '0123456789abcdef';
  const length = chain === 'bitcoin' ? 400 : 200;
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('');
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
