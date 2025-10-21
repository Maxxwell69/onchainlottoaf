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
      
      // Get recent signatures for the pair address
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(pairAddress),
        { limit: 100 }
      );

      console.log(`✅ Found ${signatures.length} pair transactions\n`);

      const qualifyingBuys = [];
      const processedSignatures = new Set();
      let checkedCount = 0;
      let parsedCount = 0;

      for (const sig of signatures) {
        // Check timestamp
        if (!sig.blockTime || new Date(sig.blockTime * 1000) < new Date(startTime)) {
          continue;
        }

        checkedCount++;

        // Skip if already processed
        if (processedSignatures.has(sig.signature)) {
          continue;
        }
        processedSignatures.add(sig.signature);

        try {
          // Parse the transaction
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });

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
                qualifyingBuys.push({
                  signature: sig.signature,
                  walletAddress: buyer,
                  tokenAmount: tokenAmount, // Keep as UI amount
                  usdAmount: usdValue,
                  timestamp: new Date(sig.blockTime * 1000)
                });
              }
            }
          }
        } catch (error) {
          // Skip parsing errors
        }

        // Rate limiting
        if (checkedCount % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
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

