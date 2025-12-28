# n8n-nodes-keystone

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Keystone hardware wallet integration, providing 25 resources and 200+ operations for air-gapped cryptocurrency signing, multi-chain support, and wallet integrations.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Chains](https://img.shields.io/badge/chains-20%2B-green)
![Air-Gapped](https://img.shields.io/badge/security-air--gapped-brightgreen)

## Features

- **Air-Gapped Security**: Complete offline signing via QR codes - private keys never leave the device
- **Multi-Chain Support**: Bitcoin, Ethereum, Solana, Cosmos, and 15+ additional blockchains
- **QR Code Workflows**: Generate and parse standard and animated QR codes for data transfer
- **UR Encoding**: Full Uniform Resource (BC-UR) encoding/decoding support
- **PSBT Support**: Create, sign, and broadcast Partially Signed Bitcoin Transactions
- **Multi-Signature**: Setup and manage multi-sig wallets with threshold signing
- **Watch-Only Wallets**: Export and sync with software wallets
- **Wallet Integrations**: MetaMask, Rabby, BlueWallet, Sparrow, Specter, Electrum, and more
- **USB Support**: Direct USB connection for Keystone 3 Pro devices
- **EIP-712**: Typed data signing for Ethereum and EVM chains

## Installation

### Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes** in your n8n instance
2. Select **Install**
3. Enter `n8n-nodes-keystone` and confirm

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-keystone

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-keystone.git
cd n8n-nodes-keystone

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-keystone

# Restart n8n
```

## Credentials Setup

### Keystone Device Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Connection Type | QR Code, USB, or SDK | Yes |
| Device Model | Keystone 3 Pro, Essential, or Pro | Yes |
| QR Scan Method | Camera, Upload, or URL | No |
| USB Device Path | Device path for USB connection | No |
| Master Fingerprint | Device identifier (8 hex chars) | No |
| Account Index | Default account index (0-based) | No |

### Keystone SDK Credentials

| Field | Description | Required |
|-------|-------------|----------|
| SDK Version | Keystone SDK version | Yes |
| UR Codec Version | BC-UR codec version | Yes |
| Fragment Size | Max bytes per QR fragment | No |
| Error Correction | QR error correction level | No |
| Custom Derivation Paths | Custom BIP32 paths | No |

### Keystone Network Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Blockchain | Target blockchain | Yes |
| Network Type | Mainnet or Testnet | Yes |
| RPC URL | JSON-RPC endpoint | No |
| Explorer API | Block explorer API endpoint | No |
| Chain ID | EVM chain ID | No |

## Resources & Operations

### Device Resource
- Get Device Info, Fingerprint, Version, Battery Status
- Check Connection, Verify Authenticity
- Get Supported Chains, SE Version

### Account Resource
- Get Accounts, Addresses, Extended Public Keys
- Import/Export via QR, Sync Accounts
- Multi-Sig and Watch-Only account management

### QR Code Resource
- Generate/Parse QR Codes (standard and animated)
- Encode/Decode UR (Uniform Resource)
- Split/Merge large QR data
- Get Animation Frames

### Bitcoin Resource
- Get Accounts, Addresses, Extended Keys (xPub/yPub/zPub)
- Create/Sign PSBT, Compose Transactions
- Multi-Sig Setup and Signing
- Watch-Only Export, Message Signing

### Ethereum Resource
- Sign Transactions (Legacy, EIP-1559)
- Sign Messages (Personal, EIP-712 Typed Data)
- Get Balances (ETH and Tokens)
- Watch-Only Export

### EVM Chains Resource
- Support for Polygon, BSC, Arbitrum, Optimism, Avalanche, Base, Fantom, Cronos, OKX Chain
- Sign Transactions and Messages
- Cross-chain operations

### Solana Resource
- Sign Transactions (Legacy and Versioned)
- Sign Messages
- Get Token Accounts

### Cosmos Resource
- Sign Amino and Direct Transactions
- Support for Cosmos Hub, Osmosis, and other Cosmos chains

### Additional Chain Resources
- **Aptos**: Transaction and message signing
- **Sui**: Transaction and message signing
- **Near**: Transaction signing
- **Tron**: Transaction signing
- **XRP**: Transaction signing
- **Cardano**: Transaction and staking key management
- **Litecoin**: PSBT signing

### Multi-Sig Resource
- Create Multi-Sig Wallets
- Import/Export Co-Signers
- Coordinate Signature Collection
- Finalize Transactions

### Watch-Only Resource
- Export/Import Watch-Only Wallets
- Create Unsigned Transactions
- Sync Balances

### Transaction Resource
- Create Unsigned Transactions
- Generate/Import Transaction QR
- Combine Signatures
- Broadcast to Network
- Fee Estimation

### Signing Resource
- Sign Transactions, Messages, Typed Data
- Sign PSBT, Arbitrary Data
- Multi-Sign Coordination
- Signature Verification

### UR (Uniform Resource) Resource
- Encode/Decode UR format
- Create/Parse Crypto-PSBT
- Create/Parse Crypto-Account
- ETH/SOL Sign Request handling

### MetaMask Integration
- Generate Sync QR
- Sign MetaMask Transactions
- Parse Requests/Generate Responses

### Wallet Integration Resource
- MetaMask, Rabby, OKX Wallet
- BlueWallet, Sparrow, Specter, Electrum
- Keplr (Cosmos), Phantom, Solflare (Solana)
- Core (Avalanche)

### Firmware Resource
- Get Firmware/SE Version
- Check for Updates
- Verify Firmware Integrity

### Security Resource
- Verify Device Authenticity
- Get Secure Element Info
- Check Anti-Tamper Status
- Device Health Verification

### Utility Resource
- Get Supported Chains
- Validate Addresses
- Get Derivation Paths
- Convert Address Formats

## Trigger Node

The Keystone Trigger node monitors for events:

### QR Scan Triggers
- QR Code Scanned
- Animated QR Complete
- QR Parse Error

### Signature Triggers
- Signature Ready
- Multi-Sig Signature Added
- All Signatures Collected

### Transaction Triggers
- Transaction Created
- Transaction Signed
- Transaction Broadcast
- Transaction Confirmed

### Account Triggers
- Account Imported
- Watch-Only Created
- Multi-Sig Setup Complete

### Device Triggers
- Device Connected (USB)
- Firmware Update Available

## Usage Examples

### Air-Gapped Bitcoin Signing

```javascript
// 1. Create unsigned PSBT
const psbt = await Keystone.bitcoin.createPsbt({
  inputs: [{ txid: '...', vout: 0 }],
  outputs: [{ address: 'bc1q...', amount: 0.001 }],
  changeAddress: 'bc1q...'
});

// 2. Generate QR for device signing
const qrCode = await Keystone.qrCode.generateAnimatedQr({
  data: psbt.psbtBase64,
  urType: 'crypto-psbt'
});

// 3. Display QR, scan on Keystone device

// 4. Import signed PSBT from device
const signedPsbt = await Keystone.bitcoin.importSignatureQr({
  qrData: scannedQrData
});

// 5. Broadcast transaction
const txid = await Keystone.bitcoin.broadcastTransaction({
  signedPsbt: signedPsbt.psbtBase64
});
```

### Ethereum Transaction Signing

```javascript
// 1. Prepare EIP-1559 transaction
const unsignedTx = {
  to: '0x...',
  value: '0.1',
  maxFeePerGas: '50',
  maxPriorityFeePerGas: '2',
  gasLimit: 21000,
  chainId: 1
};

// 2. Generate signing request QR
const qrCode = await Keystone.ethereum.signEip1559Transaction({
  transaction: unsignedTx,
  derivationPath: "m/44'/60'/0'/0/0"
});

// 3. Import signature from device
const signature = await Keystone.ethereum.importSignatureQr({
  qrData: scannedQrData
});

// 4. Broadcast
const txHash = await Keystone.ethereum.broadcastTransaction({
  signedTransaction: signature.signedTx
});
```

### Multi-Signature Workflow

```javascript
// 1. Create 2-of-3 multi-sig wallet
const wallet = await Keystone.multiSig.createMultiSigWallet({
  threshold: 2,
  totalSigners: 3,
  name: 'Treasury'
});

// 2. Import co-signer public keys
await Keystone.multiSig.importCoSigner({
  walletId: wallet.id,
  xpub: 'xpub...',
  name: 'Co-signer 1'
});

// 3. Create multi-sig PSBT
const psbt = await Keystone.multiSig.createMultiSigPsbt({
  walletId: wallet.id,
  outputs: [{ address: 'bc1q...', amount: 1.0 }]
});

// 4. Collect signatures from each signer
// (Each signer scans QR, signs on their device)

// 5. Combine and finalize
const finalTx = await Keystone.multiSig.combineSignatures({
  psbt: psbt.psbtBase64,
  signatures: [sig1, sig2]
});
```

### Watch-Only Wallet Setup

```javascript
// 1. Export watch-only from Keystone
const watchOnly = await Keystone.watchOnly.exportWatchOnlyQr({
  chain: 'bitcoin',
  format: 'sparrow'
});

// 2. Create watch-only wallet in n8n
const wallet = await Keystone.watchOnly.createWatchOnlyWallet({
  qrData: watchOnly.qrData,
  name: 'Cold Storage'
});

// 3. Monitor balance
const balance = await Keystone.watchOnly.getWatchOnlyBalance({
  walletId: wallet.id
});

// 4. Create unsigned transaction when needed
const unsignedTx = await Keystone.watchOnly.createUnsignedTransaction({
  walletId: wallet.id,
  outputs: [{ address: 'bc1q...', amount: 0.5 }]
});
```

### MetaMask Integration

```javascript
// 1. Generate MetaMask sync QR
const syncQr = await Keystone.metamask.getMetaMaskSyncQr({
  accountIndex: 0,
  includeAccounts: 5
});

// 2. Sign transaction request from MetaMask
const signedTx = await Keystone.metamask.signMetaMaskTransaction({
  requestQr: metamaskRequestQr,
  derivationPath: "m/44'/60'/0'/0/0"
});

// 3. Return signature to MetaMask
const responseQr = await Keystone.metamask.generateMetaMaskResponse({
  signature: signedTx.signature
});
```

## Keystone Concepts

### Air-Gapped Security
Keystone devices operate completely offline. Data transfer happens exclusively via QR codes, ensuring private keys never touch network-connected devices.

### Uniform Resource (UR)
BC-UR is a standard encoding format for blockchain data in QR codes. It enables:
- Structured data encoding with type tags
- Animated QR for large data (fragmented transfer)
- Cross-wallet compatibility

### PSBT (Partially Signed Bitcoin Transaction)
BIP-174 standard for handling Bitcoin transactions with multiple signing stages:
1. Create unsigned PSBT with inputs/outputs
2. Pass to signers (each adds their signature)
3. Combine signatures and finalize
4. Extract and broadcast raw transaction

### Master Fingerprint
An 8-character hex identifier derived from the master public key. Used to:
- Identify devices uniquely
- Match transactions to correct signing device
- Verify key derivation paths

### Animated QR Codes
For data exceeding single QR capacity (~2KB), Keystone uses animated QR:
- Data split into fragments
- Each fragment displayed sequentially
- Device reconstructs from scanned frames
- Progress indicator shows completion

## Supported Networks

| Chain | Mainnet | Testnet | Features |
|-------|---------|---------|----------|
| Bitcoin | ✅ | ✅ | PSBT, Multi-Sig, SegWit, Taproot |
| Ethereum | ✅ | ✅ | EIP-1559, EIP-712, Messages |
| Polygon | ✅ | ✅ | Full EVM support |
| BSC | ✅ | ✅ | Full EVM support |
| Arbitrum | ✅ | ✅ | Full EVM support |
| Optimism | ✅ | ✅ | Full EVM support |
| Avalanche | ✅ | ✅ | C-Chain support |
| Base | ✅ | ✅ | Full EVM support |
| Solana | ✅ | ✅ | Versioned transactions |
| Cosmos | ✅ | ✅ | Amino & Direct signing |
| Osmosis | ✅ | ✅ | Cosmos ecosystem |
| Aptos | ✅ | ✅ | Transaction signing |
| Sui | ✅ | ✅ | Transaction signing |
| Near | ✅ | ✅ | Transaction signing |
| Tron | ✅ | - | Transaction signing |
| XRP | ✅ | ✅ | Transaction signing |
| Cardano | ✅ | ✅ | ADA, staking |
| Litecoin | ✅ | ✅ | PSBT support |

## Error Handling

The node provides descriptive error codes:

| Code | Description |
|------|-------------|
| DEVICE_NOT_CONNECTED | No Keystone device detected |
| INVALID_QR_DATA | QR code format invalid |
| UR_DECODE_ERROR | Failed to decode UR data |
| PSBT_INVALID | PSBT format or content invalid |
| SIGNATURE_MISMATCH | Signature doesn't match transaction |
| INSUFFICIENT_SIGNATURES | Multi-sig threshold not met |
| NETWORK_ERROR | Blockchain network communication failed |
| UNSUPPORTED_CHAIN | Chain not supported by device |

## Security Best Practices

1. **Verify Device Authenticity**: Always run device verification on first use
2. **Visual Address Verification**: Confirm addresses on device screen before signing
3. **Check Transaction Details**: Verify amounts and recipients on device display
4. **Secure QR Transfer**: Ensure no cameras record QR codes during transfer
5. **Multi-Sig for High Value**: Use multi-signature for large holdings
6. **Regular Firmware Updates**: Keep device firmware current for security patches
7. **Backup Recovery Phrase**: Store seed phrase securely offline

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint

# Test
npm test

# Test with coverage
npm run test:coverage
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use

Permitted for personal, educational, research, and internal business use.

### Commercial Use

Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries:
**licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:
- Passes all tests (`npm test`)
- Follows linting rules (`npm run lint`)
- Includes appropriate documentation
- Maintains air-gap security principles

## Support

- **Documentation**: [GitHub Wiki](https://github.com/Velocity-BPA/n8n-nodes-keystone/wiki)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-keystone/issues)
- **Keystone Support**: [keyst.one](https://keyst.one)

## Acknowledgments

- [Keystone](https://keyst.one) - Hardware wallet manufacturer
- [Blockchain Commons](https://www.blockchaincommons.com/) - UR specification
- [n8n](https://n8n.io) - Workflow automation platform
