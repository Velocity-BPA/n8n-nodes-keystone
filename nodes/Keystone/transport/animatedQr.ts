/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ANIMATED_QR_SETTINGS, QRErrorCorrectionLevel } from '../constants/qrSettings';
import { generateStaticQR, QRGenerationOptions } from './qrCodeHandler';

/**
 * Animated QR Code Handler
 *
 * Handles generation and management of animated QR codes for
 * transferring large data through Keystone's air-gapped workflow.
 *
 * Uses the fountain code approach where frames cycle through
 * allowing the scanner to pick up any frames it missed.
 */

/**
 * Animated QR Configuration
 */
export interface AnimatedQRConfig {
	/** Maximum data per QR frame */
	fragmentSize: number;
	/** Frames per second for animation */
	fps: number;
	/** Error correction level */
	errorCorrection: QRErrorCorrectionLevel;
	/** QR code size in pixels */
	size: number;
	/** Loop animation continuously */
	loop: boolean;
	/** Include checksum for verification */
	includeChecksum: boolean;
}

/**
 * Animation Frame
 */
export interface AnimationFrame {
	/** Frame index (0-based) */
	index: number;
	/** Total number of frames */
	total: number;
	/** Frame data payload */
	data: string;
	/** Base64 QR code image */
	qrImage: string;
	/** Checksum if enabled */
	checksum?: string;
}

/**
 * Animation State
 */
export interface AnimationState {
	/** All frames */
	frames: AnimationFrame[];
	/** Current frame index */
	currentIndex: number;
	/** Is playing */
	playing: boolean;
	/** Interval ID for animation */
	intervalId?: NodeJS.Timeout;
}

/**
 * Default animated QR configuration
 */
export const DEFAULT_ANIMATED_CONFIG: AnimatedQRConfig = {
	fragmentSize: ANIMATED_QR_SETTINGS.fragmentLength,
	fps: ANIMATED_QR_SETTINGS.fps,
	errorCorrection: 'M',
	size: 400,
	loop: true,
	includeChecksum: true,
};

/**
 * Calculate CRC32 checksum
 *
 * @param data - Data to checksum
 * @returns CRC32 as hex string
 */
const calculateChecksum = (data: string): string => {
	let crc = 0xffffffff;

	for (let i = 0; i < data.length; i++) {
		crc ^= data.charCodeAt(i);
		for (let j = 0; j < 8; j++) {
			crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
		}
	}

	return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
};

/**
 * Split data into fragments with UR-style headers
 *
 * @param data - Data to split
 * @param urType - UR type for encoding
 * @param fragmentSize - Maximum fragment size
 * @returns Array of fragment strings
 */
export const createURFragments = (
	data: string,
	urType: string,
	fragmentSize: number = ANIMATED_QR_SETTINGS.fragmentLength,
): string[] => {
	const fragments: string[] = [];
	const totalFragments = Math.ceil(data.length / fragmentSize);

	for (let i = 0; i < data.length; i += fragmentSize) {
		const fragmentData = data.substring(i, i + fragmentSize);
		const fragmentIndex = fragments.length + 1;

		// UR multipart format: ur:{type}/{index}-{total}/{data}
		const fragment = `ur:${urType}/${fragmentIndex}-${totalFragments}/${fragmentData}`;
		fragments.push(fragment);
	}

	return fragments;
};

/**
 * Generate animated QR frames
 *
 * @param data - Full data to encode
 * @param urType - UR type identifier
 * @param config - Animation configuration
 * @returns Array of animation frames
 */
export const generateAnimatedFrames = async (
	data: string,
	urType: string,
	config: Partial<AnimatedQRConfig> = {},
): Promise<AnimationFrame[]> => {
	const fullConfig = { ...DEFAULT_ANIMATED_CONFIG, ...config };
	const fragments = createURFragments(data, urType, fullConfig.fragmentSize);
	const frames: AnimationFrame[] = [];

	const qrOptions: QRGenerationOptions = {
		width: fullConfig.size,
		errorCorrectionLevel: fullConfig.errorCorrection,
	};

	for (let i = 0; i < fragments.length; i++) {
		const fragmentData = fragments[i];
		const qrImage = await generateStaticQR(fragmentData, qrOptions);

		const frame: AnimationFrame = {
			index: i,
			total: fragments.length,
			data: fragmentData,
			qrImage,
		};

		if (fullConfig.includeChecksum) {
			frame.checksum = calculateChecksum(fragmentData);
		}

		frames.push(frame);
	}

	return frames;
};

