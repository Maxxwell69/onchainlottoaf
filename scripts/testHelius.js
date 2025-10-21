// Test Helius API connection
require('dotenv').config();
const heliusService = require('../services/heliusService');

async function testHelius() {
  console.log('🧪 Testing Helius API Connection...\n');
  
  const apiKey = process.env.HELIUS_API_KEY;
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET'}`);
  
  if (!apiKey) {
    console.error('❌ HELIUS_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  console.log('✅ API Key loaded\n');
  
  // Test 1: Get BONK token metadata
  console.log('Test 1: Fetching BONK token metadata...');
  try {
    const metadata = await heliusService.getTokenMetadata('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
    if (metadata) {
      console.log('✅ Token metadata fetched successfully');
      console.log(`   Symbol: ${metadata.symbol || 'N/A'}`);
      console.log(`   Name: ${metadata.name || 'N/A'}\n`);
    } else {
      console.log('⚠️  No metadata returned\n');
    }
  } catch (error) {
    console.error('❌ Failed to fetch token metadata:', error.message, '\n');
  }
  
  // Test 2: Get BONK token price
  console.log('Test 2: Fetching BONK token price...');
  try {
    const price = await heliusService.getTokenPrice('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
    console.log('✅ Token price fetched successfully');
    console.log(`   Price: $${price}\n`);
  } catch (error) {
    console.error('❌ Failed to fetch token price:', error.message, '\n');
  }
  
  // Test 3: Get recent transactions
  console.log('Test 3: Fetching recent BONK transactions...');
  try {
    const transactions = await heliusService.getTokenTransactions('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 5);
    if (transactions && transactions.length > 0) {
      console.log(`✅ Fetched ${transactions.length} transactions`);
      console.log(`   First TX: ${transactions[0].signature.substring(0, 16)}...`);
      console.log(`   Timestamp: ${new Date(transactions[0].timestamp * 1000).toLocaleString()}\n`);
    } else {
      console.log('⚠️  No transactions returned\n');
    }
  } catch (error) {
    console.error('❌ Failed to fetch transactions:', error.message, '\n');
  }
  
  console.log('🎉 Helius API tests completed!');
  console.log('\nIf all tests passed, your Helius integration is working correctly.');
  console.log('You can now create lotto draws and scan for transactions!\n');
  
  process.exit(0);
}

testHelius();

