/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { DEVICE_MODELS } from '../constants';

/**
 * Firmware Resource
 *
 * Operations for managing Keystone device firmware:
 * - Get firmware version
 * - Check for updates
 * - Get changelog
 * - Verify firmware integrity
 * - Get Secure Element version
 * - Get device features
 */

export const firmwareOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['firmware'],
			},
		},
		options: [
			{
				name: 'Get Firmware Version',
				value: 'getFirmwareVersion',
				description: 'Get the current firmware version of the device',
				action: 'Get firmware version',
			},
			{
				name: 'Check for Updates',
				value: 'checkForUpdates',
				description: 'Check if firmware updates are available',
				action: 'Check for updates',
			},
			{
				name: 'Get Changelog',
				value: 'getChangelog',
				description: 'Get firmware version changelog',
				action: 'Get changelog',
			},
			{
				name: 'Verify Firmware',
				value: 'verifyFirmware',
				description: 'Verify firmware integrity and authenticity',
				action: 'Verify firmware',
			},
			{
				name: 'Get SE Version',
				value: 'getSeVersion',
				description: 'Get Secure Element firmware version',
				action: 'Get se version',
			},
			{
				name: 'Get Device Features',
				value: 'getDeviceFeatures',
				description: 'Get supported features for current firmware',
				action: 'Get device features',
			},
		],
		default: 'getFirmwareVersion',
	},
];

export const firmwareFields: INodeProperties[] = [
	// Get Firmware Version fields
	{
		displayName: 'Device Model',
		name: 'deviceModel',
		type: 'options',
		options: Object.entries(DEVICE_MODELS).map(([key, model]) => ({
			name: model.name,
			value: key,
		})),
		default: 'keystone3Pro',
		description: 'The Keystone device model',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['getFirmwareVersion', 'checkForUpdates', 'getDeviceFeatures'],
			},
		},
	},
	// Current Version (for update check)
	{
		displayName: 'Current Version',
		name: 'currentVersion',
		type: 'string',
		default: '',
		placeholder: '1.2.0',
		description: 'Current firmware version installed on device',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['checkForUpdates'],
			},
		},
	},
	// Firmware Hash (for verification)
	{
		displayName: 'Firmware Hash',
		name: 'firmwareHash',
		type: 'string',
		default: '',
		placeholder: 'sha256:abc123...',
		description: 'Firmware hash for verification',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['verifyFirmware'],
			},
		},
	},
	// Version Range (for changelog)
	{
		displayName: 'From Version',
		name: 'fromVersion',
		type: 'string',
		default: '',
		placeholder: '1.0.0',
		description: 'Start version for changelog range',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['getChangelog'],
			},
		},
	},
	{
		displayName: 'To Version',
		name: 'toVersion',
		type: 'string',
		default: '',
		placeholder: '1.2.0',
		description: 'End version for changelog range (empty for latest)',
		displayOptions: {
			show: {
				resource: ['firmware'],
				operation: ['getChangelog'],
			},
		},
	},
];

/**
 * Execute firmware operations
 */
