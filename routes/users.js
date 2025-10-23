const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { hashPassword, comparePassword } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT u.id, u.username, u.email, u.role, u.status, u.created_at, u.last_login,
                   creator.username as created_by_username
            FROM users u
            LEFT JOIN users creator ON u.created_by = creator.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            query += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (role) {
            paramCount++;
            query += ` AND u.role = $${paramCount}`;
            params.push(role);
        }

        if (status) {
            paramCount++;
            query += ` AND u.status = $${paramCount}`;
            params.push(status);
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        
        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
        const countParams = [];
        let countParamCount = 0;

        if (search) {
            countParamCount++;
            countQuery += ` AND (username ILIKE $${countParamCount} OR email ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        if (role) {
            countParamCount++;
            countQuery += ` AND role = $${countParamCount}`;
            countParams.push(role);
        }

        if (status) {
            countParamCount++;
            countQuery += ` AND status = $${countParamCount}`;
            countParams.push(status);
        }

        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            users: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.role, u.status, u.created_at, u.last_login,
                   creator.username as created_by_username
            FROM users u
            LEFT JOIN users creator ON u.created_by = creator.id
            WHERE u.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { username, email, password, role = 'user', status = 'active' } = req.body;
        const createdBy = req.user.id;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const result = await pool.query(`
            INSERT INTO users (username, email, password_hash, role, status, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, role, status, created_at
        `, [username, email, passwordHash, role, status, createdBy]);

        // Log activity
        await pool.query(`
            INSERT INTO user_activity_log (user_id, action, description)
            VALUES ($1, 'user_created', $2)
        `, [createdBy, `Created user: ${username}`]);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, status, password } = req.body;
        const updatedBy = req.user.id;

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updates = [];
        const params = [];
        let paramCount = 0;

        if (username) {
            paramCount++;
            updates.push(`username = $${paramCount}`);
            params.push(username);
        }

        if (email) {
            paramCount++;
            updates.push(`email = $${paramCount}`);
            params.push(email);
        }

        if (role) {
            paramCount++;
            updates.push(`role = $${paramCount}`);
            params.push(role);
        }

        if (status) {
            paramCount++;
            updates.push(`status = $${paramCount}`);
            params.push(status);
        }

        if (password) {
            paramCount++;
            const passwordHash = await hashPassword(password);
            updates.push(`password_hash = $${paramCount}`);
            params.push(passwordHash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        paramCount++;
        params.push(id);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, role, status, updated_at`;
        
        const result = await pool.query(query, params);

        // Log activity
        await pool.query(`
            INSERT INTO user_activity_log (user_id, action, description)
            VALUES ($1, 'user_updated', $2)
        `, [updatedBy, `Updated user: ${userResult.rows[0].username}`]);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBy = req.user.id;

        // Check if user exists
        const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const username = userResult.rows[0].username;

        // Prevent deleting super admin
        if (username === 'admin') {
            return res.status(400).json({ error: 'Cannot delete super admin user' });
        }

        // Delete user
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        // Log activity
        await pool.query(`
            INSERT INTO user_activity_log (user_id, action, description)
            VALUES ($1, 'user_deleted', $2)
        `, [deletedBy, `Deleted user: ${username}`]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user activity log
router.get('/:id/activity', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT action, description, created_at, ip_address
            FROM user_activity_log
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        res.json({ activities: result.rows });

    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
