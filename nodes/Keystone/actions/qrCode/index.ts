/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import {
  generateQRCode,
  generateAnimatedQR,
  parseQRCode,
  mergeQRFragments,
  validateQRData,
  shouldUseAnimatedQR,
  estimateScanTime,
} from '../utils/qrUtils';
import { createURString, parseURString, validateURString } from '../utils/urUtils';
import { DEFAULT_QR_SETTINGS, ANIMATED_QR_SETTINGS } from '../constants/qrSettings';
import { UR_TYPES } from '../constants/urTypes';

/**
 * QR Code Resource Description
 */
export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['qrCode'],
      },
    },
    options: [
      {
        name: 'Decode UR',
        value: 'decodeUr',
        description: 'Decode Uniform Resource data',
        action: 'Decode UR',
      },
      {
        name: 'Encode UR',
        value: 'encodeUr',
        description: 'Encode data as Uniform Resource',
        action: 'Encode UR',
      },
      {
        name: 'Generate Animated QR',
        value: 'generateAnimatedQr',
        description: 'Generate animated QR sequence for large data',
        action: 'Generate animated QR',
      },
      {
        name: 'Generate QR Code',
        value: 'generateQrCode',
        description: 'Generate QR code from data',
        action: 'Generate QR code',
      },
      {
        name: 'Get Animation Frames',
        value: 'getAnimationFrames',
        description: 'Get individual frames from animated QR',
        action: 'Get animation frames',
      },
      {
        name: 'Get QR Data',
        value: 'getQrData',
        description: 'Extract raw data from QR code',
        action: 'Get QR data',
      },
      {
        name: 'Get UR Type',
        value: 'getUrType',
        description: 'Identify UR type from data',
        action: 'Get UR type',
      },
      {
        name: 'Merge QR Parts',
        value: 'mergeQrParts',
        description: 'Merge animated QR fragments',
        action: 'Merge QR parts',
      },
      {
        name: 'Parse Animated QR',
        value: 'parseAnimatedQr',
        description: 'Parse animated QR code sequence',
        action: 'Parse animated QR',
      },
      {
        name: 'Parse QR Code',
        value: 'parseQrCode',
        description: 'Parse and decode QR code data',
        action: 'Parse QR code',
      },
      {
        name: 'Split QR',
        value: 'splitQr',
        description: 'Split large data for animated QR',
        action: 'Split QR',
      },
    ],
    default: 'generateQrCode',
  },

  // Data to encode
  {
    displayName: 'Data',
    name: 'data',
    type: 'string',
    default: '',
    description: 'Data to encode in QR code',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['generateQrCode', 'generateAnimatedQr', 'encodeUr', 'splitQr'],
      },
    },
  },

  // QR data to parse
  {
    displayName: 'QR Data',
    name: 'qrData',
    type: 'string',
    default: '',
    description: 'QR code data to parse',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['parseQrCode', 'decodeUr', 'getQrData', 'getUrType'],
      },
    },
  },

  // Fragments for merging
  {
    displayName: 'Fragments',
    name: 'fragments',
    type: 'json',
    default: '[]',
    description: 'Array of QR fragment data',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['mergeQrParts', 'parseAnimatedQr'],
      },
    },
  },

  // UR Type
  {
    displayName: 'UR Type',
    name: 'urType',
    type: 'options',
    options: Object.entries(UR_TYPES).map(([key, value]) => ({
      name: value.name,
      value: key,
      description: value.description,
    })),
    default: 'crypto-psbt',
    description: 'Uniform Resource type',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['encodeUr'],
      },
    },
  },

  // QR Size
  {
    displayName: 'Size',
    name: 'size',
    type: 'number',
    default: DEFAULT_QR_SETTINGS.size,
    description: 'QR code size in pixels',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['generateQrCode', 'generateAnimatedQr'],
      },
    },
  },

  // Error correction level
  {
    displayName: 'Error Correction',
    name: 'errorCorrection',
    type: 'options',
    options: [
      { name: 'Low (7%)', value: 'L' },
      { name: 'Medium (15%)', value: 'M' },
      { name: 'Quartile (25%)', value: 'Q' },
      { name: 'High (30%)', value: 'H' },
    ],
    default: 'M',
    description: 'Error correction level',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['generateQrCode', 'generateAnimatedQr'],
      },
    },
  },

  // Fragment size for animated QR
  {
    displayName: 'Fragment Size',
    name: 'fragmentSize',
    type: 'number',
    default: ANIMATED_QR_SETTINGS.fragmentSize,
    description: 'Maximum data size per frame',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['generateAnimatedQr', 'splitQr'],
      },
    },
  },

  // Output format
  {
    displayName: 'Output Format',
    name: 'outputFormat',
    type: 'options',
    options: [
      { name: 'SVG', value: 'svg' },
      { name: 'PNG (Data URL)', value: 'dataURL' },
    ],
    default: 'svg',
    description: 'QR code image format',
    displayOptions: {
      show: {
        resource: ['qrCode'],
        operation: ['generateQrCode', 'generateAnimatedQr'],
      },
    },
  },
];

