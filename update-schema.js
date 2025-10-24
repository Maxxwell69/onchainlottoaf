const { Pool } = require('pg');
require('dotenv').config();

async function updateLottoEntriesSchema() {
  try {
    console.log('🔧 Updating lotto_entries schema for manual verification...\n');

    // Connect to database
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'onchain_lotto',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    console.log('✅ Connected to database');

    // Add new columns to lotto_entries table
    const alterQueries = [
      // Add notes column
      `ALTER TABLE lotto_entries ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,
      
      // Add verified column
      `ALTER TABLE lotto_entries ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT TRUE`,
      
      // Make transaction_signature nullable for manual entries
      `ALTER TABLE lotto_entries ALTER COLUMN transaction_signature DROP NOT NULL`,
      
      // Remove unique constraint on transaction_signature (since manual entries might not have one)
      `ALTER TABLE lotto_entries DROP CONSTRAINT IF EXISTS lotto_entries_transaction_signature_key`,
      
      // Add unique constraint only for non-null transaction signatures
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_lotto_entries_transaction_signature_unique 
       ON lotto_entries(transaction_signature) 
       WHERE transaction_signature IS NOT NULL`
    ];

    for (const query of alterQueries) {
      try {
        console.log(`Executing: ${query.substring(0, 50)}...`);
        await pool.query(query);
        console.log('✅ Success');
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('⚠️  Skipped (already exists or does not exist)');
        } else {
          console.log(`❌ Error: ${error.message}`);
        }
      }
    }

    // Add method to get entries by wallet and draw
    const addMethodQuery = `
      CREATE OR REPLACE FUNCTION get_lotto_entry_by_wallet_and_draw(
        p_wallet_address VARCHAR(44),
        p_draw_id INTEGER
      )
      RETURNS TABLE(
        id INTEGER,
        draw_id INTEGER,
        lotto_number INTEGER,
        wallet_address VARCHAR(44),
        transaction_signature VARCHAR(88),
        token_amount DECIMAL(20, 8),
        usd_amount DECIMAL(10, 2),
        timestamp TIMESTAMP,
        notes TEXT,
        verified BOOLEAN,
        created_at TIMESTAMP
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          le.id,
          le.draw_id,
          le.lotto_number,
          le.wallet_address,
          le.transaction_signature,
          le.token_amount,
          le.usd_amount,
          le.timestamp,
          le.notes,
          le.verified,
          le.created_at
        FROM lotto_entries le
        WHERE le.wallet_address = p_wallet_address 
          AND le.draw_id = p_draw_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    console.log('\n🔧 Adding helper function...');
    await pool.query(addMethodQuery);
    console.log('✅ Helper function added');

    await pool.end();
    console.log('\n✅ Schema update complete!');
    console.log('\n📋 Changes made:');
    console.log('1. Added "notes" column for manual entry descriptions');
    console.log('2. Added "verified" column (default TRUE for existing entries)');
    console.log('3. Made transaction_signature nullable for manual entries');
    console.log('4. Updated unique constraints to handle nullable signatures');
    console.log('5. Added helper function for wallet+draw lookups');

  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
  }
}

updateLottoEntriesSchema();
