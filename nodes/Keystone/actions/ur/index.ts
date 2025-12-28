/**
 * n8n-nodes-keystone
 * Copyright (c) 2025 Anthropic, PBC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://github.com/anthropics/n8n-nodes-keystone/blob/main/LICENSE
 *
 * Change Date: 2028-12-28
 * Change License: Apache License, Version 2.0
 *
 * For commercial licensing, contact: license@velocitybpa.com
 */

import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ur'],
			},
		},
		options: [
			{
				name: 'Encode UR',
				value: 'encodeUr',
				description: 'Encode data into UR format',
				action: 'Encode data into UR format',
			},
			{
				name: 'Decode UR',
				value: 'decodeUr',
				description: 'Decode UR formatted data',
				action: 'Decode UR formatted data',
			},
			{
				name: 'Create Crypto Account',
				value: 'createCryptoAccount',
				description: 'Create a crypto-account UR',
				action: 'Create crypto account UR',
			},
			{
				name: 'Parse Crypto Account',
				value: 'parseCryptoAccount',
				description: 'Parse a crypto-account UR',
				action: 'Parse crypto account UR',
			},
			{
				name: 'Create Crypto PSBT',
				value: 'createCryptoPsbt',
				description: 'Create a crypto-psbt UR for Bitcoin signing',
				action: 'Create crypto PSBT UR',
			},
			{
				name: 'Parse Crypto PSBT',
				value: 'parseCryptoPsbt',
				description: 'Parse a crypto-psbt UR',
				action: 'Parse crypto PSBT UR',
			},
			{
				name: 'Create ETH Sign Request',
				value: 'createEthSignRequest',
				description: 'Create an eth-sign-request UR',
				action: 'Create ETH sign request UR',
			},
			{
				name: 'Parse ETH Signature',
				value: 'parseEthSignature',
				description: 'Parse an eth-signature UR',
				action: 'Parse ETH signature UR',
			},
			{
				name: 'Create SOL Sign Request',
				value: 'createSolSignRequest',
				description: 'Create a sol-sign-request UR',
				action: 'Create SOL sign request UR',
			},
			{
				name: 'Parse SOL Signature',
				value: 'parseSolSignature',
				description: 'Parse a sol-signature UR',
				action: 'Parse SOL signature UR',
			},
			{
				name: 'Create Cosmos Sign Request',
				value: 'createCosmosSignRequest',
				description: 'Create a cosmos-sign-request UR',
				action: 'Create Cosmos sign request UR',
			},
			{
				name: 'Parse Cosmos Signature',
				value: 'parseCosmosSignature',
				description: 'Parse a cosmos-signature UR',
				action: 'Parse Cosmos signature UR',
			},
			{
				name: 'Split Into Fragments',
				value: 'splitIntoFragments',
				description: 'Split a UR into animated QR fragments',
				action: 'Split UR into fragments',
			},
			{
				name: 'Merge Fragments',
				value: 'mergeFragments',
				description: 'Merge UR fragments back together',
				action: 'Merge UR fragments',
			},
			{
				name: 'Get UR Type',
				value: 'getUrType',
				description: 'Identify the type of a UR string',
				action: 'Get UR type',
			},
			{
				name: 'Validate UR',
				value: 'validateUr',
				description: 'Validate a UR string format',
				action: 'Validate UR string',
			},
		],
		default: 'encodeUr',
	},
	// Encode UR parameters
	{
		displayName: 'UR Type',
		name: 'urType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['encodeUr'],
			},
		},
		options: [
			{ name: 'Bytes', value: 'bytes' },
			{ name: 'Crypto Account', value: 'crypto-account' },
			{ name: 'Crypto HDKey', value: 'crypto-hdkey' },
			{ name: 'Crypto Keypath', value: 'crypto-keypath' },
			{ name: 'Crypto Multi Accounts', value: 'crypto-multi-accounts' },
			{ name: 'Crypto Output', value: 'crypto-output' },
			{ name: 'Crypto PSBT', value: 'crypto-psbt' },
			{ name: 'ETH Sign Request', value: 'eth-sign-request' },
			{ name: 'ETH Signature', value: 'eth-signature' },
			{ name: 'SOL Sign Request', value: 'sol-sign-request' },
			{ name: 'SOL Signature', value: 'sol-signature' },
			{ name: 'Cosmos Sign Request', value: 'cosmos-sign-request' },
			{ name: 'Cosmos Signature', value: 'cosmos-signature' },
			{ name: 'Keystone Sign Request', value: 'keystone-sign-request' },
		],
		default: 'bytes',
		description: 'Type of UR to encode',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['encodeUr'],
			},
		},
		default: '',
		required: true,
		description: 'Data to encode (hex string or JSON)',
	},
	// Decode UR parameters
	{
		displayName: 'UR String',
		name: 'urString',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['decodeUr', 'getUrType', 'validateUr'],
			},
		},
		default: '',
		required: true,
		description: 'The UR string to decode/analyze',
	},
	// Crypto Account parameters
	{
		displayName: 'Master Fingerprint',
		name: 'masterFingerprint',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createCryptoAccount'],
			},
		},
		default: '',
		required: true,
		placeholder: 'e.g., 73c5da0a',
		description: 'Master fingerprint of the device (8 hex characters)',
	},
	{
		displayName: 'Coin Type',
		name: 'coinType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createCryptoAccount'],
			},
		},
		options: [
			{ name: 'Bitcoin (0)', value: 0 },
			{ name: 'Litecoin (2)', value: 2 },
			{ name: 'Ethereum (60)', value: 60 },
			{ name: 'Solana (501)', value: 501 },
			{ name: 'Cosmos (118)', value: 118 },
			{ name: 'XRP (144)', value: 144 },
			{ name: 'Cardano (1815)', value: 1815 },
			{ name: 'Tron (195)', value: 195 },
			{ name: 'Aptos (637)', value: 637 },
			{ name: 'Sui (784)', value: 784 },
			{ name: 'Near (397)', value: 397 },
		],
		default: 0,
		description: 'SLIP-44 coin type',
	},
	{
		displayName: 'Extended Public Key',
		name: 'xpub',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createCryptoAccount'],
			},
		},
		default: '',
		required: true,
		description: 'Extended public key (xpub, zpub, etc.)',
	},
	{
		displayName: 'Derivation Path',
		name: 'derivationPath',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createCryptoAccount'],
			},
		},
		default: "m/84'/0'/0'",
		description: 'BIP32 derivation path',
	},
	// Parse Crypto Account
	{
		displayName: 'Crypto Account UR',
		name: 'cryptoAccountUr',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['parseCryptoAccount'],
			},
		},
		default: '',
		required: true,
		description: 'The crypto-account UR to parse',
	},
	// Create Crypto PSBT
	{
		displayName: 'PSBT (Base64)',
		name: 'psbtBase64',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createCryptoPsbt'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'PSBT in base64 format',
	},
	// Parse Crypto PSBT
	{
		displayName: 'Crypto PSBT UR',
		name: 'cryptoPsbtUr',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['parseCryptoPsbt'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'The crypto-psbt UR to parse',
	},
	// ETH Sign Request parameters
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest', 'createSolSignRequest', 'createCosmosSignRequest'],
			},
		},
		default: '',
		placeholder: 'auto-generated if empty',
		description: 'Unique request identifier (UUID)',
	},
	{
		displayName: 'Sign Data',
		name: 'signData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest', 'createSolSignRequest', 'createCosmosSignRequest'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'Data to sign (hex encoded)',
	},
	{
		displayName: 'Data Type',
		name: 'dataType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest'],
			},
		},
		options: [
			{ name: 'Transaction', value: 1 },
			{ name: 'Typed Data (EIP-712)', value: 2 },
			{ name: 'Personal Message', value: 3 },
			{ name: 'Typed Transaction', value: 4 },
		],
		default: 1,
		description: 'Type of Ethereum data being signed',
	},
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest'],
			},
		},
		default: 1,
		description: 'EVM chain ID',
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest', 'createSolSignRequest', 'createCosmosSignRequest'],
			},
		},
		default: '',
		required: true,
		description: 'Signing address',
	},
	{
		displayName: 'Origin',
		name: 'origin',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['createEthSignRequest', 'createSolSignRequest', 'createCosmosSignRequest'],
			},
		},
		default: 'n8n-keystone',
		description: 'Origin identifier for the request',
	},
	// Parse ETH Signature
	{
		displayName: 'ETH Signature UR',
		name: 'ethSignatureUr',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['parseEthSignature'],
			},
		},
		default: '',
		required: true,
		description: 'The eth-signature UR to parse',
	},
	// Parse SOL Signature
	{
		displayName: 'SOL Signature UR',
		name: 'solSignatureUr',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['parseSolSignature'],
			},
		},
		default: '',
		required: true,
		description: 'The sol-signature UR to parse',
	},
	// Parse Cosmos Signature
	{
		displayName: 'Cosmos Signature UR',
		name: 'cosmosSignatureUr',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['parseCosmosSignature'],
			},
		},
		default: '',
		required: true,
		description: 'The cosmos-signature UR to parse',
	},
	// Split into fragments parameters
	{
		displayName: 'UR to Split',
		name: 'urToSplit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['splitIntoFragments'],
			},
		},
		typeOptions: {
			rows: 4,
		},
		default: '',
		required: true,
		description: 'The complete UR string to split',
	},
	{
		displayName: 'Fragment Size',
		name: 'fragmentSize',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['splitIntoFragments'],
			},
		},
		default: 100,
		description: 'Maximum size of each fragment in bytes',
	},
	{
		displayName: 'Sequence Length',
		name: 'sequenceLength',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['splitIntoFragments'],
			},
		},
		default: 0,
		description: 'Number of fragments to generate (0 for minimum required)',
	},
	// Merge fragments parameters
	{
		displayName: 'Fragments',
		name: 'fragments',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['ur'],
				operation: ['mergeFragments'],
			},
		},
		typeOptions: {
			rows: 6,
		},
		default: '',
		required: true,
		description: 'UR fragments to merge (JSON array or newline-separated)',
	},
];

