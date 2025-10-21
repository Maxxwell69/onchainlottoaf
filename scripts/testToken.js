// Test specific token scanning
require('dotenv').config();
const heliusService = require('../services/heliusService');

async function testToken() {
  const tokenAddress = 'bwCs4bAMoExahc8Np2rxufxfrGai2Jb3mwkMqxkpump';
  
  console.log(`🧪 Testing token: ${tokenAddress}\n`);
  
  // Test 1: Get transactions
  console.log('Test 1: Fetching transactions...');
  try {
    const transactions = await heliusService.getTokenTransactions(tokenAddress, 10);
    console.log(`✅ Found ${transactions ? transactions.length : 0} transactions`);
    
    if (transactions && transactions.length > 0) {
      console.log('\nFirst transaction:');
      console.log(`  Signature: ${transactions[0].signature}`);
      console.log(`  Timestamp: ${new Date(transactions[0].timestamp * 1000).toLocaleString()}`);
      console.log(`  Type: ${transactions[0].type}`);
      console.log(`  Token Transfers: ${transactions[0].tokenTransfers ? transactions[0].tokenTransfers.length : 0}`);
      
      if (transactions[0].tokenTransfers && transactions[0].tokenTransfers.length > 0) {
        console.log(`\n  First Transfer:`);
        console.log(`    From: ${transactions[0].tokenTransfers[0].fromUserAccount || 'N/A'}`);
        console.log(`    To: ${transactions[0].tokenTransfers[0].toUserAccount || 'N/A'}`);
        console.log(`    Amount: ${transactions[0].tokenTransfers[0].tokenAmount || 0}`);
        console.log(`    Mint: ${transactions[0].tokenTransfers[0].mint || 'N/A'}`);
      }
    } else {
      console.log('❌ No transactions found!');
      console.log('\nPossible reasons:');
      console.log('  - Token is very new');
      console.log('  - Token address is incorrect');
      console.log('  - No trading activity yet');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Test 2: Get price
  console.log('\n\nTest 2: Fetching price...');
  try {
    const price = await heliusService.getTokenPrice(tokenAddress);
    console.log(`Price: $${price}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testToken();

