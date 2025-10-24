const axios = require('axios');

async function addMissingTransaction() {
  try {
    console.log('🔧 Adding missing transaction manually...\n');

    // Transaction details from the user
    const transactionData = {
      drawId: 31,
      walletAddress: 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH', // This is actually the wallet address
      tokenAmount: 147500, // Calculated from $15.34 / $0.0001040 price
      usdAmount: 15.34,
      transactionSignature: 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH', // This might be the transaction signature
      notes: 'Manually added - missing from scan on 10/17/25 at 07:34 PM EST'
    };

    console.log('📝 Transaction details:');
    console.log(`   Draw ID: ${transactionData.drawId}`);
    console.log(`   Wallet: ${transactionData.walletAddress}`);
    console.log(`   Token Amount: ${transactionData.tokenAmount}`);
    console.log(`   USD Amount: $${transactionData.usdAmount}`);
    console.log(`   Signature: ${transactionData.transactionSignature}`);
    console.log(`   Notes: ${transactionData.notes}\n`);

    // Make API call to add the transaction
    console.log('🚀 Sending request to API...');
    
    try {
      const response = await axios.post('http://localhost:3000/api/manual-entries', transactionData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Transaction added successfully!');
      console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data || apiError.message);
      
      if (apiError.response?.status === 400) {
        console.log('\n💡 Possible issues:');
        console.log('1. Draw #31 might not exist');
        console.log('2. Draw might not be active');
        console.log('3. Transaction might already exist');
        console.log('4. Draw might be full');
      }
    }

  } catch (error) {
    console.error('❌ Error adding transaction:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get('http://localhost:3000/api/health', { timeout: 5000 });
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Server is not running');
    console.log('Please start the server with: node server.js');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await addMissingTransaction();
  }
}

main();
