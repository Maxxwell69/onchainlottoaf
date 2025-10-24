const { Connection, PublicKey } = require('@solana/web3.js');
const DexScreenerService = require('./services/dexScreenerService');

async function testScanningLogic() {
  try {
    console.log('🧪 Testing scanning logic...\n');

    // Test parameters
    const tokenMint = 'FvNcnFnWtschwYRNP758bg5yqmXBUKdDDcUcbrVvKLHv';
    const startTime = '2025-10-17T00:00:00Z'; // Start of Oct 17
    const minUsdAmount = 10; // $10 minimum

    console.log(`Token: ${tokenMint}`);
    console.log(`Start Time: ${startTime}`);
    console.log(`Min USD Amount: $${minUsdAmount}\n`);

    // Test DexScreener service
    console.log('🔍 Testing DexScreener service...');
    const dexScreener = DexScreenerService;
    
    // Get token data
    const tokenData = await dexScreener.getTokenData(tokenMint);
    if (tokenData) {
      console.log('✅ Token found on DexScreener');
      console.log(`Pairs: ${tokenData.length}`);
      
      tokenData.forEach((pair, i) => {
        console.log(`  Pair ${i + 1}:`);
        console.log(`    DEX: ${pair.dexId}`);
        console.log(`    Symbol: ${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
        console.log(`    Price: $${pair.priceUsd}`);
        console.log(`    Volume 24h: $${pair.volume?.h24 || 0}`);
        console.log(`    Liquidity: $${pair.liquidity?.usd || 0}`);
        console.log(`    Pair Address: ${pair.pairAddress}`);
      });
    } else {
      console.log('❌ Token not found on DexScreener');
      return;
    }

    // Test scanning for qualifying buys
    console.log('\n🔍 Testing scan for qualifying buys...');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    const qualifyingBuys = await dexScreener.scanForQualifyingBuys(
      tokenMint,
      startTime,
      minUsdAmount,
      connection
    );

    console.log(`\n✅ Found ${qualifyingBuys.length} qualifying buys:`);
    qualifyingBuys.forEach((buy, i) => {
      console.log(`  ${i + 1}. Wallet: ${buy.walletAddress}`);
      console.log(`     Amount: ${buy.tokenAmount} tokens`);
      console.log(`     USD: $${buy.usdAmount.toFixed(2)}`);
      console.log(`     Time: ${buy.timestamp.toISOString()}`);
      console.log(`     Signature: ${buy.signature}`);
    });

    // Check if our specific transaction is in the results
    const targetSignature = 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH';
    const foundTransaction = qualifyingBuys.find(buy => buy.signature === targetSignature);
    
    if (foundTransaction) {
      console.log(`\n✅ Found target transaction!`);
      console.log(`   Wallet: ${foundTransaction.walletAddress}`);
      console.log(`   Amount: ${foundTransaction.tokenAmount} tokens`);
      console.log(`   USD: $${foundTransaction.usdAmount.toFixed(2)}`);
    } else {
      console.log(`\n❌ Target transaction not found in scan results`);
      console.log(`   Looking for: ${targetSignature}`);
    }

  } catch (error) {
    console.error('❌ Error testing scanning logic:', error.message);
    console.error(error.stack);
  }
}

testScanningLogic();
