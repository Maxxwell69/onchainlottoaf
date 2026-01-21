const { pool } = require('../database/db');

async function runMigration() {
  try {
    console.log('🚀 Running migration: Add token media fields...');
    
    // Add banner_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);
    `);
    console.log('✅ Added banner_url column');
    
    // Add logo_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
    `);
    console.log('✅ Added logo_url column');
    
    // Add website_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);
    `);
    console.log('✅ Added website_url column');
    
    // Add twitter_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
    `);
    console.log('✅ Added twitter_url column');
    
    // Add telegram_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS telegram_url VARCHAR(500);
    `);
    console.log('✅ Added telegram_url column');
    
    // Add discord_url column
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS discord_url VARCHAR(500);
    `);
    console.log('✅ Added discord_url column');
    
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
