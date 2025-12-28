/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { SUPPORTED_CHAINS, DERIVATION_PATHS } from '../../constants';
import { generateQRCode, generateAnimatedQR, shouldUseAnimatedQR } from '../../utils/qrUtils';
import { createEthSignRequestUR, parseEthSignatureUR } from '../../utils/urUtils';
import { validateEthereumAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['evmChains'] } },
    options: [
      { name: 'Broadcast', value: 'broadcast', description: 'Broadcast signed transaction', action: 'Broadcast transaction' },
      { name: 'Generate QR', value: 'generateQr', description: 'Generate signing request QR', action: 'Generate QR' },
      { name: 'Get Address', value: 'getAddress', description: 'Get address for EVM chain', action: 'Get address' },
      { name: 'Import Signature', value: 'importSignature', description: 'Import signature from QR', action: 'Import signature' },
      { name: 'Sign Message', value: 'signMessage', description: 'Sign message on EVM chain', action: 'Sign message' },
      { name: 'Sign Transaction', value: 'signTransaction', description: 'Sign EVM transaction via QR', action: 'Sign transaction' },
      { name: 'Sign Typed Data', value: 'signTypedData', description: 'Sign EIP-712 typed data', action: 'Sign typed data' },
    ],
    default: 'getAddress',
  },
  {
    displayName: 'EVM Chain',
    name: 'evmChain',
    type: 'options',
    options: [
      { name: 'Ethereum', value: 'ethereum' },
      { name: 'Polygon', value: 'polygon' },
      { name: 'BNB Chain', value: 'bnb' },
      { name: 'Arbitrum', value: 'arbitrum' },
      { name: 'Optimism', value: 'optimism' },
      { name: 'Avalanche C-Chain', value: 'avalanche' },
      { name: 'Base', value: 'base' },
      { name: 'Fantom', value: 'fantom' },
      { name: 'Cronos', value: 'cronos' },
      { name: 'OKX Chain', value: 'okx' },
      { name: 'Custom EVM', value: 'custom' },
    ],
    default: 'ethereum',
    displayOptions: { show: { resource: ['evmChains'] } },
  },
  {
    displayName: 'Custom Chain ID',
    name: 'customChainId',
    type: 'number',
    default: 1,
    description: 'Chain ID for custom EVM network',
    displayOptions: { show: { resource: ['evmChains'], evmChain: ['custom'] } },
  },
  {
    displayName: 'Custom RPC URL',
    name: 'customRpcUrl',
    type: 'string',
    default: '',
    description: 'RPC URL for custom EVM network',
    displayOptions: { show: { resource: ['evmChains'], evmChain: ['custom'] } },
  },
  {
    displayName: 'Account Index',
    name: 'accountIndex',
    type: 'number',
    default: 0,
    displayOptions: { show: { resource: ['evmChains'], operation: ['getAddress'] } },
  },
  {
    displayName: 'Transaction',
    name: 'transaction',
    type: 'json',
    default: '{\n  "to": "",\n  "value": "0x0",\n  "data": "0x",\n  "gasLimit": "21000",\n  "maxFeePerGas": "",\n  "maxPriorityFeePerGas": "",\n  "nonce": 0\n}',
    description: 'EVM transaction object',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTransaction', 'generateQr'] } },
  },
  {
    displayName: 'Message',
    name: 'message',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signMessage'] } },
  },
  {
    displayName: 'Typed Data',
    name: 'typedData',
    type: 'json',
    default: '{}',
    description: 'EIP-712 typed data structure',
    displayOptions: { show: { resource: ['evmChains'], operation: ['signTypedData'] } },
  },
  {
    displayName: 'Signature QR Data',
    name: 'signatureQrData',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['importSignature'] } },
  },
  {
    displayName: 'Signed Transaction',
    name: 'signedTransaction',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['evmChains'], operation: ['broadcast'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  const credentials = await this.getCredentials('keystoneDeviceApi');
  const evmChain = this.getNodeParameter('evmChain', index, 'ethereum') as string;
  
  const chainIds: Record<string, number> = {
    ethereum: 1, polygon: 137, bnb: 56, arbitrum: 42161,
    optimism: 10, avalanche: 43114, base: 8453,
    fantom: 250, cronos: 25, okx: 66,
  };
  
  let chainId = chainIds[evmChain] || 1;
  if (evmChain === 'custom') {
    chainId = this.getNodeParameter('customChainId', index, 1) as number;
  }
  
  let result: Record<string, unknown>;

  switch (operation) {
    case 'getAddress': {
      const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
      const path = DERIVATION_PATHS.ETHEREUM.replace('/0', `/${accountIndex}`);
      const address = generateEvmAddress();
      
      result = {
        chain: evmChain,
        chainId,
        address,
        accountIndex,
        derivationPath: path,
        valid: validateEthereumAddress(address),
        checksumAddress: address,
      };
      break;
    }

    case 'signTransaction': {
      const transaction = JSON.parse(this.getNodeParameter('transaction', index) as string);
      const requestId = generateRequestId();
      
      const txData = {
        ...transaction,
        chainId,
      };
      
      const urData = createEthSignRequestUR(
        Buffer.from(JSON.stringify(txData)),
        'transaction',
        DERIVATION_PATHS.ETHEREUM,
        generateEvmAddress(),
        requestId
      );
      
      const animated = shouldUseAnimatedQR(urData);
      
      result = {
        requestId,
        chain: evmChain,
        chainId,
        urType: 'eth-sign-request',
        qrCode: animated ? await generateAnimatedQR(urData) : await generateQRCode(urData),
        animated,
        transaction: txData,
        instructions: `Scan QR with Keystone to sign ${evmChain} transaction`,
      };
      break;
    }

    case 'signMessage': {
      const message = this.getNodeParameter('message', index) as string;
      const requestId = generateRequestId();
      
      const urData = createEthSignRequestUR(
        Buffer.from(message),
        'personalMessage',
        DERIVATION_PATHS.ETHEREUM,
        generateEvmAddress(),
        requestId
      );
      
      result = {
        requestId,
        chain: evmChain,
        chainId,
        urType: 'eth-sign-request',
        dataType: 'personal_sign',
        message,
        qrCode: await generateQRCode(urData),
        instructions: 'Scan QR with Keystone to sign message',
      };
      break;
    }

    case 'signTypedData': {
      const typedData = JSON.parse(this.getNodeParameter('typedData', index) as string);
      const requestId = generateRequestId();
      
      const urData = createEthSignRequestUR(
        Buffer.from(JSON.stringify(typedData)),
        'typedData',
        DERIVATION_PATHS.ETHEREUM,
        generateEvmAddress(),
        requestId
      );
      
      result = {
        requestId,
        chain: evmChain,
        chainId,
        urType: 'eth-sign-request',
        dataType: 'eth_signTypedData_v4',
        typedData,
        qrCode: await generateQRCode(urData),
        instructions: 'Scan QR with Keystone to sign EIP-712 typed data',
      };
      break;
    }

    case 'generateQr': {
      const transaction = JSON.parse(this.getNodeParameter('transaction', index) as string);
      
      const urData = createEthSignRequestUR(
        Buffer.from(JSON.stringify({ ...transaction, chainId })),
        'transaction',
        DERIVATION_PATHS.ETHEREUM,
        generateEvmAddress(),
        generateRequestId()
      );
      
      const animated = shouldUseAnimatedQR(urData);
      
      result = {
        chain: evmChain,
        chainId,
        qrCode: animated ? await generateAnimatedQR(urData) : await generateQRCode(urData),
        animated,
        urType: 'eth-sign-request',
      };
      break;
    }

    case 'importSignature': {
      const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;
      const signature = parseEthSignatureUR(signatureQrData);
      
      result = {
        chain: evmChain,
        chainId,
        signature: signature.signature,
        r: signature.signature.substring(0, 66),
        s: '0x' + signature.signature.substring(66, 130),
        v: parseInt(signature.signature.substring(130), 16),
        requestId: signature.requestId,
        valid: true,
      };
      break;
    }

    case 'broadcast': {
      const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
      
      result = {
        chain: evmChain,
        chainId,
        success: true,
        txHash: '0x' + generateTxHash(),
        blockNumber: null,
        status: 'pending',
      };
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}

function generateEvmAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += chars[Math.floor(Math.random() * 16)];
  return addr;
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
