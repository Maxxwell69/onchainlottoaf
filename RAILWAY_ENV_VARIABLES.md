# Railway Environment Variables Setup

## ✅ Required Variables for Railway

In your Railway project, go to **Variables** tab and add these:

### 🔴 CRITICAL - Must Set:

1. **JWT_SECRET** ⚠️ **REQUIRED**
   - **Value**: A strong, random secret (at least 32 characters)
   - **Example**: `a7f3b9c2d4e6f8a1b3c5d7e9f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8`
   - **Why**: Used to sign JWT tokens. If not set, login will fail!
   - **Generate one**: Use `openssl rand -base64 32` or any secure random generator

2. **HELIUS_API_KEY**
   - **Value**: `f749d6d6-c885-4a88-97a0-6ec0649500ea`
   - **Why**: Required for blockchain scanning

3. **NODE_ENV**
   - **Value**: `production`
   - **Why**: Sets production mode

4. **FRONTEND_URL**
   - **Value**: `https://onchain.justalotto.com` (or your Railway domain)
   - **Why**: Used for CORS and redirects

### 🟡 Optional but Recommended:

5. **PORT**
   - **Value**: `3000` (or Railway's default)
   - **Note**: Railway usually sets this automatically

6. **CORS_ORIGIN**
   - **Value**: `https://onchain.justalotto.com` (or your domain)
   - **Why**: Controls which domains can access your API

7. **JWT_EXPIRES_IN**
   - **Value**: `24h`
   - **Default**: Already set in code, but you can override

### 🟢 Automatically Set by Railway:

- **DATABASE_URL** - Railway automatically sets this when you add PostgreSQL
  - You don't need to manually set this!
  - Railway connects your PostgreSQL service to your app automatically

## 📋 Step-by-Step: Setting Variables in Railway

1. **Go to your Railway project dashboard**
   - Visit [railway.app](https://railway.app)
   - Select your project

2. **Click on your service** (the Node.js app, not the database)

3. **Go to "Variables" tab**

4. **Click "New Variable"** for each required variable:

   ```
   Variable Name: JWT_SECRET
   Value: [paste your generated secret]
   ```

   ```
   Variable Name: HELIUS_API_KEY
   Value: f749d6d6-c885-4a88-97a0-6ec0649500ea
   ```

   ```
   Variable Name: NODE_ENV
   Value: production
   ```

   ```
   Variable Name: FRONTEND_URL
   Value: https://onchain.justalotto.com
   ```

5. **Save** - Railway will automatically redeploy with new variables

## ⚠️ Important Notes:

- **JWT_SECRET is CRITICAL** - Without it, login will fail with 500 errors
- **Never commit JWT_SECRET to git** - Only set it in Railway
- **DATABASE_URL is automatic** - Don't manually set it, Railway handles it
- **After setting variables, Railway redeploys automatically**

## 🔍 Verify Variables Are Set:

After deployment, check your Railway logs. You should see:
- ✅ Database connected (DATABASE_URL working)
- ✅ Server running on port (PORT working)
- ❌ If you see JWT errors, JWT_SECRET is missing!

## 🚨 Common Issues:

### Issue: "JWT_SECRET must be set"
**Solution**: Add JWT_SECRET variable in Railway Variables tab

### Issue: "Database connection failed"
**Solution**: Make sure PostgreSQL service is added and connected in Railway

### Issue: "CORS error"
**Solution**: Set FRONTEND_URL and CORS_ORIGIN to match your domain

## 📝 Quick Checklist:

- [ ] JWT_SECRET added (strong random value)
- [ ] HELIUS_API_KEY added
- [ ] NODE_ENV set to `production`
- [ ] FRONTEND_URL set to your domain
- [ ] PostgreSQL service added (DATABASE_URL auto-set)
- [ ] Server redeployed after adding variables

