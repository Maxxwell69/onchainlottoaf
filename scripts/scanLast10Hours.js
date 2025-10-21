// Aggressive scan for last 10 hours
require('dotenv').config();
const rpcService = require('../services/solanaRpcService');
const heliusService = require('../services/heliusService');

async function scanLast10Hours() {
  const tokenAddress = 'bwCs4bAMoExahc8Np2rxufxfrGai2Jb3mwkMqxkpump';
  const hoursAgo = 10;
  const minUsd = 9;
  
  console.log(`🔍 Aggressive Scan: Last ${hoursAgo} hours, Min $${minUsd}\n`);
  console.log(`Token: ${tokenAddress}\n`);
  
  // Get price
  const price = await heliusService.getTokenPrice(tokenAddress);
  console.log(`Price: $${price}\n`);
  
  // Calculate minimum tokens needed
  const minTokens = minUsd / price;
  console.log(`Minimum tokens needed: ${minTokens.toFixed(2)}\n`);
  
  // Set start time to 10 hours ago
  const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  console.log(`Looking for buys after: ${startTime.toLocaleString()}\n`);
  
  // Get more transactions
  console.log('📊 Fetching token account transactions...');
  const transactions = await rpcService.getTokenAccountTransactions(tokenAddress, 200); // Increased to 200
  console.log(`Found ${transactions.length} total transactions\n`);
  
  // Filter by time first
  const recentTxs = transactions.filter(tx => {
    return tx.timestamp && new Date(tx.timestamp * 1000) >= startTime;
  });
  console.log(`${recentTxs.length} transactions in last ${hoursAgo} hours\n`);
  
  if (recentTxs.length === 0) {
    console.log(`❌ No transactions found in the last ${hoursAgo} hours!`);
    console.log(`\n💡 This could mean:`);
    console.log(`  - Token has low trading activity`);
    console.log(`  - Need to check a longer time period`);
    console.log(`  - Or check different token accounts\n`);
    
    // Show when the most recent transaction was
    if (transactions.length > 0) {
      console.log(`Most recent transaction was:`);
      console.log(`  Time: ${new Date(transactions[0].timestamp * 1000).toLocaleString()}`);
      console.log(`  Signature: ${transactions[0].signature}`);
    }
    process.exit(0);
  }
  
  // Parse each transaction
  console.log('Parsing recent transactions...\n');
  const buys = [];
  
  for (let i = 0; i < recentTxs.length; i++) {
    const tx = recentTxs[i];
    process.stdout.write(`  Processing ${i+1}/${recentTxs.length}...\r`);
    
    const parsed = await rpcService.parseTransaction(tx.signature, tokenAddress);
    
    if (parsed && parsed.tokenAmount > 0) {
      const tokenAmountUi = parsed.tokenAmount / 1e9;
      const usdValue = tokenAmountUi * price;
      
      buys.push({
        signature: parsed.signature,
        buyer: parsed.buyer,
        tokenAmount: tokenAmountUi,
        usdValue: usdValue,
        timestamp: parsed.timestamp
      });
      
      console.log(`\n  ✅ Buy found:`);
      console.log(`     Wallet: ${parsed.buyer.substring(0, 12)}...`);
      console.log(`     Amount: ${tokenAmountUi.toFixed(2)} tokens`);
      console.log(`     Value: $${usdValue.toFixed(2)}`);
      console.log(`     Time: ${parsed.timestamp.toLocaleString()}`);
      console.log(`     Tx: https://solscan.io/tx/${parsed.signature}\n`);
    }
    
    // Small delay to avoid rate limits
    if (i % 20 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n\n📊 RESULTS:`);
  console.log(`Total buys found: ${buys.length}`);
  
  const qualifyingBuys = buys.filter(b => b.usdValue >= minUsd);
  console.log(`Qualifying buys (≥$${minUsd}): ${qualifyingBuys.length}`);
  
  if (qualifyingBuys.length > 0) {
    console.log(`\n🎉 QUALIFYING BUYS:`);
    qualifyingBuys.forEach((buy, i) => {
      console.log(`\n${i+1}. Wallet: ${buy.buyer.substring(0, 12)}...`);
      console.log(`   Amount: ${buy.tokenAmount.toFixed(2)} tokens`);
      console.log(`   Value: $${buy.usdValue.toFixed(2)}`);
      console.log(`   Time: ${buy.timestamp.toLocaleString()}`);
      console.log(`   Tx: https://solscan.io/tx/${buy.signature}`);
    });
  } else {
    console.log(`\n❌ No buys ≥$${minUsd} found in last ${hoursAgo} hours`);
    console.log(`\nAll buys found:`);
    buys.forEach((buy, i) => {
      console.log(`  ${i+1}. $${buy.usdValue.toFixed(2)} at ${buy.timestamp.toLocaleTimeString()}`);
    });
  }
  
  process.exit(0);
}

scanLast10Hours().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

