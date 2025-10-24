const heliusService = require('./heliusService');
const LottoDraw = require('../models/LottoDraw');
const LottoEntry = require('../models/LottoEntry');
const ScanHistory = require('../models/ScanHistory');
const WalletBlacklist = require('../models/WalletBlacklist');

class ScanService {
  /**
   * Scan a specific draw for new qualifying transactions
   * @param {number} drawId - ID of the draw to scan
   * @returns {Promise<Object>} Scan results
   */
  async scanDraw(drawId) {
    try {
      console.log(`\n🎰 Starting scan for draw #${drawId}`);

      // Get draw details
      const draw = await LottoDraw.getById(drawId);
      if (!draw) {
        throw new Error(`Draw #${drawId} not found`);
      }

      // Check if draw is still active
      if (draw.status !== 'active') {
        console.log(`⚠️  Draw #${drawId} is ${draw.status}, skipping scan`);
        return {
          success: true,
          message: 'Draw is not active',
          newEntries: 0
        };
      }

      // Check if draw is already full
      if (draw.filled_slots >= draw.total_slots) {
        console.log(`⚠️  Draw #${drawId} is full (${draw.filled_slots}/${draw.total_slots})`);
        await LottoDraw.updateStatus(drawId, 'completed');
        return {
          success: true,
          message: 'Draw is full',
          newEntries: 0
        };
      }

      // Get last scan to know where to continue from
      const lastScan = await ScanHistory.getLastScan(drawId);
      const lastSignature = lastScan ? lastScan.last_signature : null;

      // Scan blockchain for qualifying buys
      const qualifyingBuys = await heliusService.scanForQualifyingBuys(
        draw,
        lastSignature
      );

      // Get blacklisted wallets for this token
      const blacklistedWallets = await WalletBlacklist.getByTokenAddress(draw.token_address);
      const blacklistSet = new Set(blacklistedWallets.map(b => b.wallet_address));
      
      if (blacklistedWallets.length > 0) {
        console.log(`🚫 Found ${blacklistedWallets.length} blacklisted wallets for this token`);
      }

      let newEntries = 0;
      let filtered = 0;
      let lastProcessedSignature = lastSignature;

      // Sort qualifying buys by timestamp (chronological order)
      qualifyingBuys.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      console.log(`📅 Sorted ${qualifyingBuys.length} transactions chronologically`);

      // Process qualifying buys with optimized rate limiting for paid Helius
      const batchSize = 10; // Process in larger batches
      const delayBetweenBatches = 500; // 500ms delay between batches
      
      for (let i = 0; i < qualifyingBuys.length; i += batchSize) {
        const batch = qualifyingBuys.slice(i, i + batchSize);
        
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(qualifyingBuys.length/batchSize)} (${batch.length} transactions)`);
        
        for (const buy of batch) {
          // Skip blacklisted wallets - BULLETPROOF CHECK
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
          
          // Check if transaction already processed in this draw only
          const exists = await LottoEntry.existsBySignature(buy.signature, drawId);
          if (exists) {
            console.log(`⏭️  Skipping duplicate transaction in this draw: ${buy.signature.substring(0, 8)}...`);
            continue;
          }

          // Get next available lotto number
          const nextNumber = await LottoEntry.getNextLottoNumber(drawId);
          if (!nextNumber) {
            console.log('🎯 All lottery numbers assigned!');
            await LottoDraw.updateStatus(drawId, 'completed');
            break;
          }

          // Create entry
          const entry = await LottoEntry.create({
            draw_id: drawId,
            lotto_number: nextNumber,
            wallet_address: buy.walletAddress,
            transaction_signature: buy.signature,
            token_amount: buy.tokenAmount,
            usd_amount: buy.usdAmount,
            timestamp: buy.timestamp
          });

          if (entry) {
            newEntries++;
            console.log(`🎫 Assigned lotto number ${nextNumber} to ${buy.walletAddress.substring(0, 8)}...`);
            lastProcessedSignature = buy.signature;
          } else {
            console.log(`⚠️  Failed to create entry for ${buy.walletAddress.substring(0, 8)}... (likely duplicate signature)`);
          }
        }
        
        // Update progress and rate limiting
        const progress = Math.round(((i + batchSize) / qualifyingBuys.length) * 100);
        console.log(`📊 Progress: ${Math.min(progress, 100)}% (${i + batchSize}/${qualifyingBuys.length} transactions processed)`);
        
        // Update draw filled slots periodically
        if ((i + batchSize) % (batchSize * 5) === 0) {
          const currentTotal = await LottoEntry.countByDrawId(drawId);
          await LottoDraw.updateFilledSlots(drawId, currentTotal);
        }
        
        // Rate limiting: delay between batches
        if (i + batchSize < qualifyingBuys.length) {
          console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      // Update draw filled slots
      const totalEntries = await LottoEntry.countByDrawId(drawId);
      await LottoDraw.updateFilledSlots(drawId, totalEntries);

      // Record scan history with progress tracking
      await ScanHistory.create({
        draw_id: drawId,
        last_signature: lastProcessedSignature,
        transactions_found: qualifyingBuys.length,
        entries_added: newEntries,
        entries_filtered: filtered
      });

      if (filtered > 0) {
        console.log(`🚫 Filtered ${filtered} blacklisted entries`);
      }
      
      console.log(`✅ Scan complete: ${newEntries} new entries added`);
      console.log(`📊 Draw status: ${totalEntries}/${draw.total_slots} slots filled\n`);

      return {
        success: true,
        newEntries,
        totalEntries,
        totalSlots: draw.total_slots,
        qualifyingTransactions: qualifyingBuys.length
      };

    } catch (error) {
      console.error(`❌ Error scanning draw #${drawId}:`, error);
      throw error;
    }
  }

  /**
   * Scan all active draws
   * @returns {Promise<Array>} Results for all scans
   */
  async scanAllActiveDraws() {
    try {
      const activeDraws = await LottoDraw.getActive();
      console.log(`🔍 Found ${activeDraws.length} active draws to scan`);

      const results = [];
      for (const draw of activeDraws) {
        const result = await this.scanDraw(draw.id);
        results.push({
          drawId: draw.id,
          drawName: draw.draw_name,
          ...result
        });
      }

      return results;
    } catch (error) {
      console.error('Error scanning all draws:', error);
      throw error;
    }
  }
}

module.exports = new ScanService();

