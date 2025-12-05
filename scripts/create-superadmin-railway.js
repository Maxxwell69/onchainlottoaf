/**
 * Railway-friendly superadmin creation script
 * Run this directly on Railway to create the superadmin user
 */

require('dotenv').config();
const { pool } = require('../database/db');
const { hashPassword } = require('../middleware/auth');

async function createSuperAdmin() {
    try {
        console.log('🔐 Creating superadmin user for Railway...\n');
        console.log('📊 Checking database connection...');
        
        // Test database connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connected\n');
        
        const username = 'maxx';
        const password = 'ShogunMaxx1969!';
        const email = 'maxx@pantherpilot.com';
        const role = 'super_admin';
        
        console.log('🔍 Checking if user exists...');
        // Check if user already exists (by username or email)
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (existingUser.rows.length > 0) {
            console.log('⚠️  User already exists. Updating password and role...');
            console.log(`   Current user: ${existingUser.rows[0].username} (${existingUser.rows[0].email})`);
            console.log(`   Current role: ${existingUser.rows[0].role}`);
            console.log(`   Current status: ${existingUser.rows[0].status}\n`);
            
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
            console.log(`   Role: ${role}`);
            console.log(`   Status: active\n`);
        } else {
            console.log('📝 Creating new superadmin user...\n');
            // Create new user
            const passwordHash = await hashPassword(password);
            
            await pool.query(
                `INSERT INTO users (username, email, password_hash, role, status, created_at)
                 VALUES ($1, $2, $3, $4, 'active', NOW())`,
                [username, email, passwordHash, role]
            );
            
            console.log('✅ Superadmin user created successfully!');
            console.log(`   Username: ${username}`);
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
            console.log(`   Role: ${role}`);
            console.log(`   Status: active\n`);
        }
        
        // Verify the user was created/updated
        console.log('🔍 Verifying user...');
        const verifyUser = await pool.query(
            'SELECT id, username, email, role, status FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        
        if (verifyUser.rows.length > 0) {
            const user = verifyUser.rows[0];
            console.log('✅ User verified:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Status: ${user.status}\n`);
        }
        
        console.log('🎉 Setup complete! You can now login with:');
        console.log(`   Username: ${username} or Email: ${email}`);
        console.log(`   Password: ${password}\n`);
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating superadmin:', error);
        console.error('Stack:', error.stack);
        await pool.end();
        process.exit(1);
    }
}

createSuperAdmin();

