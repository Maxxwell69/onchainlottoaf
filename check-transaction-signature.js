const { Connection, PublicKey } = require('@solana/web3.js');

async function checkTransactionSignature() {
  try {
    console.log('🔍 Checking transaction signature validity...\n');

    // The transaction signature from the user
    const transactionSignature = 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH';
    
    console.log(`Transaction: ${transactionSignature}`);
    console.log(`Length: ${transactionSignature.length}`);
    
    // Check if it's a valid base58 string
    try {
      const pubkey = new PublicKey(transactionSignature);
      console.log('✅ Valid base58 signature format');
    } catch (error) {
      console.log('❌ Invalid base58 signature format');
      console.log(`Error: ${error.message}`);
      return;
    }

    // Try different RPC endpoints
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana',
      'https://api.helius.xyz/v0/transactions?api-key=YOUR_API_KEY'
    ];

    for (let i = 0; i < rpcEndpoints.length; i++) {
      const endpoint = rpcEndpoints[i];
      console.log(`\n🔗 Trying RPC endpoint ${i + 1}: ${endpoint.substring(0, 30)}...`);
      
      try {
        const connection = new Connection(endpoint, 'confirmed');
        
        // Try to get the transaction
        const tx = await connection.getParsedTransaction(transactionSignature, {
          maxSupportedTransactionVersion: 0
        });

        if (tx) {
          console.log('✅ Transaction found!');
          console.log(`Block Time: ${new Date(tx.blockTime * 1000).toISOString()}`);
          console.log(`Success: ${!tx.meta.err}`);
          console.log(`Slot: ${tx.slot}`);
          
          if (tx.meta.err) {
            console.log(`Error: ${tx.meta.err}`);
          } else {
            console.log('✅ Transaction was successful');
            
            // Check token transfers
            const preTokenBalances = tx.meta.preTokenBalances || [];
            const postTokenBalances = tx.meta.postTokenBalances || [];
            
            console.log(`Pre-token balances: ${preTokenBalances.length}`);
            console.log(`Post-token balances: ${postTokenBalances.length}`);
            
            // Look for our specific token
            const tokenMint = 'FvNcnFnWtschwYRNP758bg5yqmXBUKdDDcUcbrVvKLHv';
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
                    decimals: post.uiTokenAmount.decimals
                  });
                }
              }
            }
            
            console.log(`\n📊 Token transfers for ${tokenMint}: ${ourTokenTransfers.length}`);
            ourTokenTransfers.forEach((transfer, i) => {
              console.log(`  ${i + 1}. Owner: ${transfer.owner}`);
              console.log(`     Change: ${transfer.change} tokens`);
              console.log(`     Decimals: ${transfer.decimals}`);
            });
          }
          
          return; // Found the transaction, no need to try other endpoints
        } else {
          console.log('❌ Transaction not found');
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
      
      // Wait between requests to avoid rate limiting
      if (i < rpcEndpoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n❌ Transaction not found on any RPC endpoint');
    console.log('Possible issues:');
    console.log('1. Transaction signature might be incorrect');
    console.log('2. Transaction might be from a different network (testnet vs mainnet)');
    console.log('3. Transaction might be too old and pruned');
    console.log('4. Transaction might have failed');

  } catch (error) {
    console.error('❌ Error checking transaction:', error.message);
  }
}

checkTransactionSignature();
