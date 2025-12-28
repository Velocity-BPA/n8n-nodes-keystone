/**
 * Integration tests for Keystone n8n node
 * Tests end-to-end workflows and resource operations
 */

// Mock n8n execution context
const mockExecutionContext = {
	getInputData: jest.fn(),
	getNodeParameter: jest.fn(),
	getCredentials: jest.fn(),
	helpers: {
		returnJsonArray: (data: any[]) => data.map((item) => ({ json: item })),
	},
};

// Import action operations
import * as deviceOps from '../../nodes/Keystone/actions/device';
import * as accountOps from '../../nodes/Keystone/actions/account';
import * as bitcoinOps from '../../nodes/Keystone/actions/bitcoin';
import * as ethereumOps from '../../nodes/Keystone/actions/ethereum';
import * as signingOps from '../../nodes/Keystone/actions/signing';
import * as transactionOps from '../../nodes/Keystone/actions/transaction';
import * as qrCodeOps from '../../nodes/Keystone/actions/qrCode';
import * as urOps from '../../nodes/Keystone/actions/ur';
import * as metamaskOps from '../../nodes/Keystone/actions/metamask';
import * as walletIntegrationOps from '../../nodes/Keystone/actions/walletIntegration';
import * as firmwareOps from '../../nodes/Keystone/actions/firmware';
import * as securityOps from '../../nodes/Keystone/actions/security';
import * as utilityOps from '../../nodes/Keystone/actions/utility';

