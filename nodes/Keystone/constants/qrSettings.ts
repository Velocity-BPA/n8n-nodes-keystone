/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * QR Code Settings Constants
 *
 * Configuration for QR code generation and animated QR sequences
 * used in air-gapped communication with Keystone devices.
 */

/**
 * QR Error Correction Levels
 */
export const QR_ERROR_CORRECTION = {
  L: 'L', // 7% recovery
  M: 'M', // 15% recovery
  Q: 'Q', // 25% recovery
  H: 'H', // 30% recovery
} as const;

export type QRErrorCorrectionLevel = keyof typeof QR_ERROR_CORRECTION;

/**
 * Default QR Settings
 */
export const DEFAULT_QR_SETTINGS = {
  /** QR code width/height in pixels */
  size: 300,
  /** Error correction level */
  errorCorrection: 'M' as QRErrorCorrectionLevel,
  /** Margin (quiet zone) in modules */
  margin: 4,
  /** Dark module color */
  darkColor: '#000000',
  /** Light module color */
  lightColor: '#FFFFFF',
  /** QR code type */
  type: 'svg' as 'svg' | 'png' | 'canvas',
};

/**
 * Animated QR Settings
 */
export const ANIMATED_QR_SETTINGS = {
  /** Milliseconds between frames */
  frameInterval: 100,
  /** Number of frames to display before repeating */
  loopCount: 0, // 0 = infinite
  /** Maximum data size per fragment (bytes) */
  fragmentSize: 200,
  /** Fragment overlap for error recovery */
  fragmentOverlap: 0,
  /** Default animation speed */
  defaultSpeed: 'medium' as 'slow' | 'medium' | 'fast',
};

/**
 * Animation Speed Presets (ms per frame)
 */
export const ANIMATION_SPEEDS = {
  slow: 200,
  medium: 100,
  fast: 50,
} as const;

/**
 * QR Size Presets
 */
export const QR_SIZE_PRESETS = {
  small: 200,
  medium: 300,
  large: 400,
  xlarge: 500,
} as const;

/**
 * Maximum data sizes for single QR codes
 */
export const SINGLE_QR_MAX_SIZES = {
  /** Binary data max (error correction L) */
  binaryL: 2953,
  binaryM: 2331,
  binaryQ: 1663,
  binaryH: 1273,
  /** Alphanumeric data max */
  alphanumericL: 4296,
  alphanumericM: 3391,
  alphanumericQ: 2420,
  alphanumericH: 1852,
  /** Numeric data max */
  numericL: 7089,
  numericM: 5596,
  numericQ: 3993,
  numericH: 3057,
} as const;

/**
 * Fragment Length Presets for Animated QR
 */
export const FRAGMENT_LENGTH_PRESETS = {
  /** For slow/unreliable scanning */
  conservative: 100,
  /** Default balanced setting */
  balanced: 200,
  /** For fast/reliable scanning */
  aggressive: 400,
} as const;

/**
 * UR Fragment Settings
 */
export const UR_FRAGMENT_SETTINGS = {
  /** Minimum fragment length */
  minLength: 50,
  /** Maximum fragment length */
  maxLength: 500,
  /** Default fragment length */
  defaultLength: 200,
  /** Recommended fragment length for Keystone */
  keystoneRecommended: 200,
};

/**
 * QR Scanner Settings
 */
export const QR_SCANNER_SETTINGS = {
  /** Scan interval in ms */
  scanInterval: 100,
  /** Maximum attempts before timeout */
  maxAttempts: 1000,
  /** Timeout in ms (0 = no timeout) */
  timeout: 0,
  /** Auto-detect animated QR */
  autoDetectAnimated: true,
};

/**
 * Camera Settings for QR Scanning
 */
export const CAMERA_SETTINGS = {
  /** Preferred facing mode */
  facingMode: 'environment' as 'environment' | 'user',
  /** Preferred resolution */
  resolution: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  /** Focus mode */
  focusMode: 'continuous' as 'manual' | 'continuous' | 'auto',
};

/**
 * Export all settings as combined config
 */
export const QR_CONFIG = {
  default: DEFAULT_QR_SETTINGS,
  animated: ANIMATED_QR_SETTINGS,
  errorCorrection: QR_ERROR_CORRECTION,
  speeds: ANIMATION_SPEEDS,
  sizes: QR_SIZE_PRESETS,
  maxSizes: SINGLE_QR_MAX_SIZES,
  fragmentLengths: FRAGMENT_LENGTH_PRESETS,
  urFragments: UR_FRAGMENT_SETTINGS,
  scanner: QR_SCANNER_SETTINGS,
  camera: CAMERA_SETTINGS,
} as const;
