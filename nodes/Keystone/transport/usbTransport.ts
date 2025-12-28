/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * USB Transport for Keystone 3 Pro
 *
 * Handles USB communication with Keystone 3 Pro devices.
 * Note: USB communication is only available on Keystone 3 Pro model.
 *
 * IMPORTANT: This module provides the interface definitions and
 * communication protocol. Actual USB operations require the
 * WebUSB API (browser) or node-hid/usb library (Node.js).
 */

/**
 * Keystone USB Device identifiers
 */
export const KEYSTONE_USB = {
	VENDOR_ID: 0x1209, // Example - actual Keystone VID
	PRODUCT_ID: 0x4b53, // Example - actual Keystone PID
	INTERFACE: 0,
	ENDPOINT_IN: 0x81,
	ENDPOINT_OUT: 0x01,
	PACKET_SIZE: 64,
};

/**
 * USB Command Types
 */
export enum USBCommand {
	GET_DEVICE_INFO = 0x01,
	GET_MASTER_FINGERPRINT = 0x02,
	GET_XPUB = 0x03,
	SIGN_TRANSACTION = 0x04,
	SIGN_MESSAGE = 0x05,
	GET_ADDRESS = 0x06,
	VERIFY_ADDRESS = 0x07,
	GET_ACCOUNTS = 0x08,
	GET_FIRMWARE_VERSION = 0x09,
	GET_SE_VERSION = 0x0a,
	PING = 0xff,
}

/**
 * USB Response Status
 */
export enum USBStatus {
	SUCCESS = 0x00,
	ERROR_INVALID_COMMAND = 0x01,
	ERROR_INVALID_DATA = 0x02,
	ERROR_USER_REJECTED = 0x03,
	ERROR_TIMEOUT = 0x04,
	ERROR_DEVICE_BUSY = 0x05,
	ERROR_NOT_SUPPORTED = 0x06,
	ERROR_INTERNAL = 0xff,
}

/**
 * Device Connection State
 */
export enum ConnectionState {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error',
}

/**
 * USB Device Info
 */
export interface USBDeviceInfo {
	vendorId: number;
	productId: number;
	serialNumber?: string;
	manufacturer?: string;
	product?: string;
	firmwareVersion?: string;
	seVersion?: string;
	masterFingerprint?: string;
}

/**
 * USB Command Request
 */
export interface USBRequest {
	command: USBCommand;
	data?: Uint8Array;
	timeout?: number;
}

/**
 * USB Command Response
 */
export interface USBResponse {
	status: USBStatus;
	data?: Uint8Array;
	error?: string;
}

/**
 * USB Transport Configuration
 */
export interface USBTransportConfig {
	timeout: number;
	retries: number;
	autoReconnect: boolean;
}

/**
 * Default USB configuration
 */
export const DEFAULT_USB_CONFIG: USBTransportConfig = {
	timeout: 30000, // 30 seconds for signing operations
	retries: 3,
	autoReconnect: true,
};

/**
 * USB Packet structure
 */
interface USBPacket {
	command: USBCommand;
	sequence: number;
	totalPackets: number;
	data: Uint8Array;
}

/**
 * Build USB command packet
 *
 * @param command - Command type
 * @param data - Optional data payload
 * @returns Formatted packet bytes
 */
export const buildPacket = (command: USBCommand, data?: Uint8Array): Uint8Array => {
	const dataLength = data?.length || 0;
	const packet = new Uint8Array(KEYSTONE_USB.PACKET_SIZE);

	// Header
	packet[0] = 0x4b; // 'K' - Keystone marker
	packet[1] = 0x53; // 'S' - Keystone marker
	packet[2] = command;
	packet[3] = (dataLength >> 8) & 0xff;
	packet[4] = dataLength & 0xff;

	// Data payload
	if (data && dataLength > 0) {
		const maxPayload = KEYSTONE_USB.PACKET_SIZE - 5;
		const copyLength = Math.min(dataLength, maxPayload);
		packet.set(data.subarray(0, copyLength), 5);
	}

	return packet;
};

/**
 * Parse USB response packet
 *
 * @param packet - Raw response bytes
 * @returns Parsed response
 */
