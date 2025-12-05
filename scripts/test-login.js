/**
 * Test login endpoint directly
 */

require('dotenv').config();
const { pool } = require('../database/db');
const { comparePassword, generateToken } = require('../middleware/auth');

async function testLogin() {
    try {
        console.log('🧪 Testing login flow...\n');
        
        const username = 'maxx';
        const password = 'ShogunMaxx1969!';
        
        // Step 1: Find user
        console.log('Step 1: Finding user...');
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );
        
        if (result.rows.length === 0) {
            console.log('❌ User not found!');
            process.exit(1);
        }
        
        const user = result.rows[0];
        console.log(`✅ User found: ${user.username} (${user.email})`);
        console.log(`   Role: ${user.role}, Status: ${user.status}`);
        
        // Step 2: Check status
        console.log('\nStep 2: Checking status...');
        const userStatus = user.status?.toString().toLowerCase();
        if (userStatus !== 'active') {
            console.log(`❌ User status is '${userStatus}', not 'active'!`);
            process.exit(1);
        }
        console.log('✅ User is active');
        
        // Step 3: Check password
        console.log('\nStep 3: Checking password...');
        console.log(`   Password hash: ${user.password_hash.substring(0, 30)}...`);
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            console.log('❌ Password is INVALID!');
            console.log('   This is the issue!');
            process.exit(1);
        }
        console.log('✅ Password is valid');
        
        // Step 4: Generate token
        console.log('\nStep 4: Generating token...');
        try {
            const token = generateToken(user);
            console.log('✅ Token generated successfully');
            console.log(`   Token: ${token.substring(0, 50)}...`);
        } catch (tokenError) {
            console.log('❌ Token generation failed:', tokenError.message);
            process.exit(1);
        }
        
        console.log('\n✅ All checks passed! Login should work.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLogin();

