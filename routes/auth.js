const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { generateToken, hashPassword, comparePassword, authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Find user in database (by username or email)
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account is not active. Please contact an administrator.'
            });
        }

        // Check password
        const isValidPassword = await comparePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Generate token
        let token;
        try {
            token = generateToken(user);
        } catch (tokenError) {
            console.error('Token generation error:', tokenError);
            return res.status(500).json({
                error: 'Server configuration error. Please contact administrator.'
            });
        }

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Public registration endpoint - DISABLED (admin-only access)
router.post('/register', async (req, res) => {
    return res.status(403).json({
        error: 'Registration is disabled. Admin access only.'
    });
    try {
        const { username, email, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user with default 'user' role and 'inactive' status (requires admin approval)
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, username, email, role, status',
            [username, email, passwordHash, 'user', 'inactive']
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending admin approval.',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Admin-only registration endpoint (for creating users with specific roles) - SUPERADMIN ONLY
router.post('/admin-register', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { username, email, password, role = 'user', status = 'active' } = req.body;
        const createdBy = req.user.id;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, username, email, role, status',
            [username, email, passwordHash, role, status, createdBy]
        );

        const user = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                error: 'No token provided'
            });
        }

        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const decoded = jwt.verify(token, jwtSecret);

        res.json({
            success: true,
            user: decoded
        });

    } catch (error) {
        res.status(401).json({
            error: 'Invalid token'
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
