/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
	DEFAULT_QR_SETTINGS,
	ANIMATED_QR_SETTINGS,
	QRErrorCorrectionLevel,
} from '../constants/qrSettings';

/**
 * QR Code Handler
 *
 * Handles QR code generation and parsing for Keystone communication.
 * Supports both static and animated QR codes for air-gapped workflows.
 */

/**
 * QR Generation Options
 */
export interface QRGenerationOptions {
	width?: number;
	margin?: number;
	errorCorrectionLevel?: QRErrorCorrectionLevel;
	color?: {
		dark?: string;
		light?: string;
	};
}

/**
 * Animated QR Options
 */
export interface AnimatedQROptions extends QRGenerationOptions {
	fragmentLength?: number;
	fps?: number;
	loop?: boolean;
}

/**
 * QR Parse Result
 */
export interface QRParseResult {
	success: boolean;
	data?: string;
	error?: string;
	isUR?: boolean;
	urType?: string;
}

/**
 * Animated QR Fragment
 */
export interface QRFragment {
	index: number;
	total: number;
	data: string;
	checksum?: string;
}

/**
 * Generate a static QR code
 *
 * @param data - Data to encode
 * @param options - Generation options
 * @returns Base64 encoded QR image
 */
export const generateStaticQR = async (
	data: string,
	options: QRGenerationOptions = {},
): Promise<string> => {
	const qrOptions = {
		width: options.width || DEFAULT_QR_SETTINGS.size,
		margin: options.margin || DEFAULT_QR_SETTINGS.margin,
		errorCorrectionLevel: options.errorCorrectionLevel || DEFAULT_QR_SETTINGS.errorCorrectionLevel,
		color: {
			dark: options.color?.dark || '#000000',
			light: options.color?.light || '#FFFFFF',
		},
	};

	try {
		const qrDataUrl = await QRCode.toDataURL(data, qrOptions);
		return qrDataUrl;
	} catch (error) {
		throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
	}
};

/**
 * Generate animated QR frames for large data
 *
 * @param data - Large data to encode
 * @param options - Animation options
 * @returns Array of QR frame data URLs
 */
export const generateAnimatedQRFrames = async (
	data: string,
	options: AnimatedQROptions = {},
): Promise<string[]> => {
	const fragmentLength = options.fragmentLength || ANIMATED_QR_SETTINGS.fragmentLength;
	const fragments = splitDataIntoFragments(data, fragmentLength);
	const frames: string[] = [];

	for (let i = 0; i < fragments.length; i++) {
		const fragmentData = formatFragment(fragments[i], i, fragments.length);
		const frame = await generateStaticQR(fragmentData, options);
		frames.push(frame);
	}

	return frames;
};

/**
 * Split large data into fragments
 *
 * @param data - Data to split
 * @param maxLength - Maximum fragment length
 * @returns Array of fragments
 */
export const splitDataIntoFragments = (data: string, maxLength: number): string[] => {
	const fragments: string[] = [];

	for (let i = 0; i < data.length; i += maxLength) {
		fragments.push(data.substring(i, i + maxLength));
	}

	return fragments;
};

/**
 * Format a fragment with metadata
 *
 * @param fragment - Fragment data
 * @param index - Fragment index
 * @param total - Total fragments
 * @returns Formatted fragment string
 */
const formatFragment = (fragment: string, index: number, total: number): string => {
	// UR fragment format: p{index}of{total}/{data}
	return `p${index + 1}of${total}/${fragment}`;
};

/**
 * Parse QR code from image data
 *
 * @param imageData - Raw image data (RGBA)
 * @param width - Image width
 * @param height - Image height
 * @returns Parse result
 */
export const parseQRCode = (
	imageData: Uint8ClampedArray,
	width: number,
	height: number,
): QRParseResult => {
	try {
		const result = jsQR(imageData, width, height);

		if (!result) {
			return { success: false, error: 'No QR code found in image' };
		}

		const data = result.data;
		const isUR = data.toLowerCase().startsWith('ur:');

		return {
			success: true,
			data,
			isUR,
			urType: isUR ? extractURType(data) : undefined,
		};
	} catch (error) {
		return { success: false, error: (error as Error).message };
	}
};

/**
 * Extract UR type from UR string
 *
 * @param urString - UR encoded string
 * @returns UR type or undefined
 */
const extractURType = (urString: string): string | undefined => {
	// UR format: ur:{type}/{data}
	const match = urString.match(/^ur:([^/]+)/i);
	return match ? match[1] : undefined;
};

/**
 * Parse animated QR fragment
 *
 * @param data - Fragment data
 * @returns Parsed fragment info
 */
export const parseAnimatedQRFragment = (data: string): QRFragment | null => {
	// Format: p{index}of{total}/{data}
	const match = data.match(/^p(\d+)of(\d+)\/(.+)$/);

	if (!match) {
		return null;
	}

	return {
		index: parseInt(match[1], 10) - 1,
		total: parseInt(match[2], 10),
		data: match[3],
	};
};

