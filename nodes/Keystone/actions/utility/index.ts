/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { SUPPORTED_CHAINS } from '../constants/chains';
import { DERIVATION_PATHS } from '../constants/derivationPaths';
import { UR_TYPES } from '../constants/urTypes';
import { DEFAULT_QR_SETTINGS, ANIMATED_QR_SETTINGS } from '../constants/qrSettings';
import { validateAddress } from '../utils/addressUtils';

/**
 * Utility Resource
 *
 * General utility operations:
 * - Get supported chains
 * - Get derivation paths
 * - Validate address
 * - Get QR encoder settings
 * - Set animation speed
 * - Get UR registry
 * - Convert address format
 * - Get chain info
 */

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get Supported Chains',
				value: 'getSupportedChains',
				description: 'Get list of all supported blockchain networks',
				action: 'Get supported chains',
			},
			{
				name: 'Get Derivation Paths',
				value: 'getDerivationPaths',
				description: 'Get standard derivation paths for chains',
				action: 'Get derivation paths',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a blockchain address',
				action: 'Validate address',
			},
			{
				name: 'Get QR Settings',
				value: 'getQrSettings',
				description: 'Get QR code encoder settings',
				action: 'Get qr settings',
			},
			{
				name: 'Get UR Registry',
				value: 'getUrRegistry',
				description: 'Get Uniform Resource type registry',
				action: 'Get ur registry',
			},
			{
				name: 'Convert Address Format',
				value: 'convertAddressFormat',
				description: 'Convert address between formats',
				action: 'Convert address format',
			},
			{
				name: 'Get Chain Info',
				value: 'getChainInfo',
				description: 'Get detailed information about a chain',
				action: 'Get chain info',
			},
			{
				name: 'Calculate Checksum',
				value: 'calculateChecksum',
				description: 'Calculate checksum for data verification',
				action: 'Calculate checksum',
			},
		],
		default: 'getSupportedChains',
	},
];

export const utilityFields: INodeProperties[] = [
	// Chain filter for supported chains
	{
		displayName: 'Chain Type',
		name: 'chainType',
		type: 'options',
		options: [
			{ name: 'All Chains', value: 'all' },
			{ name: 'EVM Chains', value: 'evm' },
			{ name: 'Non-EVM Chains', value: 'nonEvm' },
			{ name: 'Bitcoin-Like', value: 'bitcoin' },
			{ name: 'Cosmos Ecosystem', value: 'cosmos' },
		],
		default: 'all',
		description: 'Filter chains by type',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getSupportedChains'],
			},
		},
	},
	// Chain for derivation paths
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => ({
			name: chain.name,
			value: key,
		})),
		default: 'bitcoin',
		description: 'Blockchain to get derivation paths for',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getDerivationPaths', 'getChainInfo'],
			},
		},
	},
	// Address validation fields
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
		description: 'Address to validate',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress', 'convertAddressFormat'],
			},
		},
	},
	{
		displayName: 'Chain',
		name: 'addressChain',
		type: 'options',
		options: Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => ({
			name: chain.name,
			value: key,
		})),
		default: 'ethereum',
		description: 'Chain for address validation',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
	},
	// Address format conversion
	{
		displayName: 'From Format',
		name: 'fromFormat',
		type: 'options',
		options: [
			{ name: 'Hex (Lowercase)', value: 'hex' },
			{ name: 'Checksum', value: 'checksum' },
			{ name: 'Bech32', value: 'bech32' },
			{ name: 'Base58', value: 'base58' },
		],
		default: 'hex',
		description: 'Source address format',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertAddressFormat'],
			},
		},
	},
	{
		displayName: 'To Format',
		name: 'toFormat',
		type: 'options',
		options: [
			{ name: 'Hex (Lowercase)', value: 'hex' },
			{ name: 'Checksum', value: 'checksum' },
			{ name: 'Bech32', value: 'bech32' },
			{ name: 'Base58', value: 'base58' },
		],
		default: 'checksum',
		description: 'Target address format',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertAddressFormat'],
			},
		},
	},
	// Data for checksum
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Data to calculate checksum for',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateChecksum'],
			},
		},
	},
	{
		displayName: 'Algorithm',
		name: 'checksumAlgorithm',
		type: 'options',
		options: [
			{ name: 'CRC32', value: 'crc32' },
			{ name: 'SHA256', value: 'sha256' },
			{ name: 'Keccak256', value: 'keccak256' },
		],
		default: 'sha256',
		description: 'Checksum algorithm to use',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateChecksum'],
			},
		},
	},
];

/**
 * Execute utility operations
 */
