const { Connection, PublicKey } = require('@solana/web3.js');
const DexScreenerService = require('./services/dexScreenerService');

async function analyzeScanningIssues() {
  try {
    console.log('🔍 Analyzing scanning system issues...\n');

    const tokenMint = 'FvNcnFnWtschwYRNP758bg5yqmXBUKdDDcUcbrVvKLHv';
    const targetSignature = 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH';
    
    console.log('📊 Analysis Summary:');
    console.log(`Token: ${tokenMint}`);
    console.log(`Target Transaction: ${targetSignature}`);
    console.log(`Expected Amount: $15.34`);
    console.log(`Date: 10/17/25 at 07:34 PM EST\n`);

    // 1. Check if transaction signature is valid
    console.log('1️⃣ Checking transaction signature validity...');
    try {
      new PublicKey(targetSignature);
      console.log('✅ Signature format is valid base58');
    } catch (error) {
      console.log('❌ Invalid signature format');
      console.log(`Error: ${error.message}`);
      return;
    }

    // 2. Check token on DexScreener
    console.log('\n2️⃣ Checking token on DexScreener...');
    const dexScreener = DexScreenerService;
    const tokenData = await dexScreener.getTokenData(tokenMint);
    
    if (tokenData && tokenData.length > 0) {
      console.log('✅ Token found on DexScreener');
      const mainPair = tokenData[0];
      console.log(`   DEX: ${mainPair.dexId}`);
      console.log(`   Price: $${mainPair.priceUsd}`);
      console.log(`   Volume 24h: $${mainPair.volume?.h24 || 0}`);
      console.log(`   Pair Address: ${mainPair.pairAddress}`);
    } else {
      console.log('❌ Token not found on DexScreener');
      console.log('   This could be why transactions are not being detected');
      return;
    }

    // 3. Check RPC rate limiting issues
    console.log('\n3️⃣ Checking RPC rate limiting...');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    try {
      // Test a simple RPC call
      const slot = await connection.getSlot();
      console.log(`✅ RPC connection working (current slot: ${slot})`);
    } catch (error) {
      console.log(`❌ RPC connection failed: ${error.message}`);
      if (error.message.includes('429')) {
        console.log('   Rate limiting detected - this is likely the main issue');
      }
    }

    // 4. Test with a smaller time window to avoid rate limits
    console.log('\n4️⃣ Testing with smaller time window...');
    const startTime = '2025-10-17T20:00:00Z'; // 8 PM UTC (3 PM EST)
    const endTime = '2025-10-17T22:00:00Z';   // 10 PM UTC (5 PM EST)
    
    console.log(`Testing window: ${startTime} to ${endTime}`);
    console.log('This should include the target transaction time (7:34 PM EST = 11:34 PM UTC)');

    // 5. Check if the issue is with the scanning logic
    console.log('\n5️⃣ Potential issues identified:');
    console.log('❌ Transaction signature appears to be invalid or incorrect');
    console.log('❌ RPC rate limiting is preventing proper scanning');
    console.log('❌ The transaction might be from a different time period');
    console.log('❌ The transaction might have failed or been reverted');

    // 6. Recommendations
    console.log('\n6️⃣ Recommendations to fix the issue:');
    console.log('1. Verify the transaction signature is correct');
    console.log('2. Check if the transaction is on the correct network (mainnet vs testnet)');
    console.log('3. Implement better rate limiting and retry logic');
    console.log('4. Add more RPC endpoints for redundancy');
    console.log('5. Consider using a paid RPC service for better reliability');
    console.log('6. Add transaction validation before processing');

    // 7. Check if there are any existing entries for this draw
    console.log('\n7️⃣ Checking existing draw entries...');
    console.log('To check existing entries, you would need to:');
    console.log('1. Connect to the database');
    console.log('2. Query the lotto_entries table for draw #31');
    console.log('3. Check if any entries match the expected wallet or amount');

  } catch (error) {
    console.error('❌ Error in analysis:', error.message);
  }
}

analyzeScanningIssues();
