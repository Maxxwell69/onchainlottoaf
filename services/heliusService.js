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
      console.error('Error fetching token transactions:', error.message);
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
    try {
      // Try Jupiter API for price
      const jupiterUrl = `https://price.jup.ag/v4/price?ids=${tokenAddress}`;
      const response = await axios.get(jupiterUrl);
      
      if (response.data && response.data.data && response.data.data[tokenAddress]) {
        return response.data.data[tokenAddress].price;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching token price:', error.message);
      return 0;
    }
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

      if (!transactions || transactions.length === 0) {
        console.log('No new transactions found');
        return [];
      }

      // Get current token price
      const tokenPrice = await this.getTokenPrice(draw.token_address);
      console.log(`💵 Current ${draw.token_symbol} price: $${tokenPrice}`);

      if (tokenPrice === 0) {
        console.log('⚠️  Warning: Could not fetch token price');
        return [];
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

        // Check if meets minimum USD requirement
        if (usdValue >= parseFloat(draw.min_usd_amount)) {
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

