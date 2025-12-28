/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { UR_TYPES, CBOR_TAGS } from '../constants/urTypes';

/**
 * UR (Uniform Resource) Codec
 *
 * Implements the Blockchain Commons UR encoding standard for
 * encoding and decoding blockchain data for QR code transmission.
 *
 * UR format: ur:{type}/{payload}
 * Where payload is bytewords-encoded CBOR data.
 */

/**
 * Bytewords encoding charset
 * Based on Blockchain Commons specification
 */
const BYTEWORDS =
	'ableacabornacidalsoapeapexaquaarchatomauloawayaxleayebackbaldballbandbarsbazebeckbeltbilkbiobirdbitebodyboatboltbombbootbothbowlbulkburnbuzzcalmcascashcatscellchefciviccladclubcobscodecolacooldovecurlcuspcyandarkdatasaysdeafdelldiaddietdivodoesdoledrewdrugdrumdulldurodutyeacheasteasyerasevenexamexiteyesfactfairfernfigsfilmfingfishfitsflapflewfluxfoxyfreefrogfugsfundgalagamegategauzegeargemsgiftgiragemsglowgoodgraphawkshelphickhighhillholehornicyidleikonimagoionsirisironitenjakejazzjoinjoltjowljunkjuryjustkeepkelskernkickkilokinskitelandlavalazyleaflegsliarlimplogolossloudlovealucklunarmagicmainmakesmathmawsmealsmennumininutonoxoyakonsyawnzenyawnzerozest';

/**
 * Bytewords array (4-letter words)
 */
const BYTEWORDS_ARRAY: string[] = [];
for (let i = 0; i < 256; i++) {
	BYTEWORDS_ARRAY.push(BYTEWORDS.substring(i * 4, i * 4 + 4));
}

/**
 * Create reverse lookup map
 */
const BYTEWORDS_MAP = new Map<string, number>();
BYTEWORDS_ARRAY.forEach((word, index) => {
	BYTEWORDS_MAP.set(word, index);
});

/**
 * UR Encoded Data
 */
export interface URData {
	type: string;
	payload: Uint8Array;
	cbor?: any;
}

/**
 * UR Parse Result
 */
export interface URParseResult {
	success: boolean;
	data?: URData;
	error?: string;
}

/**
 * Encode bytes to bytewords
 *
 * @param bytes - Bytes to encode
 * @param minimal - Use minimal encoding (first and last char only)
 * @returns Bytewords string
 */
export const encodeBytewords = (bytes: Uint8Array, minimal: boolean = false): string => {
	const words: string[] = [];

	for (const byte of bytes) {
		const word = BYTEWORDS_ARRAY[byte];
		if (minimal) {
			// Minimal encoding: first and last character
			words.push(word[0] + word[3]);
		} else {
			words.push(word);
		}
	}

	return words.join('');
};

/**
 * Decode bytewords to bytes
 *
 * @param bytewords - Bytewords string
 * @param minimal - Whether input is minimal encoding
 * @returns Decoded bytes
 */
export const decodeBytewords = (bytewords: string, minimal: boolean = false): Uint8Array => {
	const bytes: number[] = [];
	const wordLength = minimal ? 2 : 4;

	for (let i = 0; i < bytewords.length; i += wordLength) {
		const word = bytewords.substring(i, i + wordLength);

		if (minimal) {
			// Find word by first and last character
			const found = BYTEWORDS_ARRAY.findIndex((w) => w[0] === word[0] && w[3] === word[1]);
			if (found === -1) {
				throw new Error(`Invalid minimal byteword: ${word}`);
			}
			bytes.push(found);
		} else {
			const index = BYTEWORDS_MAP.get(word.toLowerCase());
			if (index === undefined) {
				throw new Error(`Invalid byteword: ${word}`);
			}
			bytes.push(index);
		}
	}

	return new Uint8Array(bytes);
};

/**
 * Create UR string from type and data
 *
 * @param type - UR type (e.g., 'crypto-psbt')
 * @param data - Raw data bytes
 * @returns UR formatted string
 */
export const createURString = (type: string, data: Uint8Array): string => {
	const payload = encodeBytewords(data);
	return `ur:${type}/${payload}`;
};

/**
 * Parse UR string
 *
 * @param urString - UR formatted string
 * @returns Parsed UR data
 */
export const parseURString = (urString: string): URParseResult => {
	try {
		const lower = urString.toLowerCase();

		if (!lower.startsWith('ur:')) {
			return { success: false, error: 'Not a valid UR string' };
		}

		const withoutPrefix = lower.substring(3);
		const slashIndex = withoutPrefix.indexOf('/');

		if (slashIndex === -1) {
			return { success: false, error: 'Invalid UR format: missing type/payload separator' };
		}

		const type = withoutPrefix.substring(0, slashIndex);
		const payload = withoutPrefix.substring(slashIndex + 1);

		// Detect minimal vs standard encoding
		const isMinimal = payload.length % 2 === 0 && payload.length % 4 !== 0;
		const bytes = decodeBytewords(payload, isMinimal);

		return {
			success: true,
			data: { type, payload: bytes },
		};
	} catch (error) {
		return { success: false, error: (error as Error).message };
	}
};

