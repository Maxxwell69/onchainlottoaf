/**
 * Script to check user status and verify login credentials
 */

require('dotenv').config();
const { pool } = require('../database/db');
const { comparePassword } = require('../middleware/auth');

async function checkUser() {
    try {
        console.log('🔍 Checking user status...\n');
        
        const username = 'maxx';
        const email = 'maxx@pantherpilot.com';
        
        // Check user by username
        const result = await pool.query(
            'SELECT id, username, email, role, status, password_hash FROM users WHERE username = $1 OR email = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ User not found!');
            process.exit(1);
        }
        
        const user = result.rows[0];
        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password Hash: ${user.password_hash.substring(0, 20)}...`);
        
        // Test password
        const testPassword = 'ShogunMaxx1969!';
        const isValid = await comparePassword(testPassword, user.password_hash);
        console.log(`\n🔐 Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        
        if (user.status !== 'active') {
            console.log(`\n⚠️  WARNING: User status is '${user.status}', not 'active'!`);
            console.log('   This will prevent login.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkUser();