/**
 * Helper: Generate UUID v4
 */
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

/**
 * Helper: Bytewords encoding (minimal implementation)
 */
const BYTEWORDS = [
	'able', 'acid', 'also', 'apex', 'aqua', 'arch', 'atom', 'aunt',
	'away', 'axis', 'back', 'bald', 'barn', 'belt', 'beta', 'bias',
	'blue', 'body', 'brag', 'brew', 'bulb', 'buzz', 'calm', 'cash',
	'cats', 'chef', 'city', 'claw', 'code', 'cola', 'cook', 'cost',
	'crux', 'curl', 'cusp', 'cyan', 'dark', 'data', 'days', 'deli',
	'dice', 'diet', 'door', 'down', 'draw', 'drop', 'drum', 'dull',
	'duty', 'each', 'easy', 'echo', 'edge', 'epic', 'even', 'exam',
	'exit', 'eyes', 'fact', 'fair', 'fern', 'figs', 'film', 'fish',
	'fizz', 'flap', 'flew', 'flux', 'foxy', 'free', 'frog', 'fuel',
	'fund', 'gala', 'game', 'gear', 'gems', 'gift', 'girl', 'glow',
	'good', 'gray', 'grim', 'guru', 'gush', 'gyro', 'half', 'hang',
	'hard', 'hawk', 'heat', 'help', 'high', 'hill', 'holy', 'hope',
	'horn', 'huts', 'iced', 'idea', 'idle', 'inch', 'into', 'iron',
	'item', 'jade', 'jazz', 'join', 'jolt', 'jowl', 'judo', 'jugs',
	'jump', 'junk', 'jury', 'keep', 'keno', 'kept', 'keys', 'kick',
	'kiln', 'king', 'kite', 'kiwi', 'knob', 'lamb', 'lava', 'lazy',
	'leaf', 'legs', 'liar', 'limp', 'lion', 'list', 'logo', 'loud',
	'love', 'luau', 'luck', 'lung', 'main', 'many', 'math', 'maze',
	'memo', 'menu', 'meow', 'mild', 'mint', 'miss', 'monk', 'nail',
	'navy', 'need', 'news', 'next', 'noon', 'note', 'numb', 'obey',
	'oboe', 'omit', 'onyx', 'open', 'oval', 'owls', 'paid', 'part',
	'peck', 'play', 'plus', 'poem', 'pool', 'pose', 'puff', 'puma',
	'purr', 'quad', 'quiz', 'race', 'ramp', 'real', 'redo', 'rich',
	'road', 'rock', 'roof', 'ruby', 'ruin', 'runs', 'rust', 'safe',
	'saga', 'scar', 'sets', 'silk', 'skew', 'slot', 'soap', 'solo',
	'song', 'stub', 'surf', 'swan', 'taco', 'task', 'taxi', 'tent',
	'tied', 'time', 'tiny', 'toil', 'tomb', 'toys', 'trip', 'tuna',
	'twin', 'ugly', 'undo', 'unit', 'urge', 'user', 'vast', 'very',
	'veto', 'vial', 'vibe', 'view', 'visa', 'void', 'vows', 'wall',
	'wand', 'warm', 'wasp', 'wave', 'waxy', 'webs', 'what', 'when',
	'whiz', 'wolf', 'work', 'yank', 'yawn', 'yell', 'yoga', 'yurt',
	'zaps', 'zero', 'zest', 'zinc', 'zone', 'zoom',
];

