const { query } = require('./database/db');

async function emergencyCleanDraw16Again() {
  try {
    console.log('🚨 EMERGENCY: Cleaning ALL entries from draw 16 again...');
    
    // Delete ALL entries from draw 16
    const deleteResult = await query('DELETE FROM lotto_entries WHERE draw_id = 16');
    console.log('Deleted ALL entries from draw 16:', deleteResult.rowCount);
    
    // Reset filled slots to 0
    await query('UPDATE lotto_draws SET filled_slots = 0 WHERE id = 16');
    console.log('Reset filled slots to 0');
    
    // Verify it's clean
    const verifyResult = await query('SELECT COUNT(*) as count FROM lotto_entries WHERE draw_id = 16');
    console.log('Draw 16 now has', verifyResult.rows[0].count, 'entries');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

emergencyCleanDraw16Again();