/**
 * Simple CBOR encoder for common types
 * Note: Full CBOR implementation would use a library
 */
export class SimpleCBOREncoder {
	private buffer: number[] = [];

	/**
	 * Encode unsigned integer
	 */
	encodeUInt(value: number): void {
		if (value < 24) {
			this.buffer.push(value);
		} else if (value < 256) {
			this.buffer.push(24, value);
		} else if (value < 65536) {
			this.buffer.push(25, value >> 8, value & 0xff);
		} else {
			this.buffer.push(26, (value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
		}
	}

	/**
	 * Encode byte string
	 */
	encodeBytes(bytes: Uint8Array): void {
		const len = bytes.length;
		if (len < 24) {
			this.buffer.push(0x40 + len);
		} else if (len < 256) {
			this.buffer.push(0x58, len);
		} else if (len < 65536) {
			this.buffer.push(0x59, len >> 8, len & 0xff);
		}
		this.buffer.push(...bytes);
	}

	/**
	 * Encode text string
	 */
	encodeText(text: string): void {
		const bytes = new TextEncoder().encode(text);
		const len = bytes.length;
		if (len < 24) {
			this.buffer.push(0x60 + len);
		} else if (len < 256) {
			this.buffer.push(0x78, len);
		} else if (len < 65536) {
			this.buffer.push(0x79, len >> 8, len & 0xff);
		}
		this.buffer.push(...bytes);
	}

	/**
	 * Encode map start
	 */
	encodeMapStart(length: number): void {
		if (length < 24) {
			this.buffer.push(0xa0 + length);
		} else if (length < 256) {
			this.buffer.push(0xb8, length);
		}
	}

	/**
	 * Encode array start
	 */
	encodeArrayStart(length: number): void {
		if (length < 24) {
			this.buffer.push(0x80 + length);
		} else if (length < 256) {
			this.buffer.push(0x98, length);
		}
	}

	/**
	 * Encode CBOR tag
	 */
	encodeTag(tag: number): void {
		if (tag < 24) {
			this.buffer.push(0xc0 + tag);
		} else if (tag < 256) {
			this.buffer.push(0xd8, tag);
		} else if (tag < 65536) {
			this.buffer.push(0xd9, tag >> 8, tag & 0xff);
		} else {
			this.buffer.push(0xda, (tag >> 24) & 0xff, (tag >> 16) & 0xff, (tag >> 8) & 0xff, tag & 0xff);
		}
	}

	/**
	 * Get encoded bytes
	 */
	getBytes(): Uint8Array {
		return new Uint8Array(this.buffer);
	}

	/**
	 * Reset encoder
	 */
	reset(): void {
		this.buffer = [];
	}
}

/**
 * Create crypto-psbt UR
 *
 * @param psbtBytes - PSBT data as bytes
 * @returns UR string
 */
export const createCryptoPSBT = (psbtBytes: Uint8Array): string => {
	const encoder = new SimpleCBOREncoder();
	encoder.encodeTag(CBOR_TAGS['crypto-psbt']);
	encoder.encodeBytes(psbtBytes);
	return createURString(UR_TYPES.CRYPTO_PSBT, encoder.getBytes());
};

/**
 * Create eth-sign-request UR
 *
 * @param requestData - Ethereum signing request data
 * @returns UR string
 */
export const createEthSignRequest = (requestData: {
	requestId: Uint8Array;
	signData: Uint8Array;
	dataType: number;
	chainId?: number;
	derivationPath: string;
	address?: string;
}): string => {
	const encoder = new SimpleCBOREncoder();
	encoder.encodeTag(CBOR_TAGS['eth-sign-request']);

	// Map with request fields
	const fieldCount = 4 + (requestData.chainId ? 1 : 0) + (requestData.address ? 1 : 0);
	encoder.encodeMapStart(fieldCount);

	// Request ID (key: 1)
	encoder.encodeUInt(1);
	encoder.encodeBytes(requestData.requestId);

	// Sign data (key: 2)
	encoder.encodeUInt(2);
	encoder.encodeBytes(requestData.signData);

	// Data type (key: 3)
	encoder.encodeUInt(3);
	encoder.encodeUInt(requestData.dataType);

	// Chain ID (key: 4)
	if (requestData.chainId) {
		encoder.encodeUInt(4);
		encoder.encodeUInt(requestData.chainId);
	}

	// Derivation path (key: 5)
	encoder.encodeUInt(5);
	encoder.encodeText(requestData.derivationPath);

	// Address (key: 6)
	if (requestData.address) {
		encoder.encodeUInt(6);
		encoder.encodeText(requestData.address);
	}

	return createURString(UR_TYPES.ETH_SIGN_REQUEST, encoder.getBytes());
};

/**
 * Create sol-sign-request UR
 *
 * @param requestData - Solana signing request data
 * @returns UR string
 */
export const createSolSignRequest = (requestData: {
	requestId: Uint8Array;
	signData: Uint8Array;
	derivationPath: string;
	signType: number;
}): string => {
	const encoder = new SimpleCBOREncoder();
	encoder.encodeTag(CBOR_TAGS['sol-sign-request']);

	encoder.encodeMapStart(4);

	// Request ID
	encoder.encodeUInt(1);
	encoder.encodeBytes(requestData.requestId);

	// Sign data
	encoder.encodeUInt(2);
	encoder.encodeBytes(requestData.signData);

	// Derivation path
	encoder.encodeUInt(3);
	encoder.encodeText(requestData.derivationPath);

	// Sign type
	encoder.encodeUInt(4);
	encoder.encodeUInt(requestData.signType);

	return createURString(UR_TYPES.SOL_SIGN_REQUEST, encoder.getBytes());
};

/**
 * Create cosmos-sign-request UR
 *
 * @param requestData - Cosmos signing request data
 * @returns UR string
 */
export const createCosmosSignRequest = (requestData: {
	requestId: Uint8Array;
	signData: Uint8Array;
	derivationPath: string;
	dataType: number;
	addresses?: string[];
}): string => {
	const encoder = new SimpleCBOREncoder();
	encoder.encodeTag(CBOR_TAGS['cosmos-sign-request']);

	const fieldCount = 4 + (requestData.addresses ? 1 : 0);
	encoder.encodeMapStart(fieldCount);

	encoder.encodeUInt(1);
	encoder.encodeBytes(requestData.requestId);

	encoder.encodeUInt(2);
	encoder.encodeBytes(requestData.signData);

	encoder.encodeUInt(3);
	encoder.encodeText(requestData.derivationPath);

	encoder.encodeUInt(4);
	encoder.encodeUInt(requestData.dataType);

	if (requestData.addresses) {
		encoder.encodeUInt(5);
		encoder.encodeArrayStart(requestData.addresses.length);
		for (const addr of requestData.addresses) {
			encoder.encodeText(addr);
		}
	}

	return createURString(UR_TYPES.COSMOS_SIGN_REQUEST, encoder.getBytes());
};

/**
 * Validate UR type
 *
 * @param type - UR type to validate
 * @returns True if valid Keystone UR type
 */
export const isValidURType = (type: string): boolean => {
	return Object.values(UR_TYPES).includes(type);
};

/**
 * Get CBOR tag for UR type
 *
 * @param type - UR type
 * @returns CBOR tag number or undefined
 */
export const getCBORTagForType = (type: string): number | undefined => {
	return CBOR_TAGS[type as keyof typeof CBOR_TAGS];
};

/**
 * UR Codec class for stateful encoding/decoding
 */
export class URCodec {
	private fragmentBuffer: Map<number, string> = new Map();
	private expectedFragments: number | null = null;
	private urType: string | null = null;

	/**
	 * Process a UR fragment
	 *
	 * @param fragment - UR fragment string
	 * @returns Processing result
	 */
	processFragment(fragment: string): {
		complete: boolean;
		progress: number;
		result?: URData;
		error?: string;
	} {
		// Check for multipart UR
		const multipartMatch = fragment.match(/^ur:([^/]+)\/(\d+)-(\d+)\/(.+)$/i);

		if (multipartMatch) {
			const type = multipartMatch[1];
			const index = parseInt(multipartMatch[2], 10);
			const total = parseInt(multipartMatch[3], 10);
			const data = multipartMatch[4];

			if (this.urType && this.urType !== type) {
				return { complete: false, progress: 0, error: 'UR type mismatch' };
			}

			this.urType = type;
			this.expectedFragments = total;
			this.fragmentBuffer.set(index, data);

			const progress = (this.fragmentBuffer.size / total) * 100;

			if (this.fragmentBuffer.size === total) {
				// Merge all fragments
				const merged = this.mergeFragments();
				const parseResult = parseURString(`ur:${type}/${merged}`);

				if (parseResult.success && parseResult.data) {
					return { complete: true, progress: 100, result: parseResult.data };
				} else {
					return { complete: false, progress, error: parseResult.error };
				}
			}

			return { complete: false, progress };
		}

		// Single-part UR
		const parseResult = parseURString(fragment);
		if (parseResult.success && parseResult.data) {
			return { complete: true, progress: 100, result: parseResult.data };
		}

		return { complete: false, progress: 0, error: parseResult.error };
	}

	/**
	 * Merge collected fragments
	 */
	private mergeFragments(): string {
		const sorted = Array.from(this.fragmentBuffer.entries())
			.sort((a, b) => a[0] - b[0])
			.map((entry) => entry[1]);
		return sorted.join('');
	}

	/**
	 * Reset codec state
	 */
	reset(): void {
		this.fragmentBuffer.clear();
		this.expectedFragments = null;
		this.urType = null;
	}

	/**
	 * Get current progress
	 */
	getProgress(): number {
		if (!this.expectedFragments) return 0;
		return (this.fragmentBuffer.size / this.expectedFragments) * 100;
	}
}

export default {
	encodeBytewords,
	decodeBytewords,
	createURString,
	parseURString,
	createCryptoPSBT,
	createEthSignRequest,
	createSolSignRequest,
	createCosmosSignRequest,
	isValidURType,
	getCBORTagForType,
	SimpleCBOREncoder,
	URCodec,
};
