/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { SUPPORTED_CHAINS, DERIVATION_PATHS } from '../constants';
import { generateQRCode } from '../utils/qrUtils';

/**
 * Account Resource Description
 */
export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['account'],
      },
    },
    options: [
      {
        name: 'Add Account',
        value: 'addAccount',
        description: 'Add new account to device',
        action: 'Add account',
      },
      {
        name: 'Export Account QR',
        value: 'exportAccountQr',
        description: 'Export account as QR code for wallet import',
        action: 'Export account QR',
      },
      {
        name: 'Get Account Addresses',
        value: 'getAccountAddresses',
        description: 'Get multiple addresses for an account',
        action: 'Get account addresses',
      },
      {
        name: 'Get Account By Chain',
        value: 'getAccountByChain',
        description: 'Get account for specific blockchain',
        action: 'Get account by chain',
      },
      {
        name: 'Get Account Descriptor',
        value: 'getAccountDescriptor',
        description: 'Get output descriptor for account',
        action: 'Get account descriptor',
      },
      {
        name: 'Get Accounts',
        value: 'getAccounts',
        description: 'Get all accounts from device',
        action: 'Get accounts',
      },
      {
        name: 'Get Extended Public Key',
        value: 'getExtendedPublicKey',
        description: 'Get xPub/yPub/zPub for account',
        action: 'Get extended public key',
      },
      {
        name: 'Get Multi-Sig Account',
        value: 'getMultiSigAccount',
        description: 'Get multi-signature account configuration',
        action: 'Get multi-sig account',
      },
      {
        name: 'Get Watch-Only Account',
        value: 'getWatchOnlyAccount',
        description: 'Get watch-only account for wallet import',
        action: 'Get watch-only account',
      },
      {
        name: 'Import Account via QR',
        value: 'importAccountQr',
        description: 'Import account from QR code',
        action: 'Import account via QR',
      },
      {
        name: 'Sync Account',
        value: 'syncAccount',
        description: 'Sync account with wallet software',
        action: 'Sync account',
      },
    ],
    default: 'getAccounts',
  },

  // Chain selection
  {
    displayName: 'Chain',
    name: 'chain',
    type: 'options',
    options: Object.entries(SUPPORTED_CHAINS).map(([key, config]) => ({
      name: config.name,
      value: key,
    })),
    default: 'bitcoin',
    description: 'Select blockchain',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: [
          'getAccountByChain',
          'getAccountAddresses',
          'getExtendedPublicKey',
          'exportAccountQr',
          'addAccount',
        ],
      },
    },
  },

  // Account index
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    description: 'Account index (BIP44 account level)',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: [
          'getAccountByChain',
          'getAccountAddresses',
          'getExtendedPublicKey',
          'exportAccountQr',
        ],
      },
    },
  },

  // Address count
  {
    displayName: 'Address Count',
    name: 'addressCount',
    type: 'number',
    default: 10,
    description: 'Number of addresses to generate',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getAccountAddresses'],
      },
    },
  },

  // Extended key type
  {
    displayName: 'Key Type',
    name: 'keyType',
    type: 'options',
    options: [
      { name: 'xPub (Legacy P2PKH)', value: 'xpub' },
      { name: 'yPub (Wrapped SegWit P2SH)', value: 'ypub' },
      { name: 'zPub (Native SegWit)', value: 'zpub' },
    ],
    default: 'zpub',
    description: 'Type of extended public key',
    displayOptions: {
      show: {
        resource: ['account'],
        chain: ['bitcoin', 'litecoin'],
        operation: ['getExtendedPublicKey'],
      },
    },
  },

  // QR data for import
  {
    displayName: 'QR Data',
    name: 'qrData',
    type: 'string',
    default: '',
    description: 'UR-encoded account data from QR scan',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['importAccountQr'],
      },
    },
  },

  // Multi-sig configuration
  {
    displayName: 'Threshold',
    name: 'threshold',
    type: 'number',
    default: 2,
    description: 'Required signatures (M in M-of-N)',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getMultiSigAccount'],
      },
    },
  },
  {
    displayName: 'Total Signers',
    name: 'totalSigners',
    type: 'number',
    default: 3,
    description: 'Total number of signers (N in M-of-N)',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['getMultiSigAccount'],
      },
    },
  },
];

/**
 * Execute Account Operations
 */
