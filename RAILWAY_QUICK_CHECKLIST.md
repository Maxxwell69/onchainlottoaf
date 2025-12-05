# Railway Setup Quick Checklist

## ✅ Environment Variables Status

- [x] **JWT_SECRET** - Set to: `a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8`
- [ ] **HELIUS_API_KEY** - Should be: `f749d6d6-c885-4a88-97a0-6ec0649500ea`
- [ ] **NODE_ENV** - Should be: `production`
- [ ] **FRONTEND_URL** - Should be: `https://onchain.justalotto.com`
- [x] **DATABASE_URL** - Automatically set by Railway (PostgreSQL)

## 🎯 Next Steps

### 1. Verify All Variables Are Set

In Railway → Your Service → Variables tab, make sure you have:

```
JWT_SECRET=a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea
NODE_ENV=production
FRONTEND_URL=https://onchain.justalotto.com
```

### 2. Create Superadmin User

After Railway redeploys, you need to create the superadmin user. You can do this by:

**Option A: Using Railway's CLI/Shell**
1. In Railway dashboard, go to your service
2. Click on "Deployments" → Latest deployment
3. Click "View Logs" or use Railway's shell feature
4. Run: `npm run create-superadmin`

**Option B: Using Railway's One-Click Deploy Script**
If Railway supports running scripts, you can add this to your package.json and run it via Railway's interface.

**Option C: Connect via SSH/Terminal**
If you have SSH access to Railway, connect and run:
```bash
npm run create-superadmin
```

### 3. Test Login

1. Go to: `https://onchain.justalotto.com/login.html`
2. Login with:
   - Username: `maxx` or Email: `maxx@pantherpilot.com`
   - Password: `ShogunMaxx1969!`

## 🔒 Security Note

The JWT_SECRET you're using is the example key. For production, consider generating a unique secret:

```bash
# Generate a new secret (run locally)
openssl rand -base64 32
```

Then update it in Railway Variables. But the current one will work fine for now!

## ✅ Verification

After setting everything up, check Railway logs for:
- ✅ "Database connected successfully"
- ✅ "Server running on port..."
- ✅ No JWT_SECRET errors

If you see login errors, check:
- User exists (run create-superadmin)
- JWT_SECRET is set correctly
- All environment variables are present

