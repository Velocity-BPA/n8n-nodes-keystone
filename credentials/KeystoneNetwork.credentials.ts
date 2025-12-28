/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Keystone Network Credentials
 *
 * Network configuration for blockchain connectivity.
 * Used for broadcasting transactions and querying balances.
 * Note: The Keystone device itself never connects to the network;
 * these settings are for the n8n server-side operations.
 */
export class KeystoneNetworkCredentials implements ICredentialType {
  name = 'keystoneNetwork';
  displayName = 'Keystone Network';
  documentationUrl = 'https://keyst.one/developer';

  properties: INodeProperties[] = [
    {
      displayName: 'Network Type',
      name: 'networkType',
      type: 'options',
      options: [
        {
          name: 'Bitcoin',
          value: 'bitcoin',
        },
        {
          name: 'Ethereum',
          value: 'ethereum',
        },
        {
          name: 'EVM (Other)',
          value: 'evm',
        },
        {
          name: 'Solana',
          value: 'solana',
        },
        {
          name: 'Cosmos',
          value: 'cosmos',
        },
        {
          name: 'Aptos',
          value: 'aptos',
        },
        {
          name: 'Sui',
          value: 'sui',
        },
        {
          name: 'Near',
          value: 'near',
        },
        {
          name: 'Tron',
          value: 'tron',
        },
        {
          name: 'XRP',
          value: 'xrp',
        },
        {
          name: 'Cardano',
          value: 'cardano',
        },
        {
          name: 'Litecoin',
          value: 'litecoin',
        },
      ],
      default: 'ethereum',
      description: 'Blockchain network type',
    },
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Mainnet',
          value: 'mainnet',
        },
        {
          name: 'Testnet',
          value: 'testnet',
        },
      ],
      default: 'mainnet',
      description: 'Whether to use mainnet or testnet',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/...',
      description: 'RPC endpoint for blockchain queries and broadcasting',
      hint: 'Leave empty to use default public endpoints',
    },
    {
      displayName: 'Explorer API URL',
      name: 'explorerApiUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.etherscan.io/api',
      description: 'Block explorer API for transaction history and verification',
    },
    {
      displayName: 'Explorer API Key',
      name: 'explorerApiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'API key for the block explorer (if required)',
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      displayOptions: {
        show: {
          networkType: ['ethereum', 'evm'],
        },
      },
      default: 1,
      description: 'EVM chain ID (1 for Ethereum mainnet)',
      hint: 'Required for EVM transaction signing',
    },
    {
      displayName: 'Custom Chain Name',
      name: 'customChainName',
      type: 'string',
      displayOptions: {
        show: {
          networkType: ['evm'],
        },
      },
      default: '',
      placeholder: 'My Custom Chain',
      description: 'Display name for the custom EVM chain',
    },
    {
      displayName: 'Cosmos Chain ID',
      name: 'cosmosChainId',
      type: 'string',
      displayOptions: {
        show: {
          networkType: ['cosmos'],
        },
      },
      default: 'cosmoshub-4',
      placeholder: 'cosmoshub-4',
      description: 'Cosmos chain identifier',
    },
    {
      displayName: 'Bech32 Prefix',
      name: 'bech32Prefix',
      type: 'string',
      displayOptions: {
        show: {
          networkType: ['cosmos'],
        },
      },
      default: 'cosmos',
      placeholder: 'cosmos, osmo, juno',
      description: 'Address prefix for the Cosmos chain',
    },
    {
      displayName: 'WebSocket URL',
      name: 'wsUrl',
      type: 'string',
      default: '',
      placeholder: 'wss://eth-mainnet.g.alchemy.com/v2/...',
      description: 'WebSocket endpoint for real-time updates (optional)',
    },
    {
      displayName: 'Request Timeout (seconds)',
      name: 'timeout',
      type: 'number',
      default: 30,
      description: 'Timeout for network requests',
    },
    {
      displayName: 'Retry Count',
      name: 'retryCount',
      type: 'number',
      default: 3,
      description: 'Number of retry attempts for failed requests',
    },
  ];
}