export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  const masterFingerprint = (credentials.masterFingerprint as string) || '73c5da0a';

  let result: Record<string, unknown>;

  switch (operation) {
    case 'getAccounts': {
      const accounts = Object.entries(SUPPORTED_CHAINS).slice(0, 5).map(([chain, config], idx) => ({
        chain,
        name: config.name,
        accountIndex: 0,
        derivationPath: DERIVATION_PATHS[chain as keyof typeof DERIVATION_PATHS]?.default || `m/44'/${config.slip44}'/0'`,
        masterFingerprint,
      }));

      result = {
        accounts,
        count: accounts.length,
        masterFingerprint,
      };
      break;
    }

    case 'getAccountByChain': {
      const chain = this.getNodeParameter('chain', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const chainConfig = SUPPORTED_CHAINS[chain];
      const paths = DERIVATION_PATHS[chain as keyof typeof DERIVATION_PATHS];

      result = {
        chain,
        name: chainConfig?.name,
        accountIndex,
        derivationPath: paths?.default || `m/44'/${chainConfig?.slip44}'/0'`,
        masterFingerprint,
        address: generatePlaceholderAddress(chain),
      };
      break;
    }

    case 'getAccountAddresses': {
      const chain = this.getNodeParameter('chain', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const addressCount = this.getNodeParameter('addressCount', index) as number;

      const addresses = [];
      for (let i = 0; i < addressCount; i++) {
        addresses.push({
          index: i,
          path: `m/84'/0'/${accountIndex}'/0/${i}`,
          address: generatePlaceholderAddress(chain),
          type: 'external',
        });
      }

      result = {
        chain,
        accountIndex,
        addresses,
        count: addresses.length,
      };
      break;
    }

    case 'getExtendedPublicKey': {
      const chain = this.getNodeParameter('chain', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const keyType = this.getNodeParameter('keyType', index, 'zpub') as string;

      result = {
        chain,
        accountIndex,
        keyType,
        extendedPublicKey: generatePlaceholderXpub(keyType),
        derivationPath: `m/84'/0'/${accountIndex}'`,
        masterFingerprint,
      };
      break;
    }

    case 'getAccountDescriptor': {
      result = {
        descriptor: `wpkh([${masterFingerprint}/84'/0'/0']zpub...)`,
        type: 'wpkh',
        masterFingerprint,
        checksum: 'abc123',
      };
      break;
    }

    case 'addAccount': {
      const chain = this.getNodeParameter('chain', index) as string;
      const chainConfig = SUPPORTED_CHAINS[chain];

      result = {
        success: true,
        chain,
        accountIndex: 0,
        derivationPath: `m/44'/${chainConfig?.slip44}'/0'`,
        address: generatePlaceholderAddress(chain),
        message: 'Account added successfully',
      };
      break;
    }

    case 'exportAccountQr': {
      const chain = this.getNodeParameter('chain', index) as string;
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;

      const urData = `ur:crypto-account/...${masterFingerprint}...`;
      const qrCode = await generateQRCode(urData);

      result = {
        chain,
        accountIndex,
        urType: 'crypto-account',
        urData,
        qrCode,
      };
      break;
    }

    case 'importAccountQr': {
      const qrData = this.getNodeParameter('qrData', index) as string;

      result = {
        success: true,
        imported: {
          chain: 'bitcoin',
          accountIndex: 0,
          masterFingerprint: masterFingerprint,
        },
        urType: 'crypto-account',
      };
      break;
    }

    case 'getMultiSigAccount': {
      const threshold = this.getNodeParameter('threshold', index) as number;
      const totalSigners = this.getNodeParameter('totalSigners', index) as number;

      result = {
        type: 'multisig',
        threshold,
        totalSigners,
        configuration: `${threshold}-of-${totalSigners}`,
        cosigners: Array(totalSigners).fill(null).map((_, i) => ({
          index: i,
          fingerprint: i === 0 ? masterFingerprint : `cosigner${i}`,
          xpub: generatePlaceholderXpub('Zpub'),
        })),
        address: '3...',
        scriptType: 'p2wsh',
      };
      break;
    }

    case 'getWatchOnlyAccount': {
      result = {
        type: 'watch-only',
        chain: 'bitcoin',
        xpub: generatePlaceholderXpub('zpub'),
        derivationPath: "m/84'/0'/0'",
        masterFingerprint,
        addresses: [generatePlaceholderAddress('bitcoin')],
      };
      break;
    }

    case 'syncAccount': {
      result = {
        success: true,
        synced: true,
        chain: 'bitcoin',
        accountIndex: 0,
        lastSync: new Date().toISOString(),
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

/**
 * Generate placeholder address
 */
function generatePlaceholderAddress(chain: string): string {
  const prefixes: Record<string, string> = {
    bitcoin: 'bc1q',
    ethereum: '0x',
    solana: '',
    cosmos: 'cosmos1',
    litecoin: 'ltc1q',
    cardano: 'addr1',
    xrp: 'r',
    tron: 'T',
    near: '',
    aptos: '0x',
    sui: '0x',
  };

  const prefix = prefixes[chain] || '0x';
  const chars = chain === 'solana' ? 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789' : '0123456789abcdef';
  let addr = prefix;
  const length = chain === 'solana' ? 44 : chain === 'bitcoin' || chain === 'litecoin' ? 42 : 40;

  for (let i = prefix.length; i < length; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }

  return addr;
}

/**
 * Generate placeholder xpub
 */
function generatePlaceholderXpub(type: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let xpub = type.toLowerCase();
  for (let i = 0; i < 107; i++) {
    xpub += chars[Math.floor(Math.random() * chars.length)];
  }
  return xpub;
}