/**
 * Merge animated QR fragments
 *
 * @param fragments - Array of fragments
 * @returns Merged data or null if incomplete
 */
export const mergeAnimatedQRFragments = (fragments: QRFragment[]): string | null => {
	if (fragments.length === 0) {
		return null;
	}

	const total = fragments[0].total;

	// Check if we have all fragments
	if (fragments.length !== total) {
		return null;
	}

	// Sort by index
	const sorted = [...fragments].sort((a, b) => a.index - b.index);

	// Verify sequence
	for (let i = 0; i < sorted.length; i++) {
		if (sorted[i].index !== i) {
			return null;
		}
	}

	// Merge data
	return sorted.map((f) => f.data).join('');
};

/**
 * Check if data requires animated QR
 *
 * @param data - Data to check
 * @param maxSingleSize - Maximum size for single QR
 * @returns True if animated QR needed
 */
export const requiresAnimatedQR = (
	data: string,
	maxSingleSize: number = DEFAULT_QR_SETTINGS.maxDataSize,
): boolean => {
	return data.length > maxSingleSize;
};

/**
 * Estimate number of frames needed
 *
 * @param data - Data to encode
 * @param fragmentLength - Fragment length
 * @returns Estimated frame count
 */
export const estimateFrameCount = (
	data: string,
	fragmentLength: number = ANIMATED_QR_SETTINGS.fragmentLength,
): number => {
	return Math.ceil(data.length / fragmentLength);
};

/**
 * Calculate scan time estimate
 *
 * @param frameCount - Number of frames
 * @param fps - Frames per second
 * @returns Estimated seconds
 */
export const estimateScanTime = (
	frameCount: number,
	fps: number = ANIMATED_QR_SETTINGS.fps,
): number => {
	// Assume 1.5x time for user to align and scan
	return Math.ceil((frameCount / fps) * 1.5);
};

/**
 * Generate QR with automatic mode selection
 *
 * @param data - Data to encode
 * @param options - Generation options
 * @returns Single QR or animated frames
 */
export const generateQRAuto = async (
	data: string,
	options: AnimatedQROptions = {},
): Promise<{ type: 'static' | 'animated'; data: string | string[] }> => {
	if (requiresAnimatedQR(data)) {
		const frames = await generateAnimatedQRFrames(data, options);
		return { type: 'animated', data: frames };
	} else {
		const qr = await generateStaticQR(data, options);
		return { type: 'static', data: qr };
	}
};

/**
 * QR Code Handler Class
 * Manages stateful QR code operations
 */
export class QRCodeHandler {
	private fragments: Map<number, QRFragment> = new Map();
	private expectedTotal: number | null = null;

	/**
	 * Add a scanned fragment
	 *
	 * @param data - Scanned QR data
	 * @returns Status of collection
	 */
	addFragment(data: string): {
		complete: boolean;
		progress: number;
		error?: string;
	} {
		const fragment = parseAnimatedQRFragment(data);

		if (!fragment) {
			// Might be a static QR
			return { complete: true, progress: 100 };
		}

		if (this.expectedTotal === null) {
			this.expectedTotal = fragment.total;
		} else if (this.expectedTotal !== fragment.total) {
			return {
				complete: false,
				progress: 0,
				error: 'Fragment count mismatch - restart scan',
			};
		}

		this.fragments.set(fragment.index, fragment);

		const progress = (this.fragments.size / this.expectedTotal) * 100;
		const complete = this.fragments.size === this.expectedTotal;

		return { complete, progress };
	}

	/**
	 * Get merged data if complete
	 *
	 * @returns Merged data or null
	 */
	getMergedData(): string | null {
		if (!this.expectedTotal || this.fragments.size !== this.expectedTotal) {
			return null;
		}

		return mergeAnimatedQRFragments(Array.from(this.fragments.values()));
	}

	/**
	 * Reset the handler
	 */
	reset(): void {
		this.fragments.clear();
		this.expectedTotal = null;
	}

	/**
	 * Get current progress
	 *
	 * @returns Progress percentage
	 */
	getProgress(): number {
		if (!this.expectedTotal) return 0;
		return (this.fragments.size / this.expectedTotal) * 100;
	}

	/**
	 * Get missing fragment indices
	 *
	 * @returns Array of missing indices
	 */
	getMissingFragments(): number[] {
		if (!this.expectedTotal) return [];

		const missing: number[] = [];
		for (let i = 0; i < this.expectedTotal; i++) {
			if (!this.fragments.has(i)) {
				missing.push(i);
			}
		}
		return missing;
	}
}

export default {
	generateStaticQR,
	generateAnimatedQRFrames,
	parseQRCode,
	parseAnimatedQRFragment,
	mergeAnimatedQRFragments,
	requiresAnimatedQR,
	estimateFrameCount,
	estimateScanTime,
	generateQRAuto,
	QRCodeHandler,
};
