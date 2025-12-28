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
 * Keystone Device Credentials
 *
 * Manages connection settings for Keystone hardware wallets.
 * Supports multiple connection types:
 * - QR Code (Air-gapped) - Primary method for Keystone devices
 * - USB (Keystone 3 Pro only)
 * - Keystone SDK direct integration
 */
export class KeystoneDeviceCredentials implements ICredentialType {
  name = 'keystoneDevice';
  displayName = 'Keystone Device';
  documentationUrl = 'https://keyst.one/developer';

  properties: INodeProperties[] = [
    {
      displayName: 'Connection Type',
      name: 'connectionType',
      type: 'options',
      options: [
        {
          name: 'QR Code (Air-Gapped)',
          value: 'qr',
          description: 'Air-gapped communication via QR codes - most secure method',
        },
        {
          name: 'USB (Keystone 3 Pro)',
          value: 'usb',
          description: 'USB connection for Keystone 3 Pro devices only',
        },
        {
          name: 'Keystone SDK',
          value: 'sdk',
          description: 'Direct SDK integration for programmatic access',
        },
      ],
      default: 'qr',
      description: 'How to communicate with the Keystone device',
    },
    {
      displayName: 'Device Type',
      name: 'deviceType',
      type: 'options',
      options: [
        {
          name: 'Keystone 3 Pro',
          value: 'keystone3pro',
          description: 'Latest model with USB support and largest screen',
        },
        {
          name: 'Keystone 3',
          value: 'keystone3',
          description: 'Air-gapped only model with large screen',
        },
        {
          name: 'Keystone Essential',
          value: 'essential',
          description: 'Entry-level air-gapped hardware wallet',
        },
        {
          name: 'Keystone Pro',
          value: 'pro',
          description: 'Previous generation pro model',
        },
      ],
      default: 'keystone3pro',
      description: 'Model of the Keystone device',
    },
    {
      displayName: 'QR Scan Method',
      name: 'qrScanMethod',
      type: 'options',
      displayOptions: {
        show: {
          connectionType: ['qr'],
        },
      },
      options: [
        {
          name: 'Camera Scan',
          value: 'camera',
          description: 'Scan QR codes using device camera',
        },
        {
          name: 'Image Upload',
          value: 'upload',
          description: 'Upload QR code images for processing',
        },
        {
          name: 'Manual Input',
          value: 'manual',
          description: 'Manually input UR-encoded data',
        },
      ],
      default: 'camera',
      description: 'Method for scanning QR codes from the Keystone device',
    },
    {
      displayName: 'USB Device Path',
      name: 'usbDevicePath',
      type: 'string',
      displayOptions: {
        show: {
          connectionType: ['usb'],
        },
      },
      default: '',
      placeholder: '/dev/ttyUSB0 or COM3',
      description: 'Path to the USB device (leave empty for auto-detection)',
    },
    {
      displayName: 'Account Index',
      name: 'accountIndex',
      type: 'number',
      default: 0,
      description: 'Default account index to use (0 is the first account)',
      hint: 'Used for deriving addresses when not specified in operations',
    },
    {
      displayName: 'Master Fingerprint',
      name: 'masterFingerprint',
      type: 'string',
      default: '',
      placeholder: 'e.g., 73C5DA0A',
      description: 'Device master fingerprint (8 hex characters) - used to verify correct device',
      hint: 'Optional but recommended for device verification',
    },
    {
      displayName: 'Timeout (seconds)',
      name: 'timeout',
      type: 'number',
      default: 60,
      description: 'Timeout for device operations in seconds',
      hint: 'Increase for slow networks or complex operations',
    },
  ];
}
