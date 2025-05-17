# Ethereum Message Authentication API

A simple API for signing messages with Ethereum private keys and verifying signatures to prove ownership of Ethereum addresses.

## Features

- Sign messages with your private key
- Verify signatures to confirm message authenticity
- Simple RESTful API

## Endpoints

### Sign a Message

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

### Verify a Signature

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

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your PORT config
4. Start the server: `npm start`

## Development

Run the server in development mode with auto-reload:
```
npm run dev
```

## Deployment to Vercel

This project is configured for easy deployment to Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel`

## Security Warning

⚠️ **NEVER send your private key as a URL parameter in production!** This is for demonstration purposes only. In a real-world scenario, you should:
- Keep your private key secure
- Only sign messages client-side using secure libraries
- Consider using a secure wallet connection (like MetaMask) instead

## License

ISC
