/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import * as QRCode from 'qrcode';
import { DEFAULT_QR_SETTINGS, ANIMATED_QR_SETTINGS, UR_FRAGMENT_SETTINGS } from '../constants/qrSettings';

/**
 * QR Code Utilities
 *
 * Utilities for generating and parsing QR codes,
 * including animated QR sequences for large data.
 */

/**
 * QR Generation Options
 */
export interface QRGenerationOptions {
  size?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  type?: 'svg' | 'png' | 'dataURL';
}

/**
 * Animated QR Options
 */
export interface AnimatedQROptions extends QRGenerationOptions {
  fragmentSize?: number;
  frameInterval?: number;
}

/**
 * QR Parse Result
 */
export interface QRParseResult {
  data: string;
  isUR: boolean;
  urType?: string;
  fragmentIndex?: number;
  totalFragments?: number;
}

/**
 * Generate QR Code
 *
 * @param data - Data to encode
 * @param options - Generation options
 * @returns QR code as string (SVG, PNG base64, or data URL)
 */
export const generateQRCode = async (
  data: string,
  options: QRGenerationOptions = {},
): Promise<string> => {
  const settings = {
    width: options.size ?? DEFAULT_QR_SETTINGS.size,
    errorCorrectionLevel: options.errorCorrection ?? DEFAULT_QR_SETTINGS.errorCorrection,
    margin: options.margin ?? DEFAULT_QR_SETTINGS.margin,
    color: {
      dark: options.darkColor ?? DEFAULT_QR_SETTINGS.darkColor,
      light: options.lightColor ?? DEFAULT_QR_SETTINGS.lightColor,
    },
  };

  const type = options.type ?? 'svg';

  if (type === 'svg') {
    return await QRCode.toString(data, { ...settings, type: 'svg' });
  } else if (type === 'png') {
    return await QRCode.toDataURL(data, settings);
  } else {
    return await QRCode.toDataURL(data, settings);
  }
};

/**
 * Generate Animated QR Code Sequence
 *
 * Splits large data into multiple QR codes for animated display.
 *
 * @param data - Data to encode
 * @param options - Animation options
 * @returns Array of QR code frames
 */
export const generateAnimatedQR = async (
  data: string,
  options: AnimatedQROptions = {},
): Promise<string[]> => {
  const fragmentSize = options.fragmentSize ?? ANIMATED_QR_SETTINGS.fragmentSize;
  const fragments = splitDataIntoFragments(data, fragmentSize);
  
  const frames: string[] = [];
  
  for (let i = 0; i < fragments.length; i++) {
    const fragmentData = formatURFragment(fragments[i], i, fragments.length);
    const qr = await generateQRCode(fragmentData, options);
    frames.push(qr);
  }
  
  return frames;
};

/**
 * Split data into fragments for animated QR
 *
 * @param data - Data to split
 * @param fragmentSize - Size of each fragment
 * @returns Array of fragments
 */
export const splitDataIntoFragments = (
  data: string,
  fragmentSize: number = UR_FRAGMENT_SETTINGS.defaultLength,
): string[] => {
  const fragments: string[] = [];
  
  for (let i = 0; i < data.length; i += fragmentSize) {
    fragments.push(data.slice(i, i + fragmentSize));
  }
  
  return fragments;
};

/**
 * Format UR fragment with sequence info
 *
 * @param fragment - Fragment data
 * @param index - Fragment index
 * @param total - Total fragments
 * @returns Formatted fragment string
 */
export const formatURFragment = (
  fragment: string,
  index: number,
  total: number,
): string => {
  // UR fragment format: seqNum/seqLen/data
  return `${index + 1}of${total}/${fragment}`;
};

/**
 * Parse QR Code data
 *
 * @param qrData - Raw QR code data
 * @returns Parsed QR result
 */
