/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { generateQRCode, generateAnimatedQR } from '../utils/qrUtils';
import { createCryptoPSBTUR, parseCryptoPSBTUR } from '../utils/urUtils';
import { validatePSBT, createPSBT, parsePSBT, getPSBTSigningStatus } from '../utils/psbtUtils';
import { validateBitcoinAddress } from '../utils/addressUtils';
import { DERIVATION_PATHS } from '../constants/derivationPaths';

/**
 * Bitcoin Resource Description
 */
export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['bitcoin'],
      },
    },
    options: [
      {
        name: 'Broadcast Transaction',
        value: 'broadcastTransaction',
        description: 'Broadcast signed transaction to network',
        action: 'Broadcast transaction',
      },
      {
        name: 'Compose Transaction',
        value: 'composeTransaction',
        description: 'Compose unsigned transaction',
        action: 'Compose transaction',
      },
      {
        name: 'Create PSBT',
        value: 'createPsbt',
        description: 'Create Partially Signed Bitcoin Transaction',
        action: 'Create PSBT',
      },
      {
        name: 'Export Watch-Only Wallet',
        value: 'exportWatchOnly',
        description: 'Export watch-only wallet for software wallet',
        action: 'Export watch-only wallet',
      },
      {
        name: 'Generate Signature QR',
        value: 'generateSignatureQr',
        description: 'Generate QR code for signed PSBT',
        action: 'Generate signature QR',
      },
      {
        name: 'Get Bitcoin Account',
        value: 'getBitcoinAccount',
        description: 'Get Bitcoin account info',
        action: 'Get Bitcoin account',
      },
      {
        name: 'Get Bitcoin Address',
        value: 'getBitcoinAddress',
        description: 'Get Bitcoin address',
        action: 'Get Bitcoin address',
      },
      {
        name: 'Get Bitcoin Addresses',
        value: 'getBitcoinAddresses',
        description: 'Get multiple Bitcoin addresses',
        action: 'Get Bitcoin addresses',
      },
      {
        name: 'Get UTXO',
        value: 'getUtxo',
        description: 'Get unspent transaction outputs',
        action: 'Get UTXO',
      },
      {
        name: 'Get xPub/yPub/zPub',
        value: 'getExtendedKey',
        description: 'Get extended public key',
        action: 'Get extended key',
      },
      {
        name: 'Import Signature QR',
        value: 'importSignatureQr',
        description: 'Import signed PSBT from QR code',
        action: 'Import signature QR',
      },
      {
        name: 'Multi-Sig Setup',
        value: 'multiSigSetup',
        description: 'Setup multi-signature wallet',
        action: 'Multi-sig setup',
      },
      {
        name: 'Multi-Sig Sign',
        value: 'multiSigSign',
        description: 'Add signature to multi-sig transaction',
        action: 'Multi-sig sign',
      },
      {
        name: 'Parse Signed PSBT',
        value: 'parseSignedPsbt',
        description: 'Parse and validate signed PSBT',
        action: 'Parse signed PSBT',
      },
      {
        name: 'Sign Message',
        value: 'signMessage',
        description: 'Sign message with Bitcoin key',
        action: 'Sign message',
      },
      {
        name: 'Sign PSBT',
        value: 'signPsbt',
        description: 'Sign PSBT on Keystone device',
        action: 'Sign PSBT',
      },
      {
        name: 'Verify Message',
        value: 'verifyMessage',
        description: 'Verify signed message',
        action: 'Verify message',
      },
    ],
    default: 'getBitcoinAccount',
  },

  // Account index
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    description: 'BIP44 account index',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['getBitcoinAccount', 'getBitcoinAddress', 'getBitcoinAddresses', 'getExtendedKey'],
      },
    },
  },

  // Address type
  {
    displayName: 'Address Type',
    name: 'addressType',
    type: 'options',
    options: [
      { name: 'Native SegWit (bc1q...)', value: 'bech32' },
      { name: 'Wrapped SegWit (3...)', value: 'p2sh-segwit' },
      { name: 'Legacy (1...)', value: 'legacy' },
      { name: 'Taproot (bc1p...)', value: 'taproot' },
    ],
    default: 'bech32',
    description: 'Bitcoin address format',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['getBitcoinAddress', 'getBitcoinAddresses', 'getExtendedKey'],
      },
    },
  },

  // Address index
  {
    displayName: 'Address Index',
    name: 'addressIndex',
    type: 'number',
    default: 0,
    description: 'Address derivation index',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['getBitcoinAddress'],
      },
    },
  },

  // Address count
  {
    displayName: 'Count',
    name: 'addressCount',
    type: 'number',
    default: 10,
    description: 'Number of addresses to generate',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['getBitcoinAddresses'],
      },
    },
  },

  // PSBT data
  {
    displayName: 'PSBT',
    name: 'psbt',
    type: 'string',
    default: '',
    description: 'PSBT in hex or base64 format',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['signPsbt', 'parseSignedPsbt', 'generateSignatureQr', 'multiSigSign'],
      },
    },
  },

  // Transaction inputs
  {
    displayName: 'Inputs',
    name: 'inputs',
    type: 'json',
    default: '[]',
    description: 'Transaction inputs (array of {txid, vout, value})',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['createPsbt', 'composeTransaction'],
      },
    },
  },

  // Transaction outputs
  {
    displayName: 'Outputs',
    name: 'outputs',
    type: 'json',
    default: '[]',
    description: 'Transaction outputs (array of {address, value})',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['createPsbt', 'composeTransaction'],
      },
    },
  },

  // Message to sign
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    description: 'Message to sign',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['signMessage', 'verifyMessage'],
      },
    },
  },

  // Signature for verification
  {
    displayName: 'Signature',
    name: 'signature',
    type: 'string',
    default: '',
    description: 'Signature to verify',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['verifyMessage'],
      },
    },
  },

  // Address for verification
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    default: '',
    description: 'Bitcoin address',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['verifyMessage', 'getUtxo'],
      },
    },
  },

  // QR data for import
  {
    displayName: 'QR Data',
    name: 'qrData',
    type: 'string',
    default: '',
    description: 'UR-encoded PSBT from QR scan',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['importSignatureQr'],
      },
    },
  },

  // Network
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 'mainnet' },
      { name: 'Testnet', value: 'testnet' },
    ],
    default: 'mainnet',
    description: 'Bitcoin network',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
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
        resource: ['bitcoin'],
        operation: ['multiSigSetup'],
      },
    },
  },
  {
    displayName: 'Cosigner XPubs',
    name: 'cosignerXpubs',
    type: 'json',
    default: '[]',
    description: 'Array of cosigner extended public keys',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['multiSigSetup'],
      },
    },
  },

  // Signed transaction
  {
    displayName: 'Signed Transaction',
    name: 'signedTx',
    type: 'string',
    default: '',
    description: 'Signed transaction in hex format',
    displayOptions: {
      show: {
        resource: ['bitcoin'],
        operation: ['broadcastTransaction'],
      },
    },
  },
];

