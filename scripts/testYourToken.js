// Test your specific token with RPC fallback
require('dotenv').config();
const rpcService = require('../services/solanaRpcService');
const heliusService = require('../services/heliusService');

async function testYourToken() {
  const tokenAddress = 'bwCs4bAMoExahc8Np2rxufxfrGai2Jb3mwkMqxkpump';
  
  console.log('🧪 Testing Your Token with Direct RPC\n');
  console.log(`Token: ${tokenAddress}\n`);
  
  // Test 1: Get price
  console.log('📊 Step 1: Getting token price...');
  const price = await heliusService.getTokenPrice(tokenAddress);
  console.log(`Price: $${price}\n`);
  
  // Test 2: Get token accounts
  console.log('📊 Step 2: Getting token account transactions...');
  const transactions = await rpcService.getTokenAccountTransactions(tokenAddress, 10);
  console.log(`Found ${transactions.length} transactions\n`);
  
  if (transactions.length > 0) {
    console.log('First 3 transactions:');
    for (let i = 0; i < Math.min(3, transactions.length); i++) {
      const tx = transactions[i];
      console.log(`  ${i+1}. ${tx.signature.substring(0, 16)}...`);
      console.log(`     Time: ${new Date(tx.timestamp * 1000).toLocaleString()}`);
      
      // Try to parse it
      const parsed = await rpcService.parseTransaction(tx.signature, tokenAddress);
      if (parsed) {
        console.log(`     Buyer: ${parsed.buyer.substring(0, 8)}...`);
        console.log(`     Amount: ${(parsed.tokenAmount / 1e9).toFixed(2)} tokens`);
        console.log(`     USD Value: $${((parsed.tokenAmount / 1e9) * price).toFixed(2)}`);
      } else {
        console.log(`     Could not parse transaction`);
      }
      console.log('');
    }
  } else {
    console.log('❌ No transactions found!');
    console.log('\nPossible reasons:');
    console.log('  - Token has no recent trading activity');
    console.log('  - All token holders are inactive');
    console.log('  - Token mint address might be incorrect');
    console.log('\n💡 Try checking the token on Solscan:');
    console.log(`   https://solscan.io/token/${tokenAddress}`);
  }
  
  // Test 3: Full scan simulation
  console.log('\n📊 Step 3: Simulating full scan...');
  const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  const minUsd = 9;
  
  const qualifyingBuys = await rpcService.scanForQualifyingBuys(
    tokenAddress,
    startTime.toISOString(),
    minUsd,
    price
  );
  
  console.log(`\n✅ Scan Complete!`);
  console.log(`Found ${qualifyingBuys.length} qualifying buys (>${minUsd} USD in last 24h)`);
  
  process.exit(0);
}

testYourToken().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

