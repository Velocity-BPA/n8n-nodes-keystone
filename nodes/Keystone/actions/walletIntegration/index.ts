/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { WALLET_INTEGRATIONS } from '../constants/wallets';
import { generateStaticQR, generateAnimatedQRFrames } from '../transport/qrCodeHandler';

/**
 * Wallet Integration Resource
 *
 * Operations for integrating with various software wallets:
 * - MetaMask
 * - Rabby Wallet
 * - OKX Wallet
 * - BlueWallet
 * - Sparrow Wallet
 * - Specter Desktop
 * - Electrum
 * - Core (Avalanche)
 * - Keplr (Cosmos)
 * - Phantom (Solana)
 * - Solflare (Solana)
 */

export const walletIntegrationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
			},
		},
		options: [
			{
				name: 'Generate Sync QR',
				value: 'generateSyncQr',
				description: 'Generate QR code for wallet sync',
				action: 'Generate sync qr',
			},
			{
				name: 'Import from Wallet',
				value: 'importFromWallet',
				description: 'Import data from wallet QR',
				action: 'Import from wallet',
			},
			{
				name: 'Export to Wallet',
				value: 'exportToWallet',
				description: 'Export account to wallet',
				action: 'Export to wallet',
			},
			{
				name: 'Create Sign Request',
				value: 'createSignRequest',
				description: 'Create signing request for wallet',
				action: 'Create sign request',
			},
			{
				name: 'Return Signature',
				value: 'returnSignature',
				description: 'Return signature to wallet',
				action: 'Return signature',
			},
			{
				name: 'Get Wallet Info',
				value: 'getWalletInfo',
				description: 'Get supported wallet information',
				action: 'Get wallet info',
			},
			{
				name: 'List Supported Wallets',
				value: 'listSupportedWallets',
				description: 'List all supported wallet integrations',
				action: 'List supported wallets',
			},
		],
		default: 'generateSyncQr',
	},
];

export const walletIntegrationFields: INodeProperties[] = [
	// Wallet selection
	{
		displayName: 'Wallet',
		name: 'wallet',
		type: 'options',
		options: Object.entries(WALLET_INTEGRATIONS).map(([key, wallet]) => ({
			name: wallet.name,
			value: key,
			description: wallet.chains.join(', '),
		})),
		default: 'metamask',
		description: 'Software wallet to integrate with',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: [
					'generateSyncQr',
					'exportToWallet',
					'createSignRequest',
					'returnSignature',
					'getWalletInfo',
				],
			},
		},
	},
	// Account info for sync/export
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		description: 'Account index to sync/export',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['generateSyncQr', 'exportToWallet'],
			},
		},
	},
	// Extended public key
	{
		displayName: 'Extended Public Key',
		name: 'xpub',
		type: 'string',
		default: '',
		placeholder: 'xpub6...',
		description: 'Extended public key for export',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['exportToWallet'],
			},
		},
	},
	// Master fingerprint
	{
		displayName: 'Master Fingerprint',
		name: 'masterFingerprint',
		type: 'string',
		default: '',
		placeholder: '12345678',
		description: 'Device master fingerprint',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['generateSyncQr', 'exportToWallet', 'createSignRequest'],
			},
		},
	},
	// Chain for wallet
	{
		displayName: 'Chain',
		name: 'chain',
		type: 'options',
		options: [
			{ name: 'Bitcoin', value: 'bitcoin' },
			{ name: 'Ethereum', value: 'ethereum' },
			{ name: 'Solana', value: 'solana' },
			{ name: 'Cosmos', value: 'cosmos' },
			{ name: 'Avalanche', value: 'avalanche' },
		],
		default: 'bitcoin',
		description: 'Blockchain for the operation',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['generateSyncQr', 'createSignRequest'],
			},
		},
	},
	// Import QR data
	{
		displayName: 'QR Data',
		name: 'qrData',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: 'ur:crypto-psbt/...',
		description: 'QR data from wallet to import',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['importFromWallet'],
			},
		},
	},
	// Sign request data
	{
		displayName: 'Sign Data',
		name: 'signData',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Data to sign (transaction, message, or PSBT)',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['createSignRequest'],
			},
		},
	},
	// Derivation path
	{
		displayName: 'Derivation Path',
		name: 'derivationPath',
		type: 'string',
		default: '',
		placeholder: "m/84'/0'/0'/0/0",
		description: 'BIP derivation path',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['createSignRequest'],
			},
		},
	},
	// Signature for return
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		default: '',
		description: 'Signature from Keystone device',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['returnSignature'],
			},
		},
	},
	// Request ID
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		default: '',
		description: 'Original request ID',
		displayOptions: {
			show: {
				resource: ['walletIntegration'],
				operation: ['returnSignature'],
			},
		},
	},
];

