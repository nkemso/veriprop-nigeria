'use strict';

const express = require('express');
const { requireAuth, requireTier } = require('../middleware/requireAuth');
const { submitSignature, getMultiSigStatus } = require('./multiSigEngine');

const router = express.Router();

// Get multi-sig status for an escrow
router.get('/escrow/:escrowId', requireAuth, async (req, res) => {
  try {
    const data = await getMultiSigStatus(req.params.escrowId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit a signature
router.post('/escrow/:escrowId/sign', requireAuth, requireTier('TIER2_GOVT_ID'), async (req, res) => {
  try {
    const { signerRole } = req.body;
    if (!signerRole) return res.status(400).json({ success: false, message: 'signerRole is required' });

    const result = await submitSignature({
      escrowId: req.params.escrowId,
      signerId: req.user.id,
      signerRole,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
