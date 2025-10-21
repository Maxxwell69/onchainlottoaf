# ⚡ Quick Start Guide - On Chain Lotto

Get up and running in 5 minutes!

## 🎯 Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/Maxxwell69/onchainlottoaf.git
cd onchainlottoaf

# Install dependencies
npm install
```

## 🎯 Step 2: Configure (1 minute)

Your `.env` file needs these values:

```env
# Your Railway PostgreSQL URL (get from Railway dashboard)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Already configured for you!
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea

# Local settings
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Getting DATABASE_URL:

**Option A: Use Railway (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the `DATABASE_URL` from the PostgreSQL service
4. Paste it in your `.env` file

**Option B: Use Local PostgreSQL**
1. Install PostgreSQL locally
2. Create database: `createdb onchainlotto`
3. Use: `DATABASE_URL=postgresql://localhost:5432/onchainlotto`

## 🎯 Step 3: Initialize Database (1 minute)

```bash
npm run init-db
```

You should see:
```
✅ Database initialized successfully!
📊 Tables created:
   - lotto_draws
   - lotto_entries
   - scan_history
```

## 🎯 Step 4: Start Server (1 minute)

```bash
npm run dev
```

You should see:
```
🚀 On Chain Lotto API Server Starting...
✅ Database connected successfully
🎰 Server running on port 3000
📍 API URL: http://localhost:3000
🔄 Auto-scan enabled: Every 2 minutes
```

## 🎯 Step 5: Create Your First Draw!

1. Open browser: http://localhost:3000
2. Fill out the form:
   - **Draw Name**: "My First BONK Draw"
   - **Token Address**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` (BONK)
   - **Token Symbol**: BONK (or leave empty)
   - **Min USD Amount**: 100
   - **Start Time**: Select current date/time

3. Click "Create Lotto Draw"
4. You'll be taken to the results page!

## 🎮 Using the System

### Scan for Buys
Click **"🔍 Scan for New Buys"** to check blockchain for qualifying purchases.

### Auto-Refresh
The page auto-refreshes every 30 seconds. Manual refresh button also available.

### View Results
- **Numbers Grid**: Shows 1-69, filled numbers are purple
- **Entries Table**: All qualified buyers with transaction links

## 🧪 Testing Tips

### Test with a Popular Token
Use established tokens for testing:
- **BONK**: `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
- **WIF**: `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`
- **MYRO**: `HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4`

### Set Recent Start Time
Use a start time from the last few hours to find existing transactions.

### Lower Minimum for Testing
Start with a low minimum (like $10) to see results faster.

## 📊 What Happens Next?

1. **System scans blockchain** every 2 minutes
2. **Finds qualifying buys** (purchases above minimum USD)
3. **Assigns lotto numbers** (1-69, first-come first-served)
4. **Updates in real-time** on the results page
5. **Draw completes** when all 69 slots are filled

## ❓ Common Questions

**Q: No buys showing up?**
- Check token address is correct
- Verify start time is in the past
- Lower minimum USD amount
- Try a more popular token

**Q: Token price showing $0?**
- Token might not be on Jupiter price feed
- Use a more established meme coin
- Check Helius dashboard for issues

**Q: Database connection failed?**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure network connectivity

## 🚀 Deploy to Production

When ready to go live:

1. Follow [DEPLOYMENT.md](DEPLOYMENT.md) for Railway setup
2. Your app will be live at: `https://your-app.up.railway.app`
3. Share the link with your community!

## 📞 Need Help?

- **GitHub Issues**: [Create issue](https://github.com/Maxxwell69/onchainlottoaf/issues)
- **Helius Config**: See [HELIUS_SETUP.md](HELIUS_SETUP.md)
- **Full README**: See [README.md](README.md)

---

That's it! You're now running On Chain Lotto! 🎰

Have fun and may the odds be ever in your favor! 🍀

