const express = require('express');
const router = express.Router();
const chain = require('./blockchain_sim');
const shortid = require('shortid');
const QRCode = require('qrcode');
require('dotenv').config();
const axios = require('axios');

// --- Helper to extract chain data ---
const getData = () => {
  const fullChain = chain.getChain();
  // Filter out genesis
  return fullChain.slice(1).map(b => b.payload);
};

// 1. Farmer: Add Harvest
router.post('/harvest', (req, res) => {
  // Frontend sends: { herb, harvestDate, weight, quantity, location, photo, batchId }
  // We accept all of it.
  const { batchId, ...rest } = req.body;

  // Fallback ID if not provided (though frontend usually provides it)
  const finalBatchId = batchId || `FARM-BATCH-${shortid.generate()}`;

  const payload = {
    type: 'HARVEST',
    data: {
      batchId: finalBatchId,
      ...rest,
      status: 'harvested'
    }
  };
  chain.addRecord(payload);
  res.json({ success: true, batchId: finalBatchId, message: 'Harvest recorded', payload: payload.data });
});

// 2. Collector: Add Collection Event
router.post('/collection', (req, res) => {
  const { batchId, ...rest } = req.body;
  if (!batchId) return res.status(400).json({ error: 'Missing batchId' });

  const payload = {
    type: 'COLLECTION',
    data: {
      batchId,
      collectionDate: new Date().toISOString(),
      status: 'collected',
      ...rest
    }
  };
  chain.addRecord(payload);
  res.json({ success: true, message: 'Collection recorded', payload: payload.data });
});

// 3. Lab: Add Quality Test
router.post('/quality', (req, res) => {
  const { batchId, ...rest } = req.body;
  if (!batchId) return res.status(400).json({ error: 'Missing batchId' });

  const payload = {
    type: 'QUALITY_TEST',
    data: {
      batchId,
      testDate: new Date().toISOString(),
      status: 'tested', // This might be 'pass' or 'fail' in 'finalStatus' inside 'rest'
      ...rest
    }
  };
  chain.addRecord(payload);
  res.json({ success: true, message: 'Lab results recorded', payload: payload.data });
});

// 4. Manufacturer: Add Processing Step (Create Product)
router.post('/processing', (req, res) => {
  const { lotNumber, ...rest } = req.body;
  // Frontend sends { productName, lotNumber, ingredientBatch }
  if (!lotNumber) return res.status(400).json({ error: 'Missing lotNumber' });

  const payload = {
    type: 'MANUFACTURING',
    data: {
      lotNumber,
      manufacturingDate: new Date().toISOString(),
      status: 'manufactured',
      ...rest
    }
  };
  chain.addRecord(payload);
  res.json({ success: true, message: 'Manufacturing recorded', payload: payload.data });
});

// 5. Generate QR for batch/product
router.post('/generate-qr', async (req, res) => {
  const { text } = req.body;
  try {
    const qrCode = await QRCode.toDataURL(text);
    res.json({ qrCode });
  } catch (err) {
    res.status(500).json({ error: 'QR Generation failed' });
  }
});

// 6. Get entire chain (for frontend hydration)
router.get('/chain', (req, res) => {
  res.json(chain.getChain());
});

// AI Proxy Endpoint
const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

router.post('/generate-content', async (req, res) => {
  const { userQuery } = req.body;
  if (!userQuery) return res.status(400).json({ error: 'userQuery is required' });

  try {
    const googleResponse = await axios.post(API_URL, {
      contents: [{ parts: [{ text: userQuery }] }]
    });
    res.json(googleResponse.data);
  } catch (error) {
    console.error('Error calling Google AI:', error.message);
    res.status(500).json({ error: 'Failed to fetch details from AI' });
  }
});

module.exports = router;
