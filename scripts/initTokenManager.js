const fs = require('fs');
const path = require('path');
const { pool } = require('../database/db');

async function initTokenManager() {
  try {
    console.log('🚀 Initializing Token Manager tables...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../database/tokens_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Token Manager initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - managed_tokens');
    console.log('   - wallet_blacklist');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing Token Manager:', error);
    process.exit(1);
  }
}

initTokenManager();

