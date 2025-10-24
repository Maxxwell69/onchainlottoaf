const express = require('express');
const router = express.Router();
const LottoEntry = require('../models/LottoEntry');
const LottoDraw = require('../models/LottoDraw');

/**
 * Add transaction with automatic time and ball assignment
 * POST /api/transactions/add
 */
router.post('/add', async (req, res) => {
  try {
    const { 
      drawId, 
      walletAddress, 
      tokenAmount, 
      usdAmount, 
      transactionSignature,
      transactionTime, // Optional - if not provided, uses current time
      notes 
    } = req.body;

    // Validate required fields
    if (!drawId || !walletAddress || !tokenAmount || !usdAmount) {
      return res.status(400).json({
        error: 'Missing required fields: drawId, walletAddress, tokenAmount, usdAmount'
      });
    }

    // Check if draw exists and is active
    const draw = await LottoDraw.getById(drawId);
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    if (draw.status !== 'active') {
      return res.status(400).json({ error: 'Draw is not active' });
    }

    // Check if draw is full
    if (draw.filled_slots >= draw.total_slots) {
      return res.status(400).json({ error: 'Draw is full' });
    }

    // Check if wallet already has an entry in this draw (multiple entries now allowed)
    const existingWalletEntries = await LottoEntry.getByWalletAndDraw(walletAddress, drawId);
    console.log(`📊 Wallet ${walletAddress.substring(0, 8)}... has ${existingWalletEntries.length} existing entries in draw ${drawId}`);

    // Auto-assign lotto number (next available)
    const nextNumberResult = await LottoEntry.getNextLottoNumber(drawId);
    const lottoNumber = nextNumberResult;

    // Auto-assign timestamp
    let assignedTime;
    if (transactionTime) {
      // Use provided transaction time
      assignedTime = new Date(transactionTime);
    } else {
      // Use current time
      assignedTime = new Date();
    }

    // Validate timestamp is within draw window
    const drawStartTime = new Date(draw.start_time);
    const drawEndTime = draw.end_time ? new Date(draw.end_time) : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now if no end time
    
    if (assignedTime < drawStartTime) {
      return res.status(400).json({ 
        error: `Transaction time (${assignedTime.toISOString()}) is before draw start time (${drawStartTime.toISOString()})` 
      });
    }

    if (assignedTime > drawEndTime) {
      return res.status(400).json({ 
        error: `Transaction time (${assignedTime.toISOString()}) is after draw end time (${drawEndTime.toISOString()})` 
      });
    }

    // Create the entry with auto-assigned values
    const entry = await LottoEntry.create({
      draw_id: drawId,
      lotto_number: lottoNumber,
      wallet_address: walletAddress,
      transaction_signature: transactionSignature || null,
      token_amount: parseFloat(tokenAmount),
      usd_amount: parseFloat(usdAmount),
      timestamp: assignedTime,
      notes: notes || `Auto-added transaction - ${assignedTime.toISOString()}`,
      verified: true // Auto-verify since we're adding it through the system
    });

    // Update draw filled slots
    await LottoDraw.updateFilledSlots(drawId, draw.filled_slots + 1);

    res.status(201).json({
      success: true,
      message: 'Transaction added and auto-assigned successfully',
      entry: {
        id: entry.id,
        drawId: entry.draw_id,
        lottoNumber: entry.lotto_number,
        walletAddress: entry.wallet_address,
        tokenAmount: entry.token_amount,
        usdAmount: entry.usd_amount,
        transactionSignature: entry.transaction_signature,
        assignedTime: entry.timestamp,
        notes: entry.notes,
        verified: entry.verified,
        createdAt: entry.created_at
      },
      autoAssigned: {
        lottoNumber: lottoNumber,
        timestamp: assignedTime.toISOString(),
        timeSlot: getTimeSlot(assignedTime, drawStartTime),
        ballPosition: getBallPosition(lottoNumber)
      }
    });

  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get next available lotto number for a draw
 */
function getNextLottoNumber(drawId) {
  return LottoEntry.getNextLottoNumber(drawId);
}

/**
 * Calculate time slot based on transaction time
 */
function getTimeSlot(transactionTime, drawStartTime) {
  const timeDiff = transactionTime.getTime() - drawStartTime.getTime();
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    hours: hoursDiff,
    minutes: minutesDiff,
    totalMinutes: Math.floor(timeDiff / (1000 * 60)),
    formatted: `${hoursDiff}h ${minutesDiff}m after draw start`
  };
}

/**
 * Calculate ball position in the grid (1-69)
 */
function getBallPosition(lottoNumber) {
  return {
    number: lottoNumber,
    row: Math.ceil(lottoNumber / 10),
    column: ((lottoNumber - 1) % 10) + 1,
    position: `${Math.ceil(lottoNumber / 10)}-${((lottoNumber - 1) % 10) + 1}`
  };
}

/**
 * Get transaction history for a draw
 * GET /api/transactions/:drawId/history
 */
router.get('/:drawId/history', async (req, res) => {
  try {
    const { drawId } = req.params;
    
    const entries = await LottoEntry.getByDrawId(drawId);
    
    // Sort by timestamp (chronological order)
    entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Add auto-calculated fields
    const enrichedEntries = entries.map(entry => {
      const draw = LottoDraw.getById(drawId);
      const timeSlot = getTimeSlot(new Date(entry.timestamp), new Date(draw.start_time));
      const ballPosition = getBallPosition(entry.lotto_number);
      
      return {
        ...entry,
        timeSlot,
        ballPosition,
        timeFromStart: timeSlot.formatted
      };
    });

    res.json({
      success: true,
      entries: enrichedEntries,
      summary: {
        totalEntries: entries.length,
        timeRange: {
          first: entries.length > 0 ? entries[0].timestamp : null,
          last: entries.length > 0 ? entries[entries.length - 1].timestamp : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Bulk add transactions
 * POST /api/transactions/bulk-add
 */
router.post('/bulk-add', async (req, res) => {
  try {
    const { drawId, transactions } = req.body;
    
    if (!drawId || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: 'Missing drawId or transactions array'
      });
    }

    const results = [];
    const errors = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      try {
        const response = await router.handle({
          method: 'POST',
          url: '/add',
          body: {
            drawId,
            walletAddress: tx.walletAddress,
            tokenAmount: tx.tokenAmount,
            usdAmount: tx.usdAmount,
            transactionSignature: tx.transactionSignature,
            transactionTime: tx.transactionTime,
            notes: tx.notes
          }
        });
        
        results.push({
          index: i,
          success: true,
          entry: response.body.entry
        });
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          transaction: tx
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${transactions.length} transactions`,
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: transactions.length
      }
    });

  } catch (error) {
    console.error('Error in bulk add:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
