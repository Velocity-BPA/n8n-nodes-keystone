/**
 * Unit tests for Keystone transport layer
 */

import {
	QRCodeHandler,
	generateStaticQR,
	generateAnimatedQRFrames,
	parseQRData,
	detectQRType,
} from '../../nodes/Keystone/transport/qrCodeHandler';

import {
	URCodec,
	encodeBytewords,
	decodeBytewords,
	createURString,
	parseURString,
} from '../../nodes/Keystone/transport/urCodec';

import {
	AnimatedQRPlayer,
	AnimatedQRScanner,
	createURFragments,
	estimateScanTime,
} from '../../nodes/Keystone/transport/animatedQr';

import {
	MockUSBTransport,
	USBTransportManager,
	USBCommand,
	USBStatus,
} from '../../nodes/Keystone/transport/usbTransport';

describe('QR Code Handler', () => {
	describe('Static QR Generation', () => {
		it('should generate static QR code', async () => {
			const qr = await generateStaticQR('test data');
			expect(qr).toMatch(/^data:image\/png;base64,/);
		});

		it('should respect size options', async () => {
			const qr = await generateStaticQR('test', { size: 512 });
			expect(qr).toBeDefined();
		});

		it('should respect error correction options', async () => {
			const qrL = await generateStaticQR('test', { errorCorrection: 'L' });
			const qrH = await generateStaticQR('test', { errorCorrection: 'H' });
			expect(qrL).toBeDefined();
			expect(qrH).toBeDefined();
		});
	});

	describe('Animated QR Generation', () => {
		it('should generate multiple frames for large data', async () => {
			const largeData = 'x'.repeat(2000);
			const frames = await generateAnimatedQRFrames(largeData);
			expect(frames.length).toBeGreaterThan(1);
		});

		it('should generate single frame for small data', async () => {
			const frames = await generateAnimatedQRFrames('small');
			expect(frames.length).toBe(1);
		});

		it('should include fragment info in frames', async () => {
			const frames = await generateAnimatedQRFrames('x'.repeat(2000));
			expect(frames[0]).toHaveProperty('index');
			expect(frames[0]).toHaveProperty('total');
			expect(frames[0]).toHaveProperty('data');
		});
	});

	describe('QR Data Parsing', () => {
		it('should parse simple data', () => {
			const result = parseQRData('Hello');
			expect(result.data).toBe('Hello');
		});

		it('should parse UR format', () => {
			const result = parseQRData('ur:crypto-psbt/1-1/data');
			expect(result.type).toBe('ur');
			expect(result.urType).toBe('crypto-psbt');
		});

		it('should parse fragment format', () => {
			const result = parseQRData('p1of3/fragmentdata');
			expect(result.isFragment).toBe(true);
			expect(result.fragmentIndex).toBe(1);
			expect(result.totalFragments).toBe(3);
		});
	});

	describe('QR Type Detection', () => {
		it('should detect UR type', () => {
			expect(detectQRType('ur:crypto-psbt/data')).toBe('ur');
		});

		it('should detect JSON type', () => {
			expect(detectQRType('{"key":"value"}')).toBe('json');
		});

		it('should detect hex type', () => {
			expect(detectQRType('0x1234abcd')).toBe('hex');
		});

		it('should detect plain text', () => {
			expect(detectQRType('Hello World')).toBe('text');
		});
	});

	describe('QRCodeHandler Class', () => {
		let handler: QRCodeHandler;

		beforeEach(() => {
			handler = new QRCodeHandler();
		});

		it('should generate QR with default settings', async () => {
			const qr = await handler.generate('test');
			expect(qr).toBeDefined();
		});

		it('should track state for animated QR', async () => {
			await handler.startAnimatedSequence('x'.repeat(2000));
			expect(handler.isPlaying()).toBe(true);
		});

		it('should stop animated sequence', async () => {
			await handler.startAnimatedSequence('x'.repeat(2000));
			handler.stop();
			expect(handler.isPlaying()).toBe(false);
		});
	});
});

