const { Connection, PublicKey } = require('@solana/web3.js');
require('dotenv').config();

class SolanaRpcService {
  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY;
    this.rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;
    this.connection = new Connection(this.rpcUrl, 'confirmed');
  }

  /**
   * Get token account transactions using direct Solana RPC
   * This works for ALL tokens, including pump.fun
   */
  async getTokenAccountTransactions(tokenMint, limit = 100) {
    try {
      console.log(`🔍 Scanning token accounts for ${tokenMint}...`);
      
      const mintPubkey = new PublicKey(tokenMint);
      
      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program
        {
          filters: [
            {
              dataSize: 165, // Size of token account
            },
            {
              memcmp: {
                offset: 0, // Mint location in account data
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      console.log(`✅ Found ${tokenAccounts.length} token accounts`);

      const allTransactions = [];
      const processedSignatures = new Set();

      // Get recent transactions for first 20 accounts (to avoid rate limits)
      const accountsToCheck = tokenAccounts.slice(0, 20);
      
      for (const account of accountsToCheck) {
        try {
          const signatures = await this.connection.getSignaturesForAddress(
            account.pubkey,
            { limit: Math.ceil(limit / accountsToCheck.length) }
          );

          for (const sig of signatures) {
            if (!processedSignatures.has(sig.signature)) {
              processedSignatures.add(sig.signature);
              allTransactions.push({
                signature: sig.signature,
                timestamp: sig.blockTime,
                slot: sig.slot
              });
            }
          }
        } catch (error) {
          console.log(`⚠️  Error fetching signatures for account: ${error.message}`);
        }
      }

      // Sort by timestamp descending
      allTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      return allTransactions.slice(0, limit);
    } catch (error) {
      console.error('Error getting token account transactions:', error.message);
      return [];
    }
  }

  /**
   * Parse transaction to extract token transfer details
   */
  async parseTransaction(signature, tokenMint) {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta) {
        return null;
      }

      // Look for token transfers in the transaction
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      // Find transfers of our token
      for (let i = 0; i < postTokenBalances.length; i++) {
        const post = postTokenBalances[i];
        const pre = preTokenBalances.find(p => p.accountIndex === post.accountIndex);

        if (post.mint === tokenMint && pre) {
          const preAmount = parseFloat(pre.uiTokenAmount.uiAmount || 0);
          const postAmount = parseFloat(post.uiTokenAmount.uiAmount || 0);
          const change = postAmount - preAmount;

          // If positive change, this account received tokens (buyer)
          if (change > 0) {
            const accountIndex = post.accountIndex;
            const ownerAddress = post.owner;

            return {
              signature: signature,
              buyer: ownerAddress,
              tokenAmount: change * Math.pow(10, post.uiTokenAmount.decimals), // Convert back to raw amount
              timestamp: new Date(tx.blockTime * 1000),
              slot: tx.slot
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Error parsing transaction ${signature}:`, error.message);
      return null;
    }
  }

  /**
   * Scan for qualifying buys using direct RPC
   */
  async scanForQualifyingBuys(tokenMint, startTime, minUsdAmount, tokenPrice) {
    try {
      console.log('🔗 Using direct Solana RPC scanning (works with all tokens)...');
      
      // Get recent transactions
      const transactions = await this.getTokenAccountTransactions(tokenMint, 50);
      console.log(`📊 Processing ${transactions.length} transactions...`);

      const qualifyingBuys = [];
      let processed = 0;

      for (const tx of transactions) {
        // Check timestamp
        if (!tx.timestamp || new Date(tx.timestamp * 1000) < new Date(startTime)) {
          continue;
        }

        // Parse transaction
        const parsedTx = await this.parseTransaction(tx.signature, tokenMint);
        
        if (parsedTx && parsedTx.tokenAmount > 0) {
          processed++;
          
          // Calculate USD value
          const tokenAmountUi = parsedTx.tokenAmount / 1e9; // Assuming 9 decimals
          const usdValue = tokenAmountUi * tokenPrice;

          console.log(`  📝 Buy: ${parsedTx.buyer.substring(0, 8)}... | ${tokenAmountUi.toFixed(2)} tokens | $${usdValue.toFixed(2)}`);

          // Check if meets minimum
          if (tokenPrice === 0 || usdValue >= parseFloat(minUsdAmount)) {
            qualifyingBuys.push({
              signature: parsedTx.signature,
              walletAddress: parsedTx.buyer,
              tokenAmount: parsedTx.tokenAmount,
              usdAmount: usdValue,
              timestamp: parsedTx.timestamp
            });
          }
        }

        // Add small delay to avoid rate limits
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Found ${qualifyingBuys.length} qualifying buys from ${processed} parsed transactions`);
      return qualifyingBuys;
    } catch (error) {
      console.error('Error in RPC scanning:', error);
      return [];
    }
  }
}

module.exports = new SolanaRpcService();