export const parseQRCode = (qrData: string): QRParseResult => {
  // Check if it's a UR format
  if (isKeystoneUR(qrData)) {
    const parsed = parseURString(qrData);
    return {
      data: parsed.data,
      isUR: true,
      urType: parsed.type,
      fragmentIndex: parsed.fragmentIndex,
      totalFragments: parsed.totalFragments,
    };
  }
  
  return {
    data: qrData,
    isUR: false,
  };
};

/**
 * Parse UR string
 *
 * @param urString - UR formatted string
 * @returns Parsed UR data
 */
export const parseURString = (urString: string): {
  type: string;
  data: string;
  fragmentIndex?: number;
  totalFragments?: number;
} => {
  // UR format: ur:type/[fragment-info/]data
  const lower = urString.toLowerCase();
  
  if (!lower.startsWith('ur:')) {
    throw new Error('Invalid UR format: must start with "ur:"');
  }
  
  const parts = lower.slice(3).split('/');
  
  if (parts.length < 2) {
    throw new Error('Invalid UR format: missing type or data');
  }
  
  const type = parts[0];
  
  // Check for fragment info (e.g., "1of5")
  const fragmentMatch = parts[1].match(/^(\d+)of(\d+)$/);
  
  if (fragmentMatch) {
    return {
      type,
      data: parts.slice(2).join('/'),
      fragmentIndex: parseInt(fragmentMatch[1], 10) - 1,
      totalFragments: parseInt(fragmentMatch[2], 10),
    };
  }
  
  return {
    type,
    data: parts.slice(1).join('/'),
  };
};

/**
 * Merge QR fragments back into complete data
 *
 * @param fragments - Array of QR fragment results
 * @returns Merged data
 */
export const mergeQRFragments = (fragments: QRParseResult[]): string => {
  // Sort by fragment index
  const sorted = [...fragments].sort((a, b) => 
    (a.fragmentIndex ?? 0) - (b.fragmentIndex ?? 0)
  );
  
  // Verify completeness
  const expectedTotal = sorted[0]?.totalFragments ?? sorted.length;
  if (sorted.length !== expectedTotal) {
    throw new Error(`Incomplete QR sequence: got ${sorted.length} of ${expectedTotal} fragments`);
  }
  
  // Merge data
  return sorted.map(f => f.data).join('');
};

/**
 * Check if string is a Keystone UR format
 *
 * @param data - String to check
 * @returns True if UR format
 */
export const isKeystoneUR = (data: string): boolean => {
  const lower = data.toLowerCase();
  return lower.startsWith('ur:');
};

/**
 * Validate QR data for Keystone
 *
 * @param data - QR data to validate
 * @returns Validation result
 */
export const validateQRData = (data: string): {
  valid: boolean;
  error?: string;
  type?: string;
} => {
  if (!data || data.length === 0) {
    return { valid: false, error: 'Empty QR data' };
  }
  
  if (isKeystoneUR(data)) {
    try {
      const parsed = parseURString(data);
      return { valid: true, type: parsed.type };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }
  
  return { valid: true };
};

/**
 * Calculate if animated QR is needed
 *
 * @param data - Data to check
 * @param maxSize - Maximum single QR size
 * @returns True if animated QR needed
 */
export const shouldUseAnimatedQR = (
  data: string,
  maxSize: number = 2000,
): boolean => {
  return data.length > maxSize;
};

/**
 * Estimate scan time for animated QR
 *
 * @param dataSize - Size of data
 * @param fragmentSize - Fragment size
 * @param frameInterval - Time per frame (ms)
 * @returns Estimated time in seconds
 */
export const estimateScanTime = (
  dataSize: number,
  fragmentSize: number = ANIMATED_QR_SETTINGS.fragmentSize,
  frameInterval: number = ANIMATED_QR_SETTINGS.frameInterval,
): number => {
  const fragments = Math.ceil(dataSize / fragmentSize);
  // Assume 3x playthrough for reliable scan
  return (fragments * frameInterval * 3) / 1000;
};
