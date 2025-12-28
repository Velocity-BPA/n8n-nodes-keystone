/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ITriggerFunctions,
  INodeType,
  INodeTypeDescription,
  ITriggerResponse,
  NodeConnectionType,
} from 'n8n-workflow';

/**
 * Keystone Trigger Node
 *
 * Monitors for QR code events, signatures, and device interactions
 * from Keystone hardware wallets.
 */
export class KeystoneTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Keystone Trigger',
    name: 'keystoneTrigger',
    icon: 'file:keystone.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Trigger on Keystone hardware wallet events',
    defaults: {
      name: 'Keystone Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'keystoneDeviceApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          // QR Scan Events
          {
            name: 'QR Code Scanned',
            value: 'qrScanned',
            description: 'Triggered when a QR code is scanned',
          },
          {
            name: 'Animated QR Complete',
            value: 'animatedQrComplete',
            description: 'Triggered when all frames of an animated QR are collected',
          },
          {
            name: 'QR Parse Error',
            value: 'qrParseError',
            description: 'Triggered when QR code parsing fails',
          },

          // Signature Events
          {
            name: 'Signature Ready',
            value: 'signatureReady',
            description: 'Triggered when device generates a signature',
          },
          {
            name: 'Signature Imported',
            value: 'signatureImported',
            description: 'Triggered when a signature QR is imported',
          },
          {
            name: 'Multi-Sig Signature Added',
            value: 'multiSigSignatureAdded',
            description: 'Triggered when a co-signer adds their signature',
          },
          {
            name: 'All Signatures Collected',
            value: 'allSignaturesCollected',
            description: 'Triggered when multi-sig threshold is met',
          },

          // Transaction Events
          {
            name: 'Transaction Created',
            value: 'transactionCreated',
            description: 'Triggered when unsigned transaction is created',
          },
          {
            name: 'Transaction Signed',
            value: 'transactionSigned',
            description: 'Triggered when transaction is signed on device',
          },
          {
            name: 'Transaction Broadcast',
            value: 'transactionBroadcast',
            description: 'Triggered when transaction is broadcast to network',
          },
          {
            name: 'Transaction Confirmed',
            value: 'transactionConfirmed',
            description: 'Triggered when transaction is confirmed',
          },
          {
            name: 'Transaction Failed',
            value: 'transactionFailed',
            description: 'Triggered when transaction fails',
          },

          // Account Events
          {
            name: 'Account Imported',
            value: 'accountImported',
            description: 'Triggered when account is imported from device',
          },
          {
            name: 'Watch-Only Created',
            value: 'watchOnlyCreated',
            description: 'Triggered when watch-only wallet is created',
          },
          {
            name: 'Multi-Sig Setup Complete',
            value: 'multiSigSetupComplete',
            description: 'Triggered when multi-sig wallet setup is complete',
          },
          {
            name: 'Account Synced',
            value: 'accountSynced',
            description: 'Triggered when account sync completes',
          },

          // Device Events
          {
            name: 'Device Connected',
            value: 'deviceConnected',
            description: 'Triggered when device connects via USB',
          },
          {
            name: 'Device Verified',
            value: 'deviceVerified',
            description: 'Triggered when device authenticity is verified',
          },
          {
            name: 'Firmware Update Available',
            value: 'firmwareUpdateAvailable',
            description: 'Triggered when firmware update is detected',
          },
        ],
        default: 'signatureReady',
        required: true,
      },

      // Chain filter
      {
        displayName: 'Chain Filter',
        name: 'chainFilter',
        type: 'options',
        options: [
          { name: 'All Chains', value: 'all' },
          { name: 'Bitcoin', value: 'bitcoin' },
          { name: 'Ethereum', value: 'ethereum' },
          { name: 'Solana', value: 'solana' },
          { name: 'Cosmos', value: 'cosmos' },
          { name: 'Polygon', value: 'polygon' },
          { name: 'Arbitrum', value: 'arbitrum' },
          { name: 'Optimism', value: 'optimism' },
          { name: 'Avalanche', value: 'avalanche' },
          { name: 'Base', value: 'base' },
          { name: 'BNB Chain', value: 'bsc' },
          { name: 'Aptos', value: 'aptos' },
          { name: 'Sui', value: 'sui' },
          { name: 'Near', value: 'near' },
          { name: 'Tron', value: 'tron' },
          { name: 'XRP', value: 'xrp' },
          { name: 'Cardano', value: 'cardano' },
          { name: 'Litecoin', value: 'litecoin' },
        ],
        default: 'all',
        description: 'Filter events by blockchain',
        displayOptions: {
          show: {
            event: [
              'signatureReady',
              'signatureImported',
              'transactionCreated',
              'transactionSigned',
              'transactionBroadcast',
              'transactionConfirmed',
              'transactionFailed',
              'accountImported',
              'watchOnlyCreated',
            ],
          },
        },
      },

      // Account filter
      {
        displayName: 'Account Filter',
        name: 'accountFilter',
        type: 'string',
        default: '',
        placeholder: 'e.g., bc1q..., 0x...',
        description: 'Filter by specific account address (optional)',
        displayOptions: {
          show: {
            event: [
              'signatureReady',
              'transactionSigned',
              'transactionBroadcast',
              'transactionConfirmed',
            ],
          },
        },
      },

      // Multi-sig config
      {
        displayName: 'Multi-Sig Wallet ID',
        name: 'multiSigWalletId',
        type: 'string',
        default: '',
        description: 'Filter by multi-sig wallet identifier',
        displayOptions: {
          show: {
            event: ['multiSigSignatureAdded', 'allSignaturesCollected', 'multiSigSetupComplete'],
          },
        },
      },

      // Polling interval for events
      {
        displayName: 'Poll Interval',
        name: 'pollInterval',
        type: 'number',
        default: 5000,
        description: 'How often to check for events (in milliseconds)',
        hint: 'Minimum 1000ms recommended',
      },
    ],
  };

  async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const event = this.getNodeParameter('event') as string;
    const pollInterval = this.getNodeParameter('pollInterval', 5000) as number;
    const chainFilter = this.getNodeParameter('chainFilter', 'all') as string;

    // Event state tracking
    let lastEventId: string | null = null;

    const poll = async () => {
      try {
        // Simulate event checking - in production this would
        // connect to a Keystone SDK or file watcher
        const eventData = await checkForEvent(event, chainFilter, lastEventId);

        if (eventData && eventData.id !== lastEventId) {
          lastEventId = eventData.id;

          this.emit([
            this.helpers.returnJsonArray([
              {
                event,
                chain: eventData.chain,
                data: eventData.data,
                timestamp: new Date().toISOString(),
                deviceId: eventData.deviceId,
              },
            ]),
          ]);
        }
      } catch (error) {
        // Log error but don't stop polling
        console.error('Keystone trigger error:', error);
      }
    };

    // Start polling
    const intervalId = setInterval(poll, Math.max(pollInterval, 1000));

    // Initial poll
    await poll();

    // Cleanup function
    const closeFunction = async () => {
      clearInterval(intervalId);
    };

    return {
      closeFunction,
    };
  }
}

/**
 * Check for Keystone events
 * This is a placeholder - real implementation would use file watchers,
 * USB events, or SDK callbacks
 */
async function checkForEvent(
  eventType: string,
  chainFilter: string,
  lastEventId: string | null,
): Promise<{
  id: string;
  chain: string;
  data: Record<string, unknown>;
  deviceId: string;
} | null> {
  // Placeholder implementation
  // In production, this would:
  // 1. Watch for QR code scan completion files
  // 2. Monitor USB device events (Keystone 3 Pro)
  // 3. Check for signature files in designated folder
  // 4. Parse UR-encoded data from clipboard or file

  return null;
}
