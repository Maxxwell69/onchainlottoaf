// Test specific pair from DexScreener
require('dotenv').config();
const axios = require('axios');
const { Connection } = require('@solana/web3.js');

async function testPair() {
  const pairAddress = '9GzuXvASSZsMRCnXa7KxGaRyci5w2GBtHjMQj1xy5kLm';
  
  console.log('🧪 Testing Pair from DexScreener\n');
  console.log(`Pair Address: ${pairAddress}\n`);
  
  // Get pair info from DexScreener
  console.log('Step 1: Getting pair info from DexScreener...');
  try {
    const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${pairAddress}`;
    const response = await axios.get(url);
    
    if (response.data && response.data.pair) {
      const pair = response.data.pair;
      console.log('✅ Pair found!\n');
      console.log(`Token: ${pair.baseToken.symbol}`);
      console.log(`Token Address: ${pair.baseToken.address}`);
      console.log(`Price: $${pair.priceUsd}`);
      console.log(`Volume 24h: $${pair.volume?.h24 || 0}`);
      console.log(`Liquidity: $${pair.liquidity?.usd || 0}`);
      console.log(`Txns 24h: ${pair.txns?.h24?.buys || 0} buys, ${pair.txns?.h24?.sells || 0} sells\n`);
      
      // Now test scanning this token
      const tokenAddress = pair.baseToken.address;
      const price = parseFloat(pair.priceUsd);
      
      console.log('\nStep 2: Scanning pair transactions for $25+ buys...');
      
      const apiKey = process.env.HELIUS_API_KEY;
      const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
      const connection = new Connection(rpcUrl, 'confirmed');
      
      const { PublicKey } = require('@solana/web3.js');
      
      // Get recent signatures for the pair
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(pairAddress),
        { limit: 50 }
      );
      
      console.log(`Found ${signatures.length} pair transactions\n`);
      
      const buys = [];
      let checked = 0;
      
      for (const sig of signatures) {
        if (checked >= 20) break; // Check first 20
        
        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          
          if (!tx || !tx.meta || tx.meta.err) continue;
          
          checked++;
          
          // Look for token transfers
          const preTokenBalances = tx.meta.preTokenBalances || [];
          const postTokenBalances = tx.meta.postTokenBalances || [];
          
          for (const post of postTokenBalances) {
            if (post.mint !== tokenAddress) continue;
            
            const pre = preTokenBalances.find(p => 
              p.accountIndex === post.accountIndex && 
              p.mint === tokenAddress
            );
            
            const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmount || 0) : 0;
            const postAmount = parseFloat(post.uiTokenAmount.uiAmount || 0);
            const change = postAmount - preAmount;
            
            if (change > 0 && post.owner) {
              const usdValue = change * price;
              
              if (usdValue >= 25) {
                buys.push({
                  wallet: post.owner,
                  tokens: change,
                  usd: usdValue,
                  time: new Date(sig.blockTime * 1000),
                  tx: sig.signature
                });
                
                console.log(`✅ $${usdValue.toFixed(2)} buy found!`);
                console.log(`   Wallet: ${post.owner.substring(0, 12)}...`);
                console.log(`   Tokens: ${change.toFixed(2)}`);
                console.log(`   Time: ${new Date(sig.blockTime * 1000).toLocaleString()}`);
                console.log(`   Tx: https://solscan.io/tx/${sig.signature}\n`);
              }
            }
          }
        } catch (error) {
          // Skip errors
        }
        
        // Rate limit
        if (checked % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`\n📊 RESULTS:`);
      console.log(`Checked ${checked} transactions`);
      console.log(`Found ${buys.length} buys ≥ $25\n`);
      
      if (buys.length === 0) {
        console.log('❌ No buys ≥ $25 found in recent transactions');
        console.log('\nPossible reasons:');
        console.log('  - Need to check more transactions (increase limit)');
        console.log('  - Buys happened earlier than scanned period');
        console.log('  - DexScreener showing cumulative data');
      }
      
    } else {
      console.log('❌ Pair not found!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

testPair();

