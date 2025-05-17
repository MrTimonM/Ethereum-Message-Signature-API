const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const dotenv = require('dotenv');

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
      <title>Ethereum Message Signing API</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #3b82f6;
          --primary-darker: #2563eb;
          --secondary: #6366f1;
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
          max-width: 1100px;
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
          background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        
        header p {
          color: var(--gray);
          font-size: 18px;
          max-width: 600px;
          margin: 0 auto;
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
          margin-top: 4px;
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
        }

        .button:hover {
          background-color: var(--primary-darker);
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
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Ethereum Message Signing API</h1>
          <p>A simple and secure API for signing messages with Ethereum private keys and verifying signatures</p>
        </header>
        
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
        
        <div class="warning">
          <h3>Security Warning</h3>
          <p>This API is for demonstration purposes only. In production, never send your private key as a URL parameter. Private keys should be kept secure and used client-side when possible. Or send. Who cares, Oviously Olaf doesn't!!!</p>
        </div>
        
        <footer>
          <p>Ethereum Message Signing API &copy; ${new Date().getFullYear()}</p>
          <div>
            <span class="tag">Ethereum</span>
            <span class="tag">Web3</span>
            <span class="tag">Cryptography</span>
          </div>
        </footer>
      </div>

      <script>
        // Result display element
        const resultElement = document.createElement('div');
        resultElement.id = 'result';
        resultElement.innerText = 'Results will appear here...';
        document.querySelector('.container').appendChild(resultElement);
        
        // Sign message function
        async function signMessage() {
          const privateKey = document.getElementById('privateKey').value;
          const message = document.getElementById('signMessage').value;
          
          if (!privateKey || !message) {
            resultElement.innerHTML = '<span style="color: #dc2626;">Please provide both a private key and a message.</span>';
            return;
          }
          
          try {
            resultElement.innerText = 'Signing message...';
            const response = await fetch(\`/sign?key=\${encodeURIComponent(privateKey)}&message=\${encodeURIComponent(message)}\`);
            const data = await response.json();
            resultElement.innerHTML = '<span style="color: #0369a1; font-weight: bold;">Result:</span>\\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            resultElement.innerHTML = '<span style="color: #dc2626;">Error: </span>' + error.message;
          }
        }
        
        // Verify signature function
        async function verifySignature() {
          const signature = document.getElementById('signature').value;
          const message = document.getElementById('verifyMessage').value;
          
          if (!signature || !message) {
            resultElement.innerHTML = '<span style="color: #dc2626;">Please provide both a signature and a message.</span>';
            return;
          }
          
          try {
            resultElement.innerText = 'Verifying signature...';
            const response = await fetch(\`/verify?signature=\${encodeURIComponent(signature)}&message=\${encodeURIComponent(message)}\`);
            const data = await response.json();
            resultElement.innerHTML = '<span style="color: #0369a1; font-weight: bold;">Result:</span>\\n' + JSON.stringify(data, null, 2);
          } catch (error) {
            resultElement.innerHTML = '<span style="color: #dc2626;">Error: </span>' + error.message;
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