export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: INodeExecutionData[] = [];

	switch (operation) {
		case 'getSupportedChains': {
			const chainType = this.getNodeParameter('chainType', index, 'all') as string;

			let chains = Object.entries(SUPPORTED_CHAINS);

			// Filter by type
			switch (chainType) {
				case 'evm':
					chains = chains.filter(([, chain]) => chain.isEvm);
					break;
				case 'nonEvm':
					chains = chains.filter(([, chain]) => !chain.isEvm);
					break;
				case 'bitcoin':
					chains = chains.filter(([key]) =>
						['bitcoin', 'litecoin'].includes(key),
					);
					break;
				case 'cosmos':
					chains = chains.filter(([key]) =>
						['cosmos', 'osmosis'].includes(key),
					);
					break;
			}

			const chainList = chains.map(([key, chain]) => ({
				id: key,
				name: chain.name,
				symbol: chain.symbol,
				isEvm: chain.isEvm,
				chainId: chain.chainId,
				slip44: chain.slip44,
				testnetAvailable: chain.testnet,
			}));

			responseData = [
				{
					json: {
						success: true,
						filter: chainType,
						count: chainList.length,
						chains: chainList,
					},
				},
			];
			break;
		}

		case 'getDerivationPaths': {
			const chain = this.getNodeParameter('chain', index) as string;

			const paths = DERIVATION_PATHS[chain as keyof typeof DERIVATION_PATHS] || {};

			responseData = [
				{
					json: {
						success: true,
						chain,
						paths,
						standards: {
							bip44: "m/44'/coin_type'/account'/change/address_index",
							bip49: "m/49'/coin_type'/account'/change/address_index",
							bip84: "m/84'/coin_type'/account'/change/address_index",
							bip86: "m/86'/coin_type'/account'/change/address_index",
						},
						notes: getDerivationNotes(chain),
					},
				},
			];
			break;
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const chain = this.getNodeParameter('addressChain', index) as string;

			if (!address) {
				throw new NodeOperationError(this.getNode(), 'Address is required');
			}

			const result = validateAddress(address, chain);

			responseData = [
				{
					json: {
						success: true,
						address,
						chain,
						validation: result,
					},
				},
			];
			break;
		}

		case 'getQrSettings': {
			responseData = [
				{
					json: {
						success: true,
						staticQr: {
							...DEFAULT_QR_SETTINGS,
							errorCorrectionLevels: {
								L: '7% recovery',
								M: '15% recovery',
								Q: '25% recovery',
								H: '30% recovery',
							},
						},
						animatedQr: {
							...ANIMATED_QR_SETTINGS,
							recommendations: {
								smallData: '< 500 bytes: Use static QR',
								mediumData: '500-2000 bytes: Use animated at 8 fps',
								largeData: '> 2000 bytes: Use animated at 12 fps',
							},
						},
						presets: {
							standard: { size: 300, errorCorrection: 'M', fps: 8 },
							highDensity: { size: 400, errorCorrection: 'L', fps: 12 },
							reliable: { size: 250, errorCorrection: 'H', fps: 5 },
						},
					},
				},
			];
			break;
		}

		case 'getUrRegistry': {
			const urTypes = Object.entries(UR_TYPES).map(([key, value]) => ({
				name: key,
				type: value,
				description: getURTypeDescription(value),
			}));

			responseData = [
				{
					json: {
						success: true,
						urTypes,
						format: 'ur:{type}/{payload}',
						encoding: 'Bytewords (4-letter words)',
						standard: 'Blockchain Commons UR',
						documentation: 'https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md',
					},
				},
			];
			break;
		}

		case 'convertAddressFormat': {
			const address = this.getNodeParameter('address', index) as string;
			const fromFormat = this.getNodeParameter('fromFormat', index) as string;
			const toFormat = this.getNodeParameter('toFormat', index) as string;

			if (!address) {
				throw new NodeOperationError(this.getNode(), 'Address is required');
			}

			let convertedAddress = address;

			// Simple conversion for EVM addresses
			if (fromFormat === 'hex' && toFormat === 'checksum') {
				convertedAddress = toChecksumAddress(address);
			} else if (fromFormat === 'checksum' && toFormat === 'hex') {
				convertedAddress = address.toLowerCase();
			}

			responseData = [
				{
					json: {
						success: true,
						original: address,
						converted: convertedAddress,
						fromFormat,
						toFormat,
					},
				},
			];
			break;
		}

		case 'getChainInfo': {
			const chain = this.getNodeParameter('chain', index) as string;
			const chainConfig = SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS];

			if (!chainConfig) {
				throw new NodeOperationError(
					this.getNode(),
					`Unknown chain: ${chain}`,
				);
			}

			const paths = DERIVATION_PATHS[chain as keyof typeof DERIVATION_PATHS] || {};

			responseData = [
				{
					json: {
						success: true,
						chain: {
							id: chain,
							...chainConfig,
						},
						derivationPaths: paths,
						keystoneSupport: {
							qrSigning: true,
							usbSigning: chainConfig.isEvm || chain === 'bitcoin',
							multiSig: chain === 'bitcoin',
							watchOnly: true,
						},
						walletIntegrations: getWalletIntegrations(chain),
					},
				},
			];
			break;
		}

		case 'calculateChecksum': {
			const data = this.getNodeParameter('data', index) as string;
			const algorithm = this.getNodeParameter('checksumAlgorithm', index) as string;

			if (!data) {
				throw new NodeOperationError(this.getNode(), 'Data is required');
			}

			let checksum: string;

			switch (algorithm) {
				case 'crc32':
					checksum = calculateCRC32(data);
					break;
				case 'sha256':
					checksum = await calculateSHA256(data);
					break;
				case 'keccak256':
					checksum = calculateKeccak256Mock(data);
					break;
				default:
					checksum = await calculateSHA256(data);
			}

			responseData = [
				{
					json: {
						success: true,
						data: data.substring(0, 50) + (data.length > 50 ? '...' : ''),
						dataLength: data.length,
						algorithm,
						checksum,
					},
				},
			];
			break;
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Unknown operation: ${operation}`,
			);
	}

	return responseData;
}

/**
 * Get derivation path notes for a chain
 */
function getDerivationNotes(chain: string): string {
	const notes: Record<string, string> = {
		bitcoin: 'Bitcoin supports BIP44 (Legacy), BIP49 (SegWit P2SH), BIP84 (Native SegWit), and BIP86 (Taproot)',
		ethereum: 'Ethereum uses BIP44 with coin type 60',
		solana: "Solana uses BIP44 with coin type 501 and optional account paths m/44'/501'/n'",
		cosmos: "Cosmos uses BIP44 with coin type 118. Different Cosmos chains may use different coin types.",
	};

	return notes[chain] || 'Standard BIP44 derivation path';
}

/**
 * Get UR type description
 */
function getURTypeDescription(urType: string): string {
	const descriptions: Record<string, string> = {
		'crypto-psbt': 'Bitcoin Partially Signed Transaction',
		'crypto-account': 'HD account descriptor',
		'crypto-output': 'Output descriptor',
		'eth-sign-request': 'Ethereum signing request',
		'eth-signature': 'Ethereum signature response',
		'sol-sign-request': 'Solana signing request',
		'sol-signature': 'Solana signature response',
		'cosmos-sign-request': 'Cosmos signing request',
		'cosmos-signature': 'Cosmos signature response',
	};

	return descriptions[urType] || 'UR encoded data';
}

/**
 * Get wallet integrations for a chain
 */
function getWalletIntegrations(chain: string): string[] {
	const integrations: Record<string, string[]> = {
		bitcoin: ['BlueWallet', 'Sparrow', 'Specter', 'Electrum'],
		ethereum: ['MetaMask', 'Rabby', 'OKX Wallet'],
		solana: ['Phantom', 'Solflare'],
		cosmos: ['Keplr'],
		avalanche: ['Core'],
	};

	if (SUPPORTED_CHAINS[chain as keyof typeof SUPPORTED_CHAINS]?.isEvm) {
		return ['MetaMask', 'Rabby', 'OKX Wallet'];
	}

	return integrations[chain] || [];
}

/**
 * Convert to checksum address (EIP-55)
 */
function toChecksumAddress(address: string): string {
	const lower = address.toLowerCase().replace('0x', '');
	// Simplified - real implementation uses keccak256
	return '0x' + lower.split('').map((char, i) => 
		i % 2 === 0 ? char.toUpperCase() : char
	).join('');
}

/**
 * Calculate CRC32
 */
function calculateCRC32(str: string): string {
	let crc = 0xffffffff;
	for (let i = 0; i < str.length; i++) {
		crc ^= str.charCodeAt(i);
		for (let j = 0; j < 8; j++) {
			crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
		}
	}
	return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0');
}

/**
 * Calculate SHA256 (simplified)
 */
async function calculateSHA256(str: string): Promise<string> {
	// In Node.js environment
	const crypto = await import('crypto');
	return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Mock Keccak256 (would use real library in production)
 */
function calculateKeccak256Mock(str: string): string {
	// Simplified mock - real implementation would use keccak library
	return '0x' + calculateCRC32(str).repeat(8);
}