describe('Integration Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Default mock credentials
		mockExecutionContext.getCredentials.mockResolvedValue({
			deviceType: 'keystone3Pro',
			connectionMethod: 'qr',
			masterFingerprint: 'abcd1234',
		});
	});

	describe('Device Operations', () => {
		it('should get device info', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getInfo';
				return undefined;
			});

			const result = await deviceOps.execute.call(mockExecutionContext);
			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
		});

		it('should check device connection', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'checkConnection';
				return undefined;
			});

			const result = await deviceOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('connected');
		});
	});

	describe('Account Operations', () => {
		it('should generate account', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'generate';
				if (name === 'chain') return 'bitcoin';
				if (name === 'accountIndex') return 0;
				if (name === 'addressType') return 'native_segwit';
				return undefined;
			});

			const result = await accountOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('address');
			expect(result[0].json).toHaveProperty('path');
		});

		it('should list accounts', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'list';
				if (name === 'chain') return 'ethereum';
				return undefined;
			});

			const result = await accountOps.execute.call(mockExecutionContext);
			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe('Bitcoin Operations', () => {
		it('should create PSBT', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createPsbt';
				if (name === 'inputs') return JSON.stringify([{
					txid: 'abc123',
					vout: 0,
					value: 100000,
				}]);
				if (name === 'outputs') return JSON.stringify([{
					address: 'bc1qtest',
					value: 90000,
				}]);
				return undefined;
			});

			const result = await bitcoinOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('psbt');
		});

		it('should parse PSBT', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'parsePsbt';
				if (name === 'psbt') return 'cHNidP8BAH0CAAAAAQ==';
				return undefined;
			});

			const result = await bitcoinOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('version');
		});

		it('should generate address', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getAddress';
				if (name === 'accountIndex') return 0;
				if (name === 'addressIndex') return 0;
				if (name === 'addressType') return 'native_segwit';
				return undefined;
			});

			const result = await bitcoinOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('address');
		});
	});

	describe('Ethereum Operations', () => {
		it('should create transaction', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createTransaction';
				if (name === 'to') return '0x742d35Cc6634C0532925a3b844Bc454e4438f44E';
				if (name === 'value') return '1000000000000000000';
				if (name === 'chainId') return 1;
				return undefined;
			});

			const result = await ethereumOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('unsignedTx');
		});

		it('should create sign request', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createSignRequest';
				if (name === 'requestType') return 'transaction';
				if (name === 'data') return '0x1234';
				return undefined;
			});

			const result = await ethereumOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('signRequest');
		});

		it('should sign typed data', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'signTypedData';
				if (name === 'typedData') return JSON.stringify({
					types: { EIP712Domain: [] },
					primaryType: 'Test',
					domain: {},
					message: {},
				});
				return undefined;
			});

			const result = await ethereumOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('signRequest');
		});
	});

	describe('Signing Operations', () => {
		it('should create sign request', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createRequest';
				if (name === 'chain') return 'bitcoin';
				if (name === 'dataToSign') return 'cHNidP8BAH0CAAAAAQ==';
				return undefined;
			});

			const result = await signingOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('request');
		});

		it('should parse signature', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'parseSignature';
				if (name === 'signatureData') return 'ur:crypto-signature/abc';
				return undefined;
			});

			const result = await signingOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('signature');
		});
	});

	describe('Transaction Operations', () => {
		it('should build transaction', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'build';
				if (name === 'chain') return 'ethereum';
				if (name === 'transactionData') return JSON.stringify({
					to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44E',
					value: '1000000000000000000',
				});
				return undefined;
			});

			const result = await transactionOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('transaction');
		});

		it('should broadcast transaction', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'broadcast';
				if (name === 'signedTransaction') return '0xf86c...';
				if (name === 'chain') return 'ethereum';
				return undefined;
			});

			// This would need network in real scenario
			const result = await transactionOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('txHash');
		});
	});

	describe('QR Code Operations', () => {
		it('should generate QR code', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'generate';
				if (name === 'data') return 'test data';
				if (name === 'format') return 'dataUrl';
				return undefined;
			});

			const result = await qrCodeOps.execute.call(mockExecutionContext);
			expect(result[0].json.qrCode).toMatch(/^data:image/);
		});

		it('should generate animated QR', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'generateAnimated';
				if (name === 'data') return 'x'.repeat(2000);
				if (name === 'fps') return 8;
				return undefined;
			});

			const result = await qrCodeOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('frames');
			expect(result[0].json.frames.length).toBeGreaterThan(1);
		});
	});

	describe('UR Operations', () => {
		it('should encode to UR', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'encode';
				if (name === 'type') return 'crypto-psbt';
				if (name === 'data') return 'cHNidP8=';
				return undefined;
			});

			const result = await urOps.execute.call(mockExecutionContext);
			expect(result[0].json.ur).toMatch(/^ur:crypto-psbt\//);
		});

		it('should decode UR', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'decode';
				if (name === 'ur') return 'ur:crypto-psbt/1-1/data';
				return undefined;
			});

			const result = await urOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('type');
			expect(result[0].json).toHaveProperty('data');
		});
	});

	describe('MetaMask Integration', () => {
		it('should generate sync QR', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getSyncQr';
				if (name === 'accountIndex') return 0;
				return undefined;
			});

			const result = await metamaskOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('syncQr');
		});

		it('should create eth sign request', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createSignRequest';
				if (name === 'requestType') return 'transaction';
				if (name === 'data') return '0x02f8...';
				if (name === 'chainId') return 1;
				return undefined;
			});

			const result = await metamaskOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('signRequest');
		});
	});

	describe('Wallet Integration', () => {
		it('should generate sync QR for wallet', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'generateSyncQr';
				if (name === 'wallet') return 'sparrow';
				if (name === 'chain') return 'bitcoin';
				return undefined;
			});

			const result = await walletIntegrationOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('syncQr');
		});

		it('should list supported wallets', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'listSupportedWallets';
				return undefined;
			});

			const result = await walletIntegrationOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('wallets');
			expect(Array.isArray(result[0].json.wallets)).toBe(true);
		});
	});

	describe('Firmware Operations', () => {
		it('should get firmware version', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getFirmwareVersion';
				return undefined;
			});

			const result = await firmwareOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('version');
		});

		it('should check for updates', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'checkForUpdates';
				return undefined;
			});

			const result = await firmwareOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('updateAvailable');
		});
	});

	describe('Security Operations', () => {
		it('should verify device authenticity', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'verifyAuthenticity';
				return undefined;
			});

			const result = await securityOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('authentic');
		});

		it('should check device health', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'checkDeviceHealth';
				return undefined;
			});

			const result = await securityOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('overallHealth');
		});
	});

	describe('Utility Operations', () => {
		it('should get supported chains', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getSupportedChains';
				if (name === 'filter') return 'all';
				return undefined;
			});

			const result = await utilityOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('chains');
			expect(Array.isArray(result[0].json.chains)).toBe(true);
		});

		it('should validate address', async () => {
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'validateAddress';
				if (name === 'address') return '0x742d35Cc6634C0532925a3b844Bc454e4438f44E';
				if (name === 'chain') return 'ethereum';
				return undefined;
			});

			const result = await utilityOps.execute.call(mockExecutionContext);
			expect(result[0].json).toHaveProperty('valid');
			expect(result[0].json.valid).toBe(true);
		});
	});
});

