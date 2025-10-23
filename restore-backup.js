const { pool } = require('./database/db');
const fs = require('fs');
const path = require('path');

async function restoreDatabase(backupFile) {
  try {
    console.log('🔄 Starting database restore...');
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📁 Restoring from backup: ${backupFile}`);
    console.log(`📅 Backup timestamp: ${backupData.timestamp}`);
    console.log(`📊 Tables to restore: ${Object.keys(backupData.tables).length}`);
    
    // Get current tables
    const currentTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const currentTables = currentTablesResult.rows.map(row => row.table_name);
    console.log(`📋 Current tables: ${currentTables.join(', ')}`);
    
    // Restore each table
    for (const [tableName, tableData] of Object.entries(backupData.tables)) {
      if (tableData.error) {
        console.log(`⚠️ Skipping ${tableName}: ${tableData.error}`);
        continue;
      }
      
      console.log(`🔄 Restoring table: ${tableName} (${tableData.rowCount} rows)`);
      
      try {
        // Clear existing data
        await pool.query(`DELETE FROM ${tableName}`);
        console.log(`   🗑️ Cleared existing data`);
        
        if (tableData.rowCount === 0) {
          console.log(`   ✅ Table ${tableName} restored (empty)`);
          continue;
        }
        
        // Get column names from first row
        const firstRow = tableData.data[0];
        const columns = Object.keys(firstRow);
        const columnList = columns.join(', ');
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        
        // Insert data
        for (const row of tableData.data) {
          const values = columns.map(col => row[col]);
          await pool.query(
            `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`   ✅ Restored ${tableData.rowCount} rows to ${tableName}`);
        
      } catch (error) {
        console.log(`   ❌ Error restoring ${tableName}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Database restore completed successfully!');
    
    // Verify restore
    console.log('\n🔍 Verifying restore...');
    for (const [tableName, tableData] of Object.entries(backupData.tables)) {
      if (tableData.error) continue;
      
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const currentCount = parseInt(countResult.rows[0].count);
      const expectedCount = tableData.rowCount;
      
      if (currentCount === expectedCount) {
        console.log(`   ✅ ${tableName}: ${currentCount}/${expectedCount} rows`);
      } else {
        console.log(`   ⚠️ ${tableName}: ${currentCount}/${expectedCount} rows (mismatch)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during restore:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Get backup file from command line argument
const backupFile = process.argv[2];

if (!backupFile) {
  console.log('Usage: node restore-backup.js <backup-file>');
  console.log('Example: node restore-backup.js backups/backup-2025-10-23T21-28-02-298Z.json');
  process.exit(1);
}

restoreDatabase(backupFile);
