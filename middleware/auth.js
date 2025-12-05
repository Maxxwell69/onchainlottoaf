const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('⚠️  WARNING: JWT_SECRET is not set!');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Admin only middleware
const requireAdmin = requireRole(['admin', 'super_admin']);

// Super admin only middleware
const requireSuperAdmin = requireRole(['super_admin']);

// Generate JWT token
const generateToken = (user) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET must be set in environment variables');
    }
    
    // Only reject the exact old default value from code
    if (jwtSecret === 'your-secret-key') {
        throw new Error('JWT_SECRET cannot use the default value. Please set a secure secret in .env');
    }
    
    return jwt.sign(
        { 
            id: user.id, 
            username: user.username,
            role: user.role || 'user'
        },
        jwtSecret,
        { expiresIn: '24h' }
    );
};

// Hash password
const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireSuperAdmin,
    generateToken,
    hashPassword,
    comparePassword
};