export const parsePacket = (packet: Uint8Array): USBResponse => {
	// Validate header
	if (packet[0] !== 0x4b || packet[1] !== 0x53) {
		return { status: USBStatus.ERROR_INVALID_DATA, error: 'Invalid packet header' };
	}

	const status = packet[2] as USBStatus;
	const dataLength = (packet[3] << 8) | packet[4];

	if (dataLength > 0) {
		const data = packet.slice(5, 5 + dataLength);
		return { status, data };
	}

	return { status };
};

/**
 * Split large data into multiple packets
 *
 * @param command - Command type
 * @param data - Large data to split
 * @returns Array of packets
 */
export const splitIntoPackets = (command: USBCommand, data: Uint8Array): USBPacket[] => {
	const maxPayload = KEYSTONE_USB.PACKET_SIZE - 7; // Header + sequence info
	const totalPackets = Math.ceil(data.length / maxPayload);
	const packets: USBPacket[] = [];

	for (let i = 0; i < totalPackets; i++) {
		const start = i * maxPayload;
		const end = Math.min(start + maxPayload, data.length);
		const packetData = data.slice(start, end);

		packets.push({
			command,
			sequence: i,
			totalPackets,
			data: packetData,
		});
	}

	return packets;
};

/**
 * Merge multiple response packets
 *
 * @param packets - Array of received packets
 * @returns Merged data
 */
export const mergePackets = (packets: USBPacket[]): Uint8Array => {
	const sortedPackets = [...packets].sort((a, b) => a.sequence - b.sequence);
	const totalLength = sortedPackets.reduce((sum, p) => sum + p.data.length, 0);
	const merged = new Uint8Array(totalLength);

	let offset = 0;
	for (const packet of sortedPackets) {
		merged.set(packet.data, offset);
		offset += packet.data.length;
	}

	return merged;
};

/**
 * USB Transport Interface
 *
 * Abstract interface for USB communication.
 * Implementations should handle platform-specific USB APIs.
 */
export interface IUSBTransport {
	/** Connect to device */
	connect(): Promise<boolean>;

	/** Disconnect from device */
	disconnect(): Promise<void>;

	/** Check if connected */
	isConnected(): boolean;

	/** Send command and receive response */
	sendCommand(request: USBRequest): Promise<USBResponse>;

	/** Get device info */
	getDeviceInfo(): Promise<USBDeviceInfo | null>;

	/** Set event listener */
	onStateChange(callback: (state: ConnectionState) => void): void;
}

/**
 * Mock USB Transport for testing
 *
 * Simulates Keystone 3 Pro USB communication for development and testing.
 */
export class MockUSBTransport implements IUSBTransport {
	private connected: boolean = false;
	private stateCallback?: (state: ConnectionState) => void;
	private mockDeviceInfo: USBDeviceInfo = {
		vendorId: KEYSTONE_USB.VENDOR_ID,
		productId: KEYSTONE_USB.PRODUCT_ID,
		serialNumber: 'KS3PRO-MOCK-001',
		manufacturer: 'Keystone',
		product: 'Keystone 3 Pro',
		firmwareVersion: '1.2.0',
		seVersion: '1.0.5',
		masterFingerprint: '12345678',
	};

	async connect(): Promise<boolean> {
		this.setState(ConnectionState.CONNECTING);

		// Simulate connection delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		this.connected = true;
		this.setState(ConnectionState.CONNECTED);

		return true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
		this.setState(ConnectionState.DISCONNECTED);
	}

	isConnected(): boolean {
		return this.connected;
	}

	async sendCommand(request: USBRequest): Promise<USBResponse> {
		if (!this.connected) {
			return { status: USBStatus.ERROR_DEVICE_BUSY, error: 'Not connected' };
		}

		// Simulate command processing
		await new Promise((resolve) => setTimeout(resolve, 100));

		switch (request.command) {
			case USBCommand.PING:
				return { status: USBStatus.SUCCESS };

			case USBCommand.GET_DEVICE_INFO:
				const infoJson = JSON.stringify(this.mockDeviceInfo);
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(infoJson),
				};

			case USBCommand.GET_MASTER_FINGERPRINT:
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(this.mockDeviceInfo.masterFingerprint!),
				};

