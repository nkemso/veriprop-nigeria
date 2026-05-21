'use strict';

const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/requireAuth');
const { getVaultBalances, calculateSplit, executeSplit } = require('./splitEngine');

const router = express.Router();

// Get all vault balances (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const vaults = await getVaultBalances();
    res.json({ success: true, vaults });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Preview split calculation
router.post('/calculate', requireAuth, async (req, res) => {
  try {
    const { amount, hasAgent, sellerIsCompany } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'Amount required' });
    const split = calculateSplit(parseFloat(amount), hasAgent !== false, sellerIsCompany === true);
    res.json({ success: true, split });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute split (admin)
router.post('/escrow/:escrowId/split', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await executeSplit(req.params.escrowId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
