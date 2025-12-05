# How to Create Superadmin User on Railway

The 401 error means the superadmin user doesn't exist in your production database. Here's how to create it:

## 🚀 Method 1: Using Railway CLI (Recommended)

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Link to Your Project

```bash
railway link
```
Select your project when prompted.

### Step 4: Run the Superadmin Script

```bash
railway run npm run create-superadmin
```

This will create the user:
- Username: `maxx`
- Email: `maxx@pantherpilot.com`
- Password: `ShogunMaxx1969!`
- Role: `super_admin`

## 🚀 Method 2: Using Railway Dashboard Shell

1. Go to your Railway project dashboard
2. Click on your **Node.js service** (not the database)
3. Go to **"Deployments"** tab
4. Click on the latest deployment
5. Look for **"Shell"** or **"Terminal"** option
6. Run:
   ```bash
   npm run create-superadmin
   ```

## 🚀 Method 3: Add to Build Command (One-time)

1. In Railway dashboard → Your service → **Settings** tab
2. Find **"Build Command"** or **"Start Command"**
3. Temporarily change it to:
   ```
   npm install && npm run create-superadmin && npm start
   ```
4. Save and redeploy
5. After deployment succeeds, change it back to just: `npm start`

## 🚀 Method 4: Direct SQL (If you have database access)

If you can access your Railway PostgreSQL directly:

1. Go to Railway → PostgreSQL service → **"Data"** tab
2. Or use Railway CLI: `railway run psql`
3. Run this SQL:

```sql
-- First, check if users table exists
SELECT * FROM users;

-- If table exists, insert the superadmin user
-- (You'll need to hash the password first using bcrypt)
-- Better to use the script: npm run create-superadmin
```

## ✅ Verify User Was Created

After running the script, check Railway logs. You should see:
```
✅ Superadmin user created successfully!
   Username: maxx
   Email: maxx@pantherpilot.com
   Password: ShogunMaxx1969!
   Role: super_admin
```

## 🧪 Test Login

1. Go to: `https://onchain.justalotto.com/login.html`
2. Login with:
   - Username: `maxx` or Email: `maxx@pantherpilot.com`
   - Password: `ShogunMaxx1969!`

## 🔍 Troubleshooting

### If Railway CLI doesn't work:
- Make sure you're logged in: `railway login`
- Make sure you're linked: `railway link`
- Check Railway CLI version: `railway --version`

### If script fails:
- Check Railway logs for error messages
- Verify DATABASE_URL is set (Railway sets this automatically)
- Make sure database tables exist (run `npm run init-db` first if needed)

### If login still fails after creating user:
- Check Railway logs for "Login attempt failed" messages
- Verify JWT_SECRET is set correctly
- Make sure user status is 'active'

