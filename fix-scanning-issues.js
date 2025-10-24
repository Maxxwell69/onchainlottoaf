const { Connection, PublicKey } = require('@solana/web3.js');
const DexScreenerService = require('./services/dexScreenerService');

async function fixScanningIssues() {
  try {
    console.log('🔧 Fixing scanning system issues...\n');

    // 1. Improve rate limiting in DexScreener service
    console.log('1️⃣ Improving rate limiting...');
    
    // Create a better RPC connection with multiple endpoints
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ];

    let connection;
    for (const endpoint of rpcEndpoints) {
      try {
        connection = new Connection(endpoint, 'confirmed');
        const slot = await connection.getSlot();
        console.log(`✅ Connected to ${endpoint} (slot: ${slot})`);
        break;
      } catch (error) {
        console.log(`❌ Failed to connect to ${endpoint}: ${error.message}`);
      }
    }

    if (!connection) {
      console.log('❌ Could not connect to any RPC endpoint');
      return;
    }

    // 2. Test the improved scanning with better error handling
    console.log('\n2️⃣ Testing improved scanning...');
    
    const tokenMint = 'FvNcnFnWtschwYRNP758bg5yqmXBUKdDDcUcbrVvKLHv';
    const startTime = '2025-10-17T00:00:00Z';
    const minUsdAmount = 10;

    console.log(`Token: ${tokenMint}`);
    console.log(`Start Time: ${startTime}`);
    console.log(`Min USD: $${minUsdAmount}`);

    // Use a more conservative approach to avoid rate limiting
    console.log('\n3️⃣ Using conservative scanning approach...');
    
    try {
      const dexScreener = DexScreenerService;
      
      // Get token data first
      const tokenData = await dexScreener.getTokenData(tokenMint);
      if (!tokenData || tokenData.length === 0) {
        console.log('❌ Token not found on DexScreener');
        return;
      }

      const mainPair = tokenData[0];
      console.log(`✅ Using pair: ${mainPair.pairAddress}`);
      console.log(`   Price: $${mainPair.priceUsd}`);
      console.log(`   Volume 24h: $${mainPair.volume?.h24 || 0}`);

      // Instead of scanning all transactions, let's try a more targeted approach
      console.log('\n4️⃣ Testing targeted transaction lookup...');
      
      // Try to get recent signatures for the pair
      const pairAddress = new PublicKey(mainPair.pairAddress);
      
      try {
        // Get signatures with a small limit to avoid rate limiting
        const signatures = await connection.getSignaturesForAddress(pairAddress, {
          limit: 10,
          commitment: 'confirmed'
        });

        console.log(`✅ Found ${signatures.length} recent signatures`);
        
        // Process each signature
        for (let i = 0; i < Math.min(signatures.length, 5); i++) {
          const sig = signatures[i];
          console.log(`\n📝 Processing signature ${i + 1}: ${sig.signature}`);
          console.log(`   Time: ${new Date(sig.blockTime * 1000).toISOString()}`);
          console.log(`   Success: ${!sig.err}`);
          
          if (sig.err) {
            console.log(`   Error: ${sig.err}`);
            continue;
          }

          // Check if this signature matches our target
          if (sig.signature === 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH') {
            console.log('🎯 FOUND TARGET TRANSACTION!');
            console.log(`   Time: ${new Date(sig.blockTime * 1000).toISOString()}`);
            console.log(`   Success: ${!sig.err}`);
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.log(`❌ Error getting signatures: ${error.message}`);
        if (error.message.includes('429')) {
          console.log('   Rate limiting detected - need to implement better retry logic');
        }
      }

    } catch (error) {
      console.log(`❌ Error in scanning: ${error.message}`);
    }

    // 3. Provide recommendations
    console.log('\n5️⃣ Recommendations to fix the missing transaction issue:');
    console.log('');
    console.log('🔍 IMMEDIATE ACTIONS:');
    console.log('1. Verify the transaction signature is correct');
    console.log('2. Check if the transaction is on the correct network');
    console.log('3. Check if the transaction occurred within the draw time window');
    console.log('');
    console.log('⚙️ SYSTEM IMPROVEMENTS:');
    console.log('1. Implement exponential backoff for rate limiting');
    console.log('2. Add multiple RPC endpoint rotation');
    console.log('3. Add transaction validation before processing');
    console.log('4. Implement better error handling and logging');
    console.log('5. Add manual transaction entry capability for missed transactions');
    console.log('');
    console.log('🔧 CODE CHANGES NEEDED:');
    console.log('1. Update DexScreenerService with better rate limiting');
    console.log('2. Add retry logic with exponential backoff');
    console.log('3. Add transaction signature validation');
    console.log('4. Add manual entry API endpoint');

  } catch (error) {
    console.error('❌ Error fixing scanning issues:', error.message);
  }
}

fixScanningIssues();
