const { query } = require('../database/db');

async function addPrizeColumns() {
  try {
    console.log('Adding prize description columns to lotto_draws table...');
    
    // Check if columns exist first
    const checkShort = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='lotto_draws' AND column_name='prize_description_short'
    `);
    
    const checkLong = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='lotto_draws' AND column_name='prize_description_long'
    `);
    
    if (checkShort.rows.length === 0) {
      await query(`
        ALTER TABLE lotto_draws 
        ADD COLUMN prize_description_short TEXT
      `);
      console.log('✅ Added prize_description_short column');
    } else {
      console.log('ℹ️ prize_description_short column already exists');
    }
    
    if (checkLong.rows.length === 0) {
      await query(`
        ALTER TABLE lotto_draws 
        ADD COLUMN prize_description_long TEXT
      `);
      console.log('✅ Added prize_description_long column');
    } else {
      console.log('ℹ️ prize_description_long column already exists');
    }
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding prize columns:', error);
    process.exit(1);
  }
}

addPrizeColumns();



