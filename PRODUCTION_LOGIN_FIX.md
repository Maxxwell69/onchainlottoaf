# Production Login Fix Guide

If you're getting 401 errors on production, follow these steps:

## Step 1: Verify User Exists in Production Database

Run this on your production server:

```bash
npm run create-superadmin
```

This will create/update the superadmin user:
- Username: `maxx`
- Email: `maxx@pantherpilot.com`
- Password: `ShogunMaxx1969!`
- Role: `super_admin`

## Step 2: Verify JWT_SECRET is Set

Make sure your production `.env` file has:

```env
JWT_SECRET=your-actual-secret-key-here
```

**IMPORTANT**: Do NOT use the default `your-secret-key` value. Use a strong, random secret.

## Step 3: Check Server Logs

When attempting to login, check your production server logs. You should see:
- `Login attempt failed: User not found for maxx` (if user doesn't exist)
- `Login attempt failed: Invalid password for user maxx` (if password is wrong)
- `✅ Successful login: maxx (super_admin)` (if successful)

## Step 4: Verify Database Connection

Make sure your production `DATABASE_URL` in `.env` is correct and the database is accessible.

## Step 5: Restart Server

After making any changes, restart your production server:

```bash
# If using PM2
pm2 restart onchain-lotto

# Or if running directly
# Stop and restart node server.js
```

## Troubleshooting

### If user doesn't exist:
Run `npm run create-superadmin` on production server

### If password is wrong:
The script will update the password when you run it

### If JWT_SECRET error:
Set a proper JWT_SECRET in production .env file

### If database connection fails:
Check DATABASE_URL in production .env file

