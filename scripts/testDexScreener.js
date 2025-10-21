// Test DexScreener integration directly
require('dotenv').config();
const dexScreenerService = require('../services/dexScreenerService');
const { Connection } = require('@solana/web3.js');

async function testDexScreener() {
  const tokenAddress = 'bwCs4bAMoExahc8Np2rxufxfrGai2Jb3mwkMqxkpump';
  
  console.log('🧪 Testing DexScreener Integration\n');
  console.log(`Token: ${tokenAddress}\n`);
  
  // Test 1: Get token data
  console.log('Step 1: Getting token data from DexScreener...');
  const tokenData = await dexScreenerService.getTokenData(tokenAddress);
  
  if (tokenData) {
    console.log(`✅ Found ${tokenData.length} trading pair(s)\n`);
    tokenData.forEach((pair, i) => {
      console.log(`Pair ${i+1}:`);
      console.log(`  DEX: ${pair.dexId}`);
      console.log(`  Address: ${pair.pairAddress}`);
      console.log(`  ${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
      console.log(`  Price: $${pair.priceUsd}`);
      console.log(`  Volume 24h: $${pair.volume?.h24 || 0}`);
      console.log(`  Liquidity: $${pair.liquidity?.usd || 0}`);
      console.log(`  Txns 24h: ${pair.txns?.h24?.buys || 0} buys, ${pair.txns?.h24?.sells || 0} sells\n`);
    });
  } else {
    console.log('❌ No trading pairs found!');
    process.exit(1);
  }
  
  // Test 2: Get recent transactions
  console.log('\nStep 2: Getting recent transaction info...');
  const pairInfo = await dexScreenerService.getRecentTransactions(tokenAddress);
  
  if (!pairInfo) {
    console.log('❌ Could not get pair info');
    process.exit(1);
  }
  
  // Test 3: Scan for buys
  console.log('\n\nStep 3: Scanning for qualifying buys (last 6 hours, min $9)...');
  const startTime = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const minUsd = 9;
  
  const apiKey = process.env.HELIUS_API_KEY;
  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  const connection = new Connection(rpcUrl, 'confirmed');
  
  const buys = await dexScreenerService.scanForQualifyingBuys(
    tokenAddress,
    startTime.toISOString(),
    minUsd,
    connection
  );
  
  console.log(`\n\n📊 FINAL RESULTS:`);
  console.log(`Found ${buys.length} qualifying buys (≥$${minUsd})\n`);
  
  if (buys.length > 0) {
    buys.forEach((buy, i) => {
      console.log(`${i+1}. Wallet: ${buy.walletAddress.substring(0, 12)}...`);
      console.log(`   Amount: ${(buy.tokenAmount / 1e9).toFixed(2)} tokens`);
      console.log(`   Value: $${buy.usdAmount.toFixed(2)}`);
      console.log(`   Time: ${buy.timestamp.toLocaleString()}`);
      console.log(`   Tx: https://solscan.io/tx/${buy.signature}\n`);
    });
  } else {
    console.log('❌ No qualifying buys found');
    console.log('\nThis could mean:');
    console.log('  - No buys ≥$9 in the last 6 hours');
    console.log('  - Parsing issues with the pair transactions');
    console.log('  - Time zone differences');
  }
  
  process.exit(0);
}

testDexScreener().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

