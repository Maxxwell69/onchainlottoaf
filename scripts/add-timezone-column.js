// Script to add timezone column to lotto_draws table
const { pool } = require('../database/db');
const fs = require('fs');
const path = require('path');

async function addTimezoneColumn() {
    try {
        console.log('🔄 Adding timezone column to lotto_draws table...');
        
        // Read the migration SQL
        const sqlPath = path.join(__dirname, '../database/add_timezone_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the migration
        await pool.query(sql);
        
        console.log('✅ Timezone column added successfully!');
        
        // Verify the column exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'lotto_draws' 
            AND column_name = 'timezone'
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Verified: timezone column exists');
        } else {
            console.warn('⚠️ Warning: Could not verify timezone column');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding timezone column:', error);
        process.exit(1);
    }
}

addTimezoneColumn();



