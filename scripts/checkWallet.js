// Check if a wallet is a liquidity pool or contract
require('dotenv').config();
const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');

async function checkWallet(walletAddress) {
  const apiKey = process.env.HELIUS_API_KEY;
  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  const connection = new Connection(rpcUrl, 'confirmed');
  
  console.log(`🔍 Analyzing Wallet: ${walletAddress}\n`);
  
  try {
    const pubkey = new PublicKey(walletAddress);
    
    // 1. Check account info
    console.log('📊 Step 1: Checking account info...');
    const accountInfo = await connection.getAccountInfo(pubkey);
    
    if (accountInfo) {
      console.log(`✅ Account exists`);
      console.log(`   Owner: ${accountInfo.owner.toBase58()}`);
      console.log(`   Lamports: ${accountInfo.lamports / 1e9} SOL`);
      console.log(`   Executable: ${accountInfo.executable}`);
      console.log(`   Data Length: ${accountInfo.data.length} bytes`);
      
      // Check if it's a program/contract
      if (accountInfo.executable) {
        console.log(`\n🚨 VERDICT: This is a PROGRAM/CONTRACT (executable account)`);
        console.log(`   Recommendation: BLACKLIST ✅`);
        return { isPool: true, reason: 'contract', shouldBlacklist: true };
      }
      
      // Check owner program
      const owner = accountInfo.owner.toBase58();
      const knownPrograms = {
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM',
        'EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q': 'Raydium V4',
        'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
        '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin': 'Serum DEX',
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
        'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool'
      };
      
      if (knownPrograms[owner]) {
        console.log(`\n⚠️  Owned by: ${knownPrograms[owner]}`);
        console.log(`   This could be a liquidity pool or DEX-related account`);
      }
    } else {
      console.log(`❌ Account does not exist or is empty`);
    }
    
    // 2. Check token balances
    console.log(`\n📊 Step 2: Checking token balances...`);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      pubkey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    console.log(`   Token accounts: ${tokenAccounts.value.length}`);
    
    if (tokenAccounts.value.length > 10) {
      console.log(`\n⚠️  HIGH token count (${tokenAccounts.value.length}) - Could be a DEX or aggregator`);
    }
    
    // Show first few token balances
    if (tokenAccounts.value.length > 0) {
      console.log(`\n   Top token balances:`);
      for (let i = 0; i < Math.min(5, tokenAccounts.value.length); i++) {
        const account = tokenAccounts.value[i];
        const info = account.account.data.parsed.info;
        console.log(`   ${i+1}. ${info.tokenAmount.uiAmount} tokens (Mint: ${info.mint.substring(0, 8)}...)`);
      }
    }
    
    // 3. Check recent transaction patterns
    console.log(`\n📊 Step 3: Checking transaction patterns...`);
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 50 });
    console.log(`   Recent transactions: ${signatures.length}`);
    
    if (signatures.length >= 50) {
      // Check frequency
      const oldest = signatures[signatures.length - 1];
      const newest = signatures[0];
      const timeSpan = newest.blockTime - oldest.blockTime;
      const txPerHour = (signatures.length / timeSpan) * 3600;
      
      console.log(`   Transaction frequency: ${txPerHour.toFixed(2)} tx/hour`);
      
      if (txPerHour > 10) {
        console.log(`\n⚠️  HIGH transaction frequency - Likely a bot or liquidity pool`);
      }
    }
    
    // 4. Use Helius DAS API to get more info
    console.log(`\n📊 Step 4: Checking with Helius DAS API...`);
    try {
      const response = await axios.post(
        `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
        {
          jsonrpc: '2.0',
          id: 'wallet-check',
          method: 'getAsset',
          params: {
            id: walletAddress
          }
        }
      );
      
      if (response.data.result) {
        console.log(`   Additional info found via DAS`);
      }
    } catch (error) {
      // DAS might not have info for regular wallets
    }
    
    // Final verdict
    console.log(`\n\n═══════════════════════════════════════`);
    console.log(`🎯 ANALYSIS SUMMARY`);
    console.log(`═══════════════════════════════════════`);
    
    let verdict = 'UNKNOWN';
    let shouldBlacklist = false;
    let confidence = 'Low';
    
    if (accountInfo?.executable) {
      verdict = 'CONTRACT/PROGRAM';
      shouldBlacklist = true;
      confidence = 'High';
    } else if (tokenAccounts.value.length > 20) {
      verdict = 'LIKELY LIQUIDITY POOL or DEX';
      shouldBlacklist = true;
      confidence = 'High';
    } else if (tokenAccounts.value.length > 10) {
      verdict = 'POSSIBLY LIQUIDITY POOL';
      shouldBlacklist = true;
      confidence = 'Medium';
    } else if (signatures.length > 0) {
      const oldest = signatures[Math.min(signatures.length - 1, 49)];
      const newest = signatures[0];
      const timeSpan = newest.blockTime - oldest.blockTime;
      const txPerHour = (signatures.length / timeSpan) * 3600;
      
      if (txPerHour > 10) {
        verdict = 'LIKELY BOT (High frequency)';
        shouldBlacklist = true;
        confidence = 'Medium';
      } else {
        verdict = 'REGULAR WALLET';
        shouldBlacklist = false;
        confidence = 'Medium';
      }
    }
    
    console.log(`Verdict: ${verdict}`);
    console.log(`Confidence: ${confidence}`);
    console.log(`Recommendation: ${shouldBlacklist ? '🚫 BLACKLIST' : '✅ Allow'}`);
    console.log(`═══════════════════════════════════════\n`);
    
    return { verdict, shouldBlacklist, confidence };
    
  } catch (error) {
    console.error('❌ Error analyzing wallet:', error.message);
    return { verdict: 'ERROR', shouldBlacklist: false, confidence: 'Unknown' };
  }
}

// Run check
const walletToCheck = process.argv[2] || 'ca3GiMBzi9psdxk6ZDE6Qghbwz5UhPfqGWTo7K9gvJt';
checkWallet(walletToCheck).then(() => process.exit(0));