			case USBCommand.GET_FIRMWARE_VERSION:
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(this.mockDeviceInfo.firmwareVersion!),
				};

			case USBCommand.GET_SE_VERSION:
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(this.mockDeviceInfo.seVersion!),
				};

			case USBCommand.GET_XPUB:
				// Mock xpub response
				const mockXpub = 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWZiD6...(mock)';
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(mockXpub),
				};

			case USBCommand.GET_ADDRESS:
				// Mock address response
				const mockAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(mockAddress),
				};

			case USBCommand.SIGN_TRANSACTION:
			case USBCommand.SIGN_MESSAGE:
				// Simulate user approval delay
				await new Promise((resolve) => setTimeout(resolve, 2000));
				// Mock signature
				const mockSig = 'mock_signature_' + Date.now().toString(16);
				return {
					status: USBStatus.SUCCESS,
					data: new TextEncoder().encode(mockSig),
				};

			default:
				return { status: USBStatus.ERROR_NOT_SUPPORTED, error: 'Command not supported' };
		}
	}

	async getDeviceInfo(): Promise<USBDeviceInfo | null> {
		if (!this.connected) return null;
		return this.mockDeviceInfo;
	}

	onStateChange(callback: (state: ConnectionState) => void): void {
		this.stateCallback = callback;
	}

	private setState(state: ConnectionState): void {
		this.stateCallback?.(state);
	}
}

/**
 * USB Transport Manager
 *
 * Manages USB device connections and communication.
 */
export class USBTransportManager {
	private transport: IUSBTransport;
	private config: USBTransportConfig;

	constructor(transport?: IUSBTransport, config: Partial<USBTransportConfig> = {}) {
		this.transport = transport || new MockUSBTransport();
		this.config = { ...DEFAULT_USB_CONFIG, ...config };
	}

	/**
	 * Connect to Keystone device
	 */
	async connect(): Promise<boolean> {
		let attempts = 0;

		while (attempts < this.config.retries) {
			try {
				const result = await this.transport.connect();
				if (result) return true;
			} catch (error) {
				attempts++;
				if (attempts >= this.config.retries) {
					throw new Error(`Failed to connect after ${this.config.retries} attempts`);
				}
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		return false;
	}

	/**
	 * Disconnect from device
	 */
	async disconnect(): Promise<void> {
		await this.transport.disconnect();
	}

	/**
	 * Send command with timeout
	 */
	async sendCommand(command: USBCommand, data?: Uint8Array): Promise<USBResponse> {
		const timeout = this.config.timeout;

		const timeoutPromise = new Promise<USBResponse>((_, reject) => {
			setTimeout(() => reject(new Error('Command timeout')), timeout);
		});

		const commandPromise = this.transport.sendCommand({ command, data, timeout });

		return Promise.race([commandPromise, timeoutPromise]);
	}

	/**
	 * Get device information
	 */
	async getDeviceInfo(): Promise<USBDeviceInfo | null> {
		return this.transport.getDeviceInfo();
	}

	/**
	 * Ping device to check connection
	 */
	async ping(): Promise<boolean> {
		try {
			const response = await this.sendCommand(USBCommand.PING);
			return response.status === USBStatus.SUCCESS;
		} catch {
			return false;
		}
	}

	/**
	 * Get master fingerprint
	 */
	async getMasterFingerprint(): Promise<string | null> {
		try {
			const response = await this.sendCommand(USBCommand.GET_MASTER_FINGERPRINT);
			if (response.status === USBStatus.SUCCESS && response.data) {
				return new TextDecoder().decode(response.data);
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Check if device is connected
	 */
	isConnected(): boolean {
		return this.transport.isConnected();
	}

	/**
	 * Set connection state change callback
	 */
	onStateChange(callback: (state: ConnectionState) => void): void {
		this.transport.onStateChange(callback);
	}
}

export default {
	KEYSTONE_USB,
	USBCommand,
	USBStatus,
	ConnectionState,
	buildPacket,
	parsePacket,
	splitIntoPackets,
	mergePackets,
	MockUSBTransport,
	USBTransportManager,
	DEFAULT_USB_CONFIG,
};
