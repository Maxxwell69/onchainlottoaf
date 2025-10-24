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

      // Get recent transactions for MORE accounts to find all recent activity
      // Sort by last activity to get the most active accounts first
      const accountsToCheck = tokenAccounts.slice(0, 200); // Increased to 200 accounts
      
      for (const account of accountsToCheck) {
        try {
          const signatures = await this.connection.getSignaturesForAddress(
            account.pubkey,
            { limit: 5 } // Get last 5 transactions per account for better coverage
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
   * Enhanced to handle pump.fun and Raydium swaps
   */
  async parseTransaction(signature, tokenMint) {
    try {
      const tx = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx || !tx.meta || tx.meta.err) {
        return null;
      }

      // Look for token balance changes in the transaction
      const preTokenBalances = tx.meta.preTokenBalances || [];
      const postTokenBalances = tx.meta.postTokenBalances || [];

      // Find ALL accounts that received our token
      const recipients = [];

      for (let i = 0; i < postTokenBalances.length; i++) {
        const post = postTokenBalances[i];
        
        // Only process our token
        if (post.mint !== tokenMint) {
          continue;
        }

        const pre = preTokenBalances.find(p => 
          p.accountIndex === post.accountIndex && 
          p.mint === tokenMint
        );

        const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmount || 0) : 0;
        const postAmount = parseFloat(post.uiTokenAmount.uiAmount || 0);
        const change = postAmount - preAmount;

        // If positive change, this account received tokens (potential buyer)
        if (change > 0) {
          recipients.push({
            owner: post.owner,
            change: change,
            decimals: post.uiTokenAmount.decimals
          });
        }
      }

      // Find the largest recipient (the actual buyer in a swap)
      if (recipients.length > 0) {
        // Sort by change amount descending
        recipients.sort((a, b) => b.change - a.change);
        const buyer = recipients[0];

        // Convert UTC blockTime to EDT for storage
        const utcDate = new Date(tx.blockTime * 1000);
        const edtDate = new Date(utcDate.getTime() - (4 * 60 * 60 * 1000)); // Subtract 4 hours for EDT
        
        const year = edtDate.getUTCFullYear();
        const month = String(edtDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(edtDate.getUTCDate()).padStart(2, '0');
        const hour = String(edtDate.getUTCHours()).padStart(2, '0');
        const minute = String(edtDate.getUTCMinutes()).padStart(2, '0');
        const second = String(edtDate.getUTCSeconds()).padStart(2, '0');
        
        const timestampString = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

        return {
          signature: signature,
          buyer: buyer.owner,
          tokenAmount: buyer.change * Math.pow(10, buyer.decimals),
          timestamp: timestampString,
          slot: tx.slot
        };
      }

      return null;
    } catch (error) {
      // Silently skip parsing errors for cleaner logs
      return null;
    }
  }

  /**
   * Scan for qualifying buys using direct RPC
   */
  async scanForQualifyingBuys(tokenMint, startTime, minUsdAmount, tokenPrice) {
    try {
      console.log('🔗 Using direct Solana RPC scanning (works with all tokens)...');
      
      // Get recent transactions (increased to 500 for better coverage)
      const transactions = await this.getTokenAccountTransactions(tokenMint, 500);
      console.log(`📊 Processing ${transactions.length} transactions...`);
      console.log(`⏰ Scanning for buys after ${new Date(startTime).toLocaleString()}...`);

      const qualifyingBuys = [];
      const seenBuyers = new Set(); // Track unique buyers
      let processed = 0;
      let successfullyParsed = 0;

      for (const tx of transactions) {
        // Check timestamp
        if (!tx.timestamp || new Date(tx.timestamp * 1000) < new Date(startTime)) {
          continue;
        }

        // Parse transaction
        const parsedTx = await this.parseTransaction(tx.signature, tokenMint);
        
        if (parsedTx && parsedTx.tokenAmount > 0) {
          successfullyParsed++;
          
          // Calculate USD value
          const tokenAmountUi = parsedTx.tokenAmount / 1e9; // Assuming 9 decimals
          const usdValue = tokenAmountUi * tokenPrice;

          // Skip if we already have this buyer (deduplicate)
          const buyKey = `${parsedTx.buyer}-${parsedTx.signature}`;
          if (seenBuyers.has(buyKey)) {
            continue;
          }
          seenBuyers.add(buyKey);

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

        processed++;

        // Add small delay every 20 transactions to avoid rate limits
        if (processed % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log(`✅ Found ${qualifyingBuys.length} qualifying buys from ${successfullyParsed} parsed transactions (${processed} total checked)`);
      return qualifyingBuys;
    } catch (error) {
      console.error('Error in RPC scanning:', error);
      return [];
    }
  }
}

module.exports = new SolanaRpcService();

