const express = require('express');
const router = express.Router();
const LottoEntry = require('../models/LottoEntry');
const LottoDraw = require('../models/LottoDraw');

// POST /api/manual-entries/add
// Add a manual transaction entry with automatic chronological positioning
router.post('/add', async (req, res) => {
  try {
    const {
      drawId,
      walletAddress,
      transactionSignature,
      tokenAmount,
      usdAmount,
      transactionTime,
      notes
    } = req.body;

    if (!drawId || !walletAddress || !transactionSignature || !tokenAmount || !usdAmount || !transactionTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get draw details
    const draw = await LottoDraw.getById(drawId);
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    // Check if draw is still active
    if (draw.status !== 'active') {
      return res.status(400).json({ error: 'Draw is not active' });
    }

    // Check if draw is full
    if (draw.filled_slots >= draw.total_slots) {
      return res.status(400).json({ error: 'Draw is full' });
    }

    // Check if transaction signature already exists in this draw
    const existingEntry = await LottoEntry.existsBySignature(transactionSignature, drawId);
    if (existingEntry) {
      return res.status(409).json({ error: 'Transaction signature already exists in this draw' });
    }

    // Check minimum USD amount
    if (usdAmount < draw.min_usd_amount) {
      return res.status(400).json({ error: `USD amount must be at least $${draw.min_usd_amount}` });
    }

    // Get all existing entries sorted by timestamp
    const allEntries = await LottoEntry.getByDrawId(drawId);
    allEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Find the correct position for the new transaction
    const newTimestamp = new Date(transactionTime);
    let insertPosition = allEntries.length; // Default to end

    for (let i = 0; i < allEntries.length; i++) {
      if (newTimestamp < new Date(allEntries[i].timestamp)) {
        insertPosition = i;
        break;
      }
    }

    console.log(`📊 Inserting transaction at position ${insertPosition + 1}`);

    // If inserting in the middle, we need to shift all subsequent entries
    if (insertPosition < allEntries.length) {
      console.log(`🔄 Shifting ${allEntries.length - insertPosition} entries to make room`);
      
      // Step 1: Set all lotto numbers to negative values to avoid conflicts
      for (let i = 0; i < allEntries.length; i++) {
        await LottoEntry.updateLottoNumber(allEntries[i].id, -(i + 1));
      }
      
      // Step 2: Insert the new entry at the correct position
      const newEntry = await LottoEntry.create({
        draw_id: drawId,
        lotto_number: insertPosition + 1,
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        token_amount: tokenAmount,
        usd_amount: usdAmount,
        timestamp: newTimestamp,
        notes: notes,
        verified: true
      });

      if (!newEntry) {
        return res.status(500).json({ error: 'Failed to create entry' });
      }

      // Step 3: Reassign all lotto numbers based on chronological order
      const updatedEntries = await LottoEntry.getByDrawId(drawId);
      updatedEntries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      for (let i = 0; i < updatedEntries.length; i++) {
        await LottoEntry.updateLottoNumber(updatedEntries[i].id, i + 1);
      }
      
    } else {
      // Inserting at the end - no shifting needed
      const newEntry = await LottoEntry.create({
        draw_id: drawId,
        lotto_number: allEntries.length + 1,
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        token_amount: tokenAmount,
        usd_amount: usdAmount,
        timestamp: newTimestamp,
        notes: notes,
        verified: true
      });

      if (!newEntry) {
        return res.status(500).json({ error: 'Failed to create entry' });
      }
    }

    // Update draw filled slots
    const totalEntries = await LottoEntry.countByDrawId(drawId);
    await LottoDraw.updateFilledSlots(drawId, totalEntries);

    res.status(201).json({
      message: 'Transaction added successfully',
      position: insertPosition + 1,
      totalEntries: totalEntries
    });

  } catch (error) {
    console.error('Error adding manual transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;