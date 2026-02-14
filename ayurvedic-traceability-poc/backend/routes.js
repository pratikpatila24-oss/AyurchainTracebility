const express = require('express');
const router = express.Router();
const chain = require('./blockchain_sim');
const shortid = require('shortid');
const QRCode = require('qrcode');

// Add Collection Event
router.post('/collection', (req, res) => {
  const body = req.body;
  const batchId = body.batchId || ('BATCH-' + shortid.generate());
  const payload = { type: 'CollectionEvent', data: { ...body, batchId } };
  const rec = chain.addRecord(payload);
  res.json({ success: true, record: rec, batchId });
});

// Add Quality Test
router.post('/quality', (req, res) => {
  const body = req.body;
  const payload = { type: 'QualityTest', data: body };
  const rec = chain.addRecord(payload);
  res.json({ success: true, record: rec });
});

// Add Processing Step
router.post('/processing', (req, res) => {
  const body = req.body;
  const payload = { type: 'ProcessingStep', data: body };
  const rec = chain.addRecord(payload);
  res.json({ success: true, record: rec });
});

// Generate QR for batch (returns data URI)
router.post('/generate-qr', async (req, res) => {
  const { batchId } = req.body;
  if (!batchId) return res.status(400).json({ error: 'batchId required' });
  const payload = `BATCH:${batchId}`;
  try {
    const dataUrl = await QRCode.toDataURL(payload);
    res.json({ success: true, dataUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get provenance
router.get('/provenance/:batchId', (req, res) => {
  const { batchId } = req.params;
  const events = chain.queryByBatch(batchId);
  res.json({ batchId, events });
});

// Simple chain viewer
router.get('/chain', (req, res) => {
  res.json(chain.getChain());
});

module.exports = router;
