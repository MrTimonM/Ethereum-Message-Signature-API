# Ethereum Message Signature API

A simple web API to sign messages with an Ethereum private key. Useful for verifying wallet ownership.

## Features
- Sign any message with your Ethereum private key
- Returns the signature and wallet address in JSON
- Simple web UI for local testing
- Ready for Vercel deployment

## Usage

### API Endpoint
```
GET /sign?key=YOUR_PRIVATE_KEY&message=YOUR_MESSAGE
```
- **key**: Your Ethereum private key (hex string, starting with `0x`)
- **message**: The message you want to sign

**Response:**
```
{
  "address": "0x...", // Wallet address
  "signature": "0x..." // Signature
}
```

### Example
```
GET http://localhost:3000/sign?key=0xYOURPRIVATEKEY&message=hello
```

### Web UI
Open `index.html` in your browser for a simple interface to test the API locally.

## Security Warning
**Never share your private key or use this API in production.**
This is for local/testing purposes only. Exposing your private key can result in loss of funds.

## Deploying to Vercel
- Place the API handler in `api/sign.js` for Vercel compatibility.
- Push to GitHub and import the repo in Vercel.
- The API will be available at `/api/sign` on your deployed site.

---

MIT License
