/**
 * Script to create the superadmin user: ghost_af
 * Password: Twenty2Boo
 * Role: super_admin
 */

require('dotenv').config();
const { pool } = require('../database/db');
const { hashPassword } = require('../middleware/auth');

async function createSuperAdmin() {
    try {
        console.log('🔐 Creating superadmin user...\n');
        
        const username = 'maxx';
        const password = 'ShogunMaxx1969!';
        const email = 'maxx@pantherpilot.com';
        const role = 'super_admin';
        
        // Check if user already exists (by username or email)
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingUser.rows.length > 0) {
            console.log('⚠️  User already exists. Updating password and role...');
            
            // Update existing user (by username or email)
            const passwordHash = await hashPassword(password);
            await pool.query(
                `UPDATE users 
                 SET username = $1, email = $2, password_hash = $3, role = $4, status = 'active', updated_at = NOW()
                 WHERE username = $1 OR email = $2`,
                [username, email, passwordHash, role]
            );
            
            console.log('✅ Superadmin user updated successfully!');
            console.log(`   Username: ${username}`);
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
            console.log(`   Role: ${role}\n`);
        } else {
            // Create new user
            const passwordHash = await hashPassword(password);
            
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, status, created_at)
                 VALUES ($1, $2, $3, $4, 'active', NOW())`,
                [username, email, passwordHash, role]
            );
            
            console.log('✅ Superadmin user created successfully!');
            console.log(`   Username: ${username}`);
            console.log(`   Password: ${password}`);
            console.log(`   Role: ${role}\n`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating superadmin:', error);
        process.exit(1);
    }
}

createSuperAdmin();