/**
 * Animated QR Player class
 * Manages playback of animated QR sequences
 */
export class AnimatedQRPlayer {
	private frames: AnimationFrame[] = [];
	private currentIndex: number = 0;
	private playing: boolean = false;
	private intervalId: NodeJS.Timeout | null = null;
	private config: AnimatedQRConfig;
	private onFrameChange?: (frame: AnimationFrame) => void;

	constructor(config: Partial<AnimatedQRConfig> = {}) {
		this.config = { ...DEFAULT_ANIMATED_CONFIG, ...config };
	}

	/**
	 * Load frames for playback
	 *
	 * @param frames - Animation frames to load
	 */
	loadFrames(frames: AnimationFrame[]): void {
		this.frames = frames;
		this.currentIndex = 0;
	}

	/**
	 * Generate and load frames from data
	 *
	 * @param data - Data to encode
	 * @param urType - UR type
	 */
	async loadData(data: string, urType: string): Promise<void> {
		const frames = await generateAnimatedFrames(data, urType, this.config);
		this.loadFrames(frames);
	}

	/**
	 * Start playback
	 *
	 * @param onFrame - Callback for each frame
	 */
	play(onFrame?: (frame: AnimationFrame) => void): void {
		if (this.frames.length === 0) {
			throw new Error('No frames loaded');
		}

		this.onFrameChange = onFrame;
		this.playing = true;

		const frameDelay = Math.floor(1000 / this.config.fps);

		this.intervalId = setInterval(() => {
			if (!this.playing) return;

			const frame = this.frames[this.currentIndex];
			this.onFrameChange?.(frame);

			this.currentIndex++;
			if (this.currentIndex >= this.frames.length) {
				if (this.config.loop) {
					this.currentIndex = 0;
				} else {
					this.stop();
				}
			}
		}, frameDelay);

		// Emit first frame immediately
		this.onFrameChange?.(this.frames[this.currentIndex]);
	}

	/**
	 * Pause playback
	 */
	pause(): void {
		this.playing = false;
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Stop and reset playback
	 */
	stop(): void {
		this.pause();
		this.currentIndex = 0;
	}

	/**
	 * Go to specific frame
	 *
	 * @param index - Frame index
	 */
	goToFrame(index: number): AnimationFrame | null {
		if (index < 0 || index >= this.frames.length) {
			return null;
		}
		this.currentIndex = index;
		const frame = this.frames[index];
		this.onFrameChange?.(frame);
		return frame;
	}

	/**
	 * Go to next frame
	 */
	nextFrame(): AnimationFrame | null {
		const nextIndex = (this.currentIndex + 1) % this.frames.length;
		return this.goToFrame(nextIndex);
	}

	/**
	 * Go to previous frame
	 */
	prevFrame(): AnimationFrame | null {
		const prevIndex = this.currentIndex === 0 ? this.frames.length - 1 : this.currentIndex - 1;
		return this.goToFrame(prevIndex);
	}

	/**
	 * Get current frame
	 */
	getCurrentFrame(): AnimationFrame | null {
		return this.frames[this.currentIndex] || null;
	}

	/**
	 * Get all frames
	 */
	getFrames(): AnimationFrame[] {
		return [...this.frames];
	}

	/**
	 * Get playback state
	 */
	getState(): AnimationState {
		return {
			frames: this.frames,
			currentIndex: this.currentIndex,
			playing: this.playing,
		};
	}

	/**
	 * Set playback speed
	 *
	 * @param fps - Frames per second
	 */
	setSpeed(fps: number): void {
		this.config.fps = fps;
		if (this.playing) {
			this.pause();
			this.play(this.onFrameChange);
		}
	}

	/**
	 * Get total frame count
	 */
	getFrameCount(): number {
		return this.frames.length;
	}

	/**
	 * Get estimated duration in seconds
	 */
	getDuration(): number {
		return this.frames.length / this.config.fps;
	}

	/**
	 * Get progress percentage
	 */
	getProgress(): number {
		if (this.frames.length === 0) return 0;
		return ((this.currentIndex + 1) / this.frames.length) * 100;
	}
}

/**
 * Animated QR Scanner state manager
 * Tracks which frames have been scanned
 */
export class AnimatedQRScanner {
	private scannedFragments: Map<number, string> = new Map();
	private totalFragments: number | null = null;
	private urType: string | null = null;

