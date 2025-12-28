/**
 * Unit tests for Keystone node utilities
 */

import {
	isValidBitcoinAddress,
	isValidEthereumAddress,
	isValidSolanaAddress,
	isValidCosmosAddress,
	isValidAptosAddress,
	isValidSuiAddress,
	isValidNearAddress,
	isValidTronAddress,
	isValidXrpAddress,
	isValidCardanoAddress,
	deriveAddressPath,
	getAddressType,
} from '../../nodes/Keystone/utils/addressUtils';

import {
	encodePsbt,
	decodePsbt,
	analyzePsbt,
	validatePsbtStructure,
	extractPsbtInputs,
	extractPsbtOutputs,
} from '../../nodes/Keystone/utils/psbtUtils';

import {
	generateQrCode,
	parseQrCode,
	splitIntoFragments,
	reassembleFragments,
	selectQrMode,
} from '../../nodes/Keystone/utils/qrUtils';

import {
	encodeUR,
	decodeUR,
	createCryptoPsbt,
	parseCryptoPsbt,
	getURType,
	validateUR,
} from '../../nodes/Keystone/utils/urUtils';

describe('Address Utilities', () => {
	describe('Bitcoin Address Validation', () => {
		it('should validate legacy P2PKH addresses', () => {
			expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true);
			expect(isValidBitcoinAddress('1234567890')).toBe(false);
		});

		it('should validate P2SH addresses', () => {
			expect(isValidBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
		});

		it('should validate Bech32 addresses', () => {
			expect(isValidBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(true);
			expect(isValidBitcoinAddress('bc1invalid')).toBe(false);
		});

		it('should validate Bech32m (Taproot) addresses', () => {
			expect(isValidBitcoinAddress('bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidBitcoinAddress('')).toBe(false);
			expect(isValidBitcoinAddress('notanaddress')).toBe(false);
			expect(isValidBitcoinAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f')).toBe(false);
		});
	});

	describe('Ethereum Address Validation', () => {
		it('should validate valid Ethereum addresses', () => {
			expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44E')).toBe(true);
		});

		it('should validate checksummed addresses', () => {
			expect(isValidEthereumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
		});

		it('should validate lowercase addresses', () => {
			expect(isValidEthereumAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidEthereumAddress('')).toBe(false);
			expect(isValidEthereumAddress('0x')).toBe(false);
			expect(isValidEthereumAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44')).toBe(false);
			expect(isValidEthereumAddress('742d35Cc6634C0532925a3b844Bc454e4438f44E')).toBe(false);
		});
	});

	describe('Solana Address Validation', () => {
		it('should validate valid Solana addresses', () => {
			expect(isValidSolanaAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidSolanaAddress('')).toBe(false);
			expect(isValidSolanaAddress('short')).toBe(false);
			expect(isValidSolanaAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44E')).toBe(false);
		});
	});

	describe('Cosmos Address Validation', () => {
		it('should validate Cosmos hub addresses', () => {
			expect(isValidCosmosAddress('cosmos1vqpjljwsynsn82vq4e5hq0fg2qvmn7egxr9zx6', 'cosmos')).toBe(true);
		});

		it('should validate Osmosis addresses', () => {
			expect(isValidCosmosAddress('osmo1vqpjljwsynsn82vq4e5hq0fg2qvmn7egm65gvt', 'osmo')).toBe(true);
		});

		it('should reject addresses with wrong prefix', () => {
			expect(isValidCosmosAddress('cosmos1vqpjljwsynsn82vq4e5hq0fg2qvmn7egxr9zx6', 'osmo')).toBe(false);
		});
	});

	describe('Other Chain Address Validation', () => {
		it('should validate Aptos addresses', () => {
			expect(isValidAptosAddress('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(true);
		});

		it('should validate Sui addresses', () => {
			expect(isValidSuiAddress('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(true);
		});

		it('should validate NEAR addresses', () => {
			expect(isValidNearAddress('example.near')).toBe(true);
			expect(isValidNearAddress('user.testnet')).toBe(true);
		});

		it('should validate Tron addresses', () => {
			expect(isValidTronAddress('TJCnKsPa7y5okkXvQAidZBzqx3QyQ6sxMW')).toBe(true);
		});

		it('should validate XRP addresses', () => {
			expect(isValidXrpAddress('rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9')).toBe(true);
		});

		it('should validate Cardano addresses', () => {
			expect(isValidCardanoAddress('addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp')).toBe(true);
		});
	});

	describe('Address Path Derivation', () => {
		it('should derive correct BIP44 paths', () => {
			const path = deriveAddressPath('bitcoin', 0, 0, 'legacy');
			expect(path).toBe("m/44'/0'/0'/0/0");
		});

		it('should derive correct BIP49 paths for SegWit', () => {
			const path = deriveAddressPath('bitcoin', 0, 0, 'segwit');
			expect(path).toBe("m/49'/0'/0'/0/0");
		});

		it('should derive correct BIP84 paths for Native SegWit', () => {
			const path = deriveAddressPath('bitcoin', 0, 0, 'native_segwit');
			expect(path).toBe("m/84'/0'/0'/0/0");
		});

		it('should derive correct BIP86 paths for Taproot', () => {
			const path = deriveAddressPath('bitcoin', 0, 0, 'taproot');
			expect(path).toBe("m/86'/0'/0'/0/0");
		});

		it('should derive correct Ethereum paths', () => {
			const path = deriveAddressPath('ethereum', 0, 0);
			expect(path).toBe("m/44'/60'/0'/0/0");
		});
	});

	describe('Address Type Detection', () => {
		it('should detect Bitcoin address types', () => {
			expect(getAddressType('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'bitcoin')).toBe('p2pkh');
			expect(getAddressType('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'bitcoin')).toBe('p2sh');
			expect(getAddressType('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'bitcoin')).toBe('p2wpkh');
		});

		it('should detect Ethereum address type', () => {
			expect(getAddressType('0x742d35Cc6634C0532925a3b844Bc454e4438f44E', 'ethereum')).toBe('eoa');
		});
	});
});

describe('PSBT Utilities', () => {
	const samplePsbt = 'cHNidP8BAHUCAAAAASaBcTce3/KF6Tig7cez3AsuLZk0NYb+';
	const samplePsbtBase64 = Buffer.from(samplePsbt).toString('base64');

	describe('PSBT Encoding/Decoding', () => {
		it('should encode PSBT to base64', () => {
			const encoded = encodePsbt(Buffer.from(samplePsbt));
			expect(typeof encoded).toBe('string');
		});

		it('should decode base64 PSBT', () => {
			const decoded = decodePsbt(samplePsbtBase64);
			expect(Buffer.isBuffer(decoded) || typeof decoded === 'object').toBe(true);
		});

		it('should handle invalid PSBT gracefully', () => {
			expect(() => decodePsbt('invalid')).not.toThrow();
		});
	});

	describe('PSBT Analysis', () => {
		it('should analyze PSBT structure', () => {
			const analysis = analyzePsbt(samplePsbtBase64);
			expect(analysis).toHaveProperty('version');
			expect(analysis).toHaveProperty('inputCount');
			expect(analysis).toHaveProperty('outputCount');
		});

		it('should validate PSBT structure', () => {
			const result = validatePsbtStructure(samplePsbtBase64);
			expect(result).toHaveProperty('valid');
			expect(typeof result.valid).toBe('boolean');
		});
	});

	describe('PSBT Input/Output Extraction', () => {
		it('should extract inputs from PSBT', () => {
			const inputs = extractPsbtInputs(samplePsbtBase64);
			expect(Array.isArray(inputs)).toBe(true);
		});

		it('should extract outputs from PSBT', () => {
			const outputs = extractPsbtOutputs(samplePsbtBase64);
			expect(Array.isArray(outputs)).toBe(true);
		});
	});
});

describe('QR Code Utilities', () => {
	describe('QR Code Generation', () => {
		it('should generate QR code data URL', async () => {
			const qr = await generateQrCode('Hello, Keystone!');
			expect(qr).toMatch(/^data:image\/png;base64,/);
		});

		it('should generate QR with custom size', async () => {
			const qr = await generateQrCode('Test', { width: 300, height: 300 });
			expect(qr).toMatch(/^data:image\/png;base64,/);
		});

		it('should generate QR with error correction level', async () => {
			const qrL = await generateQrCode('Test', { errorCorrectionLevel: 'L' });
			const qrH = await generateQrCode('Test', { errorCorrectionLevel: 'H' });
			expect(qrL).not.toBe(qrH);
		});
	});

	describe('QR Code Parsing', () => {
		it('should parse QR code data', () => {
			const data = parseQrCode('ur:crypto-psbt/1-2/abc123');
			expect(data).toHaveProperty('type');
		});
	});

	describe('Fragment Handling', () => {
		it('should split large data into fragments', () => {
			const largeData = 'x'.repeat(1000);
			const fragments = splitIntoFragments(largeData, 100);
			expect(fragments.length).toBeGreaterThan(1);
		});

		it('should reassemble fragments correctly', () => {
			const original = 'Hello, World!';
			const fragments = splitIntoFragments(original, 5);
			const reassembled = reassembleFragments(fragments);
			expect(reassembled).toBe(original);
		});

		it('should handle single fragment data', () => {
			const data = 'Short';
			const fragments = splitIntoFragments(data, 100);
			expect(fragments.length).toBe(1);
		});
	});

	describe('QR Mode Selection', () => {
		it('should select static mode for small data', () => {
			const mode = selectQrMode('Short data');
			expect(mode).toBe('static');
		});

		it('should select animated mode for large data', () => {
			const largeData = 'x'.repeat(3000);
			const mode = selectQrMode(largeData);
			expect(mode).toBe('animated');
		});
	});
});

describe('UR Utilities', () => {
	describe('UR Encoding/Decoding', () => {
		it('should encode data to UR format', () => {
			const ur = encodeUR('crypto-psbt', Buffer.from('test data'));
			expect(ur).toMatch(/^ur:crypto-psbt\//);
		});

		it('should decode UR string', () => {
			const ur = 'ur:crypto-psbt/1-1/ltadaacfadaxcfadahgdaohtsboe';
			const decoded = decodeUR(ur);
			expect(decoded).toHaveProperty('type');
			expect(decoded).toHaveProperty('data');
		});

		it('should handle multi-part UR', () => {
			const ur = 'ur:crypto-psbt/2-3/fragment';
			const decoded = decodeUR(ur);
			expect(decoded).toHaveProperty('fragment');
		});
	});

	describe('Crypto-PSBT Operations', () => {
		it('should create crypto-psbt UR', () => {
			const psbtBytes = Buffer.from('cHNidP8BAH', 'base64');
			const ur = createCryptoPsbt(psbtBytes);
			expect(ur).toMatch(/^ur:crypto-psbt\//);
		});

		it('should parse crypto-psbt UR', () => {
			const ur = 'ur:crypto-psbt/1-1/ltadaacfadaxcfadahgdaohtsboe';
			const parsed = parseCryptoPsbt(ur);
			expect(parsed).toHaveProperty('psbt');
		});
	});

	describe('UR Type Detection', () => {
		it('should detect UR type', () => {
			expect(getURType('ur:crypto-psbt/data')).toBe('crypto-psbt');
			expect(getURType('ur:eth-sign-request/data')).toBe('eth-sign-request');
			expect(getURType('ur:sol-sign-request/data')).toBe('sol-sign-request');
		});

		it('should handle invalid UR', () => {
			expect(getURType('invalid')).toBe('unknown');
		});
	});

	describe('UR Validation', () => {
		it('should validate correct UR format', () => {
			expect(validateUR('ur:crypto-psbt/1-1/data')).toBe(true);
		});

		it('should reject invalid UR format', () => {
			expect(validateUR('not-a-ur')).toBe(false);
			expect(validateUR('')).toBe(false);
		});
	});
});
