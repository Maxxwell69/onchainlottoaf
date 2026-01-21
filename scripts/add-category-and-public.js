const { pool } = require('../database/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Running migration: Add category and is_public...');
    
    // Add category column to managed_tokens
    await pool.query(`
      ALTER TABLE managed_tokens 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    `);
    console.log('✅ Added category column to managed_tokens');
    
    // Add is_public column to lotto_draws
    await pool.query(`
      ALTER TABLE lotto_draws 
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added is_public column to lotto_draws');
    
    // Update existing tokens to have category based on token_name or token_symbol
    await pool.query(`
      UPDATE managed_tokens 
      SET category = COALESCE(token_name, token_symbol, 'Uncategorized')
      WHERE category IS NULL;
    `);
    console.log('✅ Updated existing tokens with categories');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_managed_tokens_category ON managed_tokens(category);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_lotto_draws_public ON lotto_draws(is_public);
    `);
    console.log('✅ Created indexes');
    
    console.log('✨ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
