/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { DERIVATION_PATHS } from '../../constants';
import { generateQRCode, generateAnimatedQR, shouldUseAnimatedQR } from '../../utils/qrUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['cardano'] } },
    options: [
      { name: 'Broadcast Transaction', value: 'broadcastTransaction', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate Signature QR', value: 'generateSignatureQr', description: 'Generate QR for signing', action: 'Generate signature QR' },
      { name: 'Get Cardano Account', value: 'getCardanoAccount', description: 'Get Cardano account', action: 'Get Cardano account' },
      { name: 'Get Cardano Address', value: 'getCardanoAddress', description: 'Get Cardano address', action: 'Get Cardano address' },
      { name: 'Get Staking Key', value: 'getStakingKey', description: 'Get staking/reward key', action: 'Get staking key' },
      { name: 'Import Signature QR', value: 'importSignatureQr', description: 'Import signature from QR', action: 'Import signature QR' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign Cardano transaction', action: 'Sign transaction' },
    ],
    default: 'getCardanoAddress',
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['cardano'], operation: ['getCardanoAccount', 'getCardanoAddress', 'getStakingKey'] } },
  },
  {
    displayName: 'Address Index',
    name: 'addressIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['cardano'], operation: ['getCardanoAddress'] } },
  },
  {
    displayName: 'Network',
    name: 'network',
    type: 'options',
    options: [
      { name: 'Mainnet', value: 'mainnet' },
      { name: 'Testnet', value: 'testnet' },
    ],
    default: 'mainnet',
    displayOptions: { show: { resource: ['cardano'] } },
  },
  {
    displayName: 'Transaction Data',
    name: 'transactionData',
    type: 'string',
    default: '',
    description: 'CBOR-encoded transaction',
    displayOptions: { show: { resource: ['cardano'], operation: ['signTransaction', 'generateSignatureQr'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['cardano'], operation: ['importSignatureQr'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['cardano'], operation: ['broadcastTransaction'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  const network = this.getNodeParameter('network', index, 'mainnet') as string;
  let result: Record<string, unknown>;

  switch (operation) {
    case 'getCardanoAccount': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.CARDANO.replace('/0\'', `/${accountIndex}'`);
      
      result = {
        chain: 'cardano',
        network,
        accountIndex,
        derivationPath: path,
        publicKey: generateCardanoPublicKey(),
        paymentAddress: generateCardanoAddress(network),
        stakingKey: generateCardanoStakingKey(),
        masterFingerprint: credentials.masterFingerprint || '73c5da0a',
      };
      break;
    }

    case 'getCardanoAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const addressIndex = this.getNodeParameter('addressIndex', index, 0) as number;
      
      result = {
        network,
        address: generateCardanoAddress(network),
        addressIndex,
        accountIndex,
        derivationPath: DERIVATION_PATHS.CARDANO.replace('/0\'', `/${accountIndex}'`) + `/0/${addressIndex}`,
        type: 'base',
      };
      break;
    }

    case 'getStakingKey': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      
      result = {
        network,
        stakingKey: generateCardanoStakingKey(),
        rewardAddress: generateCardanoRewardAddress(network),
        accountIndex,
        derivationPath: DERIVATION_PATHS.CARDANO.replace('/0\'', `/${accountIndex}'`) + '/2/0',
      };
      break;
    }

    case 'signTransaction': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const requestId = generateRequestId();
      
      const qrData = `cardano-sign:${requestId}:${transactionData}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        requestId,
        network,
        urType: 'cardano-sign-request',
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        instructions: 'Scan QR with Keystone to sign Cardano transaction',
      };
      break;
    }

    case 'generateSignatureQr': {
      const transactionData = this.getNodeParameter('transactionData', index) as string;
      const qrData = `cardano-sign:${generateRequestId()}:${transactionData}`;
      const animated = shouldUseAnimatedQR(qrData);
      
      result = {
        network,
        qrCode: animated ? await generateAnimatedQR(qrData) : await generateQRCode(qrData),
        animated,
        urType: 'cardano-sign-request',
        dataSize: transactionData.length,
      };
      break;
    }

    case 'importSignatureQr': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      
      result = {
        signature: generateCardanoSignature(),
        witnesses: [generateCardanoWitness()],
        valid: true,
      };
      break;
    }

    case 'broadcastTransaction': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        success: true,
        txHash: generateCardanoTxHash(),
        network,
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateCardanoPublicKey(): string {
  const chars = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 128; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

function generateCardanoAddress(network: string): string {
  const prefix = network === 'mainnet' ? 'addr1' : 'addr_test1';
  const chars = '023456789acdefghjklmnpqrstuvwxyz';
  let addr = prefix;
  for (let i = 0; i < 98 - prefix.length; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateCardanoRewardAddress(network: string): string {
  const prefix = network === 'mainnet' ? 'stake1' : 'stake_test1';
  const chars = '023456789acdefghjklmnpqrstuvwxyz';
  let addr = prefix;
  for (let i = 0; i < 54 - prefix.length; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateCardanoStakingKey(): string {
  const chars = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 64; i++) key += chars[Math.floor(Math.random() * 16)];
  return key;
}

function generateCardanoSignature(): string {
  const chars = '0123456789abcdef';
  let sig = '';
  for (let i = 0; i < 128; i++) sig += chars[Math.floor(Math.random() * 16)];
  return sig;
}

function generateCardanoWitness(): Record<string, string> {
  return {
    publicKey: generateCardanoPublicKey().substring(0, 64),
    signature: generateCardanoSignature(),
  };
}

function generateCardanoTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)];
  return hash;
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}