/**
 * Execute QR Code Operations
 */
export async function execute(
  this: IExecuteFunctions,
  index: number,
  operation: string,
): Promise<INodeExecutionData[]> {
  let result: Record<string, unknown>;

  switch (operation) {
    case 'generateQrCode': {
      const data = this.getNodeParameter('data', index) as string;
      const size = this.getNodeParameter('size', index) as number;
      const errorCorrection = this.getNodeParameter('errorCorrection', index) as 'L' | 'M' | 'Q' | 'H';
      const outputFormat = this.getNodeParameter('outputFormat', index) as 'svg' | 'dataURL';

      const qrCode = await generateQRCode(data, {
        size,
        errorCorrection,
        type: outputFormat,
      });

      result = {
        qrCode,
        format: outputFormat,
        size,
        dataLength: data.length,
        isAnimated: false,
      };
      break;
    }

    case 'generateAnimatedQr': {
      const data = this.getNodeParameter('data', index) as string;
      const size = this.getNodeParameter('size', index) as number;
      const errorCorrection = this.getNodeParameter('errorCorrection', index) as 'L' | 'M' | 'Q' | 'H';
      const fragmentSize = this.getNodeParameter('fragmentSize', index) as number;

      const frames = await generateAnimatedQR(data, {
        size,
        errorCorrection,
        fragmentSize,
      });

      result = {
        frames,
        frameCount: frames.length,
        fragmentSize,
        totalDataSize: data.length,
        estimatedScanTime: estimateScanTime(data.length, fragmentSize),
        isAnimated: true,
      };
      break;
    }

    case 'parseQrCode': {
      const qrData = this.getNodeParameter('qrData', index) as string;
      const parsed = parseQRCode(qrData);

      result = {
        ...parsed,
        rawData: qrData,
        length: qrData.length,
      };
      break;
    }

    case 'parseAnimatedQr': {
      const fragments = this.getNodeParameter('fragments', index) as string;
      const fragmentArray = JSON.parse(fragments);

      const parsedFragments = fragmentArray.map((f: string) => parseQRCode(f));
      const mergedData = mergeQRFragments(parsedFragments);

      result = {
        data: mergedData,
        fragmentCount: fragmentArray.length,
        isComplete: true,
      };
      break;
    }

    case 'encodeUr': {
      const data = this.getNodeParameter('data', index) as string;
      const urType = this.getNodeParameter('urType', index) as string;

      const ur = createURString(urType, data);

      result = {
        ur,
        type: urType,
        dataLength: data.length,
      };
      break;
    }

    case 'decodeUr': {
      const qrData = this.getNodeParameter('qrData', index) as string;
      const parsed = parseURString(qrData);

      result = {
        type: parsed.type,
        data: parsed.data,
        raw: qrData,
      };
      break;
    }

    case 'getQrData': {
      const qrData = this.getNodeParameter('qrData', index) as string;
      const validation = validateQRData(qrData);

      result = {
        data: qrData,
        valid: validation.valid,
        type: validation.type,
        length: qrData.length,
        needsAnimated: shouldUseAnimatedQR(qrData),
      };
      break;
    }

    case 'getUrType': {
      const qrData = this.getNodeParameter('qrData', index) as string;
      const validation = validateURString(qrData);

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const urTypeInfo = UR_TYPES[validation.type as keyof typeof UR_TYPES];

      result = {
        type: validation.type,
        name: urTypeInfo?.name || validation.type,
        description: urTypeInfo?.description || 'Unknown UR type',
        category: urTypeInfo?.category || 'unknown',
      };
      break;
    }

    case 'splitQr': {
      const data = this.getNodeParameter('data', index) as string;
      const fragmentSize = this.getNodeParameter('fragmentSize', index) as number;

      const fragments = [];
      for (let i = 0; i < data.length; i += fragmentSize) {
        fragments.push({
          index: Math.floor(i / fragmentSize),
          data: data.slice(i, i + fragmentSize),
          isLast: i + fragmentSize >= data.length,
        });
      }

      result = {
        fragments,
        fragmentCount: fragments.length,
        fragmentSize,
        totalSize: data.length,
      };
      break;
    }

    case 'mergeQrParts': {
      const fragments = this.getNodeParameter('fragments', index) as string;
      const fragmentArray = JSON.parse(fragments);

      const parsedFragments = fragmentArray.map((f: string) => parseQRCode(f));
      const mergedData = mergeQRFragments(parsedFragments);

      result = {
        data: mergedData,
        fragmentCount: fragmentArray.length,
        mergedLength: mergedData.length,
      };
      break;
    }

    case 'getAnimationFrames': {
      const data = this.getNodeParameter('data', index, '') as string;

      if (!data) {
        result = {
          frames: [],
          frameCount: 0,
          message: 'No data provided',
        };
      } else {
        const frames = await generateAnimatedQR(data, {
          fragmentSize: 200,
        });

        result = {
          frames,
          frameCount: frames.length,
          frameInterval: ANIMATED_QR_SETTINGS.frameInterval,
        };
      }
      break;
    }

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return [{ json: result }];
}