	/**
	 * Process a scanned fragment
	 *
	 * @param data - Scanned QR data
	 * @returns Scan status
	 */
	processFragment(data: string): {
		accepted: boolean;
		complete: boolean;
		progress: number;
		result?: string;
		error?: string;
	} {
		// Parse UR multipart format
		const match = data.match(/^ur:([^/]+)\/(\d+)-(\d+)\/(.+)$/i);

		if (!match) {
			// Might be single-part UR
			if (data.toLowerCase().startsWith('ur:')) {
				return {
					accepted: true,
					complete: true,
					progress: 100,
					result: data,
				};
			}
			return {
				accepted: false,
				complete: false,
				progress: this.getProgress(),
				error: 'Invalid UR format',
			};
		}

		const type = match[1];
		const index = parseInt(match[2], 10);
		const total = parseInt(match[3], 10);
		const fragmentData = match[4];

		// Validate consistency
		if (this.urType && this.urType !== type) {
			return {
				accepted: false,
				complete: false,
				progress: this.getProgress(),
				error: 'UR type mismatch',
			};
		}

		if (this.totalFragments && this.totalFragments !== total) {
			return {
				accepted: false,
				complete: false,
				progress: this.getProgress(),
				error: 'Fragment count mismatch',
			};
		}

		// Store fragment
		this.urType = type;
		this.totalFragments = total;
		this.scannedFragments.set(index, fragmentData);

		const progress = this.getProgress();

		// Check if complete
		if (this.scannedFragments.size === total) {
			const result = this.assembleResult();
			return {
				accepted: true,
				complete: true,
				progress: 100,
				result,
			};
		}

		return {
			accepted: true,
			complete: false,
			progress,
		};
	}

	/**
	 * Assemble complete result from fragments
	 */
	private assembleResult(): string {
		if (!this.urType || !this.totalFragments) {
			throw new Error('Incomplete scan data');
		}

		const sortedData: string[] = [];
		for (let i = 1; i <= this.totalFragments; i++) {
			const fragment = this.scannedFragments.get(i);
			if (!fragment) {
				throw new Error(`Missing fragment ${i}`);
			}
			sortedData.push(fragment);
		}

		const mergedData = sortedData.join('');
		return `ur:${this.urType}/${mergedData}`;
	}

	/**
	 * Get current progress
	 */
	getProgress(): number {
		if (!this.totalFragments) return 0;
		return (this.scannedFragments.size / this.totalFragments) * 100;
	}

	/**
	 * Get missing fragment indices
	 */
	getMissingFragments(): number[] {
		if (!this.totalFragments) return [];

		const missing: number[] = [];
		for (let i = 1; i <= this.totalFragments; i++) {
			if (!this.scannedFragments.has(i)) {
				missing.push(i);
			}
		}
		return missing;
	}

	/**
	 * Reset scanner state
	 */
	reset(): void {
		this.scannedFragments.clear();
		this.totalFragments = null;
		this.urType = null;
	}

	/**
	 * Get scan status
	 */
	getStatus(): {
		scanned: number;
		total: number | null;
		urType: string | null;
		progress: number;
	} {
		return {
			scanned: this.scannedFragments.size,
			total: this.totalFragments,
			urType: this.urType,
			progress: this.getProgress(),
		};
	}
}

/**
 * Estimate scan time for data
 *
 * @param dataLength - Length of data to encode
 * @param fps - Animation FPS
 * @param fragmentSize - Fragment size
 * @returns Estimated seconds (with overhead)
 */
export const estimateScanTime = (
	dataLength: number,
	fps: number = ANIMATED_QR_SETTINGS.fps,
	fragmentSize: number = ANIMATED_QR_SETTINGS.fragmentLength,
): number => {
	const frameCount = Math.ceil(dataLength / fragmentSize);
	// Add 50% overhead for alignment and missed frames
	return Math.ceil((frameCount / fps) * 1.5);
};

export default {
	generateAnimatedFrames,
	createURFragments,
	AnimatedQRPlayer,
	AnimatedQRScanner,
	estimateScanTime,
	DEFAULT_ANIMATED_CONFIG,
};
