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
 * Keystone SDK Credentials
 *
 * Configuration for Keystone SDK integration.
 * Controls UR (Uniform Resource) encoding settings,
 * animation parameters, and derivation path templates.
 */
export class KeystoneSdkCredentials implements ICredentialType {
  name = 'keystoneSdk';
  displayName = 'Keystone SDK';
  documentationUrl = 'https://keyst.one/developer';

  properties: INodeProperties[] = [
    {
      displayName: 'SDK Version',
      name: 'sdkVersion',
      type: 'options',
      options: [
        {
          name: 'v0.5.x (Latest)',
          value: '0.5',
          description: 'Latest SDK version with full feature support',
        },
        {
          name: 'v0.4.x',
          value: '0.4',
          description: 'Previous stable version',
        },
        {
          name: 'v0.3.x (Legacy)',
          value: '0.3',
          description: 'Legacy version for older integrations',
        },
      ],
      default: '0.5',
      description: 'Keystone SDK version to use',
    },
    {
      displayName: 'UR Codec Version',
      name: 'urCodecVersion',
      type: 'options',
      options: [
        {
          name: 'BC-UR 2.0',
          value: 'bcur2',
          description: 'Latest BC-UR (Blockchain Commons UR) specification',
        },
        {
          name: 'BC-UR 1.0',
          value: 'bcur1',
          description: 'Original BC-UR specification',
        },
      ],
      default: 'bcur2',
      description: 'Uniform Resource encoding version',
      hint: 'BC-UR is the standard for encoding blockchain data in QR codes',
    },
    {
      displayName: 'QR Animation Speed (ms)',
      name: 'animationSpeed',
      type: 'number',
      default: 200,
      description: 'Frame interval for animated QR codes in milliseconds',
      hint: 'Lower values = faster animation, higher values = easier to scan',
    },
    {
      displayName: 'QR Fragment Size',
      name: 'fragmentSize',
      type: 'number',
      default: 200,
      description: 'Maximum bytes per QR code fragment for animated sequences',
      hint: 'Smaller fragments create more QR codes but are easier to scan',
    },
    {
      displayName: 'QR Error Correction Level',
      name: 'errorCorrectionLevel',
      type: 'options',
      options: [
        {
          name: 'Low (7%)',
          value: 'L',
          description: 'Fastest scanning, lowest error recovery',
        },
        {
          name: 'Medium (15%)',
          value: 'M',
          description: 'Balanced option for most use cases',
        },
        {
          name: 'Quartile (25%)',
          value: 'Q',
          description: 'Higher error recovery, larger QR codes',
        },
        {
          name: 'High (30%)',
          value: 'H',
          description: 'Maximum error recovery, largest QR codes',
        },
      ],
      default: 'M',
      description: 'Error correction level for generated QR codes',
    },
    {
      displayName: 'Custom Derivation Paths',
      name: 'customDerivationPaths',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
      },
      default: {},
      description: 'Custom derivation path templates for specific chains',
      options: [
        {
          name: 'paths',
          displayName: 'Path',
          values: [
            {
              displayName: 'Chain',
              name: 'chain',
              type: 'string',
              default: '',
              placeholder: 'e.g., ETH, BTC, SOL',
            },
            {
              displayName: 'Derivation Path',
              name: 'path',
              type: 'string',
              default: '',
              placeholder: "e.g., m/44'/60'/0'/0/0",
            },
          ],
        },
      ],
    },
    {
      displayName: 'Enable Fountain Codes',
      name: 'enableFountainCodes',
      type: 'boolean',
      default: true,
      description: 'Whether to use fountain codes for large data encoding',
      hint: 'Fountain codes allow recovery even if some QR frames are missed',
    },
    {
      displayName: 'Maximum QR Size',
      name: 'maxQrSize',
      type: 'number',
      default: 400,
      description: 'Maximum QR code dimension in pixels',
    },
  ];
}
