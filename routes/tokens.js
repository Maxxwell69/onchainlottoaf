const express = require('express');
const router = express.Router();
const ManagedToken = require('../models/ManagedToken');
const WalletBlacklist = require('../models/WalletBlacklist');
const heliusService = require('../services/heliusService');

/**
 * POST /api/tokens
 * Create a new managed token
 */
router.post('/', async (req, res) => {
  try {
    const { token_address, token_symbol, token_name, notes } = req.body;

    if (!token_address) {
      return res.status(400).json({
        error: 'token_address is required'
      });
    }

    // Try to fetch token metadata if not provided
    let finalSymbol = token_symbol;
    let finalName = token_name;

    if (!finalSymbol || !finalName) {
      const metadata = await heliusService.getTokenMetadata(token_address);
      if (metadata) {
        finalSymbol = finalSymbol || metadata.symbol;
        finalName = finalName || metadata.name;
      }
    }

    const token = await ManagedToken.create({
      token_address,
      token_symbol: finalSymbol,
      token_name: finalName,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Token added to manager',
      token
    });
  } catch (error) {
    console.error('Error creating managed token:', error);
    res.status(500).json({
      error: 'Failed to create managed token',
      details: error.message
    });
  }
});

/**
 * GET /api/tokens
 * Get all managed tokens
 */
router.get('/', async (req, res) => {
  try {
    const tokens = await ManagedToken.getAll();
    res.json({
      success: true,
      tokens
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({
      error: 'Failed to fetch tokens',
      details: error.message
    });
  }
});

/**
 * GET /api/tokens/:id
 * Get a specific token with blacklist
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const token = await ManagedToken.getWithBlacklistCount(id);
    
    if (!token) {
      return res.status(404).json({
        error: 'Token not found'
      });
    }

    const blacklist = await WalletBlacklist.getByToken(id);

    res.json({
      success: true,
      token: {
        ...token,
        blacklist
      }
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      error: 'Failed to fetch token',
      details: error.message
    });
  }
});

/**
 * PUT /api/tokens/:id
 * Update a managed token
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const token = await ManagedToken.update(id, updates);
    
    if (!token) {
      return res.status(404).json({
        error: 'Token not found'
      });
    }

    res.json({
      success: true,
      message: 'Token updated',
      token
    });
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({
      error: 'Failed to update token',
      details: error.message
    });
  }
});

/**
 * DELETE /api/tokens/:id
 * Delete a managed token
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ManagedToken.delete(id);

    res.json({
      success: true,
      message: 'Token deleted'
    });
  } catch (error) {
    console.error('Error deleting token:', error);
    res.status(500).json({
      error: 'Failed to delete token',
      details: error.message
    });
  }
});

/**
 * POST /api/tokens/:id/blacklist
 * Add wallet(s) to blacklist
 */
router.post('/:id/blacklist', async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet_address, wallets, reason, notes } = req.body;

    // Single wallet
    if (wallet_address) {
      const entry = await WalletBlacklist.add({
        token_id: id,
        wallet_address,
        reason: reason || 'manual',
        notes: notes || ''
      });

      return res.status(201).json({
        success: true,
        message: 'Wallet blacklisted',
        entry
      });
    }

    // Bulk add
    if (wallets && Array.isArray(wallets)) {
      await WalletBlacklist.bulkAdd(id, wallets);
      
      return res.status(201).json({
        success: true,
        message: `${wallets.length} wallets blacklisted`
      });
    }

    return res.status(400).json({
      error: 'Provide wallet_address or wallets array'
    });

  } catch (error) {
    console.error('Error blacklisting wallet:', error);
    res.status(500).json({
      error: 'Failed to blacklist wallet',
      details: error.message
    });
  }
});

/**
 * DELETE /api/tokens/:id/blacklist/:walletAddress
 * Remove wallet from blacklist
 */
router.delete('/:id/blacklist/:walletAddress', async (req, res) => {
  try {
    const { id, walletAddress } = req.params;
    await WalletBlacklist.remove(id, walletAddress);

    res.json({
      success: true,
      message: 'Wallet removed from blacklist'
    });
  } catch (error) {
    console.error('Error removing from blacklist:', error);
    res.status(500).json({
      error: 'Failed to remove from blacklist',
      details: error.message
    });
  }
});

/**
 * GET /api/tokens/:id/blacklist
 * Get blacklist for a token
 */
router.get('/:id/blacklist', async (req, res) => {
  try {
    const { id } = req.params;
    const blacklist = await WalletBlacklist.getByToken(id);

    res.json({
      success: true,
      blacklist
    });
  } catch (error) {
    console.error('Error fetching blacklist:', error);
    res.status(500).json({
      error: 'Failed to fetch blacklist',
      details: error.message
    });
  }
});

module.exports = router;