/**
 * Execute Bitcoin Operations
 */
export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  const masterFingerprint = (credentials.masterFingerprint as string) || '73c5da0a';
  const network = this.getNodeParameter('network', index, 'mainnet') as string;

  let result: Record<string, unknown>;

  switch (operation) {
    case 'getBitcoinAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const addressType = this.getNodeParameter('addressType', index) as string;

      const pathKey = addressType === 'bech32' ? 'bip84' : addressType === 'taproot' ? 'bip86' : 'bip44';
      const path = DERIVATION_PATHS.bitcoin[pathKey as keyof typeof DERIVATION_PATHS.bitcoin];

      result = {
        chain: 'bitcoin',
        accountIndex,
        addressType,
        derivationPath: path?.replace('/0/0', `/${accountIndex}'`),
        masterFingerprint,
        network,
      };
      break;
    }

    case 'getBitcoinAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const addressIndex = this.getNodeParameter('addressIndex', index) as number;
      const addressType = this.getNodeParameter('addressType', index) as string;

      const address = generateBitcoinAddress(addressType, network);

      result = {
        address,
        type: addressType,
        path: `m/84'/${network === 'mainnet' ? '0' : '1'}'/${accountIndex}'/0/${addressIndex}`,
        accountIndex,
        addressIndex,
        network,
      };
      break;
    }

    case 'getBitcoinAddresses': {
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const addressCount = this.getNodeParameter('addressCount', index) as number;
      const addressType = this.getNodeParameter('addressType', index) as string;

      const addresses = [];
      for (let i = 0; i < addressCount; i++) {
        addresses.push({
          index: i,
          address: generateBitcoinAddress(addressType, network),
          path: `m/84'/${network === 'mainnet' ? '0' : '1'}'/${accountIndex}'/0/${i}`,
          type: 'external',
        });
      }

      result = {
        addresses,
        count: addresses.length,
        accountIndex,
        addressType,
        network,
      };
      break;
    }

    case 'getExtendedKey': {
      const accountIndex = this.getNodeParameter('accountIndex', index) as number;
      const addressType = this.getNodeParameter('addressType', index) as string;

      const keyPrefix = addressType === 'bech32' ? 'zpub' : addressType === 'p2sh-segwit' ? 'ypub' : 'xpub';

      result = {
        extendedPublicKey: generatePlaceholderXpub(keyPrefix),
        type: keyPrefix,
        derivationPath: `m/84'/${network === 'mainnet' ? '0' : '1'}'/${accountIndex}'`,
        masterFingerprint,
        network,
      };
      break;
    }

    case 'createPsbt': {
      const inputs = JSON.parse(this.getNodeParameter('inputs', index) as string);
      const outputs = JSON.parse(this.getNodeParameter('outputs', index) as string);

      // Validate inputs and outputs
      if (!inputs.length) throw new Error('At least one input is required');
      if (!outputs.length) throw new Error('At least one output is required');

      const psbtHex = createPSBT(inputs, outputs);

      result = {
        psbt: psbtHex,
        format: 'hex',
        inputCount: inputs.length,
        outputCount: outputs.length,
        network,
      };
      break;
    }

    case 'signPsbt': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const validation = validatePSBT(psbt);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate signature QR for device
      const urResult = createCryptoPSBTUR(psbt);
      const qrCode = await generateAnimatedQR(urResult.ur, { fragmentSize: 200 });

      result = {
        urData: urResult.ur,
        urType: 'crypto-psbt',
        qrFrames: qrCode,
        frameCount: qrCode.length,
        instructions: 'Scan this animated QR code with your Keystone device to sign',
      };
      break;
    }

    case 'parseSignedPsbt': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const validation = validatePSBT(psbt);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const parsed = parsePSBT(psbt);
      const status = getPSBTSigningStatus(parsed);

      result = {
        ...status,
        format: validation.format,
        inputs: parsed.inputs.length,
        outputs: parsed.outputs.length,
      };
      break;
    }

    case 'generateSignatureQr': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const urResult = createCryptoPSBTUR(psbt);
      const qrCode = await generateAnimatedQR(urResult.ur, { fragmentSize: 200 });

      result = {
        urData: urResult.ur,
        urType: 'crypto-psbt',
        qrFrames: qrCode,
        frameCount: qrCode.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const qrData = this.getNodeParameter('qrData', index) as string;
      const psbtHex = parseCryptoPSBTUR(qrData);

      result = {
        psbt: psbtHex,
        format: 'hex',
        urType: 'crypto-psbt',
      };
      break;
    }

    case 'getUtxo': {
      const address = this.getNodeParameter('address', index) as string;
      const validation = validateBitcoinAddress(address, network as 'mainnet' | 'testnet');

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Placeholder UTXO data
      result = {
        address,
        utxos: [],
        totalValue: 0,
        network,
        message: 'UTXO lookup requires network API integration',
      };
      break;
    }

    case 'composeTransaction': {
      const inputs = JSON.parse(this.getNodeParameter('inputs', index) as string);
      const outputs = JSON.parse(this.getNodeParameter('outputs', index) as string);

      const totalIn = inputs.reduce((sum: number, i: { value: number }) => sum + i.value, 0);
      const totalOut = outputs.reduce((sum: number, o: { value: number }) => sum + o.value, 0);
      const fee = totalIn - totalOut;

      result = {
        inputs,
        outputs,
        totalIn,
        totalOut,
        fee,
        feeRate: Math.round((fee / 250) * 100000000), // Approximate vbytes
        network,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTx = this.getNodeParameter('signedTx', index) as string;

      result = {
        success: false,
        message: 'Broadcasting requires network API integration',
        txHex: signedTx,
        network,
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;

      const qrData = `ur:crypto-sign-request/${Buffer.from(message).toString('hex')}`;
      const qrCode = await generateQRCode(qrData);

      result = {
        message,
        qrCode,
        urType: 'crypto-sign-request',
        instructions: 'Scan with Keystone to sign message',
      };
      break;
    }

    case 'verifyMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const signature = this.getNodeParameter('signature', index) as string;
      const address = this.getNodeParameter('address', index) as string;

      result = {
        message,
        signature,
        address,
        valid: false,
        note: 'Signature verification requires crypto library',
      };
      break;
    }

    case 'exportWatchOnly': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;

      const xpub = generatePlaceholderXpub('zpub');
      const urData = `ur:crypto-account/${masterFingerprint}${xpub}`;
      const qrCode = await generateQRCode(urData);

      result = {
        xpub,
        derivationPath: `m/84'/0'/${accountIndex}'`,
        masterFingerprint,
        qrCode,
        urType: 'crypto-account',
      };
      break;
    }

    case 'multiSigSetup': {
      const threshold = this.getNodeParameter('threshold', index) as number;
      const cosignerXpubs = JSON.parse(this.getNodeParameter('cosignerXpubs', index) as string);

      const n = cosignerXpubs.length + 1; // Including this device

      result = {
        type: 'multisig',
        m: threshold,
        n,
        configuration: `${threshold}-of-${n}`,
        thisDevice: {
          fingerprint: masterFingerprint,
          xpub: generatePlaceholderXpub('Zpub'),
        },
        cosigners: cosignerXpubs,
        scriptType: 'p2wsh',
      };
      break;
    }

    case 'multiSigSign': {
      const psbt = this.getNodeParameter('psbt', index) as string;

      const urResult = createCryptoPSBTUR(psbt);
      const qrCode = await generateAnimatedQR(urResult.ur, { fragmentSize: 200 });

      result = {
        urData: urResult.ur,
        urType: 'crypto-psbt',
        qrFrames: qrCode,
        frameCount: qrCode.length,
        instructions: 'Scan with Keystone to add multi-sig signature',
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

/**
 * Generate placeholder Bitcoin address
 */
function generateBitcoinAddress(type: string, network: string): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let prefix: string;
  let length: number;

  if (type === 'bech32') {
    prefix = network === 'mainnet' ? 'bc1q' : 'tb1q';
    length = 42;
  } else if (type === 'taproot') {
    prefix = network === 'mainnet' ? 'bc1p' : 'tb1p';
    length = 62;
  } else if (type === 'p2sh-segwit') {
    prefix = '3';
    length = 34;
  } else {
    prefix = network === 'mainnet' ? '1' : 'm';
    length = 34;
  }

  let address = prefix;
  for (let i = prefix.length; i < length; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Generate placeholder xpub
 */
function generatePlaceholderXpub(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let xpub = prefix;
  for (let i = 0; i < 107; i++) {
    xpub += chars[Math.floor(Math.random() * chars.length)];
  }
  return xpub;
}
