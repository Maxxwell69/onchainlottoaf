const { query } = require('./database/db');

async function checkCurrentStatus() {
  try {
    console.log('🔍 Checking current status of draw 16...');
    
    const poolWallet = 'HLnpSz9h2S4hiLQ43rnSD9XkcUThA7B8hQMKmDaiTLcC';
    
    // Check for blacklisted entries
    const blacklistedResult = await query(`
      SELECT COUNT(*) as count 
      FROM lotto_entries 
      WHERE draw_id = 16 AND wallet_address = $1
    `, [poolWallet]);
    
    console.log('Blacklisted entries in draw 16:', blacklistedResult.rows[0].count);
    
    // Check total entries
    const totalResult = await query('SELECT COUNT(*) as count FROM lotto_entries WHERE draw_id = 16');
    console.log('Total entries in draw 16:', totalResult.rows[0].count);
    
    // Check chronological order by looking at timestamps
    const orderResult = await query(`
      SELECT lotto_number, wallet_address, usd_amount, created_at
      FROM lotto_entries 
      WHERE draw_id = 16 
      ORDER BY lotto_number
      LIMIT 15
    `);
    
    console.log('First 15 entries (checking chronological order):');
    orderResult.rows.forEach(entry => {
      console.log(`Lotto #${entry.lotto_number}: ${entry.wallet_address.substring(0, 8)}... | $${entry.usd_amount} | ${entry.created_at}`);
    });
    
    // Check if there are any blacklisted entries
    if (blacklistedResult.rows[0].count > 0) {
      const blacklistedEntries = await query(`
        SELECT lotto_number, wallet_address, usd_amount, created_at
        FROM lotto_entries 
        WHERE draw_id = 16 AND wallet_address = $1
        ORDER BY lotto_number
        LIMIT 10
      `, [poolWallet]);
      
      console.log('\n🚨 BLACKLISTED ENTRIES FOUND:');
      blacklistedEntries.rows.forEach(entry => {
        console.log(`Lotto #${entry.lotto_number}: ${entry.wallet_address.substring(0, 8)}... | $${entry.usd_amount} | ${entry.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

checkCurrentStatus();
