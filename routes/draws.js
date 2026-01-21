const express = require('express');
const router = express.Router();
const LottoDraw = require('../models/LottoDraw');
const LottoEntry = require('../models/LottoEntry');
const scanService = require('../services/scanService');
const heliusService = require('../services/heliusService');
const { authenticateToken, requireModerator, requireAdmin } = require('../middleware/auth');

/**
 * POST /api/draws
 * Create a new lotto draw (Moderator+ required)
 */
router.post('/', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { draw_name, token_address, token_symbol, min_usd_amount, timezone, start_time, prize_description_short, prize_description_long, is_public } = req.body;

    // Validation
    if (!draw_name || !draw_name.trim()) {
      return res.status(400).json({
        error: 'Missing required field: draw_name'
      });
    }
    if (!token_address || !token_address.trim()) {
      return res.status(400).json({
        error: 'Missing required field: token_address'
      });
    }
    if (!min_usd_amount || isNaN(parseFloat(min_usd_amount)) || parseFloat(min_usd_amount) <= 0) {
      return res.status(400).json({
        error: 'Invalid min_usd_amount. Must be a positive number.'
      });
    }
    if (!start_time || !start_time.trim()) {
      return res.status(400).json({
        error: 'Missing required field: start_time'
      });
    }

    // Get token metadata if token_symbol not provided
    let finalTokenSymbol = token_symbol;
    if (!finalTokenSymbol || finalTokenSymbol.trim() === '') {
      try {
        const metadata = await heliusService.getTokenMetadata(token_address);
        finalTokenSymbol = metadata?.symbol || 'UNKNOWN';
      } catch (metadataError) {
        console.warn('Could not fetch token metadata:', metadataError.message);
        finalTokenSymbol = 'UNKNOWN';
      }
    }

    // Create draw - store start_time exactly as provided (no timezone conversion)
    const draw = await LottoDraw.create({
      draw_name,
      token_address,
      token_symbol: finalTokenSymbol,
      min_usd_amount,
      timezone: timezone || null,
      start_time: start_time, // Store exactly as provided
      prize_description_short: prize_description_short || null,
      prize_description_long: prize_description_long || null,
      is_public: is_public === true || is_public === 'true'
    });

    res.status(201).json({
      success: true,
      message: 'Lotto draw created successfully',
      draw
    });
  } catch (error) {
    console.error('Error creating draw:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      error: 'Failed to create lotto draw',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
 * GET /api/draws/public
 * Get public active lotto draws
 */
router.get('/public', async (req, res) => {
  try {
    const draws = await LottoDraw.getPublicActive();
    res.json({
      success: true,
      draws
    });
  } catch (error) {
    console.error('Error fetching public draws:', error);
    res.status(500).json({
      error: 'Failed to fetch public draws',
      details: error.message
    });
  }
});

/**
 * GET /api/draws/public/category/:category
 * Get public active draws by category
 */
router.get('/public/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const draws = await LottoDraw.getPublicActiveByCategory(category);
    res.json({
      success: true,
      draws
    });
  } catch (error) {
    console.error('Error fetching public draws by category:', error);
    res.status(500).json({
      error: 'Failed to fetch public draws by category',
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
router.post('/:id/scan-dex', authenticateToken, requireModerator, async (req, res) => {
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
      
      // Validate transaction time is after draw start time
      const transactionTime = new Date(buy.timestamp);
      const drawStartTime = new Date(draw.start_time);
      
      if (transactionTime < drawStartTime) {
        filtered++;
        console.log(`⏰ Filtered transaction before draw start: ${buy.signature.substring(0, 8)}... (${buy.timestamp} < ${draw.start_time})`);
        continue;
      }
      
      // Log transaction details for debugging
      console.log(`🔍 Processing: ${buy.signature.substring(0, 16)}... | Wallet: ${buy.walletAddress.substring(0, 8)}... | Amount: $${buy.usdAmount.toFixed(2)} | Min Required: $${draw.min_usd_amount}`);
      
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
router.post('/:id/scan', authenticateToken, requireModerator, async (req, res) => {
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
router.put('/:id/status', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'completed', 'cancelled', 'drawn'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        allowed: ['active', 'completed', 'cancelled', 'drawn']
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
 * PUT /api/draws/:id/public
 * Update public visibility status
 */
router.put('/:id/public', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_public } = req.body;

    if (typeof is_public !== 'boolean') {
      return res.status(400).json({
        error: 'is_public must be a boolean'
      });
    }

    const draw = await LottoDraw.updatePublicStatus(id, is_public);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    res.json({
      success: true,
      message: `Draw ${is_public ? 'made public' : 'made private'}`,
      draw
    });
  } catch (error) {
    console.error('Error updating public status:', error);
    res.status(500).json({
      error: 'Failed to update public status',
      details: error.message
    });
  }
});

/**
 * PUT /api/draws/:id/prizes
 * Update prize descriptions
 */
router.put('/:id/prizes', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { id } = req.params;
    const { prize_description_short, prize_description_long } = req.body;

    // Validate that at least one description is provided
    if (!prize_description_short && !prize_description_long) {
      return res.status(400).json({
        error: 'At least one prize description must be provided'
      });
    }

    // Validate short description length if provided
    if (prize_description_short && prize_description_short.length > 150) {
      return res.status(400).json({
        error: 'Short description must be 150 characters or less'
      });
    }

    const draw = await LottoDraw.updatePrizes(id, prize_description_short, prize_description_long);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    res.json({
      success: true,
      message: 'Prize descriptions updated',
      draw
    });
  } catch (error) {
    console.error('Error updating prize descriptions:', error);
    res.status(500).json({
      error: 'Failed to update prize descriptions',
      details: error.message
    });
  }
});

/**
 * PUT /api/draws/:drawId/entries/:entryId/winner
 * Assign winner status and prize to an entry
 */
router.put('/:drawId/entries/:entryId/winner', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { drawId, entryId } = req.params;
    const { prize, is_winner = true } = req.body;

    if (!prize || prize.trim() === '') {
      return res.status(400).json({
        error: 'Prize description is required'
      });
    }

    // Verify entry belongs to draw
    const LottoEntry = require('../models/LottoEntry');
    const entry = await LottoEntry.getById(entryId);
    
    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    if (entry.draw_id !== parseInt(drawId)) {
      return res.status(400).json({
        error: 'Entry does not belong to this draw'
      });
    }

    // Update winner status
    const updatedEntry = await LottoEntry.updateWinner(entryId, prize.trim(), is_winner);

    res.json({
      success: true,
      message: 'Winner assigned successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error assigning winner:', error);
    res.status(500).json({
      error: 'Failed to assign winner',
      details: error.message
    });
  }
});

/**
 * POST /api/draws/:drawId/entries/empty-ball-winner
 * Assign winner to an empty ball (no existing entry)
 */
router.post('/:drawId/entries/empty-ball-winner', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { drawId } = req.params;
    const { lotto_number, prize, is_winner = true } = req.body;

    if (!lotto_number || lotto_number < 1) {
      return res.status(400).json({
        error: 'Valid lotto number is required'
      });
    }

    if (!prize || prize.trim() === '') {
      return res.status(400).json({
        error: 'Prize description is required'
      });
    }

    // Verify draw exists
    const draw = await LottoDraw.getById(drawId);
    if (!draw) {
      return res.status(404).json({
        error: 'Draw not found'
      });
    }

    // Check if lotto number is already taken
    const LottoEntry = require('../models/LottoEntry');
    const existingEntries = await LottoEntry.getByDrawId(drawId);
    const existingEntry = existingEntries.find(e => e.lotto_number === lotto_number);
    
    if (existingEntry) {
      // If entry exists, update it instead
      const updatedEntry = await LottoEntry.updateWinner(existingEntry.id, prize.trim(), is_winner);
      return res.json({
        success: true,
        message: 'Winner assigned successfully',
        entry: updatedEntry
      });
    }

    // Create a minimal entry for the winner (no wallet/transaction required)
    const entry = await LottoEntry.create({
      draw_id: parseInt(drawId),
      lotto_number: lotto_number,
      wallet_address: 'Manual Winner', // Placeholder
      transaction_signature: `manual-winner-${drawId}-${lotto_number}-${Date.now()}`,
      token_amount: 0,
      usd_amount: 0,
      timestamp: new Date().toISOString(),
      notes: 'Manual winner assignment for empty ball',
      verified: true
    });

    if (!entry) {
      return res.status(400).json({
        error: 'Failed to create entry. Ball number may already be taken.'
      });
    }

    // Update winner status
    const updatedEntry = await LottoEntry.updateWinner(entry.id, prize.trim(), is_winner);

    res.json({
      success: true,
      message: 'Winner assigned successfully to empty ball',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error assigning winner to empty ball:', error);
    res.status(500).json({
      error: 'Failed to assign winner',
      details: error.message
    });
  }
});

/**
 * DELETE /api/draws/:drawId/entries/:entryId/winner
 * Remove winner status from an entry
 */
router.delete('/:drawId/entries/:entryId/winner', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { drawId, entryId } = req.params;

    // Verify entry belongs to draw
    const LottoEntry = require('../models/LottoEntry');
    const entry = await LottoEntry.getById(entryId);
    
    if (!entry) {
      return res.status(404).json({
        error: 'Entry not found'
      });
    }

    if (entry.draw_id !== parseInt(drawId)) {
      return res.status(400).json({
        error: 'Entry does not belong to this draw'
      });
    }

    // Remove winner status
    const updatedEntry = await LottoEntry.removeWinner(entryId);

    res.json({
      success: true,
      message: 'Winner status removed',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error removing winner status:', error);
    res.status(500).json({
      error: 'Failed to remove winner status',
      details: error.message
    });
  }
});

/**
 * DELETE /api/draws/:id
 * Delete a draw and all its entries
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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
router.post('/:id/clean-blacklisted', authenticateToken, requireModerator, async (req, res) => {
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
router.delete('/:id/scan-history', authenticateToken, requireModerator, async (req, res) => {
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

