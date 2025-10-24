const express = require('express');
const router = express.Router();
const LottoDraw = require('../models/LottoDraw');
const LottoEntry = require('../models/LottoEntry');
const scanService = require('../services/scanService');
const heliusService = require('../services/heliusService');

/**
 * POST /api/draws
 * Create a new lotto draw
 */
router.post('/', async (req, res) => {
  try {
    const { draw_name, token_address, token_symbol, min_usd_amount, start_time } = req.body;

    // Validation
    if (!draw_name || !token_address || !min_usd_amount || !start_time) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['draw_name', 'token_address', 'min_usd_amount', 'start_time']
      });
    }

    // Get token metadata if token_symbol not provided
    let finalTokenSymbol = token_symbol;
    if (!finalTokenSymbol) {
      const metadata = await heliusService.getTokenMetadata(token_address);
      finalTokenSymbol = metadata?.symbol || 'UNKNOWN';
    }

    // Create draw - store start_time exactly as provided (no timezone conversion)
    const draw = await LottoDraw.create({
      draw_name,
      token_address,
      token_symbol: finalTokenSymbol,
      min_usd_amount,
      start_time: start_time // Store exactly as provided
    });

    res.status(201).json({
      success: true,
      message: 'Lotto draw created successfully',
      draw
    });
  } catch (error) {
    console.error('Error creating draw:', error);
    res.status(500).json({
      error: 'Failed to create lotto draw',
      details: error.message
    });
  }
});

/**
 * GET /api/draws
 * Get all lotto draws
 */
router.get('/', async (req, res) => {
  try {
    const draws = await LottoDraw.getAll();
    res.json({
      success: true,
      draws
    });
  } catch (error) {
    console.error('Error fetching draws:', error);
    res.status(500).json({
      error: 'Failed to fetch draws',
      details: error.message
    });
  }
});

/**
 * GET /api/draws/active
 * Get active lotto draws
 */
router.get('/active', async (req, res) => {
  try {
    const draws = await LottoDraw.getActive();
    res.json({
      success: true,
      draws
    });
  } catch (error) {
    console.error('Error fetching active draws:', error);
    res.status(500).json({
      error: 'Failed to fetch active draws',
      details: error.message
    });
  }
});

/**
 * GET /api/draws/:id
 * Get a specific draw by ID with entries
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const draw = await LottoDraw.getWithEntries(id);

    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    res.json({
      success: true,
      draw
    });
  } catch (error) {
    console.error('Error fetching draw:', error);
    res.status(500).json({
      error: 'Failed to fetch draw',
      details: error.message
    });
  }
});

/**
 * POST /api/draws/:id/scan-dex
 * Force DexScreener scan method
 */
router.post('/:id/scan-dex', async (req, res) => {
  try {
    const { id } = req.params;
    
    const draw = await LottoDraw.getById(id);
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    // Force DexScreener method
    const dexScreenerService = require('../services/dexScreenerService');
    const heliusService = require('../services/heliusService');
    
    const qualifyingBuys = await dexScreenerService.scanForQualifyingBuys(
      draw.token_address,
      draw.start_time,
      draw.min_usd_amount,
      heliusService.connection
    );

    // Check for blacklisted wallets
    const WalletBlacklist = require('../models/WalletBlacklist');
    const blacklistedWallets = await WalletBlacklist.getByTokenAddress(draw.token_address);
    const blacklistSet = new Set(blacklistedWallets.map(b => b.wallet_address));
    
    // Sort qualifying buys by timestamp (chronological order)
    qualifyingBuys.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    console.log(`📅 Sorted ${qualifyingBuys.length} transactions chronologically`);

    // Process buys and add to database
    let newEntries = 0;
    let filtered = 0;
    
    for (const buy of qualifyingBuys) {
      // Skip blacklisted wallets
      if (blacklistSet.has(buy.walletAddress)) {
        filtered++;
        console.log(`🚫 Filtered blacklisted wallet: ${buy.walletAddress.substring(0, 8)}...`);
        continue;
      }
      
      // Skip if signature already exists (optional validation)
      const exists = await LottoEntry.existsBySignature(buy.signature, id);
      if (exists) continue;

      const nextNumber = await LottoEntry.getNextLottoNumber(id);
      if (!nextNumber) break;

      const entry = await LottoEntry.create({
        draw_id: id,
        lotto_number: nextNumber,
        wallet_address: buy.walletAddress,
        transaction_signature: buy.signature,
        token_amount: buy.tokenAmount / 1e9, // Store as UI amount to avoid overflow
        usd_amount: buy.usdAmount,
        timestamp: buy.timestamp
      });

      if (entry) newEntries++;
    }
    
    if (filtered > 0) {
      console.log(`🚫 Filtered out ${filtered} blacklisted wallets`);
    }

    // Update draw
    const totalEntries = await LottoEntry.countByDrawId(id);
    await LottoDraw.updateFilledSlots(id, totalEntries);

    res.json({
      success: true,
      message: 'DexScreener scan completed',
      result: {
        success: true,
        newEntries,
        totalEntries,
        totalSlots: draw.total_slots,
        qualifyingTransactions: qualifyingBuys.length,
        filteredWallets: filtered || 0
      }
    });
  } catch (error) {
    console.error('Error in DexScreener scan:', error);
    res.status(500).json({ error: 'Scan failed', details: error.message });
  }
});

