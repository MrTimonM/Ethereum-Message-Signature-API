// server.js
const express = require('express');
const { ethers } = require('ethers');
const app = express();

app.get('/sign', async (req, res) => {
  const { key, message } = req.query;
  if (!key || !message) {
    return res.status(400).json({ error: 'Missing key or message' });
  }
  try {
    const wallet = new ethers.Wallet(key);
    const signature = await wallet.signMessage(message);
    return res.json({ address: wallet.address, signature });
  } catch (err) {
    return res.status(500).json({ error: 'Invalid key or signing error', details: err.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));