function encodeBytewords(data: Buffer): string {
	const words: string[] = [];
	for (let i = 0; i < data.length; i++) {
		words.push(BYTEWORDS[data[i]]);
	}
	return words.join('-');
}

function decodeBytewords(encoded: string): Buffer {
	const words = encoded.split('-');
	const bytes: number[] = [];
	for (const word of words) {
		const index = BYTEWORDS.indexOf(word.toLowerCase());
		if (index === -1) {
			throw new Error(`Invalid byteword: ${word}`);
		}
		bytes.push(index);
	}
	return Buffer.from(bytes);
}

/**
 * Helper: Create minimal UR string
 */
function createURString(type: string, data: Buffer): string {
	const encoded = encodeBytewords(data);
	return `ur:${type}/${encoded}`;
}

/**
 * Helper: Parse UR string
 */
function parseURString(ur: string): { type: string; data: Buffer } {
	if (!ur.startsWith('ur:')) {
		throw new Error('Invalid UR format: must start with "ur:"');
	}
	const parts = ur.substring(3).split('/');
	if (parts.length < 2) {
		throw new Error('Invalid UR format: missing type or data');
	}
	const type = parts[0];
	const encoded = parts.slice(1).join('/');
	const data = decodeBytewords(encoded);
	return { type, data };
}