/**
 * POST /api/draws/:id/scan
 * Manually trigger a scan for a specific draw
 */
router.post('/:id/scan', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if draw exists
    const draw = await LottoDraw.getById(id);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    // Trigger scan
    const result = await scanService.scanDraw(id);

    res.json({
      success: true,
      message: 'Scan completed',
      result
    });
  } catch (error) {
    console.error('Error scanning draw:', error);
    res.status(500).json({
      error: 'Failed to scan draw',
      details: error.message
    });
  }
});

/**
 * GET /api/draws/:id/entries
 * Get entries for a specific draw
 */
router.get('/:id/entries', async (req, res) => {
  try {
    const { id } = req.params;
    const entries = await LottoEntry.getByDrawId(id);

    res.json({
      success: true,
      entries
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({
      error: 'Failed to fetch entries',
      details: error.message
    });
  }
});

/**
 * PUT /api/draws/:id/status
 * Update draw status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: ['active', 'completed', 'cancelled']
      });
    }

    const draw = await LottoDraw.updateStatus(id, status);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    res.json({
      success: true,
      message: 'Draw status updated',
      draw
    });
  } catch (error) {
    console.error('Error updating draw status:', error);
    res.status(500).json({
      error: 'Failed to update draw status',
      details: error.message
    });
  }
});

/**
 * DELETE /api/draws/:id
 * Delete a draw and all its entries
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if draw exists
    const draw = await LottoDraw.getById(id);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    // Delete the draw (cascade delete will handle entries and scan history)
    const { query } = require('../database/db');
    await query('DELETE FROM lotto_draws WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Draw and all associated data deleted successfully',
      deletedDraw: {
        id: draw.id,
        name: draw.draw_name
      }
    });
  } catch (error) {
    console.error('Error deleting draw:', error);
    res.status(500).json({
      error: 'Failed to delete draw',
      details: error.message
    });
  }
});

/**
 * POST /api/draws/:id/clean-blacklisted
 * Remove entries that are now blacklisted
 */
router.post('/:id/clean-blacklisted', async (req, res) => {
  try {
    const { id } = req.params;
    
    const draw = await LottoDraw.getById(id);
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    // Get blacklist for this token
    const WalletBlacklist = require('../models/WalletBlacklist');
    const blacklistedWallets = await WalletBlacklist.getByTokenAddress(draw.token_address);
    
    if (blacklistedWallets.length === 0) {
      return res.json({
        success: true,
        message: 'No blacklisted wallets found',
        removedEntries: 0
      });
    }

    const blacklistSet = new Set(blacklistedWallets.map(b => b.wallet_address));
    
    // Find and remove blacklisted entries
    const { query } = require('../database/db');
    const result = await query(
      `DELETE FROM lotto_entries 
       WHERE draw_id = $1 
       AND wallet_address = ANY($2)
       RETURNING *`,
      [id, Array.from(blacklistSet)]
    );

    const removedCount = result.rowCount;
    
    // Update draw filled_slots
    if (removedCount > 0) {
      const totalEntries = await LottoEntry.countByDrawId(id);
      await LottoDraw.updateFilledSlots(id, totalEntries);
    }

    res.json({
      success: true,
      message: `Removed ${removedCount} blacklisted entries`,
      removedEntries: removedCount,
      removedWallets: result.rows.map(r => r.wallet_address)
    });

  } catch (error) {
    console.error('Error cleaning blacklisted entries:', error);
    res.status(500).json({
      error: 'Failed to clean blacklisted entries',
      details: error.message
    });
  }
});

/**
 * DELETE /api/draws/:id/scan-history
 * Clear scan history for a draw
 */
router.delete('/:id/scan-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { query } = require('../database/db');
    const result = await query('DELETE FROM scan_history WHERE draw_id = $1', [id]);

    res.json({
      success: true,
      message: 'Scan history cleared',
      deletedRecords: result.rowCount
    });
  } catch (error) {
    console.error('Error clearing scan history:', error);
    res.status(500).json({
      error: 'Failed to clear scan history',
      details: error.message
    });
  }
});

module.exports = router;

