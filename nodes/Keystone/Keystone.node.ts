/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  NodeConnectionType,
} from 'n8n-workflow';

import * as device from './actions/device';
import * as account from './actions/account';
import * as qrCode from './actions/qrCode';
import * as bitcoin from './actions/bitcoin';
import * as ethereum from './actions/ethereum';
import * as evmChains from './actions/evmChains';
import * as solana from './actions/solana';
import * as cosmos from './actions/cosmos';
import * as aptos from './actions/aptos';
import * as sui from './actions/sui';
import * as near from './actions/near';
import * as tron from './actions/tron';
import * as xrp from './actions/xrp';
import * as cardano from './actions/cardano';
import * as litecoin from './actions/litecoin';
import * as multiSig from './actions/multiSig';
import * as watchOnly from './actions/watchOnly';
import * as transaction from './actions/transaction';
import * as signing from './actions/signing';
import * as ur from './actions/ur';
import * as metamask from './actions/metamask';
import * as walletIntegration from './actions/walletIntegration';
import * as firmware from './actions/firmware';
import * as security from './actions/security';
import * as utility from './actions/utility';

/**
 * Keystone Hardware Wallet Node
 *
 * Comprehensive integration with Keystone hardware wallets for
 * air-gapped cryptocurrency operations via QR codes.
 */
export class Keystone implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Keystone',
    name: 'keystone',
    icon: 'file:keystone.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Keystone hardware wallet for air-gapped crypto operations',
    defaults: {
      name: 'Keystone',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'keystoneDeviceApi',
        required: true,
      },
      {
        name: 'keystoneSdkApi',
        required: false,
      },
      {
        name: 'keystoneNetworkApi',
        required: false,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Account', value: 'account' },
          { name: 'Aptos', value: 'aptos' },
          { name: 'Bitcoin', value: 'bitcoin' },
          { name: 'Cardano', value: 'cardano' },
          { name: 'Cosmos', value: 'cosmos' },
          { name: 'Device', value: 'device' },
          { name: 'Ethereum', value: 'ethereum' },
          { name: 'EVM Chains', value: 'evmChains' },
          { name: 'Firmware', value: 'firmware' },
          { name: 'Litecoin', value: 'litecoin' },
          { name: 'MetaMask', value: 'metamask' },
          { name: 'Multi-Sig', value: 'multiSig' },
          { name: 'Near', value: 'near' },
          { name: 'QR Code', value: 'qrCode' },
          { name: 'Security', value: 'security' },
          { name: 'Signing', value: 'signing' },
          { name: 'Solana', value: 'solana' },
          { name: 'Sui', value: 'sui' },
          { name: 'Transaction', value: 'transaction' },
          { name: 'Tron', value: 'tron' },
          { name: 'UR (Uniform Resource)', value: 'ur' },
          { name: 'Utility', value: 'utility' },
          { name: 'Wallet Integration', value: 'walletIntegration' },
          { name: 'Watch-Only', value: 'watchOnly' },
          { name: 'XRP', value: 'xrp' },
        ],
        default: 'device',
      },

      // Device Operations
      ...device.description,

      // Account Operations
      ...account.description,

      // QR Code Operations
      ...qrCode.description,

      // Bitcoin Operations
      ...bitcoin.description,

      // Ethereum Operations
      ...ethereum.description,

      // EVM Chains Operations
      ...evmChains.description,

      // Solana Operations
      ...solana.description,

      // Cosmos Operations
      ...cosmos.description,

      // Aptos Operations
      ...aptos.description,

      // Sui Operations
      ...sui.description,

      // Near Operations
      ...near.description,

      // Tron Operations
      ...tron.description,

      // XRP Operations
      ...xrp.description,

      // Cardano Operations
      ...cardano.description,

      // Litecoin Operations
      ...litecoin.description,

      // Multi-Sig Operations
      ...multiSig.description,

      // Watch-Only Operations
      ...watchOnly.description,

      // Transaction Operations
      ...transaction.description,

      // Signing Operations
      ...signing.description,

      // UR Operations
      ...ur.description,

      // MetaMask Operations
      ...metamask.description,

      // Wallet Integration Operations
      ...walletIntegration.description,

      // Firmware Operations
      ...firmware.description,

      // Security Operations
      ...security.description,

      // Utility Operations
      ...utility.description,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        switch (resource) {
          case 'device':
            result = await device.execute.call(this, i, operation);
            break;
          case 'account':
            result = await account.execute.call(this, i, operation);
            break;
          case 'qrCode':
            result = await qrCode.execute.call(this, i, operation);
            break;
          case 'bitcoin':
            result = await bitcoin.execute.call(this, i, operation);
            break;
          case 'ethereum':
            result = await ethereum.execute.call(this, i, operation);
            break;
          case 'evmChains':
            result = await evmChains.execute.call(this, i, operation);
            break;
          case 'solana':
            result = await solana.execute.call(this, i, operation);
            break;
          case 'cosmos':
            result = await cosmos.execute.call(this, i, operation);
            break;
          case 'aptos':
            result = await aptos.execute.call(this, i, operation);
            break;
          case 'sui':
            result = await sui.execute.call(this, i, operation);
            break;
          case 'near':
            result = await near.execute.call(this, i, operation);
            break;
          case 'tron':
            result = await tron.execute.call(this, i, operation);
            break;
          case 'xrp':
            result = await xrp.execute.call(this, i, operation);
            break;
          case 'cardano':
            result = await cardano.execute.call(this, i, operation);
            break;
          case 'litecoin':
            result = await litecoin.execute.call(this, i, operation);
            break;
          case 'multiSig':
            result = await multiSig.execute.call(this, i, operation);
            break;
          case 'watchOnly':
            result = await watchOnly.execute.call(this, i, operation);
            break;
          case 'transaction':
            result = await transaction.execute.call(this, i, operation);
            break;
          case 'signing':
            result = await signing.execute.call(this, i, operation);
            break;
          case 'ur':
            result = await ur.execute.call(this, i, operation);
            break;
          case 'metamask':
            result = await metamask.execute.call(this, i, operation);
            break;
          case 'walletIntegration':
            result = await walletIntegration.execute.call(this, i, operation);
            break;
          case 'firmware':
            result = await firmware.execute.call(this, i, operation);
            break;
          case 'security':
            result = await security.execute.call(this, i, operation);
            break;
          case 'utility':
            result = await utility.execute.call(this, i, operation);
            break;
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: (error as Error).message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