export async function executeFirmwareOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: INodeExecutionData[] = [];

	switch (operation) {
		case 'getFirmwareVersion': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const model = DEVICE_MODELS[deviceModel as keyof typeof DEVICE_MODELS];

			// In a real implementation, this would communicate with the device
			// For now, return model information with mock version
			responseData = [
				{
					json: {
						success: true,
						deviceModel: model?.name || deviceModel,
						firmwareVersion: '1.2.0',
						buildNumber: '20240115',
						releaseDate: '2024-01-15',
						features: model?.features || [],
					},
				},
			];
			break;
		}

		case 'checkForUpdates': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const currentVersion = this.getNodeParameter('currentVersion', index) as string;

			// Mock update check response
			const latestVersion = '1.3.0';
			const updateAvailable = compareVersions(currentVersion, latestVersion) < 0;

			responseData = [
				{
					json: {
						success: true,
						currentVersion,
						latestVersion,
						updateAvailable,
						releaseNotes: updateAvailable
							? 'Security improvements and new chain support'
							: null,
						downloadUrl: updateAvailable
							? 'https://keyst.one/firmware/latest'
							: null,
						releaseDate: updateAvailable ? '2024-02-01' : null,
						mandatory: false,
					},
				},
			];
			break;
		}

		case 'getChangelog': {
			const fromVersion = this.getNodeParameter('fromVersion', index) as string;
			const toVersion = this.getNodeParameter('toVersion', index, '') as string;

			// Mock changelog data
			const changelog = [
				{
					version: '1.3.0',
					date: '2024-02-01',
					changes: [
						'Added support for Sui blockchain',
						'Improved QR code scanning speed',
						'Security patches for Secure Element',
					],
				},
				{
					version: '1.2.0',
					date: '2024-01-15',
					changes: [
						'Added Aptos support',
						'Multi-signature improvements',
						'Bug fixes',
					],
				},
				{
					version: '1.1.0',
					date: '2023-12-01',
					changes: [
						'Added animated QR support',
						'Performance improvements',
						'UI enhancements',
					],
				},
			];

			// Filter by version range
			const filteredChangelog = changelog.filter((entry) => {
				const afterFrom = !fromVersion || compareVersions(entry.version, fromVersion) >= 0;
				const beforeTo = !toVersion || compareVersions(entry.version, toVersion) <= 0;
				return afterFrom && beforeTo;
			});

			responseData = [
				{
					json: {
						success: true,
						fromVersion: fromVersion || 'earliest',
						toVersion: toVersion || 'latest',
						changelog: filteredChangelog,
					},
				},
			];
			break;
		}

		case 'verifyFirmware': {
			const firmwareHash = this.getNodeParameter('firmwareHash', index) as string;

			if (!firmwareHash) {
				throw new NodeOperationError(
					this.getNode(),
					'Firmware hash is required for verification',
				);
			}

			// Mock verification - in real implementation would verify against known hashes
			const isValid = firmwareHash.startsWith('sha256:');

			responseData = [
				{
					json: {
						success: true,
						verified: isValid,
						hash: firmwareHash,
						signatureValid: isValid,
						timestampValid: isValid,
						message: isValid
							? 'Firmware integrity verified successfully'
							: 'Firmware verification failed - hash mismatch',
					},
				},
			];
			break;
		}

		case 'getSeVersion': {
			// Secure Element version
			responseData = [
				{
					json: {
						success: true,
						seVersion: '1.0.5',
						seModel: 'SE050',
						certificationLevel: 'CC EAL6+',
						features: [
							'True Random Number Generator',
							'Secure Key Storage',
							'Anti-Tamper Protection',
							'Side-Channel Attack Resistance',
						],
					},
				},
			];
			break;
		}

		case 'getDeviceFeatures': {
			const deviceModel = this.getNodeParameter('deviceModel', index) as string;
			const model = DEVICE_MODELS[deviceModel as keyof typeof DEVICE_MODELS];

			responseData = [
				{
					json: {
						success: true,
						deviceModel: model?.name || deviceModel,
						features: model?.features || [],
						supportedChains: [
							'Bitcoin',
							'Ethereum',
							'Solana',
							'Cosmos',
							'Aptos',
							'Sui',
							'Near',
							'Tron',
							'XRP',
							'Cardano',
							'Litecoin',
						],
						capabilities: {
							qrScanning: true,
							animatedQr: true,
							usb: deviceModel === 'keystone3Pro',
							multiSig: true,
							passphrase: true,
							fingerprint: deviceModel === 'keystone3Pro',
						},
						maxAccounts: 10,
						maxAddressesPerAccount: 1000,
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
 * Compare semantic versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
	const partsA = a.split('.').map(Number);
	const partsB = b.split('.').map(Number);

	for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
		const numA = partsA[i] || 0;
		const numB = partsB[i] || 0;

		if (numA < numB) return -1;
		if (numA > numB) return 1;
	}

	return 0;
}