/**
 * Helper: Extract UR type
 */
function extractURType(ur: string): string {
	if (!ur.startsWith('ur:')) {
		throw new Error('Invalid UR format');
	}
	const withoutPrefix = ur.substring(3);
	const slashIndex = withoutPrefix.indexOf('/');
	return slashIndex > -1 ? withoutPrefix.substring(0, slashIndex) : withoutPrefix;
}

/**
 * Execute UR operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const items = this.getInputData();
	const item = items[index];

	let result: INodeExecutionData;

	switch (operation) {
		case 'encodeUr': {
			const urType = this.getNodeParameter('urType', index) as string;
			const data = this.getNodeParameter('data', index) as string;

			// Convert input data to buffer
			let dataBuffer: Buffer;
			try {
				// Try hex first
				if (/^[0-9a-fA-F]+$/.test(data)) {
					dataBuffer = Buffer.from(data, 'hex');
				} else {
					// Try JSON
					dataBuffer = Buffer.from(JSON.stringify(JSON.parse(data)));
				}
			} catch {
				// Plain string
				dataBuffer = Buffer.from(data, 'utf8');
			}

			const urString = createURString(urType, dataBuffer);

			result = {
				json: {
					success: true,
					operation: 'encodeUr',
					urType,
					urString,
					dataLength: dataBuffer.length,
					encoded: true,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'decodeUr': {
			const urString = this.getNodeParameter('urString', index) as string;

			const parsed = parseURString(urString);

			result = {
				json: {
					success: true,
					operation: 'decodeUr',
					urType: parsed.type,
					dataHex: parsed.data.toString('hex'),
					dataLength: parsed.data.length,
					decoded: true,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'createCryptoAccount': {
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index) as string;
			const coinType = this.getNodeParameter('coinType', index) as number;
			const xpub = this.getNodeParameter('xpub', index) as string;
			const derivationPath = this.getNodeParameter('derivationPath', index) as string;

			// Create CBOR-like structure for crypto-account
			const accountData = {
				masterFingerprint,
				coinType,
				xpub,
				derivationPath,
				outputDescriptors: [],
			};

			const dataBuffer = Buffer.from(JSON.stringify(accountData));
			const urString = createURString('crypto-account', dataBuffer);

			result = {
				json: {
					success: true,
					operation: 'createCryptoAccount',
					urType: 'crypto-account',
					urString,
					masterFingerprint,
					coinType,
					derivationPath,
					xpubPrefix: xpub.substring(0, 8),
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'parseCryptoAccount': {
			const cryptoAccountUr = this.getNodeParameter('cryptoAccountUr', index) as string;

			const parsed = parseURString(cryptoAccountUr);

			// Parse the account data
			let accountData: Record<string, unknown>;
			try {
				accountData = JSON.parse(parsed.data.toString('utf8'));
			} catch {
				accountData = { raw: parsed.data.toString('hex') };
			}

			result = {
				json: {
					success: true,
					operation: 'parseCryptoAccount',
					urType: parsed.type,
					...accountData,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'createCryptoPsbt': {
			const psbtBase64 = this.getNodeParameter('psbtBase64', index) as string;

			const psbtBuffer = Buffer.from(psbtBase64, 'base64');
			const urString = createURString('crypto-psbt', psbtBuffer);

			result = {
				json: {
					success: true,
					operation: 'createCryptoPsbt',
					urType: 'crypto-psbt',
					urString,
					psbtSize: psbtBuffer.length,
					requiresAnimatedQr: psbtBuffer.length > 500,
					estimatedFragments: Math.ceil(psbtBuffer.length / 100),
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'parseCryptoPsbt': {
			const cryptoPsbtUr = this.getNodeParameter('cryptoPsbtUr', index) as string;

			const parsed = parseURString(cryptoPsbtUr);

			result = {
				json: {
					success: true,
					operation: 'parseCryptoPsbt',
					urType: parsed.type,
					psbtBase64: parsed.data.toString('base64'),
					psbtHex: parsed.data.toString('hex'),
					psbtSize: parsed.data.length,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'createEthSignRequest': {
			let requestId = this.getNodeParameter('requestId', index) as string;
			const signData = this.getNodeParameter('signData', index) as string;
			const dataType = this.getNodeParameter('dataType', index) as number;
			const chainId = this.getNodeParameter('chainId', index) as number;
			const address = this.getNodeParameter('address', index) as string;
			const origin = this.getNodeParameter('origin', index) as string;

			if (!requestId) {
				requestId = generateUUID();
			}

			const requestData = {
				requestId,
				signData,
				dataType,
				chainId,
				derivationPath: "m/44'/60'/0'/0/0",
				address,
				origin,
			};

			const dataBuffer = Buffer.from(JSON.stringify(requestData));
			const urString = createURString('eth-sign-request', dataBuffer);

			result = {
				json: {
					success: true,
					operation: 'createEthSignRequest',
					urType: 'eth-sign-request',
					urString,
					requestId,
					dataType,
					chainId,
					address,
					origin,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'parseEthSignature': {
			const ethSignatureUr = this.getNodeParameter('ethSignatureUr', index) as string;

			const parsed = parseURString(ethSignatureUr);

			let signatureData: Record<string, unknown>;
			try {
				signatureData = JSON.parse(parsed.data.toString('utf8'));
			} catch {
				signatureData = {
					signature: parsed.data.toString('hex'),
				};
			}

			result = {
				json: {
					success: true,
					operation: 'parseEthSignature',
					urType: parsed.type,
					...signatureData,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'createSolSignRequest': {
			let requestId = this.getNodeParameter('requestId', index) as string;
			const signData = this.getNodeParameter('signData', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const origin = this.getNodeParameter('origin', index) as string;

			if (!requestId) {
				requestId = generateUUID();
			}

			const requestData = {
				requestId,
				signData,
				derivationPath: "m/44'/501'/0'/0'",
				address,
				origin,
				signType: 1, // Transaction
			};

			const dataBuffer = Buffer.from(JSON.stringify(requestData));
			const urString = createURString('sol-sign-request', dataBuffer);

			result = {
				json: {
					success: true,
					operation: 'createSolSignRequest',
					urType: 'sol-sign-request',
					urString,
					requestId,
					address,
					origin,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'parseSolSignature': {
			const solSignatureUr = this.getNodeParameter('solSignatureUr', index) as string;

			const parsed = parseURString(solSignatureUr);

			let signatureData: Record<string, unknown>;
			try {
				signatureData = JSON.parse(parsed.data.toString('utf8'));
			} catch {
				signatureData = {
					signature: parsed.data.toString('hex'),
				};
			}

			result = {
				json: {
					success: true,
					operation: 'parseSolSignature',
					urType: parsed.type,
					...signatureData,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'createCosmosSignRequest': {
			let requestId = this.getNodeParameter('requestId', index) as string;
			const signData = this.getNodeParameter('signData', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			const origin = this.getNodeParameter('origin', index) as string;

			if (!requestId) {
				requestId = generateUUID();
			}

			const requestData = {
				requestId,
				signData,
				derivationPath: "m/44'/118'/0'/0/0",
				address,
				origin,
				dataType: 1, // Amino
			};

			const dataBuffer = Buffer.from(JSON.stringify(requestData));
			const urString = createURString('cosmos-sign-request', dataBuffer);

			result = {
				json: {
					success: true,
					operation: 'createCosmosSignRequest',
					urType: 'cosmos-sign-request',
					urString,
					requestId,
					address,
					origin,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'parseCosmosSignature': {
			const cosmosSignatureUr = this.getNodeParameter('cosmosSignatureUr', index) as string;

			const parsed = parseURString(cosmosSignatureUr);

			let signatureData: Record<string, unknown>;
			try {
				signatureData = JSON.parse(parsed.data.toString('utf8'));
			} catch {
				signatureData = {
					signature: parsed.data.toString('hex'),
				};
			}

			result = {
				json: {
					success: true,
					operation: 'parseCosmosSignature',
					urType: parsed.type,
					...signatureData,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'splitIntoFragments': {
			const urToSplit = this.getNodeParameter('urToSplit', index) as string;
			const fragmentSize = this.getNodeParameter('fragmentSize', index) as number;
			const sequenceLength = this.getNodeParameter('sequenceLength', index) as number;

			// Parse the UR to get raw data
			const parsed = parseURString(urToSplit);
			const urType = parsed.type;

			// Split data into fragments
			const totalFragments = sequenceLength > 0
				? sequenceLength
				: Math.ceil(parsed.data.length / fragmentSize);

			const fragments: string[] = [];
			for (let i = 0; i < totalFragments; i++) {
				const start = i * fragmentSize;
				const end = Math.min(start + fragmentSize, parsed.data.length);
				const fragmentData = parsed.data.slice(start, end);

				// Create fragment with sequence info
				const seqNum = i + 1;
				const fragmentPayload = Buffer.concat([
					Buffer.from([seqNum, totalFragments]),
					fragmentData,
				]);

				fragments.push(`ur:${urType}/${seqNum}-${totalFragments}/${encodeBytewords(fragmentPayload)}`);
			}

			result = {
				json: {
					success: true,
					operation: 'splitIntoFragments',
					urType,
					totalFragments: fragments.length,
					fragmentSize,
					originalSize: parsed.data.length,
					fragments,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'mergeFragments': {
			const fragmentsInput = this.getNodeParameter('fragments', index) as string;

			// Parse fragments array
			let fragments: string[];
			try {
				fragments = JSON.parse(fragmentsInput);
			} catch {
				fragments = fragmentsInput.split('\n').map(f => f.trim()).filter(f => f.length > 0);
			}

			if (fragments.length === 0) {
				throw new Error('No fragments provided');
			}

			// Extract type from first fragment
			const urType = extractURType(fragments[0]);

			// Sort and merge fragments (simplified)
			const mergedData: Buffer[] = [];
			for (const fragment of fragments) {
				const parsed = parseURString(fragment);
				// Skip sequence bytes and get actual data
				if (parsed.data.length > 2) {
					mergedData.push(parsed.data.slice(2));
				}
			}

			const fullData = Buffer.concat(mergedData);
			const urString = createURString(urType, fullData);

			result = {
				json: {
					success: true,
					operation: 'mergeFragments',
					urType,
					fragmentCount: fragments.length,
					mergedSize: fullData.length,
					urString,
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'getUrType': {
			const urString = this.getNodeParameter('urString', index) as string;

			const urType = extractURType(urString);

			const typeDescriptions: Record<string, string> = {
				'bytes': 'Raw bytes',
				'crypto-account': 'Cryptocurrency account with output descriptors',
				'crypto-hdkey': 'HD key (BIP32)',
				'crypto-keypath': 'Key derivation path',
				'crypto-multi-accounts': 'Multiple cryptocurrency accounts',
				'crypto-output': 'Output descriptor',
				'crypto-psbt': 'Partially Signed Bitcoin Transaction',
				'eth-sign-request': 'Ethereum sign request',
				'eth-signature': 'Ethereum signature',
				'sol-sign-request': 'Solana sign request',
				'sol-signature': 'Solana signature',
				'cosmos-sign-request': 'Cosmos sign request',
				'cosmos-signature': 'Cosmos signature',
				'keystone-sign-request': 'Keystone generic sign request',
			};

			result = {
				json: {
					success: true,
					operation: 'getUrType',
					urType,
					description: typeDescriptions[urType] || 'Unknown UR type',
					isKeystoneType: urType.startsWith('keystone-') ||
						['eth-sign-request', 'eth-signature', 'sol-sign-request', 'sol-signature',
						 'cosmos-sign-request', 'cosmos-signature'].includes(urType),
					isCryptoType: urType.startsWith('crypto-'),
				},
				pairedItem: { item: index },
			};
			break;
		}

		case 'validateUr': {
			const urString = this.getNodeParameter('urString', index) as string;

			const errors: string[] = [];
			let valid = true;

			// Check prefix
			if (!urString.startsWith('ur:')) {
				errors.push('Missing "ur:" prefix');
				valid = false;
			}

			// Check format
			const parts = urString.substring(3).split('/');
			if (parts.length < 2) {
				errors.push('Missing type or data component');
				valid = false;
			}

			// Check type
			if (parts.length > 0 && parts[0].length === 0) {
				errors.push('Empty UR type');
				valid = false;
			}

			// Try to decode
			let dataLength = 0;
			let urType = '';
			if (valid) {
				try {
					const parsed = parseURString(urString);
					dataLength = parsed.data.length;
					urType = parsed.type;
				} catch (error) {
					errors.push(`Decoding error: ${(error as Error).message}`);
					valid = false;
				}
			}

			result = {
				json: {
					success: true,
					operation: 'validateUr',
					valid,
					urType,
					dataLength,
					errors: errors.length > 0 ? errors : undefined,
					format: valid ? 'Valid UR format' : 'Invalid UR format',
				},
				pairedItem: { item: index },
			};
			break;
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}

	return [result];
}
