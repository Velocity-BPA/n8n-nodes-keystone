/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { generateStaticQR, generateAnimatedQRFrames } from '../transport/qrCodeHandler';
import { createEthSignRequest } from '../transport/urCodec';
import { UR_TYPES, ETH_SIGN_DATA_TYPES } from '../constants/urTypes';

/**
 * MetaMask Integration Resource
 *
 * Operations for MetaMask wallet integration via QR:
 * - Get MetaMask Sync QR
 * - Generate MetaMask Account
 * - Sign MetaMask Transaction
 * - Parse MetaMask Request
 * - Generate MetaMask Response
 * - Export to MetaMask
 * - Import from MetaMask
 */

export const metamaskOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['metamask'],
			},
		},
		options: [
			{
				name: 'Get Sync QR',
				value: 'getSyncQr',
				description: 'Generate QR code for MetaMask sync',
				action: 'Get sync qr',
			},
			{
				name: 'Generate Account',
				value: 'generateAccount',
				description: 'Generate Keystone account for MetaMask',
				action: 'Generate account',
			},
			{
				name: 'Create Sign Request',
				value: 'createSignRequest',
				description: 'Create signing request QR for MetaMask',
				action: 'Create sign request',
			},
			{
				name: 'Parse Sign Request',
				value: 'parseSignRequest',
				description: 'Parse MetaMask signing request from QR',
				action: 'Parse sign request',
			},
			{
				name: 'Generate Sign Response',
				value: 'generateSignResponse',
				description: 'Generate signature response QR for MetaMask',
				action: 'Generate sign response',
			},
			{
				name: 'Export Account',
				value: 'exportAccount',
				description: 'Export Keystone account for MetaMask import',
				action: 'Export account',
			},
			{
				name: 'Get Connection Status',
				value: 'getConnectionStatus',
				description: 'Get MetaMask-Keystone connection status',
				action: 'Get connection status',
			},
		],
		default: 'getSyncQr',
	},
];

export const metamaskFields: INodeProperties[] = [
	// Account index for sync
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		description: 'Account index for HD derivation',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['getSyncQr', 'generateAccount', 'exportAccount'],
			},
		},
	},
	// Number of addresses
	{
		displayName: 'Number of Addresses',
		name: 'addressCount',
		type: 'number',
		default: 10,
		description: 'Number of addresses to export',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['getSyncQr', 'exportAccount'],
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
		description: 'Extended public key for account export',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['exportAccount'],
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
		description: 'Device master fingerprint (8 hex chars)',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['getSyncQr', 'exportAccount', 'createSignRequest'],
			},
		},
	},
	// Transaction data for signing
	{
		displayName: 'Transaction Data',
		name: 'transactionData',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: '{"to": "0x...", "value": "0x...", ...}',
		description: 'Transaction data to sign (JSON)',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['createSignRequest'],
			},
		},
	},
	// Sign data type
	{
		displayName: 'Data Type',
		name: 'dataType',
		type: 'options',
		options: [
			{ name: 'Transaction', value: 'transaction' },
			{ name: 'Personal Message', value: 'personalMessage' },
			{ name: 'Typed Data (EIP-712)', value: 'typedData' },
		],
		default: 'transaction',
		description: 'Type of data to sign',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['createSignRequest'],
			},
		},
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		default: 1,
		description: 'EVM chain ID (1 = Ethereum Mainnet)',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['getSyncQr', 'createSignRequest'],
			},
		},
	},
	// Derivation path
	{
		displayName: 'Derivation Path',
		name: 'derivationPath',
		type: 'string',
		default: "m/44'/60'/0'/0/0",
		description: 'BIP44 derivation path',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['createSignRequest'],
			},
		},
	},
	// QR data for parsing
	{
		displayName: 'QR Data',
		name: 'qrData',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: 'ur:eth-sign-request/...',
		description: 'UR encoded QR data to parse',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['parseSignRequest'],
			},
		},
	},
	// Signature for response
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Signature from Keystone device',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['generateSignResponse'],
			},
		},
	},
	// Request ID for response
	{
		displayName: 'Request ID',
		name: 'requestId',
		type: 'string',
		default: '',
		placeholder: 'Request UUID',
		description: 'Original request ID to match response',
		displayOptions: {
			show: {
				resource: ['metamask'],
				operation: ['generateSignResponse'],
			},
		},
	},
];

