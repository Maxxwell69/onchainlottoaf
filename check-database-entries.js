const { Pool } = require('pg');
require('dotenv').config();

async function checkDatabaseEntries() {
  try {
    console.log('🗄️ Checking database for existing entries...\n');

    // Connect to database
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'onchain_lotto',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    console.log('✅ Connected to database');

    // Check draw #31
    console.log('\n📊 Checking draw #31...');
    const drawResult = await pool.query('SELECT * FROM lotto_draws WHERE id = $1', [31]);
    
    if (drawResult.rows.length === 0) {
      console.log('❌ Draw #31 not found in database');
      return;
    }

    const draw = drawResult.rows[0];
    console.log('✅ Draw #31 found:');
    console.log(`   Token: ${draw.token_symbol} (${draw.token_address})`);
    console.log(`   Status: ${draw.status}`);
    console.log(`   Start Time: ${draw.start_time}`);
    console.log(`   End Time: ${draw.end_time}`);
    console.log(`   Min USD: $${draw.min_usd_amount}`);
    console.log(`   Filled Slots: ${draw.filled_slots}/${draw.total_slots}`);

    // Check entries for this draw
    console.log('\n📝 Checking entries for draw #31...');
    const entriesResult = await pool.query(
      'SELECT * FROM lotto_entries WHERE draw_id = $1 ORDER BY created_at DESC',
      [31]
    );

    console.log(`Found ${entriesResult.rows.length} entries:`);
    
    if (entriesResult.rows.length === 0) {
      console.log('❌ No entries found for draw #31');
      console.log('   This confirms the scanning system is not working properly');
    } else {
      entriesResult.rows.forEach((entry, i) => {
        console.log(`  ${i + 1}. Wallet: ${entry.wallet_address}`);
        console.log(`     Amount: ${entry.token_amount} tokens`);
        console.log(`     USD: $${entry.usd_amount}`);
        console.log(`     Time: ${entry.created_at}`);
        console.log(`     Signature: ${entry.transaction_signature}`);
        console.log('');
      });
    }

    // Check scan history
    console.log('🔍 Checking scan history...');
    const scanResult = await pool.query(
      'SELECT * FROM scan_history WHERE draw_id = $1 ORDER BY created_at DESC LIMIT 5',
      [31]
    );

    console.log(`Found ${scanResult.rows.length} scan records:`);
    scanResult.rows.forEach((scan, i) => {
      console.log(`  ${i + 1}. Time: ${scan.created_at}`);
      console.log(`     New Entries: ${scan.new_entries}`);
      console.log(`     Last Signature: ${scan.last_signature || 'None'}`);
      console.log(`     Status: ${scan.status}`);
      console.log('');
    });

    // Check if the specific transaction exists
    console.log('🎯 Checking for specific transaction...');
    const targetSignature = 'C3cdo5t22dWcgDkj8NDT2eRjtXsRSX27ConQNu7vzmfH';
    const txResult = await pool.query(
      'SELECT * FROM lotto_entries WHERE transaction_signature = $1',
      [targetSignature]
    );

    if (txResult.rows.length > 0) {
      console.log('✅ Transaction found in database!');
      const entry = txResult.rows[0];
      console.log(`   Draw ID: ${entry.draw_id}`);
      console.log(`   Wallet: ${entry.wallet_address}`);
      console.log(`   Amount: ${entry.token_amount} tokens`);
      console.log(`   USD: $${entry.usd_amount}`);
      console.log(`   Time: ${entry.created_at}`);
    } else {
      console.log('❌ Transaction not found in database');
      console.log('   This confirms the transaction was not detected by the scanning system');
    }

    await pool.end();
    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabaseEntries();
