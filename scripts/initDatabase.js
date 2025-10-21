const fs = require('fs');
const path = require('path');
const { pool } = require('../database/db');

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - lotto_draws');
    console.log('   - lotto_entries');
    console.log('   - scan_history');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();

