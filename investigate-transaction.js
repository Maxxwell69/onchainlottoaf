const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');

// Transaction details from the user
const transactionSignature = 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH';
const tokenMint = 'FvNcnFnWtschwYRNP758bg5yqmXBUKdDDcUcbrVvKLHv';
const expectedAmount = 15.34;
const transactionDate = '2025-10-17T19:34:00-05:00'; // 7:34 PM EST

async function investigateTransaction() {
  try {
    console.log('🔍 Investigating missing transaction...');
    console.log(`Transaction: ${transactionSignature}`);
    console.log(`Token: ${tokenMint}`);
    console.log(`Expected Amount: $${expectedAmount}`);
    console.log(`Date: ${transactionDate}\n`);

    // Connect to Solana
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Get transaction details
    console.log('📡 Fetching transaction details...');
    const tx = await connection.getParsedTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      console.log('❌ Transaction not found');
      return;
    }

    console.log('✅ Transaction found!');
    console.log(`Block Time: ${new Date(tx.blockTime * 1000).toISOString()}`);
    console.log(`Success: ${!tx.meta.err}`);
    
    if (tx.meta.err) {
      console.log(`Error: ${tx.meta.err}`);
      return;
    }

    // Check token transfers
    console.log('\n🔍 Analyzing token transfers...');
    const preTokenBalances = tx.meta.preTokenBalances || [];
    const postTokenBalances = tx.meta.postTokenBalances || [];

    console.log(`Pre-token balances: ${preTokenBalances.length}`);
    console.log(`Post-token balances: ${postTokenBalances.length}`);

    // Find our token transfers
    const ourTokenTransfers = [];
    
    for (const post of postTokenBalances) {
      if (post.mint === tokenMint) {
        const pre = preTokenBalances.find(p => 
          p.accountIndex === post.accountIndex && 
          p.mint === tokenMint
        );

        const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmount || 0) : 0;
        const postAmount = parseFloat(post.uiTokenAmount.uiAmount || 0);
        const change = postAmount - preAmount;

        if (change > 0 && post.owner) {
          ourTokenTransfers.push({
            owner: post.owner,
            change: change,
            decimals: post.uiTokenAmount.decimals,
            accountIndex: post.accountIndex
          });
        }
      }
    }

    console.log(`\n📊 Token transfers found: ${ourTokenTransfers.length}`);
    ourTokenTransfers.forEach((transfer, i) => {
      console.log(`  ${i + 1}. Owner: ${transfer.owner}`);
      console.log(`     Change: ${transfer.change} tokens`);
      console.log(`     Decimals: ${transfer.decimals}`);
    });

    // Get current token price from DexScreener
    console.log('\n💰 Fetching current token price...');
    try {
      const dexResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`);
      const pairs = dexResponse.data.pairs;
      
      if (pairs && pairs.length > 0) {
        const mainPair = pairs[0];
        const currentPrice = parseFloat(mainPair.priceUsd);
        console.log(`Current price: $${currentPrice}`);
        
        // Calculate USD value for each transfer
        ourTokenTransfers.forEach((transfer, i) => {
          const usdValue = transfer.change * currentPrice;
          console.log(`  Transfer ${i + 1}: ${transfer.change} tokens = $${usdValue.toFixed(2)}`);
        });
      } else {
        console.log('❌ No trading pairs found on DexScreener');
      }
    } catch (error) {
      console.log(`❌ Error fetching price: ${error.message}`);
    }

    // Check if this would qualify for a lotto draw
    console.log('\n🎰 Checking lotto qualification...');
    console.log('This transaction would qualify if:');
    console.log('1. It occurred within the draw time window');
    console.log('2. The USD value meets the minimum requirement');
    console.log('3. The recipient is not a program account');
    console.log('4. The transaction is a valid swap/buy');

    // Check if recipient looks like a user wallet
    ourTokenTransfers.forEach((transfer, i) => {
      const isLikelyUser = !transfer.owner.endsWith('11111111111111111111111111111');
      console.log(`  Transfer ${i + 1}: ${isLikelyUser ? '✅' : '❌'} Looks like user wallet`);
    });

  } catch (error) {
    console.error('❌ Error investigating transaction:', error.message);
  }
}

investigateTransaction();
