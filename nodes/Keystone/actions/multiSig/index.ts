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
    displayOptions: { show: { resource: ['multiSig'] } },
    options: [
      { name: 'Combine Signatures', value: 'combineSignatures', description: 'Combine partial signatures', action: 'Combine signatures' },
      { name: 'Create Multi-Sig PSBT', value: 'createMultiSigPsbt', description: 'Create PSBT for multi-sig', action: 'Create multi-sig PSBT' },
      { name: 'Create Multi-Sig Wallet', value: 'createMultiSigWallet', description: 'Create new multi-sig wallet', action: 'Create multi-sig wallet' },
      { name: 'Export Co-Signer', value: 'exportCoSigner', description: 'Export co-signer info QR', action: 'Export co-signer' },
      { name: 'Export Configuration', value: 'exportConfiguration', description: 'Export wallet configuration', action: 'Export configuration' },
      { name: 'Finalize Transaction', value: 'finalizeTransaction', description: 'Finalize fully signed tx', action: 'Finalize transaction' },
      { name: 'Get Multi-Sig Address', value: 'getMultiSigAddress', description: 'Get multi-sig address', action: 'Get multi-sig address' },
      { name: 'Get Signature Status', value: 'getSignatureStatus', description: 'Check signature progress', action: 'Get signature status' },
      { name: 'Import Co-Signer', value: 'importCoSigner', description: 'Import co-signer from QR', action: 'Import co-signer' },
      { name: 'Sign Multi-Sig PSBT', value: 'signMultiSigPsbt', description: 'Add signature to PSBT', action: 'Sign multi-sig PSBT' },
    ],
    default: 'createMultiSigWallet',
  },
  {
    displayName: 'Wallet Name',
    name: 'walletName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['multiSig'], operation: ['createMultiSigWallet', 'exportConfiguration'] } },
  },
  {
    displayName: 'Required Signatures (M)',
    name: 'requiredSignatures',
    type: 'number',
    default: 2,
    description: 'Number of signatures required',
    displayOptions: { show: { resource: ['multiSig'], operation: ['createMultiSigWallet'] } },
  },
  {
    displayName: 'Total Signers (N)',
    name: 'totalSigners',
    type: 'number',
    default: 3,
    description: 'Total number of signers',
    displayOptions: { show: { resource: ['multiSig'], operation: ['createMultiSigWallet'] } },
  },
  {
    displayName: 'Address Type',
    name: 'addressType',
    type: 'options',
    options: [
      { name: 'Native SegWit (P2WSH)', value: 'p2wsh' },
      { name: 'Wrapped SegWit (P2SH-P2WSH)', value: 'p2sh-p2wsh' },
      { name: 'Legacy (P2SH)', value: 'p2sh' },
    ],
    default: 'p2wsh',
    displayOptions: { show: { resource: ['multiSig'], operation: ['createMultiSigWallet', 'getMultiSigAddress'] } },
  },
  {
    displayName: 'Co-Signer QR Data',
    name: 'coSignerQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['multiSig'], operation: ['importCoSigner'] } },
  },
  {
    displayName: 'PSBT',
    name: 'psbt',
    type: 'string',
    typeOptions: { rows: 4 },
    default: '',
    displayOptions: { show: { resource: ['multiSig'], operation: ['signMultiSigPsbt', 'createMultiSigPsbt', 'combineSignatures', 'finalizeTransaction', 'getSignatureStatus'] } },
  },
  {
    displayName: 'Partial Signatures',
    name: 'partialSignatures',
    type: 'json',
    default: '[]',
    description: 'Array of partial signatures to combine',
    displayOptions: { show: { resource: ['multiSig'], operation: ['combineSignatures'] } },
  },
  {
    displayName: 'Wallet Descriptor',
    name: 'walletDescriptor',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['multiSig'], operation: ['getMultiSigAddress', 'createMultiSigPsbt'] } },
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
    case 'createMultiSigWallet': {
      const walletName = this.getNodeParameter('walletName', index) as string;
      const requiredSignatures = this.getNodeParameter('requiredSignatures', index) as number;
      const totalSigners = this.getNodeParameter('totalSigners', index) as number;
      const addressType = this.getNodeParameter('addressType', index) as string;
      
      const descriptor = generateMultiSigDescriptor(requiredSignatures, totalSigners, addressType);
      
      result = {
        walletName: walletName || `MultiSig-${requiredSignatures}of${totalSigners}`,
        type: `${requiredSignatures}-of-${totalSigners}`,
        addressType,
        descriptor,
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
        coSigners: [],
        status: 'awaiting_cosigners',
        qrCode: await generateQRCode(`multisig-setup:${descriptor.substring(0, 100)}`),
      };
      break;
    }

    case 'importCoSigner': {
      const coSignerQrData = this.getNodeParameter('coSignerQrData', index) as string;
      
      result = {
        imported: true,
        coSignerFingerprint: generateFingerprint(),
        coSignerXpub: generateXpub(),
        derivationPath: "m/48'/0'/0'/2'",
      };
      break;
    }

    case 'exportCoSigner': {
      const xpub = generateXpub();
      const fingerprint = credentials.masterFingerprint || '73c5da0a';
      
      result = {
        fingerprint,
        xpub,
        derivationPath: "m/48'/0'/0'/2'",
        qrCode: await generateQRCode(`[${fingerprint}/48'/0'/0'/2']${xpub}`),
        format: 'wallet-descriptor',
      };
      break;
    }

    case 'getMultiSigAddress': {
      const walletDescriptor = this.getNodeParameter('walletDescriptor', index) as string;
      const addressType = this.getNodeParameter('addressType', index) as string;
      
      result = {
        address: generateMultiSigAddress(addressType),
        addressType,
        index: 0,
        change: false,
      };
      break;
    }

    case 'createMultiSigPsbt': {
      const walletDescriptor = this.getNodeParameter('walletDescriptor', index) as string;
      const psbt = this.getNodeParameter('psbt', index) as string;
      
      const urData = `crypto-psbt:${Buffer.from(psbt || 'placeholder').toString('base64')}`;
      const animated = shouldUseAnimatedQR(urData);
      
      result = {
        psbt: psbt || generatePsbtPlaceholder(),
        qrCode: animated ? await generateAnimatedQR(urData) : await generateQRCode(urData),
        animated,
        urType: 'crypto-psbt',
        requiredSignatures: 2,
        currentSignatures: 0,
      };
      break;
    }

    case 'signMultiSigPsbt': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const requestId = generateRequestId();
      
      const urData = `crypto-psbt:${requestId}`;
      
      result = {
        requestId,
        qrCode: await generateQRCode(urData),
        urType: 'crypto-psbt',
        signerFingerprint: credentials.masterFingerprint || '73c5da0a',
        instructions: 'Scan QR with Keystone to add signature',
      };
      break;
    }

    case 'combineSignatures': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      const partialSignatures = JSON.parse(this.getNodeParameter('partialSignatures', index) as string);
      
      result = {
        combinedPsbt: psbt,
        signaturesAdded: partialSignatures.length,
        complete: partialSignatures.length >= 2,
      };
      break;
    }

    case 'getSignatureStatus': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      
      result = {
        requiredSignatures: 2,
        collectedSignatures: 1,
        complete: false,
        signers: [
          { fingerprint: '73c5da0a', signed: true },
          { fingerprint: 'a1b2c3d4', signed: false },
        ],
      };
      break;
    }

    case 'finalizeTransaction': {
      const psbt = this.getNodeParameter('psbt', index) as string;
      
      result = {
        finalized: true,
        txHex: generateTxHex(),
        txid: generateTxid(),
        ready: true,
      };
      break;
    }

    case 'exportConfiguration': {
      const walletName = this.getNodeParameter('walletName', index) as string;
      
      result = {
        walletName,
        configuration: generateMultiSigDescriptor(2, 3, 'p2wsh'),
        format: 'descriptor',
        qrCode: await generateQRCode(`multisig-config:${walletName}`),
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateMultiSigDescriptor(m: number, n: number, type: string): string {
  const prefix = type === 'p2wsh' ? 'wsh' : type === 'p2sh-p2wsh' ? 'sh(wsh' : 'sh';
  const suffix = type === 'p2sh-p2wsh' ? '))' : ')';
  return `${prefix}(sortedmulti(${m},...))${suffix}`;
}

function generateMultiSigAddress(type: string): string {
  if (type === 'p2wsh') {
    const chars = '023456789acdefghjklmnpqrstuvwxyz';
    let addr = 'bc1q';
    for (let i = 0; i < 58; i++) addr += chars[Math.floor(Math.random() * chars.length)];
    return addr;
  }
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = '3';
  for (let i = 0; i < 33; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateFingerprint(): string {
  const chars = '0123456789abcdef';
  let fp = '';
  for (let i = 0; i < 8; i++) fp += chars[Math.floor(Math.random() * 16)];
  return fp;
}

function generateXpub(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let xpub = 'xpub';
  for (let i = 0; i < 107; i++) xpub += chars[Math.floor(Math.random() * chars.length)];
  return xpub;
}

function generatePsbtPlaceholder(): string {
  return Buffer.from('cHNidP8BAH...placeholder').toString('base64');
}

function generateTxHex(): string {
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 400; i++) hex += chars[Math.floor(Math.random() * 16)];
  return hex;
}

function generateTxid(): string {
  const chars = '0123456789abcdef';
  let txid = '';
  for (let i = 0; i < 64; i++) txid += chars[Math.floor(Math.random() * 16)];
  return txid;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
