# Ethereum & SUI Wallet API

A comprehensive API for Ethereum message signing, SUI wallet operations, and cryptocurrency address generation with full wallet management capabilities.

## Features

- **Message Signing**: Sign messages with Ethereum private keys
- **Signature Verification**: Verify message signatures to confirm authenticity
- **ETH Wallet Generation**: Generate new Ethereum wallets with mnemonic phrases
- **SUI Wallet Generation**: Generate new SUI wallets with Ed25519 keypairs
- **SUI Key Conversion**: Convert SUI private keys to addresses
- **Interactive Web Interface**: Beautiful web UI for testing all features

## Endpoints

### Message Signing & Verification

#### Sign a Message
```
GET /sign?key={privateKey}&message={message}
```

**Parameters:**
- `key`: Your Ethereum private key
- `message`: The message to sign

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "message": "Your message here",
    "signature": "0x..."
  }
}
```

#### Verify a Signature
```
GET /verify?signature={signature}&message={message}
```

**Parameters:**
- `signature`: The signature to verify
- `message`: The original message

**Response:**
```json
{
  "success": true,
  "data": {
    "recoveredAddress": "0x...",
    "message": "Your message here",
    "isValid": true
  }
}
```

### Wallet Generation

#### Generate ETH Wallet
```
GET /generate-eth
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "privateKey": "0x...",
    "mnemonic": "word1 word2 word3...",
    "publicKey": "0x...",
    "derivationPath": "m/44'/60'/0'/0/0"
  }
}
```

#### Generate SUI Wallet
```
GET /generate-sui
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "privateKey": "64-character-hex-string",
    "publicKey": "base64-encoded-public-key",
    "keyType": "Ed25519"
  }
}
```

### Key Conversion

#### ETH Private Key to Wallet
```
GET /eth-key-to-wallet?privateKey={privateKey}
```

**Parameters:**
- `privateKey`: Ethereum private key (64 hex characters, with or without 0x prefix)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "privateKey": "0x...",
    "publicKey": "0x04...",
    "compressedPublicKey": "0x02..."
  }
}
```

#### SUI Private Key to Address
```
GET /sui-key-to-address?privateKey={privateKey}
```

**Parameters:**
- `privateKey`: SUI private key (64 hex characters)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "publicKey": "base64-encoded-public-key",
    "privateKey": "64-character-hex-string",
    "keyType": "Ed25519"
  }
}
```## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Ethereum-Message-Signature-API
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file (optional)
```bash
PORT=3000
```

4. Start the server
```bash
npm start
```

5. Visit `http://localhost:3000` to see the interactive web interface

## Development

Run the server in development mode with auto-reload:
```bash
npm run dev
```

## Dependencies

- **ethers**: Ethereum wallet and cryptography library
- **@mysten/sui**: SUI blockchain SDK for wallet operations
- **bip39**: Mnemonic phrase generation for HD wallets
- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Web Interface

The API includes a beautiful, interactive web interface with:
- **Tabbed Navigation**: Organize features into logical groups
- **Real-time Testing**: Test all endpoints directly in the browser
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional design with syntax highlighting

## API Testing Examples

### Using cURL

Generate an ETH wallet:
```bash
curl "http://localhost:3000/generate-eth"
```

Generate a SUI wallet:
```bash
curl "http://localhost:3000/generate-sui"
```

Sign a message:
```bash
curl "http://localhost:3000/sign?key=0x...&message=Hello%20World"
```

Convert SUI private key:
```bash
curl "http://localhost:3000/sui-key-to-address?privateKey=64-char-hex-key"
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel`

The `vercel.json` configuration file is already included.

## Security Warning

⚠️ **IMPORTANT**: This API is for demonstration and development purposes only. 

**NEVER use this in production with real private keys!**

In production:
- Keep private keys secure and never transmit them over HTTP
- Use HTTPS for all communications
- Implement proper authentication and authorization
- Consider using hardware wallets or secure key management services
- Sign messages client-side when possible

## Supported Cryptocurrencies

- **Ethereum (ETH)**: Full support for wallet generation, message signing, and verification
- **SUI**: Ed25519 keypair generation and address conversion

## License

ISC
