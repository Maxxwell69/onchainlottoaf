const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

class HeliusService {
  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY;
    this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.baseUrl = 'https://api.helius.xyz/v0';
  }

  /**
   * Get token transactions for a specific token address
   * @param {string} tokenAddress - The token mint address
   * @param {number} limit - Number of transactions to fetch
   * @param {string} beforeSignature - Signature to paginate from
   * @returns {Promise<Array>} Array of transactions
   */
  async getTokenTransactions(tokenAddress, limit = 100, beforeSignature = null) {
    try {
      const url = `${this.baseUrl}/addresses/${tokenAddress}/transactions`;
      
      const params = {
        'api-key': this.apiKey,
        limit: limit,
        type: 'SWAP' // Focus on swap transactions (buying tokens)
      };

      if (beforeSignature) {
        params.before = beforeSignature;
      }

      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching token transactions: ${error.message}`);
      
      // If Helius Enhanced API fails, try without the type filter
      if (error.response && error.response.status === 500) {
        console.log('🔄 Retrying without type filter...');
        try {
          delete params.type;
          const retryResponse = await axios.get(url, { params });
          return retryResponse.data;
        } catch (retryError) {
          console.error(`Retry also failed: ${retryError.message}`);
          console.log('💡 This token may be too new or not supported by Helius Enhanced API');
          console.log('💡 Try using a more established token like BONK for testing');
          return [];
        }
      }
      
      throw error;
    }
  }

  /**
   * Parse transaction to extract buy information
   * @param {Object} transaction - Transaction data from Helius
   * @param {string} tokenAddress - Token address we're monitoring
   * @returns {Object|null} Parsed buy information or null
   */
  parseTransaction(transaction, tokenAddress) {
    try {
      const { signature, timestamp, tokenTransfers, nativeTransfers } = transaction;

      if (!tokenTransfers || tokenTransfers.length === 0) {
        return null;
      }

      // Find token transfers for our token
      const relevantTransfer = tokenTransfers.find(
        transfer => transfer.mint === tokenAddress && transfer.tokenAmount > 0
      );

      if (!relevantTransfer) {
        return null;
      }

      // The buyer is the one receiving the tokens
      const buyer = relevantTransfer.toUserAccount;
      const tokenAmount = relevantTransfer.tokenAmount;

      return {
        signature,
        buyer,
        tokenAmount,
        timestamp: new Date(timestamp * 1000) // Convert to JS Date
      };
    } catch (error) {
      console.error('Error parsing transaction:', error.message);
      return null;
    }
  }

  /**
   * Get token price in USD
   * Uses Helius DAS API or falls back to Jupiter
   * @param {string} tokenAddress - Token mint address
   * @returns {Promise<number>} Price in USD
   */
  async getTokenPrice(tokenAddress) {
    // Try Jupiter API first
    try {
      const jupiterUrl = `https://api.jup.ag/price/v2?ids=${tokenAddress}`;
      const response = await axios.get(jupiterUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.data && response.data.data[tokenAddress]) {
        const price = response.data.data[tokenAddress].price;
        console.log(`✅ Got price from Jupiter: $${price}`);
        return price;
      }
    } catch (error) {
      console.log(`⚠️  Jupiter API failed: ${error.message}`);
    }

    // Try Birdeye API as fallback
    try {
      console.log('🔄 Trying Birdeye API...');
      const birdeyeUrl = `https://public-api.birdeye.so/public/price?address=${tokenAddress}`;
      const response = await axios.get(birdeyeUrl, {
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.data && response.data.data.value) {
        const price = response.data.data.value;
        console.log(`✅ Got price from Birdeye: $${price}`);
        return price;
      }
    } catch (error) {
      console.log(`⚠️  Birdeye API failed: ${error.message}`);
    }

    // Try DexScreener as last resort
    try {
      console.log('🔄 Trying DexScreener API...');
      const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
      const response = await axios.get(dexUrl, {
        timeout: 5000
      });
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const price = parseFloat(response.data.pairs[0].priceUsd);
        if (price > 0) {
          console.log(`✅ Got price from DexScreener: $${price}`);
          return price;
        }
      }
    } catch (error) {
      console.log(`⚠️  DexScreener API failed: ${error.message}`);
    }

    console.log(`❌ Could not fetch price from any source for ${tokenAddress}`);
    console.log('💡 Tip: Token might be too new or not yet listed on price feeds');
    return 0;
  }

  /**
   * Calculate USD value of token amount
   * @param {number} tokenAmount - Amount of tokens
   * @param {number} tokenPrice - Price per token in USD
   * @param {number} decimals - Token decimals
   * @returns {number} USD value
   */
  calculateUsdValue(tokenAmount, tokenPrice, decimals = 9) {
    const actualAmount = tokenAmount / Math.pow(10, decimals);
    return actualAmount * tokenPrice;
  }

  /**
   * Scan for new qualifying buys
   * @param {Object} draw - Draw object with token info
   * @param {string} lastSignature - Last processed signature
   * @returns {Promise<Array>} Array of qualifying buys
   */
  async scanForQualifyingBuys(draw, lastSignature = null) {
    try {
      console.log(`🔍 Scanning for buys of ${draw.token_symbol} (${draw.token_address})`);
      
      // Get recent transactions
      const transactions = await this.getTokenTransactions(
        draw.token_address,
        100,
        lastSignature
      );

      // ALWAYS use DexScreener for pump.fun and meme coins (more reliable)
      console.log('🎯 Using DexScreener scan for maximum reliability...');
      const dexScreenerService = require('./dexScreenerService');
      return await dexScreenerService.scanForQualifyingBuys(
        draw.token_address,
        draw.start_time,
        draw.min_usd_amount,
        this.connection
      );

      // Get current token price
      const tokenPrice = await this.getTokenPrice(draw.token_address);
      console.log(`💵 Current ${draw.token_symbol} price: $${tokenPrice}`);

      if (tokenPrice === 0) {
        console.log('⚠️  Warning: Could not fetch token price');
        console.log('📝 NOTE: Will still check for transactions, but cannot verify USD values');
        console.log('💡 You may need to manually verify qualifying buys');
      }

      const qualifyingBuys = [];

      // Process each transaction
      for (const tx of transactions) {
        // Only process transactions after draw start time
        const txTimestamp = new Date(tx.timestamp * 1000);
        if (txTimestamp < new Date(draw.start_time)) {
          continue;
        }

        const parsedTx = this.parseTransaction(tx, draw.token_address);
        if (!parsedTx) {
          continue;
        }

        // Calculate USD value
        const usdValue = this.calculateUsdValue(
          parsedTx.tokenAmount,
          tokenPrice,
          9 // Most Solana tokens use 9 decimals
        );

        // If price is unavailable, add all buys for manual verification
        // Otherwise, check if meets minimum USD requirement
        if (tokenPrice === 0) {
          console.log(`⚠️  Adding buy without USD verification: ${parsedTx.signature.substring(0, 8)}... (${parsedTx.tokenAmount} tokens)`);
          qualifyingBuys.push({
            signature: parsedTx.signature,
            walletAddress: parsedTx.buyer,
            tokenAmount: parsedTx.tokenAmount,
            usdAmount: 0, // Will show as $0 - needs manual verification
            timestamp: parsedTx.timestamp
          });
        } else if (usdValue >= parseFloat(draw.min_usd_amount)) {
          qualifyingBuys.push({
            signature: parsedTx.signature,
            walletAddress: parsedTx.buyer,
            tokenAmount: parsedTx.tokenAmount,
            usdAmount: usdValue,
            timestamp: parsedTx.timestamp
          });
        }
      }

      console.log(`✅ Found ${qualifyingBuys.length} qualifying buys`);
      return qualifyingBuys;

    } catch (error) {
      console.error('Error scanning for qualifying buys:', error);
      throw error;
    }
  }

  /**
   * Get token metadata
   * @param {string} tokenAddress - Token mint address
   * @returns {Promise<Object>} Token metadata
   */
  async getTokenMetadata(tokenAddress) {
    try {
      const url = `${this.baseUrl}/token-metadata`;
      const response = await axios.post(
        url,
        {
          mintAccounts: [tokenAddress]
        },
        {
          params: {
            'api-key': this.apiKey
          }
        }
      );

      return response.data[0] || null;
    } catch (error) {
      console.error('Error fetching token metadata:', error.message);
      return null;
    }
  }
}

module.exports = new HeliusService();