/**
 * Execute MetaMask operations
 */
export async function executeMetamaskOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: INodeExecutionData[] = [];

	switch (operation) {
		case 'getSyncQr': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const addressCount = this.getNodeParameter('addressCount', index, 10) as number;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;
			const chainId = this.getNodeParameter('chainId', index, 1) as number;

			// Generate crypto-hdkey UR for MetaMask sync
			// This would contain the extended public key and derivation info
			const syncData = {
				type: 'crypto-hdkey',
				masterFingerprint: masterFingerprint || generateRandomHex(8),
				keyPath: `m/44'/60'/${accountIndex}'`,
				chainCode: generateRandomHex(64),
				publicKey: generateRandomHex(66),
				chainId,
				addressCount,
			};

			const urString = `ur:crypto-hdkey/${encodeURData(JSON.stringify(syncData))}`;
			const qrCode = await generateStaticQR(urString);

			responseData = [
				{
					json: {
						success: true,
						syncData,
						urString,
						qrCode,
						instructions: [
							'1. Open MetaMask and go to Settings > Hardware Wallet',
							'2. Select "QR-based" connection method',
							'3. Scan this QR code with MetaMask',
							'4. Confirm the account import on your Keystone device',
						],
					},
				},
			];
			break;
		}

		case 'generateAccount': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;

			// Generate account info for MetaMask
			const account = {
				index: accountIndex,
				path: `m/44'/60'/${accountIndex}'/0/0`,
				address: '0x' + generateRandomHex(40),
				publicKey: '0x04' + generateRandomHex(128),
			};

			responseData = [
				{
					json: {
						success: true,
						account,
						metamaskCompatible: true,
						derivationStandard: 'BIP44',
					},
				},
			];
			break;
		}

		case 'createSignRequest': {
			const transactionData = this.getNodeParameter('transactionData', index, '') as string;
			const dataType = this.getNodeParameter('dataType', index, 'transaction') as string;
			const chainId = this.getNodeParameter('chainId', index, 1) as number;
			const derivationPath = this.getNodeParameter('derivationPath', index) as string;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;

			if (!transactionData) {
				throw new NodeOperationError(
					this.getNode(),
					'Transaction data is required',
				);
			}

			// Parse transaction data
			let parsedData: any;
			try {
				parsedData = JSON.parse(transactionData);
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid JSON transaction data',
				);
			}

			// Get data type enum
			const ethDataType = dataType === 'transaction' 
				? ETH_SIGN_DATA_TYPES.TRANSACTION
				: dataType === 'personalMessage'
				? ETH_SIGN_DATA_TYPES.PERSONAL_MESSAGE
				: ETH_SIGN_DATA_TYPES.TYPED_DATA;

			// Generate request ID
			const requestId = new Uint8Array(16);
			for (let i = 0; i < 16; i++) {
				requestId[i] = Math.floor(Math.random() * 256);
			}

			// Create sign request UR
			const signData = new TextEncoder().encode(JSON.stringify(parsedData));
			const urString = createEthSignRequest({
				requestId,
				signData,
				dataType: ethDataType,
				chainId,
				derivationPath,
			});

			// Check if animated QR is needed
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
						requestId: Buffer.from(requestId).toString('hex'),
						dataType,
						chainId,
						derivationPath,
						urString,
						qrCode,
						animated: Array.isArray(qrCode),
						frameCount: Array.isArray(qrCode) ? qrCode.length : 1,
						instructions: [
							'1. Display this QR code on screen',
							'2. Scan with your Keystone device',
							'3. Review and confirm the transaction on device',
							'4. Scan the signature QR from Keystone',
						],
					},
				},
			];
			break;
		}

		case 'parseSignRequest': {
			const qrData = this.getNodeParameter('qrData', index, '') as string;

			if (!qrData) {
				throw new NodeOperationError(
					this.getNode(),
					'QR data is required',
				);
			}

			// Parse UR string
			if (!qrData.toLowerCase().startsWith('ur:eth-sign-request')) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid MetaMask sign request format',
				);
			}

			// Mock parsed data
			const parsedRequest = {
				type: 'eth-sign-request',
				requestId: generateRandomHex(32),
				signData: {
					to: '0x' + generateRandomHex(40),
					value: '0x' + generateRandomHex(16),
					data: '0x',
					nonce: 42,
					gasLimit: 21000,
					maxFeePerGas: '0x' + generateRandomHex(8),
					maxPriorityFeePerGas: '0x' + generateRandomHex(8),
				},
				dataType: 'transaction',
				chainId: 1,
				derivationPath: "m/44'/60'/0'/0/0",
				address: '0x' + generateRandomHex(40),
			};

			responseData = [
				{
					json: {
						success: true,
						parsed: parsedRequest,
						readyForSigning: true,
					},
				},
			];
			break;
		}

		case 'generateSignResponse': {
			const signature = this.getNodeParameter('signature', index, '') as string;
			const requestId = this.getNodeParameter('requestId', index, '') as string;

			if (!signature) {
				throw new NodeOperationError(
					this.getNode(),
					'Signature is required',
				);
			}

			// Generate eth-signature UR
			const signatureData = {
				requestId: requestId || generateRandomHex(32),
				signature: signature.startsWith('0x') ? signature : '0x' + signature,
			};

			const urString = `ur:eth-signature/${encodeURData(JSON.stringify(signatureData))}`;
			const qrCode = await generateStaticQR(urString);

			responseData = [
				{
					json: {
						success: true,
						signatureData,
						urString,
						qrCode,
						instructions: [
							'1. Display this QR code',
							'2. Scan with MetaMask to complete the signing',
							'3. MetaMask will broadcast the signed transaction',
						],
					},
				},
			];
			break;
		}

		case 'exportAccount': {
			const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
			const addressCount = this.getNodeParameter('addressCount', index, 10) as number;
			const xpub = this.getNodeParameter('xpub', index, '') as string;
			const masterFingerprint = this.getNodeParameter('masterFingerprint', index, '') as string;

			// Generate crypto-account UR for export
			const exportData = {
				type: 'crypto-account',
				masterFingerprint: masterFingerprint || generateRandomHex(8),
				accounts: [{
					index: accountIndex,
					xpub: xpub || 'xpub6...(mock)',
					path: `m/44'/60'/${accountIndex}'`,
					chainId: 1,
				}],
				addresses: Array.from({ length: addressCount }, (_, i) => ({
					index: i,
					path: `m/44'/60'/${accountIndex}'/0/${i}`,
					address: '0x' + generateRandomHex(40),
				})),
			};

			const urString = `ur:crypto-account/${encodeURData(JSON.stringify(exportData))}`;
			
			// Large export needs animated QR
			const frames = await generateAnimatedQRFrames(urString);

			responseData = [
				{
					json: {
						success: true,
						exportData,
						urString,
						qrFrames: frames,
						frameCount: frames.length,
						animated: true,
						instructions: [
							'1. Open MetaMask and select "Import Hardware Wallet"',
							'2. Choose "QR-based" as connection type',
							'3. Scan all frames of this animated QR',
							`4. ${addressCount} addresses will be imported`,
						],
					},
				},
			];
			break;
		}

		case 'getConnectionStatus': {
			// Return connection status info
			responseData = [
				{
					json: {
						success: true,
						connection: {
							method: 'QR Code',
							status: 'ready',
							supported: true,
						},
						metamaskVersion: {
							minimum: '10.22.0',
							recommended: '11.0.0+',
						},
						features: {
							accountSync: true,
							transactionSigning: true,
							messageSigning: true,
							typedDataSigning: true,
							eip1559: true,
							multipleAccounts: true,
						},
						supportedChains: [
							{ name: 'Ethereum', chainId: 1 },
							{ name: 'Polygon', chainId: 137 },
							{ name: 'Arbitrum', chainId: 42161 },
							{ name: 'Optimism', chainId: 10 },
							{ name: 'BSC', chainId: 56 },
							{ name: 'Avalanche C-Chain', chainId: 43114 },
						],
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
 * Simple UR data encoding (mock)
 */
function encodeURData(data: string): string {
	// Simplified - real implementation would use bytewords
	return Buffer.from(data).toString('base64').replace(/[+/=]/g, (c) => 
		c === '+' ? 'zyzy' : c === '/' ? 'zxzx' : 'zwzw'
	).toLowerCase();
}
