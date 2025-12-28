/**
 * n8n-nodes-keystone
 * Copyright (c) 2025 Velocity Business Partners LLC
 *
 * SPDX-License-Identifier: BSL-1.1
 * Licensed under the Business Source License 1.1.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { SUPPORTED_CHAINS } from '../../constants/chains';
import { UR_TYPES, ETH_SIGN_DATA_TYPES } from '../../constants/urTypes';
import { DERIVATION_PATHS } from '../../constants/derivationPaths';
import { generateQRCode, generateAnimatedQR, parseQRCode, shouldUseAnimatedQR } from '../../utils/qrUtils';
import { createEthSignRequestUR, parseEthSignatureUR, createURString, parseURString } from '../../utils/urUtils';
import { validateEthereumAddress } from '../../utils/addressUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ethereum'],
			},
		},
		options: [
			{
				name: 'Get Account',
				value: 'getAccount',
				description: 'Get Ethereum account from Keystone device',
				action: 'Get ethereum account',
			},
			{
				name: 'Get Address',
				value: 'getAddress',
				description: 'Get Ethereum address for a given derivation path',
				action: 'Get ethereum address',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get ETH balance for an address',
				action: 'Get eth balance',
			},
			{
				name: 'Get Token Balances',
				value: 'getTokenBalances',
				description: 'Get ERC-20 token balances for an address',
				action: 'Get token balances',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign an Ethereum transaction (EIP-1559 or legacy)',
				action: 'Sign ethereum transaction',
			},
			{
				name: 'Sign EIP-1559 Transaction',
				value: 'signEip1559',
				description: 'Sign an EIP-1559 transaction with priority fee',
				action: 'Sign eip 1559 transaction',
			},
			{
				name: 'Sign Legacy Transaction',
				value: 'signLegacy',
				description: 'Sign a legacy Ethereum transaction',
				action: 'Sign legacy transaction',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign an Ethereum message (eth_sign)',
				action: 'Sign ethereum message',
			},
			{
				name: 'Sign Personal Message',
				value: 'signPersonalMessage',
				description: 'Sign a personal message (personal_sign)',
				action: 'Sign personal message',
			},
			{
				name: 'Sign Typed Data',
				value: 'signTypedData',
				description: 'Sign EIP-712 typed structured data',
				action: 'Sign typed data',
			},
			{
				name: 'Generate Signature QR',
				value: 'generateSignatureQr',
				description: 'Generate QR code for signing request',
				action: 'Generate signature qr',
			},
			{
				name: 'Import Signature QR',
				value: 'importSignatureQr',
				description: 'Import signature from scanned QR code',
				action: 'Import signature qr',
			},
			{
				name: 'Broadcast Transaction',
				value: 'broadcastTransaction',
				description: 'Broadcast signed transaction to network',
				action: 'Broadcast transaction',
			},
			{
				name: 'Export Watch-Only',
				value: 'exportWatchOnly',
				description: 'Export Ethereum account for watch-only wallet',
				action: 'Export watch only',
			},
		],
		default: 'getAccount',
	},
	// Get Account Options
	{
		displayName: 'Account Index',
		name: 'accountIndex',
		type: 'number',
		default: 0,
		description: 'Account index for derivation (0 = first account)',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getAccount', 'getAddress', 'exportWatchOnly'],
			},
		},
	},
	// Transaction Options
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Recipient Ethereum address',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy'],
			},
		},
	},
	{
		displayName: 'Value (Wei)',
		name: 'value',
		type: 'string',
		default: '0',
		description: 'Amount to send in Wei',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy'],
			},
		},
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		default: '0x',
		description: 'Transaction data (hex encoded)',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy'],
			},
		},
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		default: 0,
		description: 'Transaction nonce',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy'],
			},
		},
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		default: '21000',
		description: 'Gas limit for transaction',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy'],
			},
		},
	},
	// EIP-1559 specific
	{
		displayName: 'Max Fee Per Gas (Wei)',
		name: 'maxFeePerGas',
		type: 'string',
		default: '',
		description: 'Maximum fee per gas unit',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signEip1559'],
			},
		},
	},
	{
		displayName: 'Max Priority Fee Per Gas (Wei)',
		name: 'maxPriorityFeePerGas',
		type: 'string',
		default: '',
		description: 'Maximum priority fee (tip) per gas unit',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signEip1559'],
			},
		},
	},
	// Legacy specific
	{
		displayName: 'Gas Price (Wei)',
		name: 'gasPrice',
		type: 'string',
		default: '',
		description: 'Gas price for legacy transaction',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signLegacy'],
			},
		},
	},
	// Message signing
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		default: '',
		description: 'Message to sign',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signMessage', 'signPersonalMessage'],
			},
		},
	},
	// Typed Data (EIP-712)
	{
		displayName: 'Typed Data',
		name: 'typedData',
		type: 'json',
		default: '{}',
		description: 'EIP-712 typed data object',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTypedData'],
			},
		},
	},
	{
		displayName: 'Typed Data Version',
		name: 'typedDataVersion',
		type: 'options',
		options: [
			{ name: 'V1', value: 'v1' },
			{ name: 'V3', value: 'v3' },
			{ name: 'V4', value: 'v4' },
		],
		default: 'v4',
		description: 'EIP-712 typed data version',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTypedData'],
			},
		},
	},
	// Balance check
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Ethereum address to check',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getBalance', 'getTokenBalances'],
			},
		},
	},
	// QR Code
	{
		displayName: 'Signature QR Data',
		name: 'signatureQrData',
		type: 'string',
		default: '',
		description: 'Scanned signature QR code data',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['importSignatureQr'],
			},
		},
	},
	{
		displayName: 'Sign Request Data',
		name: 'signRequestData',
		type: 'json',
		default: '{}',
		description: 'Sign request data for QR generation',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['generateSignatureQr'],
			},
		},
	},
	// Broadcast
	{
		displayName: 'Signed Transaction',
		name: 'signedTransaction',
		type: 'string',
		default: '',
		description: 'Signed transaction hex to broadcast',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['broadcastTransaction'],
			},
		},
	},
	// Chain ID
	{
		displayName: 'Chain ID',
		name: 'chainId',
		type: 'number',
		default: 1,
		description: 'Ethereum chain ID (1 = mainnet)',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['signTransaction', 'signEip1559', 'signLegacy', 'getBalance', 'getTokenBalances', 'broadcastTransaction'],
			},
		},
	},
	// Derivation Path Override
	{
		displayName: 'Custom Derivation Path',
		name: 'customDerivationPath',
		type: 'string',
		default: '',
		placeholder: "m/44'/60'/0'/0/0",
		description: 'Custom derivation path (leave empty for default)',
		displayOptions: {
			show: {
				resource: ['ethereum'],
				operation: ['getAccount', 'getAddress', 'signTransaction', 'signEip1559', 'signLegacy', 'signMessage', 'signPersonalMessage', 'signTypedData'],
			},
		},
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	const chainConfig = SUPPORTED_CHAINS.ethereum;
	const defaultPath = DERIVATION_PATHS.ethereum.default;

	try {
		switch (operation) {
			case 'getAccount': {
				const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath.replace('/0/0', `/${accountIndex}/0`);

				returnData.push({
					json: {
						success: true,
						account: {
							chain: 'ethereum',
							chainId: chainConfig.chainId,
							derivationPath,
							accountIndex,
							addressType: 'ethereum',
							urType: UR_TYPES.ETH_SIGN_REQUEST,
						},
						message: 'Scan the Keystone device QR code to import the account',
						expectedUrType: 'crypto-hdkey',
					},
				});
				break;
			}

			case 'getAddress': {
				const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath.replace('/0/0', `/${accountIndex}/0`);

				returnData.push({
					json: {
						success: true,
						derivationPath,
						accountIndex,
						chain: 'ethereum',
						slip44: chainConfig.slip44,
						message: 'Address will be derived from Keystone device',
						instructions: [
							'1. Open Keystone device',
							'2. Navigate to Ethereum wallet',
							'3. Select the account',
							'4. Scan the displayed QR code',
						],
					},
				});
				break;
			}

			case 'getBalance': {
				const address = this.getNodeParameter('address', index) as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;

				if (!validateEthereumAddress(address)) {
					throw new NodeOperationError(this.getNode(), 'Invalid Ethereum address');
				}

				returnData.push({
					json: {
						success: true,
						address,
						chainId,
						message: 'Balance check requires RPC connection',
						rpcEndpoint: chainConfig.rpcUrl,
						instructions: 'Use an Ethereum RPC node to fetch balance',
					},
				});
				break;
			}

			case 'getTokenBalances': {
				const address = this.getNodeParameter('address', index) as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;

				if (!validateEthereumAddress(address)) {
					throw new NodeOperationError(this.getNode(), 'Invalid Ethereum address');
				}

				returnData.push({
					json: {
						success: true,
						address,
						chainId,
						message: 'Token balance check requires indexer or RPC connection',
						instructions: 'Use an Ethereum indexer API to fetch ERC-20 balances',
					},
				});
				break;
			}

			case 'signTransaction': {
				const toAddress = this.getNodeParameter('toAddress', index) as string;
				const value = this.getNodeParameter('value', index, '0') as string;
				const data = this.getNodeParameter('data', index, '0x') as string;
				const nonce = this.getNodeParameter('nonce', index, 0) as number;
				const gasLimit = this.getNodeParameter('gasLimit', index, '21000') as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				if (!validateEthereumAddress(toAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid recipient address');
				}

				const unsignedTx = {
					to: toAddress,
					value,
					data,
					nonce,
					gasLimit,
					chainId,
				};

				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);
				const urData = createEthSignRequestUR({
					requestId,
					signData: JSON.stringify(unsignedTx),
					dataType: ETH_SIGN_DATA_TYPES.TRANSACTION,
					chainId,
					derivationPath,
					address: '',
				});

				const useAnimated = shouldUseAnimatedQR(urData.length);
				const qrCode = useAnimated
					? await generateAnimatedQR(urData)
					: await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signTransaction',
						unsignedTransaction: unsignedTx,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						isAnimated: useAnimated,
						requestId,
						derivationPath,
						instructions: [
							'1. Display this QR code',
							'2. Scan with Keystone device',
							'3. Review and confirm transaction on device',
							'4. Scan the signature QR code from device',
						],
					},
				});
				break;
			}

			case 'signEip1559': {
				const toAddress = this.getNodeParameter('toAddress', index) as string;
				const value = this.getNodeParameter('value', index, '0') as string;
				const data = this.getNodeParameter('data', index, '0x') as string;
				const nonce = this.getNodeParameter('nonce', index, 0) as number;
				const gasLimit = this.getNodeParameter('gasLimit', index, '21000') as string;
				const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index) as string;
				const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index) as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				if (!validateEthereumAddress(toAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid recipient address');
				}

				const eip1559Tx = {
					type: 2,
					to: toAddress,
					value,
					data,
					nonce,
					gasLimit,
					maxFeePerGas,
					maxPriorityFeePerGas,
					chainId,
				};

				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);
				const urData = createEthSignRequestUR({
					requestId,
					signData: JSON.stringify(eip1559Tx),
					dataType: ETH_SIGN_DATA_TYPES.TRANSACTION,
					chainId,
					derivationPath,
					address: '',
				});

				const useAnimated = shouldUseAnimatedQR(urData.length);
				const qrCode = useAnimated
					? await generateAnimatedQR(urData)
					: await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signEip1559',
						transactionType: 'EIP-1559',
						unsignedTransaction: eip1559Tx,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						isAnimated: useAnimated,
						requestId,
						derivationPath,
					},
				});
				break;
			}

			case 'signLegacy': {
				const toAddress = this.getNodeParameter('toAddress', index) as string;
				const value = this.getNodeParameter('value', index, '0') as string;
				const data = this.getNodeParameter('data', index, '0x') as string;
				const nonce = this.getNodeParameter('nonce', index, 0) as number;
				const gasLimit = this.getNodeParameter('gasLimit', index, '21000') as string;
				const gasPrice = this.getNodeParameter('gasPrice', index) as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				if (!validateEthereumAddress(toAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid recipient address');
				}

				const legacyTx = {
					type: 0,
					to: toAddress,
					value,
					data,
					nonce,
					gasLimit,
					gasPrice,
					chainId,
				};

				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);
				const urData = createEthSignRequestUR({
					requestId,
					signData: JSON.stringify(legacyTx),
					dataType: ETH_SIGN_DATA_TYPES.TRANSACTION,
					chainId,
					derivationPath,
					address: '',
				});

				const useAnimated = shouldUseAnimatedQR(urData.length);
				const qrCode = useAnimated
					? await generateAnimatedQR(urData)
					: await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signLegacy',
						transactionType: 'Legacy',
						unsignedTransaction: legacyTx,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						isAnimated: useAnimated,
						requestId,
						derivationPath,
					},
				});
				break;
			}

			case 'signMessage': {
				const message = this.getNodeParameter('message', index) as string;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				const messageHex = Buffer.from(message).toString('hex');
				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);

				const urData = createEthSignRequestUR({
					requestId,
					signData: messageHex,
					dataType: ETH_SIGN_DATA_TYPES.RAW_BYTES,
					chainId: 1,
					derivationPath,
					address: '',
				});

				const qrCode = await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signMessage',
						signType: 'eth_sign',
						message,
						messageHex,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						requestId,
						derivationPath,
					},
				});
				break;
			}

			case 'signPersonalMessage': {
				const message = this.getNodeParameter('message', index) as string;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				const prefix = '\x19Ethereum Signed Message:\n' + message.length;
				const prefixedMessage = prefix + message;
				const messageHex = Buffer.from(prefixedMessage).toString('hex');
				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);

				const urData = createEthSignRequestUR({
					requestId,
					signData: messageHex,
					dataType: ETH_SIGN_DATA_TYPES.PERSONAL_MESSAGE,
					chainId: 1,
					derivationPath,
					address: '',
				});

				const qrCode = await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signPersonalMessage',
						signType: 'personal_sign',
						message,
						prefixedMessage,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						requestId,
						derivationPath,
					},
				});
				break;
			}

			case 'signTypedData': {
				const typedData = this.getNodeParameter('typedData', index) as object;
				const typedDataVersion = this.getNodeParameter('typedDataVersion', index, 'v4') as string;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath;

				const typedDataJson = JSON.stringify(typedData);
				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);

				let dataType: number;
				switch (typedDataVersion) {
					case 'v1':
						dataType = ETH_SIGN_DATA_TYPES.TYPED_DATA;
						break;
					case 'v3':
						dataType = ETH_SIGN_DATA_TYPES.TYPED_DATA;
						break;
					case 'v4':
					default:
						dataType = ETH_SIGN_DATA_TYPES.TYPED_DATA;
				}

				const urData = createEthSignRequestUR({
					requestId,
					signData: typedDataJson,
					dataType,
					chainId: 1,
					derivationPath,
					address: '',
				});

				const useAnimated = shouldUseAnimatedQR(urData.length);
				const qrCode = useAnimated
					? await generateAnimatedQR(urData)
					: await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						operation: 'signTypedData',
						signType: `eth_signTypedData_${typedDataVersion}`,
						typedData,
						typedDataVersion,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						isAnimated: useAnimated,
						requestId,
						derivationPath,
					},
				});
				break;
			}

			case 'generateSignatureQr': {
				const signRequestData = this.getNodeParameter('signRequestData', index) as object;

				const requestId = Buffer.from(Date.now().toString()).toString('hex').slice(0, 16);
				const urData = createEthSignRequestUR({
					requestId,
					signData: JSON.stringify(signRequestData),
					dataType: ETH_SIGN_DATA_TYPES.TRANSACTION,
					chainId: 1,
					derivationPath: defaultPath,
					address: '',
				});

				const useAnimated = shouldUseAnimatedQR(urData.length);
				const qrCode = useAnimated
					? await generateAnimatedQR(urData)
					: await generateQRCode(urData);

				returnData.push({
					json: {
						success: true,
						qrCode,
						urData,
						urType: UR_TYPES.ETH_SIGN_REQUEST,
						isAnimated: useAnimated,
						requestId,
					},
				});
				break;
			}

			case 'importSignatureQr': {
				const signatureQrData = this.getNodeParameter('signatureQrData', index) as string;

				const parsed = parseURString(signatureQrData);
				if (parsed.type !== UR_TYPES.ETH_SIGNATURE) {
					throw new NodeOperationError(this.getNode(), `Expected ${UR_TYPES.ETH_SIGNATURE} but got ${parsed.type}`);
				}

				const signature = parseEthSignatureUR(signatureQrData);

				returnData.push({
					json: {
						success: true,
						signature: signature.signature,
						requestId: signature.requestId,
						urType: UR_TYPES.ETH_SIGNATURE,
						r: signature.signature.slice(0, 66),
						s: '0x' + signature.signature.slice(66, 130),
						v: parseInt(signature.signature.slice(130, 132), 16),
					},
				});
				break;
			}

			case 'broadcastTransaction': {
				const signedTransaction = this.getNodeParameter('signedTransaction', index) as string;
				const chainId = this.getNodeParameter('chainId', index, 1) as number;

				returnData.push({
					json: {
						success: true,
						signedTransaction,
						chainId,
						message: 'Transaction broadcast requires RPC connection',
						rpcEndpoint: chainConfig.rpcUrl,
						instructions: 'Submit to eth_sendRawTransaction RPC method',
					},
				});
				break;
			}

			case 'exportWatchOnly': {
				const accountIndex = this.getNodeParameter('accountIndex', index, 0) as number;
				const customPath = this.getNodeParameter('customDerivationPath', index, '') as string;
				const derivationPath = customPath || defaultPath.replace('/0/0', `/${accountIndex}/0`);

				returnData.push({
					json: {
						success: true,
						operation: 'exportWatchOnly',
						chain: 'ethereum',
						derivationPath,
						accountIndex,
						exportFormat: 'extended_public_key',
						message: 'Scan Keystone device to get extended public key for watch-only wallet',
						supportedWallets: ['MetaMask', 'Rabby', 'Watch-only wallets'],
					},
				});
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({
				json: {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
					operation,
				},
			});
		} else {
			throw error;
		}
	}

	return returnData;
}
