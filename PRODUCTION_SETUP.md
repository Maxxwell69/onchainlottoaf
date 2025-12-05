# Production Environment Setup Guide

## Step 1: Create Superadmin User

Run this command on your production server:

```bash
npm run create-superadmin
```

This will create/update the superadmin user with:
- **Username**: `maxx`
- **Email**: `maxx@pantherpilot.com`
- **Password**: `ShogunMaxx1969!`
- **Role**: `super_admin`
- **Status**: `active`

## Step 2: Verify Environment Variables

Make sure your production `.env` file has these required variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@host:port/database

# JWT Configuration (CRITICAL - must be set!)
JWT_SECRET=your-actual-secure-secret-key-here
JWT_EXPIRES_IN=24h

# Helius API Configuration
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea

# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://onchain.justalotto.com

# Security Configuration
CORS_ORIGIN=https://onchain.justalotto.com
SESSION_SECRET=your-session-secret-key
```

**IMPORTANT**: 
- `JWT_SECRET` must be set to a strong, random secret (NOT the default `your-secret-key`)
- `DATABASE_URL` must point to your production database
- `FRONTEND_URL` and `CORS_ORIGIN` should match your production domain

## Step 3: Verify Database Connection

Test the database connection:

```bash
node -e "require('dotenv').config(); const { pool } = require('./database/db'); pool.query('SELECT NOW()').then(() => { console.log('✅ Database connected'); process.exit(0); }).catch(err => { console.error('❌ Database error:', err.message); process.exit(1); });"
```

## Step 4: Verify User Creation

After running the superadmin script, verify the user exists:

```bash
node scripts/check-user.js
```

You should see:
```
✅ User found: maxx (maxx@pantherpilot.com)
   Role: super_admin, Status: active
🔐 Password test: ✅ VALID
```

## Step 5: Restart Production Server

After making changes, restart your server:

```bash
# If using PM2
pm2 restart onchain-lotto

# Or if using systemd
sudo systemctl restart onchain-lotto

# Or if running directly
# Stop the current process and restart with: node server.js
```

## Step 6: Test Login

1. Go to: `https://onchain.justalotto.com/login.html`
2. Login with:
   - Username: `maxx` (or email: `maxx@pantherpilot.com`)
   - Password: `ShogunMaxx1969!`

## Troubleshooting

### If login still fails:

1. **Check server logs** for error messages:
   ```bash
   # PM2 logs
   pm2 logs onchain-lotto
   
   # Or check your server console
   ```

2. **Verify user exists in database**:
   ```bash
   node scripts/check-user.js
   ```

3. **Check JWT_SECRET is set**:
   ```bash
   node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');"
   ```

4. **Test login endpoint directly**:
   ```bash
   node scripts/test-login.js
   ```

### Common Issues:

- **401 Error**: User doesn't exist or password is wrong → Run `npm run create-superadmin`
- **500 Error**: JWT_SECRET not set → Set it in `.env` file
- **Database Error**: DATABASE_URL incorrect → Check connection string
- **CORS Error**: FRONTEND_URL doesn't match domain → Update CORS_ORIGIN

## Quick Production Update Script

If you need to update production quickly:

```bash
# 1. Pull latest code
git pull origin 2.5

# 2. Install dependencies (if needed)
npm install

# 3. Create/update superadmin
npm run create-superadmin

# 4. Restart server
pm2 restart onchain-lotto

# 5. Check logs
pm2 logs onchain-lotto --lines 50
```