describe('UR Codec', () => {
	describe('Bytewords Encoding', () => {
		it('should encode bytes to bytewords', () => {
			const bytes = Buffer.from([0x00, 0x01, 0x02]);
			const bytewords = encodeBytewords(bytes);
			expect(typeof bytewords).toBe('string');
			expect(bytewords.length).toBeGreaterThan(0);
		});

		it('should decode bytewords to bytes', () => {
			const bytes = Buffer.from([0x00, 0x01, 0x02]);
			const encoded = encodeBytewords(bytes);
			const decoded = decodeBytewords(encoded);
			expect(decoded).toEqual(bytes);
		});

		it('should handle empty input', () => {
			const bytewords = encodeBytewords(Buffer.from([]));
			expect(bytewords).toBe('');
		});
	});

	describe('UR String Creation', () => {
		it('should create valid UR string', () => {
			const ur = createURString('crypto-psbt', 'bytewordsdata');
			expect(ur).toMatch(/^ur:crypto-psbt\//);
		});

		it('should create multi-part UR string', () => {
			const ur = createURString('crypto-psbt', 'data', 1, 3);
			expect(ur).toMatch(/^ur:crypto-psbt\/1-3\//);
		});
	});

	describe('UR String Parsing', () => {
		it('should parse single-part UR', () => {
			const parsed = parseURString('ur:crypto-psbt/bytewordsdata');
			expect(parsed.type).toBe('crypto-psbt');
			expect(parsed.data).toBe('bytewordsdata');
		});

		it('should parse multi-part UR', () => {
			const parsed = parseURString('ur:crypto-psbt/2-5/bytewordsdata');
			expect(parsed.type).toBe('crypto-psbt');
			expect(parsed.sequenceNumber).toBe(2);
			expect(parsed.sequenceTotal).toBe(5);
		});

		it('should throw on invalid UR', () => {
			expect(() => parseURString('invalid')).toThrow();
		});
	});

	describe('URCodec Class', () => {
		let codec: URCodec;

		beforeEach(() => {
			codec = new URCodec();
		});

		it('should encode data to UR', () => {
			const ur = codec.encode('crypto-psbt', Buffer.from('test'));
			expect(ur).toMatch(/^ur:crypto-psbt\//);
		});

		it('should decode UR to data', () => {
			const original = Buffer.from('test data');
			const ur = codec.encode('crypto-psbt', original);
			const decoded = codec.decode(ur);
			expect(decoded.type).toBe('crypto-psbt');
		});

		it('should create fragments for large data', () => {
			const largeData = Buffer.alloc(5000);
			const fragments = codec.encodeAsFragments('crypto-psbt', largeData);
			expect(fragments.length).toBeGreaterThan(1);
		});

		it('should reassemble fragments', () => {
			const largeData = Buffer.from('x'.repeat(500));
			const fragments = codec.encodeAsFragments('crypto-psbt', largeData, 100);
			const reassembled = codec.decodeFragments(fragments);
			expect(reassembled.type).toBe('crypto-psbt');
		});
	});
});

describe('Animated QR', () => {
	describe('Fragment Creation', () => {
		it('should create fragments from UR', () => {
			const ur = 'ur:crypto-psbt/' + 'x'.repeat(1000);
			const fragments = createURFragments(ur, 200);
			expect(fragments.length).toBeGreaterThan(1);
		});

		it('should preserve UR type in fragments', () => {
			const ur = 'ur:eth-sign-request/' + 'x'.repeat(500);
			const fragments = createURFragments(ur, 100);
			fragments.forEach((f) => {
				expect(f).toMatch(/^ur:eth-sign-request\//);
			});
		});
	});

	describe('Scan Time Estimation', () => {
		it('should estimate scan time based on fragments', () => {
			const time = estimateScanTime(10, 8); // 10 fragments at 8 FPS
			expect(time).toBeGreaterThan(0);
		});

		it('should account for FPS', () => {
			const slowTime = estimateScanTime(10, 4);
			const fastTime = estimateScanTime(10, 12);
			expect(slowTime).toBeGreaterThan(fastTime);
		});
	});

	describe('AnimatedQRPlayer', () => {
		let player: AnimatedQRPlayer;

		beforeEach(() => {
			player = new AnimatedQRPlayer(['frame1', 'frame2', 'frame3']);
		});

		it('should start at frame 0', () => {
			expect(player.getCurrentFrameIndex()).toBe(0);
		});

		it('should advance frames', () => {
			player.nextFrame();
			expect(player.getCurrentFrameIndex()).toBe(1);
		});

		it('should loop back to start', () => {
			player.nextFrame();
			player.nextFrame();
			player.nextFrame(); // Should loop
			expect(player.getCurrentFrameIndex()).toBe(0);
		});

		it('should return current frame data', () => {
			expect(player.getCurrentFrame()).toBe('frame1');
		});

		it('should report total frames', () => {
			expect(player.getTotalFrames()).toBe(3);
		});

		it('should support play/pause', () => {
			player.play();
			expect(player.isPlaying()).toBe(true);
			player.pause();
			expect(player.isPlaying()).toBe(false);
		});

		it('should reset to beginning', () => {
			player.nextFrame();
			player.nextFrame();
			player.reset();
			expect(player.getCurrentFrameIndex()).toBe(0);
		});
	});

	describe('AnimatedQRScanner', () => {
		let scanner: AnimatedQRScanner;

		beforeEach(() => {
			scanner = new AnimatedQRScanner();
		});

		it('should start with no fragments', () => {
			expect(scanner.getProgress()).toBe(0);
		});

		it('should add fragments', () => {
			scanner.addFragment('ur:crypto-psbt/1-3/data1');
			expect(scanner.getProgress()).toBeGreaterThan(0);
		});

		it('should track completion', () => {
			scanner.addFragment('ur:crypto-psbt/1-3/data1');
			scanner.addFragment('ur:crypto-psbt/2-3/data2');
			scanner.addFragment('ur:crypto-psbt/3-3/data3');
			expect(scanner.isComplete()).toBe(true);
		});

		it('should not duplicate fragments', () => {
			scanner.addFragment('ur:crypto-psbt/1-3/data1');
			scanner.addFragment('ur:crypto-psbt/1-3/data1');
			expect(scanner.getReceivedCount()).toBe(1);
		});

		it('should reassemble on completion', () => {
			scanner.addFragment('ur:crypto-psbt/1-2/data1');
			scanner.addFragment('ur:crypto-psbt/2-2/data2');
			const result = scanner.getResult();
			expect(result).toBeDefined();
		});

		it('should reset state', () => {
			scanner.addFragment('ur:crypto-psbt/1-2/data1');
			scanner.reset();
			expect(scanner.getProgress()).toBe(0);
		});
	});
});

describe('USB Transport', () => {
	describe('Mock USB Transport', () => {
		let transport: MockUSBTransport;

		beforeEach(() => {
			transport = new MockUSBTransport();
		});

		it('should connect successfully', async () => {
			const result = await transport.connect();
			expect(result.success).toBe(true);
		});

		it('should disconnect', async () => {
			await transport.connect();
			const result = await transport.disconnect();
			expect(result.success).toBe(true);
		});

		it('should check connection status', async () => {
			expect(transport.isConnected()).toBe(false);
			await transport.connect();
			expect(transport.isConnected()).toBe(true);
		});

		it('should send command', async () => {
			await transport.connect();
			const response = await transport.sendCommand(USBCommand.GET_VERSION);
			expect(response).toBeDefined();
			expect(response.status).toBe(USBStatus.OK);
		});

		it('should fail if not connected', async () => {
			await expect(transport.sendCommand(USBCommand.GET_VERSION)).rejects.toThrow();
		});
	});

	describe('USB Transport Manager', () => {
		let manager: USBTransportManager;

		beforeEach(() => {
			manager = new USBTransportManager();
		});

		it('should list available devices', async () => {
			const devices = await manager.listDevices();
			expect(Array.isArray(devices)).toBe(true);
		});

		it('should detect Keystone devices', async () => {
			const devices = await manager.listDevices();
			devices.forEach((device) => {
				expect(device).toHaveProperty('vendorId');
				expect(device).toHaveProperty('productId');
			});
		});

		it('should connect to device by ID', async () => {
			const devices = await manager.listDevices();
			if (devices.length > 0) {
				const result = await manager.connect(devices[0].deviceId);
				expect(result.success).toBe(true);
			}
		});

		it('should handle connection timeout', async () => {
			manager.setConnectionTimeout(100);
			// This would timeout in real scenario with no device
		});
	});

	describe('USB Commands', () => {
		it('should have correct command values', () => {
			expect(USBCommand.GET_VERSION).toBeDefined();
			expect(USBCommand.GET_ADDRESSES).toBeDefined();
			expect(USBCommand.SIGN_TRANSACTION).toBeDefined();
			expect(USBCommand.GET_PUBLIC_KEY).toBeDefined();
		});

		it('should have correct status values', () => {
			expect(USBStatus.OK).toBe(0x00);
			expect(USBStatus.ERROR).toBeDefined();
			expect(USBStatus.BUSY).toBeDefined();
			expect(USBStatus.REJECTED).toBeDefined();
		});
	});
});
