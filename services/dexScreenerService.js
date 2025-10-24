const axios = require('axios');

class DexScreenerService {
  constructor() {
    this.baseUrl = 'https://api.dexscreener.com/latest/dex';
  }

  /**
   * Get token trading data from DexScreener
   * This gives us ACTUAL DEX trades (buys/sells)
   */
  async getTokenData(tokenAddress) {
    try {
      const url = `${this.baseUrl}/tokens/${tokenAddress}`;
      const response = await axios.get(url, {
        timeout: 10000
      });

      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        return response.data.pairs;
      }

      return null;
    } catch (error) {
      console.error('Error fetching from DexScreener:', error.message);
      return null;
    }
  }

  /**
   * Get recent transactions from DexScreener
   * This is what you see on dexscreener.com
   */
  async getRecentTransactions(tokenAddress) {
    try {
      // Get token pairs
      const pairs = await this.getTokenData(tokenAddress);
      
      if (!pairs || pairs.length === 0) {
        console.log('No trading pairs found on DexScreener');
        return [];
      }

      // Use the most liquid pair (usually first one)
      const mainPair = pairs[0];
      console.log(`✅ Found trading pair: ${mainPair.dexId} (${mainPair.baseToken.symbol}/${mainPair.quoteToken.symbol})`);
      console.log(`   Price: $${mainPair.priceUsd}`);
      console.log(`   Volume 24h: $${mainPair.volume?.h24 || 0}`);
      console.log(`   Liquidity: $${mainPair.liquidity?.usd || 0}`);
      
      // Get the pair address to fetch transactions
      const pairAddress = mainPair.pairAddress;
      console.log(`   Pair Address: ${pairAddress}`);

      return {
        pairAddress,
        price: parseFloat(mainPair.priceUsd),
        volume24h: mainPair.volume?.h24 || 0,
        liquidity: mainPair.liquidity?.usd || 0,
        dexId: mainPair.dexId,
        txns24h: mainPair.txns?.h24 || {}
      };
    } catch (error) {
      console.error('Error getting DexScreener transactions:', error.message);
      return null;
    }
  }

  /**
   * Scan for qualifying buys using Helius + DexScreener approach
   * We'll use DexScreener for price and pair info, then query Solana RPC for actual txns
   */
  async scanForQualifyingBuys(tokenMint, startTime, minUsdAmount, connection) {
    try {
      console.log('🔍 Using DexScreener + Solana RPC hybrid approach...');
      
      // Get pair info from DexScreener
      const pairInfo = await this.getRecentTransactions(tokenMint);
      
      if (!pairInfo || !pairInfo.pairAddress) {
        console.log('❌ Could not find trading pair on DexScreener');
        return [];
      }

      const { pairAddress, price, txns24h } = pairInfo;
      
      console.log(`\n📊 24h Activity:`);
      console.log(`   Buys: ${txns24h.buys || 0}`);
      console.log(`   Sells: ${txns24h.sells || 0}`);
      console.log(`   Current Price: $${price}\n`);

      // Now query the PAIR address for transactions (not individual wallets)
      console.log(`🔗 Scanning pair address for transactions...`);
      const { PublicKey } = require('@solana/web3.js');
      
      // Fetch ALL signatures with pagination until we reach start time
      const allSignatures = [];
      let lastSignature = null;
      const startTimeMs = new Date(startTime).getTime();
      
      console.log(`📅 Fetching all transactions since ${new Date(startTime).toLocaleString()}...`);
      
      let retryCount = 0;
      const maxRetries = 3;
      
      while (true) {
        try {
          const options = { 
            limit: 50, // Reduced limit to avoid rate limiting
            commitment: 'confirmed'
          };
          if (lastSignature) {
            options.before = lastSignature;
          }
          
          const batch = await connection.getSignaturesForAddress(
            new PublicKey(pairAddress),
            options
          );
          
          if (batch.length === 0) break;
          
          // Check if we've gone past the start time
          const oldestInBatch = batch[batch.length - 1];
          const oldestTime = oldestInBatch.blockTime ? oldestInBatch.blockTime * 1000 : 0;
          
          // Add all signatures from this batch
          for (const sig of batch) {
            if (sig.blockTime && sig.blockTime * 1000 >= startTimeMs) {
              allSignatures.push(sig);
            }
          }
          
          // If oldest transaction in batch is before start time, we're done
          if (oldestTime < startTimeMs) {
            console.log(`✅ Reached start time. Total signatures: ${allSignatures.length}`);
            break;
          }
          
          // If we got less than 50, we've reached the end
          if (batch.length < 50) {
            console.log(`✅ Reached end of transaction history. Total signatures: ${allSignatures.length}`);
            break;
          }
          
          lastSignature = batch[batch.length - 1].signature;
          retryCount = 0; // Reset retry count on success
          
          // Improved rate limiting with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          retryCount++;
          console.log(`⚠️  Error fetching signatures (attempt ${retryCount}/${maxRetries}): ${error.message}`);
          
          if (retryCount >= maxRetries) {
            console.log('❌ Max retries reached, stopping signature fetch');
            break;
          }
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      console.log(`✅ Found ${allSignatures.length} pair transactions since start time\n`);

      const qualifyingBuys = [];
      const processedSignatures = new Set();
      let checkedCount = 0;
      let parsedCount = 0;

      for (const sig of allSignatures) {
        // Already filtered by time in pagination above
        checkedCount++;

        // Skip if already processed
        if (processedSignatures.has(sig.signature)) {
          continue;
        }
        processedSignatures.add(sig.signature);

        try {
          // Parse the transaction with retry logic
          let tx = null;
          let txRetryCount = 0;
          const maxTxRetries = 2;
          
          while (txRetryCount < maxTxRetries) {
            try {
              tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0
              });
              break;
            } catch (txError) {
              txRetryCount++;
              if (txRetryCount >= maxTxRetries) {
                console.log(`  ⚠️  Failed to parse transaction ${sig.signature}: ${txError.message}`);
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          if (!tx || !tx.meta || tx.meta.err) {
            continue;
          }

          // Look for token transfers TO non-program wallets (buyers)
          const tokenTransfers = this.parseSwapTransaction(tx, tokenMint);
          
          if (tokenTransfers) {
            parsedCount++;
            const { buyer, tokenAmount, isSwap } = tokenTransfers;
            
            if (isSwap && tokenAmount > 0) {
              // Don't divide by decimals - tokenAmount already accounts for decimals from parsing
              const usdValue = tokenAmount * price;

              console.log(`  📝 Buy: ${buyer.substring(0, 8)}... | ${tokenAmount.toFixed(2)} tokens | $${usdValue.toFixed(2)}`);

              // Check if meets minimum
              if (usdValue >= parseFloat(minUsdAmount)) {
                // Convert UTC blockTime to EDT for storage
                // sig.blockTime is Unix timestamp in seconds (UTC)
                // Convert to EDT (UTC-4) for proper display
                const utcDate = new Date(sig.blockTime * 1000);
                const edtDate = new Date(utcDate.getTime() - (4 * 60 * 60 * 1000)); // Subtract 4 hours for EDT
                
                const year = edtDate.getUTCFullYear();
                const month = String(edtDate.getUTCMonth() + 1).padStart(2, '0');
                const day = String(edtDate.getUTCDate()).padStart(2, '0');
                const hour = String(edtDate.getUTCHours()).padStart(2, '0');
                const minute = String(edtDate.getUTCMinutes()).padStart(2, '0');
                const second = String(edtDate.getUTCSeconds()).padStart(2, '0');
                
                const timestampString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
                
                qualifyingBuys.push({
                  signature: sig.signature,
                  walletAddress: buyer,
                  tokenAmount: tokenAmount, // Keep as UI amount
                  usdAmount: usdValue,
                  timestamp: timestampString
                });
              }
            }
          }
        } catch (error) {
          console.log(`  ⚠️  Error processing transaction ${sig.signature}: ${error.message}`);
        }

        // Optimized rate limiting for paid Helius plan
        if (checkedCount % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Longer break every 100 transactions
        if (checkedCount % 100 === 0) {
          console.log(`⏳ Processed ${checkedCount} transactions, taking a break...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`\n✅ Found ${qualifyingBuys.length} qualifying buys from ${parsedCount} parsed swaps (${checkedCount} checked)`);
      return qualifyingBuys;

    } catch (error) {
      console.error('Error in DexScreener scan:', error);
      return [];
    }
  }

  /**
   * Parse a swap transaction to find the buyer and amount
   */
  parseSwapTransaction(tx, tokenMint) {
    try {
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      // Find recipients of our token (excluding program accounts)
      const recipients = [];

      for (const post of postTokenBalances) {
        if (post.mint !== tokenMint) continue;

        const pre = preTokenBalances.find(p => 
          p.accountIndex === post.accountIndex && 
          p.mint === tokenMint
        );

        const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmount || 0) : 0;
        const postAmount = parseFloat(post.uiTokenAmount.uiAmount || 0);
        const change = postAmount - preAmount;

        if (change > 0 && post.owner) {
          // Check if it's not a program account (simple heuristic)
          const owner = post.owner;
          const isLikelyUser = !owner.endsWith('11111111111111111111111111111');
          
          if (isLikelyUser) {
            recipients.push({
              owner: owner,
              change: change,
              decimals: post.uiTokenAmount.decimals
            });
          }
        }
      }

      if (recipients.length > 0) {
        // Get the largest recipient (the buyer)
        recipients.sort((a, b) => b.change - a.change);
        const buyer = recipients[0];

        return {
          buyer: buyer.owner,
          tokenAmount: buyer.change, // Use UI amount directly (already has decimals applied)
          isSwap: true
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new DexScreenerService();