describe('End-to-End Workflows', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockExecutionContext.getCredentials.mockResolvedValue({
			deviceType: 'keystone3Pro',
			connectionMethod: 'qr',
			masterFingerprint: 'abcd1234',
		});
	});

	describe('Bitcoin Air-Gapped Signing Workflow', () => {
		it('should complete full PSBT signing workflow', async () => {
			// Step 1: Create PSBT
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createPsbt';
				if (name === 'inputs') return JSON.stringify([{ txid: 'abc', vout: 0, value: 100000 }]);
				if (name === 'outputs') return JSON.stringify([{ address: 'bc1q...', value: 90000 }]);
				return undefined;
			});
			const psbtResult = await bitcoinOps.execute.call(mockExecutionContext);
			expect(psbtResult[0].json.psbt).toBeDefined();

			// Step 2: Generate QR for signing
			const psbt = psbtResult[0].json.psbt;
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'encode';
				if (name === 'type') return 'crypto-psbt';
				if (name === 'data') return psbt;
				return undefined;
			});
			const urResult = await urOps.execute.call(mockExecutionContext);
			expect(urResult[0].json.ur).toMatch(/^ur:crypto-psbt\//);

			// Step 3: Generate QR code
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'generate';
				if (name === 'data') return urResult[0].json.ur;
				if (name === 'format') return 'dataUrl';
				return undefined;
			});
			const qrResult = await qrCodeOps.execute.call(mockExecutionContext);
			expect(qrResult[0].json.qrCode).toBeDefined();
		});
	});

	describe('Ethereum MetaMask Integration Workflow', () => {
		it('should complete MetaMask sync and sign workflow', async () => {
			// Step 1: Generate sync QR
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'getSyncQr';
				if (name === 'accountIndex') return 0;
				return undefined;
			});
			const syncResult = await metamaskOps.execute.call(mockExecutionContext);
			expect(syncResult[0].json.syncQr).toBeDefined();

			// Step 2: Create transaction sign request
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createTransaction';
				if (name === 'to') return '0x742d35Cc6634C0532925a3b844Bc454e4438f44E';
				if (name === 'value') return '1000000000000000000';
				if (name === 'chainId') return 1;
				return undefined;
			});
			const txResult = await ethereumOps.execute.call(mockExecutionContext);
			expect(txResult[0].json.unsignedTx).toBeDefined();

			// Step 3: Create sign request for Keystone
			mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
				if (name === 'operation') return 'createSignRequest';
				if (name === 'requestType') return 'transaction';
				if (name === 'data') return txResult[0].json.unsignedTx;
				if (name === 'chainId') return 1;
				return undefined;
			});
			const signRequestResult = await metamaskOps.execute.call(mockExecutionContext);
			expect(signRequestResult[0].json.signRequest).toBeDefined();
		});
	});

	describe('Multi-Chain Account Generation', () => {
		const chains = ['bitcoin', 'ethereum', 'solana', 'cosmos'];

		chains.forEach((chain) => {
			it(`should generate ${chain} account`, async () => {
				mockExecutionContext.getNodeParameter.mockImplementation((name: string) => {
					if (name === 'operation') return 'generate';
					if (name === 'chain') return chain;
					if (name === 'accountIndex') return 0;
					if (name === 'addressType') return 'native_segwit';
					return undefined;
				});

				const result = await accountOps.execute.call(mockExecutionContext);
				expect(result[0].json).toHaveProperty('address');
				expect(result[0].json).toHaveProperty('path');
			});
		});
	});
});