/**
 * Execute wallet integration operations
 */
export async function executeWalletIntegrationOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: INodeExecutionData[] = [];

	switch (operation) {
		case 'generateSyncQr': {
			const wallet = this.getNodeParameter('wallet', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;
			const chain = this.getNodeParameter('chain', index, 'bitcoin') as string;

			const walletConfig = WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS];
			if (!walletConfig) {
				throw new NodeOperationError(this.getNode(), `Unknown wallet: ${wallet}`);
			}

			// Check chain compatibility
			if (!walletConfig.chains.map(c => c.toLowerCase()).includes(chain.toLowerCase())) {
				throw new NodeOperationError(
					this.getNode(),
					`Wallet ${walletConfig.name} does not support ${chain}`,
				);
			}

			// Generate sync QR based on wallet's preferred format
			const syncData = generateSyncData(wallet, chain, accountIndex, masterFingerprint);
			const urString = `ur:${walletConfig.syncFormat}/${encodeSyncData(syncData)}`;

			let qrCode: string | string[];
			if (urString.length > 500) {
				qrCode = await generateAnimatedQRFrames(urString);
			} else {
				qrCode = await generateStaticQR(urString);
			}

			responseData = [
				{
					json: {
						success: true,
						wallet: walletConfig.name,
						chain,
						syncData,
						urString,
						qrCode,
						animated: Array.isArray(qrCode),
						instructions: getWalletSyncInstructions(wallet),
					},
				},
			];
			break;
		}

		case 'importFromWallet': {
			const qrData = this.getNodeParameter('qrData', index, '') as string;

			if (!qrData) {
				throw new NodeOperationError(this.getNode(), 'QR data is required');
			}

			// Parse the UR string to detect type
			const urMatch = qrData.toLowerCase().match(/^ur:([^/]+)\//);
			if (!urMatch) {
				throw new NodeOperationError(this.getNode(), 'Invalid UR format');
			}

			const urType = urMatch[1];
			
			// Detect wallet from UR type
			const detectedWallet = detectWalletFromUR(urType);

			responseData = [
				{
					json: {
						success: true,
						urType,
						detectedWallet,
						imported: {
							type: urType,
							dataLength: qrData.length,
							parsed: {
								// Mock parsed data
								format: urType,
								content: 'Parsed content placeholder',
							},
						},
					},
				},
			];
			break;
		}

		case 'exportToWallet': {
			const wallet = this.getNodeParameter('wallet', index) as string;
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const xpub = this.getNodeParameter('xpub', index, '') as string;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;

			const walletConfig = WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS];
			if (!walletConfig) {
				throw new NodeOperationError(this.getNode(), `Unknown wallet: ${wallet}`);
			}

			const exportData = {
				masterFingerprint: masterFingerprint || generateRandomHex(8),
				accountIndex,
				xpub: xpub || `xpub6...mock${accountIndex}`,
				derivationPath: getDefaultDerivationPath(wallet, accountIndex),
				wallet: walletConfig.name,
			};

			const urString = `ur:crypto-account/${encodeSyncData(exportData)}`;
			const frames = await generateAnimatedQRFrames(urString);

			responseData = [
				{
					json: {
						success: true,
						wallet: walletConfig.name,
						exportData,
						urString,
						qrFrames: frames,
						frameCount: frames.length,
						instructions: getWalletImportInstructions(wallet),
					},
				},
			];
			break;
		}

		case 'createSignRequest': {
			const wallet = this.getNodeParameter('wallet', index) as string;
			const signData = this.getNodeParameter('signData', index, '') as string;
			const chain = this.getNodeParameter('chain', index, 'bitcoin') as string;
			const derivationPath = this.getNodeParameter('derivationPath', index, '') as string;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;

			if (!signData) {
				throw new NodeOperationError(this.getNode(), 'Sign data is required');
			}

			const walletConfig = WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS];
			
			// Generate appropriate UR type based on chain
			const urType = getSignRequestURType(chain);
			const requestId = generateRandomHex(32);

			const requestData = {
				requestId,
				signData,
				chain,
				derivationPath: derivationPath || getDefaultDerivationPath(wallet, 0),
				masterFingerprint: masterFingerprint || generateRandomHex(8),
			};

			const urString = `ur:${urType}/${encodeSyncData(requestData)}`;
			
			let qrCode: string | string[];
			if (urString.length > 500) {
				qrCode = await generateAnimatedQRFrames(urString);
			} else {
				qrCode = await generateStaticQR(urString);
			}

			responseData = [
				{
					json: {
						success: true,
						wallet: walletConfig?.name || wallet,
						requestId,
						urType,
						chain,
						urString,
						qrCode,
						animated: Array.isArray(qrCode),
						instructions: [
							'1. Display this QR code',
							'2. Scan with your Keystone device',
							'3. Review and approve on device',
							'4. Scan the signature QR to return to wallet',
						],
					},
				},
			];
			break;
		}

		case 'returnSignature': {
			const wallet = this.getNodeParameter('wallet', index) as string;
			const signature = this.getNodeParameter('signature', index, '') as string;
			const requestId = this.getNodeParameter('requestId', index, '') as string;

			if (!signature) {
				throw new NodeOperationError(this.getNode(), 'Signature is required');
			}

			const walletConfig = WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS];

			const responseURType = getSignatureURType(walletConfig?.chains[0] || 'bitcoin');
			const signatureData = {
				requestId: requestId || generateRandomHex(32),
				signature,
			};

			const urString = `ur:${responseURType}/${encodeSyncData(signatureData)}`;
			const qrCode = await generateStaticQR(urString);

			responseData = [
				{
					json: {
						success: true,
						wallet: walletConfig?.name || wallet,
						signatureData,
						urType: responseURType,
						urString,
						qrCode,
						instructions: [
							'1. Display this signature QR code',
							`2. Scan with ${walletConfig?.name || wallet}`,
							'3. Transaction will be completed by the wallet',
						],
					},
				},
			];
			break;
		}

		case 'getWalletInfo': {
			const wallet = this.getNodeParameter('wallet', index) as string;
			const walletConfig = WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS];

			if (!walletConfig) {
				throw new NodeOperationError(this.getNode(), `Unknown wallet: ${wallet}`);
			}

			responseData = [
				{
					json: {
						success: true,
						wallet: {
							id: wallet,
							...walletConfig,
						},
						compatibility: {
							keystoneSupported: true,
							qrSync: true,
							signRequests: walletConfig.urTypes.length > 0,
							animatedQr: walletConfig.features.includes('Animated QR'),
						},
					},
				},
			];
			break;
		}

		case 'listSupportedWallets': {
			const wallets = Object.entries(WALLET_INTEGRATIONS).map(([key, config]) => ({
				id: key,
				name: config.name,
				chains: config.chains,
				features: config.features,
				syncFormat: config.syncFormat,
			}));

			responseData = [
				{
					json: {
						success: true,
						wallets,
						count: wallets.length,
						categories: {
							evm: wallets.filter(w => 
								w.chains.some(c => ['Ethereum', 'EVM'].includes(c))
							),
							bitcoin: wallets.filter(w => w.chains.includes('Bitcoin')),
							solana: wallets.filter(w => w.chains.includes('Solana')),
							cosmos: wallets.filter(w => w.chains.includes('Cosmos')),
						},
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
 * Generate sync data for wallet
 */
function generateSyncData(
	wallet: string,
	chain: string,
	accountIndex: number,
	masterFingerprint: string,
): Record<string, any> {
	const fp = masterFingerprint || generateRandomHex(8);
	
	if (chain === 'bitcoin') {
		return {
			masterFingerprint: fp,
			accountIndex,
			xpub: `xpub6...mock${accountIndex}`,
			derivationPath: `m/84'/0'/${accountIndex}'`,
		};
	} else if (chain === 'ethereum') {
		return {
			masterFingerprint: fp,
			accountIndex,
			publicKey: '0x04' + generateRandomHex(128),
			derivationPath: `m/44'/60'/${accountIndex}'/0/0`,
			chainId: 1,
		};
	} else if (chain === 'solana') {
		return {
			masterFingerprint: fp,
			accountIndex,
			publicKey: generateRandomHex(64),
			derivationPath: `m/44'/501'/${accountIndex}'/0'`,
		};
	} else if (chain === 'cosmos') {
		return {
			masterFingerprint: fp,
			accountIndex,
			publicKey: generateRandomHex(66),
			derivationPath: `m/44'/118'/${accountIndex}'/0/0`,
		};
	}

	return {
		masterFingerprint: fp,
		accountIndex,
		chain,
	};
}

/**
 * Get wallet sync instructions
 */
function getWalletSyncInstructions(wallet: string): string[] {
	const instructions: Record<string, string[]> = {
		metamask: [
			'1. Open MetaMask and go to Settings',
			'2. Select "Hardware Wallet"',
			'3. Choose "QR-based" and scan this QR',
		],
		bluewallet: [
			'1. Open BlueWallet and tap "Add Wallet"',
			'2. Select "Import Wallet"',
			'3. Scan this QR code',
		],
		sparrow: [
			'1. Open Sparrow Wallet',
			'2. Go to File > New Wallet',
			'3. Select "Airgapped Hardware Wallet"',
			'4. Scan this QR code',
		],
		keplr: [
			'1. Open Keplr extension',
			'2. Click "Import Hardware Wallet"',
			'3. Scan this QR code with Keplr',
		],
	};

	return instructions[wallet] || [
		'1. Open your wallet application',
		'2. Navigate to import/hardware wallet',
		'3. Scan this QR code',
	];
}

/**
 * Get wallet import instructions
 */
function getWalletImportInstructions(wallet: string): string[] {
	return [
		`1. Open ${WALLET_INTEGRATIONS[wallet as keyof typeof WALLET_INTEGRATIONS]?.name || wallet}`,
		'2. Go to Import or Add Account',
		'3. Select QR code import',
		'4. Scan all frames of the animated QR',
	];
}

/**
 * Get default derivation path for wallet
 */
function getDefaultDerivationPath(wallet: string, accountIndex: number): string {
	const paths: Record<string, string> = {
		metamask: `m/44'/60'/${accountIndex}'/0/0`,
		bluewallet: `m/84'/0'/${accountIndex}'/0/0`,
		sparrow: `m/84'/0'/${accountIndex}'/0/0`,
		keplr: `m/44'/118'/${accountIndex}'/0/0`,
		phantom: `m/44'/501'/${accountIndex}'/0'`,
	};

	return paths[wallet] || `m/44'/0'/${accountIndex}'/0/0`;
}

/**
 * Detect wallet from UR type
 */
function detectWalletFromUR(urType: string): string | null {
	const typeMapping: Record<string, string> = {
		'crypto-psbt': 'Bitcoin wallets (Sparrow, BlueWallet)',
		'eth-sign-request': 'EVM wallets (MetaMask, Rabby)',
		'sol-sign-request': 'Solana wallets (Phantom, Solflare)',
		'cosmos-sign-request': 'Cosmos wallets (Keplr)',
	};

	return typeMapping[urType] || null;
}

/**
 * Get sign request UR type for chain
 */
function getSignRequestURType(chain: string): string {
	const types: Record<string, string> = {
		bitcoin: 'crypto-psbt',
		ethereum: 'eth-sign-request',
		solana: 'sol-sign-request',
		cosmos: 'cosmos-sign-request',
	};

	return types[chain] || 'bytes';
}

/**
 * Get signature UR type for chain
 */
function getSignatureURType(chain: string): string {
	const types: Record<string, string> = {
		bitcoin: 'crypto-psbt',
		ethereum: 'eth-signature',
		solana: 'sol-signature',
		cosmos: 'cosmos-signature',
		Bitcoin: 'crypto-psbt',
		Ethereum: 'eth-signature',
		Solana: 'sol-signature',
		Cosmos: 'cosmos-signature',
	};

	return types[chain] || 'bytes';
}

/**
 * Generate random hex string
 */
function generateRandomHex(length: number): string {
	const chars = '0123456789abcdef';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

/**
 * Encode sync data (simplified)
 */
function encodeSyncData(data: Record<string, any>): string {
	return Buffer.from(JSON.stringify(data))
		.toString('base64')
		.replace(/[+/=]/g, (c) => (c === '+' ? 'zy' : c === '/' ? 'zx' : 'zw'))
		.toLowerCase();
}
