// Script to add winner/prize columns to lotto_entries table
require('dotenv').config();
const { query } = require('../database/db');

async function addWinnerPrizeColumns() {
    try {
        console.log('🔄 Adding winner and prize columns to lotto_entries table...');
        
        // Add prize column
        await query(`
            ALTER TABLE lotto_entries 
            ADD COLUMN IF NOT EXISTS prize VARCHAR(500),
            ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT FALSE
        `);
        
        console.log('✅ Added prize and is_winner columns');
        
        // Create indexes
        await query(`
            CREATE INDEX IF NOT EXISTS idx_lotto_entries_is_winner ON lotto_entries(is_winner)
        `);
        
        await query(`
            CREATE INDEX IF NOT EXISTS idx_lotto_entries_prize ON lotto_entries(prize) WHERE prize IS NOT NULL
        `);
        
        console.log('✅ Created indexes for winner queries');
        
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running migration:', error);
        process.exit(1);
    }
}

addWinnerPrizeColumns();
