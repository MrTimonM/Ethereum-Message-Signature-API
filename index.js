const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const dotenv = require('dotenv');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Secp256k1Keypair } = require('@mysten/sui/keypairs/secp256k1');
const bip39 = require('bip39');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route for message signing
app.get('/sign', async (req, res) => {
  try {
    const { key, message } = req.query;

    if (!key || !message) {
      return res.status(400).json({ 
        error: 'Private key and message are required',
        success: false
      });
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(key);
    
    // Get the address
    const address = wallet.address;
    
    // Sign the message
    const signature = await wallet.signMessage(message);
    
    // Return the signature and address
    return res.status(200).json({
      success: true,
      data: {
        address,
        message,
        signature
      }
    });
  } catch (error) {
    console.error('Error signing message:', error);
    return res.status(500).json({ 
      error: 'Error signing message. Please ensure the private key is valid.',
      success: false
    });
  }
});

// Add a verification endpoint as well (optional but useful)
app.get('/verify', async (req, res) => {
  try {
    const { message, signature } = req.query;

    if (!message || !signature) {
      return res.status(400).json({ 
        error: 'Message and signature are required',
        success: false
      });
    }

    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    return res.status(200).json({
      success: true,
      data: {
        recoveredAddress,
        message,
        isValid: true
      }
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return res.status(500).json({ 
      error: 'Error verifying signature',
      success: false
    });
  }
});

// Generate new ETH wallet with private key and mnemonic
app.get('/generate-eth', async (req, res) => {
  try {
    // Generate a random mnemonic phrase
    const mnemonic = bip39.generateMnemonic();
    
    // Create HD wallet from mnemonic (this creates the master node)
    const hdWallet = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic));
    
    // Derive the wallet at the standard Ethereum path
    const derivationPath = "m/44'/60'/0'/0/0";
    const wallet = hdWallet.derivePath(derivationPath);
    
    return res.status(200).json({
      success: true,
      data: {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic,
        publicKey: wallet.publicKey,
        derivationPath: derivationPath
      }
    });
  } catch (error) {
    console.error('Error generating ETH wallet:', error);
    
    // Fallback: Generate a simple random wallet if HD derivation fails
    try {
      const mnemonic = bip39.generateMnemonic();
      const randomWallet = ethers.Wallet.createRandom();
      
      return res.status(200).json({
        success: true,
        data: {
          address: randomWallet.address,
          privateKey: randomWallet.privateKey,
          mnemonic: mnemonic,
          publicKey: randomWallet.publicKey,
          derivationPath: "random"
        }
      });
    } catch (fallbackError) {
      console.error('Error in fallback wallet generation:', fallbackError);
      return res.status(500).json({ 
        error: 'Error generating ETH wallet',
        success: false
      });
    }
  }
});

// Generate new SUI wallet with Ed25519 keypair
app.get('/generate-sui', async (req, res) => {
  try {
    // Generate Ed25519 keypair for SUI
    const keypair = new Ed25519Keypair();
    
    // Get the address and private key
    const address = keypair.getPublicKey().toSuiAddress();
    const privateKeyBytes = keypair.getSecretKey();
    const publicKey = keypair.getPublicKey().toBase64();
    
    // Convert private key to hex (32 bytes = 64 hex characters)
    const privateKeyHex = Buffer.from(privateKeyBytes.slice(0, 32)).toString('hex');
    
    return res.status(200).json({
      success: true,
      data: {
        address: address,
        privateKey: privateKeyHex,
        publicKey: publicKey,
        keyType: 'Ed25519'
      }
    });
  } catch (error) {
    console.error('Error generating SUI wallet:', error);
    return res.status(500).json({ 
      error: 'Error generating SUI wallet',
      success: false
    });
  }
});

// Convert SUI private key to address
app.get('/sui-key-to-address', async (req, res) => {
  try {
    const { privateKey } = req.query;

    if (!privateKey) {
      return res.status(400).json({ 
        error: 'Private key is required',
        success: false
      });
    }

    // Remove 0x prefix if present and ensure it's the right length
    let cleanPrivateKey = privateKey.replace('0x', '');
    
    // For Ed25519, we expect 64 hex characters (32 bytes)
    if (cleanPrivateKey.length !== 64) {
      return res.status(400).json({ 
        error: 'Invalid private key length. Expected 64 hex characters for Ed25519.',
        success: false
      });
    }

    // Convert hex string to Uint8Array
    const privateKeyBytes = new Uint8Array(Buffer.from(cleanPrivateKey, 'hex'));
    
    // Create keypair from private key
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    
    // Get the address and public key
    const address = keypair.getPublicKey().toSuiAddress();
    const publicKey = keypair.getPublicKey().toBase64();
    
    return res.status(200).json({
      success: true,
      data: {
        address: address,
        publicKey: publicKey,
        privateKey: cleanPrivateKey,
        keyType: 'Ed25519'
      }
    });
  } catch (error) {
    console.error('Error converting SUI private key:', error);    return res.status(500).json({ 
      error: 'Error converting SUI private key. Please ensure the private key is valid.',
      success: false
    });
  }
});

// Convert ETH private key to wallet address and public key
app.get('/eth-key-to-wallet', async (req, res) => {
  try {
    const { privateKey } = req.query;

    if (!privateKey) {
      return res.status(400).json({ 
        error: 'Private key is required',
        success: false
      });
    }

    // Remove 0x prefix if present and validate format
    let cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    
    // Validate private key length (should be 66 characters with 0x prefix)
    if (cleanPrivateKey.length !== 66) {
      return res.status(400).json({ 
        error: 'Invalid private key format. Expected 64 hex characters (with or without 0x prefix).',
        success: false
      });
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(cleanPrivateKey);
    
    // Get wallet information
    const address = wallet.address;
    const publicKey = wallet.publicKey;
    
    return res.status(200).json({
      success: true,
      data: {
        address: address,
        privateKey: cleanPrivateKey,
        publicKey: publicKey,
        compressedPublicKey: ethers.SigningKey.computePublicKey(cleanPrivateKey, true)
      }
    });
  } catch (error) {
    console.error('Error converting ETH private key:', error);
    return res.status(500).json({ 
      error: 'Error converting ETH private key. Please ensure the private key is valid.',
      success: false
    });
  }
});

// Serve static files
app.use(express.static('public'));

// Root route for API documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ethereum & SUI Wallet API</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #3b82f6;
          --primary-darker: #2563eb;
          --secondary: #6366f1;
          --sui: #4FC3F7;
          --sui-darker: #29B6F6;
          --dark: #1e293b;
          --light: #f8fafc;
          --success: #22c55e;
          --warning: #eab308;
          --danger: #ef4444;
          --gray: #94a3b8;
          --border-radius: 8px;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: var(--dark);
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        header h1 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(90deg, var(--primary) 0%, var(--sui) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        header p {
          color: var(--gray);
          font-size: 18px;
          max-width: 700px;
          margin: 0 auto;
        }

        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          color: var(--gray);
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }
        
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }
        
        @media (min-width: 768px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        
        .card {
          background-color: white;
          border-radius: var(--border-radius);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 30px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 20px;
        }
        
        .sign-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .verify-icon {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }

        .eth-icon {
          background: linear-gradient(135deg, #627eea 0%, #4f46e5 100%);
          color: white;
        }

        .sui-icon {
          background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
          color: white;
        }

        .convert-icon {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .card h2 {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
        }
        
        .endpoint {
          background-color: #f1f5f9;
          border-radius: var(--border-radius);
          padding: 15px;
          margin: 20px 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 14px;
          overflow-x: auto;
        }
        
        .endpoint .method {
          color: var(--primary);
          font-weight: 600;
        }
        
        .endpoint .param {
          color: var(--secondary);
        }
        
        .param-list {
          margin: 20px 0;
        }
        
        .param-item {
          margin-bottom: 10px;
        }
        
        .param-name {
          font-weight: 600;
          margin-right: 8px;
        }
        
        .response {
          background-color: #f1f5f9;
          border-radius: var(--border-radius);
          padding: 15px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 14px;
          white-space: pre;
          overflow-x: auto;
          color: #334155;
        }
        
        .string { color: #16a34a; }
        .number { color: #2563eb; }
        .boolean { color: #9333ea; }
        .null { color: #dc2626; }
        .key { color: #0369a1; }
        
        .warning {
          background-color: #fef9c3;
          border-left: 4px solid var(--warning);
          padding: 16px;
          margin-top: 40px;
          border-radius: 4px;
        }
        
        .warning h3 {
          display: flex;
          align-items: center;
          color: #854d0e;
          font-size: 18px;
          margin-bottom: 8px;
        }
        
        .warning h3::before {
          content: "⚠️";
          margin-right: 8px;
        }
        
        .warning p {
          color: #854d0e;
          margin: 0;
        }
        
        footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: var(--gray);
          font-size: 14px;
        }
        
        .tag {
          display: inline-block;
          background-color: #e0f2fe;
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          margin: 2px;
        }

        .try-it {
          margin-top: 30px;
        }

        .try-it h3 {
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 600;
        }

        .interactive-demo {
          background-color: #f8fafc;
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .button {
          display: inline-block;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-right: 10px;
          margin-bottom: 10px;
        }

        .button:hover {
          background-color: var(--primary-darker);
        }

        .button.sui {
          background-color: var(--sui);
        }

        .button.sui:hover {
          background-color: var(--sui-darker);
        }

        #result {
          margin-top: 20px;
          background-color: #f1f5f9;
          border-radius: var(--border-radius);
          padding: 15px;
          min-height: 100px;
          white-space: pre-wrap;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
          font-size: 14px;
          word-break: break-all;
        }

        .copy-btn {
          background-color: var(--success);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;
        }

        .section-divider {
          border-top: 2px solid #e2e8f0;
          margin: 40px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Ethereum & SUI Wallet API</h1>
          <p>A comprehensive API for Ethereum message signing, SUI wallet operations, and cryptocurrency address generation with full wallet management capabilities</p>
        </header>
        
        <!-- Tab Navigation -->
        <div class="tabs">
          <button class="tab active" onclick="showTab('signing')">Message Signing</button>
          <button class="tab" onclick="showTab('generation')">Wallet Generation</button>
          <button class="tab" onclick="showTab('conversion')">Key Conversion</button>
        </div>

        <!-- Signing Tab -->
        <div id="signing" class="tab-content active">
          <div class="grid">
            <!-- Sign Message Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon sign-icon">✏️</div>
                <h2>Sign Messages</h2>
              </div>
              <p>Sign messages using your Ethereum private key to prove ownership of your wallet address.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /sign?<span class="param">key</span>={privateKey}&<span class="param">message</span>={message}
              </div>
              
              <div class="param-list">
                <div class="param-item">
                  <span class="param-name">key:</span> Your Ethereum private key
                </div>
                <div class="param-item">
                  <span class="param-name">message:</span> The message to sign
                </div>
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"address":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"message":</span> <span class="string">"Hello, Ethereum!"</span>,
    <span class="key">"signature":</span> <span class="string">"0x7f9b8c..."</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <div class="form-group">
                    <label for="privateKey">Private Key (Ethereum)</label>
                    <input type="text" id="privateKey" placeholder="0x..." />
                  </div>
                  <div class="form-group">
                    <label for="signMessage">Message to Sign</label>
                    <input type="text" id="signMessage" placeholder="Hello, World!" />
                  </div>
                  <button class="button" onclick="signMessage()">Sign Message</button>
                </div>
              </div>
            </div>
            
            <!-- Verify Signature Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon verify-icon">✓</div>
                <h2>Verify Signatures</h2>
              </div>
              <p>Verify message signatures to confirm the authenticity of messages and the identity of the signer.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /verify?<span class="param">signature</span>={signature}&<span class="param">message</span>={message}
              </div>
              
              <div class="param-list">
                <div class="param-item">
                  <span class="param-name">signature:</span> The signature to verify
                </div>
                <div class="param-item">
                  <span class="param-name">message:</span> The original message that was signed
                </div>
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"recoveredAddress":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"message":</span> <span class="string">"Hello, Ethereum!"</span>,
    <span class="key">"isValid":</span> <span class="boolean">true</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <div class="form-group">
                    <label for="signature">Signature</label>
                    <input type="text" id="signature" placeholder="0x..." />
                  </div>
                  <div class="form-group">
                    <label for="verifyMessage">Original Message</label>
                    <input type="text" id="verifyMessage" placeholder="Hello, World!" />
                  </div>
                  <button class="button" onclick="verifySignature()">Verify Signature</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Generation Tab -->
        <div id="generation" class="tab-content">
          <div class="grid">
            <!-- Generate ETH Wallet Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon eth-icon">Ξ</div>
                <h2>Generate ETH Wallet</h2>
              </div>
              <p>Generate a new Ethereum wallet with private key, public key, address, and mnemonic phrase.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /generate-eth
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"address":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"privateKey":</span> <span class="string">"0x7f9b8c..."</span>,
    <span class="key">"mnemonic":</span> <span class="string">"word1 word2..."</span>,
    <span class="key">"publicKey":</span> <span class="string">"0x04..."</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <button class="button" onclick="generateEthWallet()">Generate New ETH Wallet</button>
                </div>
              </div>
            </div>
            
            <!-- Generate SUI Wallet Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon sui-icon">SUI</div>
                <h2>Generate SUI Wallet</h2>
              </div>
              <p>Generate a new SUI wallet with Ed25519 keypair, address, and private key.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /generate-sui
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"address":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"privateKey":</span> <span class="string">"7f9b8c..."</span>,
    <span class="key">"publicKey":</span> <span class="string">"base64..."</span>,
    <span class="key">"keyType":</span> <span class="string">"Ed25519"</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <button class="button sui" onclick="generateSuiWallet()">Generate New SUI Wallet</button>
                </div>
              </div>
            </div>
          </div>
        </div>        <!-- Conversion Tab -->
        <div id="conversion" class="tab-content">
          <div class="grid">
            <!-- ETH Key to Wallet Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon eth-icon">Ξ</div>
                <h2>ETH Key to Wallet</h2>
              </div>
              <p>Convert an Ethereum private key to its corresponding wallet address and public key information.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /eth-key-to-wallet?<span class="param">privateKey</span>={privateKey}
              </div>
              
              <div class="param-list">
                <div class="param-item">
                  <span class="param-name">privateKey:</span> Ethereum private key (64 hex characters, with or without 0x prefix)
                </div>
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"address":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"privateKey":</span> <span class="string">"0x7f9b8c..."</span>,
    <span class="key">"publicKey":</span> <span class="string">"0x04..."</span>,
    <span class="key">"compressedPublicKey":</span> <span class="string">"0x02..."</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <div class="form-group">
                    <label for="ethPrivateKey">Ethereum Private Key</label>
                    <input type="text" id="ethPrivateKey" placeholder="0x... or 64 hex characters" />
                  </div>
                  <button class="button" onclick="convertEthKey()">Convert to Wallet</button>
                </div>
              </div>
            </div>

            <!-- SUI Key to Address Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-icon convert-icon">🔄</div>
                <h2>SUI Key to Address</h2>
              </div>
              <p>Convert a SUI private key to its corresponding address and public key.</p>
              
              <div class="endpoint">
                <span class="method">GET</span> /sui-key-to-address?<span class="param">privateKey</span>={privateKey}
              </div>
              
              <div class="param-list">
                <div class="param-item">
                  <span class="param-name">privateKey:</span> SUI private key (64 hex characters)
                </div>
              </div>
              
              <h3>Response</h3>
              <div class="response"><span class="key">{</span>
  <span class="key">"success":</span> <span class="boolean">true</span>,
  <span class="key">"data":</span> <span class="key">{</span>
    <span class="key">"address":</span> <span class="string">"0x1a2b3c..."</span>,
    <span class="key">"publicKey":</span> <span class="string">"base64..."</span>,
    <span class="key">"privateKey":</span> <span class="string">"7f9b8c..."</span>,
    <span class="key">"keyType":</span> <span class="string">"Ed25519"</span>
  <span class="key">}</span>
<span class="key">}</span></div>

              <div class="try-it">
                <h3>Try it</h3>
                <div class="interactive-demo">
                  <div class="form-group">
                    <label for="suiPrivateKey">SUI Private Key</label>
                    <input type="text" id="suiPrivateKey" placeholder="64 hex characters..." />
                  </div>
                  <button class="button" onclick="convertSuiKey()">Convert to Address</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="warning">
          <h3>Security Warning</h3>
          <p>This API is for demonstration purposes only. In production, never send your private key as a URL parameter. Private keys should be kept secure and used client-side when possible. Or send. Who cares, Obviously Olaf doesn't!!!</p>
        </div>
        
        <footer>
          <p>Ethereum & SUI Wallet API &copy; ${new Date().getFullYear()}</p>
          <div>
            <span class="tag">Ethereum</span>
            <span class="tag">SUI</span>
            <span class="tag">Web3</span>
            <span class="tag">Cryptography</span>
            <span class="tag">Wallet Generation</span>
          </div>
        </footer>
      </div>

      <!-- Results Display -->
      <div id="result" style="position: fixed; bottom: 20px; right: 20px; width: 400px; max-height: 300px; overflow-y: auto; z-index: 1000; display: none;">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
          <strong>Results:</strong>
          <button onclick="closeResult()" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; margin-left: auto;">✕</button>
        </div>
        <div id="resultContent">Results will appear here...</div>
      </div>

      <script>
        // Tab functionality
        function showTab(tabName) {
          // Hide all tab contents
          const tabContents = document.querySelectorAll('.tab-content');
          tabContents.forEach(content => content.classList.remove('active'));
          
          // Remove active class from all tabs
          const tabs = document.querySelectorAll('.tab');
          tabs.forEach(tab => tab.classList.remove('active'));
          
          // Show selected tab content
          document.getElementById(tabName).classList.add('active');
          
          // Add active class to clicked tab
          event.target.classList.add('active');
        }

        // Result display functions
        function showResult(content) {
          const resultDiv = document.getElementById('result');
          const resultContent = document.getElementById('resultContent');
          resultContent.innerHTML = content;
          resultDiv.style.display = 'block';
        }

        function closeResult() {
          document.getElementById('result').style.display = 'none';
        }

        // Copy to clipboard function
        function copyToClipboard(text) {
          navigator.clipboard.writeText(text).then(() => {
            alert('Copied to clipboard!');
          });
        }
        
        // Sign message function
        async function signMessage() {
          const privateKey = document.getElementById('privateKey').value;
          const message = document.getElementById('signMessage').value;
          
          if (!privateKey || !message) {
            showResult('<span style="color: #dc2626;">Please provide both a private key and a message.</span>');
            return;
          }
          
          try {
            showResult('Signing message...');
            const response = await fetch(\`/sign?key=\${encodeURIComponent(privateKey)}&message=\${encodeURIComponent(message)}\`);
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Result:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }
        
        // Verify signature function
        async function verifySignature() {
          const signature = document.getElementById('signature').value;
          const message = document.getElementById('verifyMessage').value;
          
          if (!signature || !message) {
            showResult('<span style="color: #dc2626;">Please provide both a signature and a message.</span>');
            return;
          }
          
          try {
            showResult('Verifying signature...');
            const response = await fetch(\`/verify?signature=\${encodeURIComponent(signature)}&message=\${encodeURIComponent(message)}\`);
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Result:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }

        // Generate ETH wallet function
        async function generateEthWallet() {
          try {
            showResult('Generating ETH wallet...');
            const response = await fetch('/generate-eth');
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Generated ETH Wallet:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }

        // Generate SUI wallet function
        async function generateSuiWallet() {
          try {
            showResult('Generating SUI wallet...');
            const response = await fetch('/generate-sui');
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Generated SUI Wallet:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }        // Convert SUI key function
        async function convertSuiKey() {
          const privateKey = document.getElementById('suiPrivateKey').value;
          
          if (!privateKey) {
            showResult('<span style="color: #dc2626;">Please provide a SUI private key.</span>');
            return;
          }
          
          try {
            showResult('Converting SUI private key...');
            const response = await fetch(\`/sui-key-to-address?privateKey=\${encodeURIComponent(privateKey)}\`);
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Conversion Result:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }

        // Convert ETH key function
        async function convertEthKey() {
          const privateKey = document.getElementById('ethPrivateKey').value;
          
          if (!privateKey) {
            showResult('<span style="color: #dc2626;">Please provide an Ethereum private key.</span>');
            return;
          }
          
          try {
            showResult('Converting Ethereum private key...');
            const response = await fetch(\`/eth-key-to-wallet?privateKey=\${encodeURIComponent(privateKey)}\`);
            const data = await response.json();
            showResult('<span style="color: #0369a1; font-weight: bold;">Conversion Result:</span>\\n' + JSON.stringify(data, null, 2));
          } catch (error) {
            showResult('<span style="color: #dc2626;">Error: </span>' + error.message);
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Ethereum Message Signing API running on port ${port}`);
  console.log(`Visit http://localhost:${port} to view the API documentation`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
});
