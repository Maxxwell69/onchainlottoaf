# 🎰 On Chain Lotto - Complete Setup Instructions

## 📦 What You Just Got

A complete Solana meme coin lottery system that:
- ✅ Monitors blockchain transactions via Helius
- ✅ Automatically assigns lotto numbers (1-69) to buyers
- ✅ Tracks purchases by USD value
- ✅ Beautiful admin panel and results page
- ✅ Auto-scans every 2 minutes
- ✅ Ready to deploy to Railway

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ installed
- PostgreSQL database (Railway recommended)
- Your Helius API key: `f749d6d6-c885-4a88-97a0-6ec0649500ea`

### Installation Steps

1. **Navigate to your project directory:**
```bash
cd "C:\Users\maxxf\OneDrive\Desktop\shogun\On chain Lotto"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create your .env file:**

Create a file named `.env` in the root directory with these contents:

```env
# Database - Get from Railway PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Helius API - Already configured for you!
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea

# Server settings
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**To get DATABASE_URL:**
- Option A: Go to railway.app → Create PostgreSQL → Copy connection string
- Option B: Use local PostgreSQL: `postgresql://localhost:5432/onchainlotto`

4. **Initialize the database:**
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

5. **Test Helius connection (optional but recommended):**
```bash
npm run test-helius
```

6. **Start the server:**
```bash
npm run dev
```

7. **Open your browser:**
```
http://localhost:3000
```

## 🎮 How It Works

### Creating a Draw

1. Open http://localhost:3000
2. Fill out the form:
   - **Draw Name**: Give it a catchy name (e.g., "BONK Moonshot Lotto")
   - **Token Address**: The Solana token mint address you want to track
   - **Token Symbol**: Optional (auto-fetched from blockchain)
   - **Min USD Amount**: Minimum purchase in USD to qualify (e.g., $100)
   - **Start Time**: When to start accepting entries

3. Click "Create Lotto Draw"
4. You'll be redirected to the results page for that draw

### The Results Page

Shows:
- **Draw Information**: Token, status, progress
- **Numbers Grid**: Visual 1-69 grid (purple = assigned, gray = available)
- **Scan Button**: Manually check for new qualifying buys
- **Refresh Button**: Reload the results
- **Entries Table**: All qualified buyers with:
  - Lotto number assigned
  - Wallet address (links to Solscan)
  - Token amount
  - USD value
  - Transaction signature (links to Solscan)
  - Timestamp

### How Scanning Works

**Automatic:**
- Every 2 minutes, the system scans all active draws
- Finds new transactions on the blockchain
- Assigns lotto numbers (first-come, first-served)
- Updates the results page

**Manual:**
- Click "🔍 Scan for New Buys" button
- Immediately checks for new qualifying transactions
- Perfect for testing or when you want instant updates

### Draw Lifecycle

1. **Active** - Accepting entries, scanning for buys
2. **Completed** - All 69 slots filled
3. **Cancelled** - Manually stopped (optional)

## 🌐 Deploying to Production

### Quick Deploy to Railway

1. **Push to GitHub:**
```bash
git add .
git commit -m "On Chain Lotto system ready"
git push origin main
```

2. **Deploy on Railway:**
   - Go to railway.app
   - "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add PostgreSQL database
   - Add environment variables (see DEPLOYMENT.md)
   - Deploy!

3. **Initialize database on Railway:**
```bash
railway run npm run init-db
```

4. **Your app is live!**
```
https://your-app.up.railway.app
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 📚 Documentation

- **[README.md](README.md)** - Full project documentation
- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed Railway deployment
- **[HELIUS_SETUP.md](HELIUS_SETUP.md)** - Helius API configuration

## 🧪 Testing

### Test with Popular Tokens

Use these established tokens for testing:

**BONK** (Recommended for testing):
```
Address: DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
Symbol: BONK
Active trading, good for testing
```

**dogwifhat (WIF)**:
```
Address: EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm
Symbol: WIF
```

**MYRO**:
```
Address: HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4
Symbol: MYRO
```

### Testing Tips

1. **Start with a recent time** - Last 24 hours to find existing transactions
2. **Lower minimum** - Try $10 instead of $100 to see results faster
3. **Use active tokens** - Popular meme coins with regular trading
4. **Check Solscan** - Verify transactions at solscan.io

## 🛠️ Troubleshooting

### "Database connection failed"
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### "No qualifying buys found"
- Verify token address is correct
- Check start time is in the past
- Lower minimum USD amount
- Use a more active token

### "Token price $0"
- Token might not be on Jupiter price feed
- Try a more established token
- Check token exists on Solscan

### API Errors
- Verify Helius API key: `f749d6d6-c885-4a88-97a0-6ec0649500ea`
- Run: `npm run test-helius`
- Check Helius dashboard for usage limits

## 📊 System Architecture

```
┌─────────────────┐
│   Frontend      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Express API   │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────┐
│PostgreSQL│ │  Helius  │
│ Database │ │   API    │
└──────────┘ └────┬─────┘
                  ↓
            ┌──────────┐
            │  Solana  │
            │Blockchain│
            └──────────┘
```

## 🎯 Project Structure

```
on-chain-lotto/
├── database/
│   ├── db.js              # Database connection
│   └── schema.sql         # Database schema
├── models/
│   ├── LottoDraw.js       # Draw model
│   ├── LottoEntry.js      # Entry model
│   └── ScanHistory.js     # Scan history model
├── routes/
│   └── draws.js           # API routes
├── services/
│   ├── heliusService.js   # Helius integration
│   └── scanService.js     # Transaction scanning
├── scripts/
│   ├── initDatabase.js    # Database setup
│   └── testHelius.js      # API testing
├── public/
│   ├── index.html         # Admin panel
│   ├── draw.html          # Results page
│   ├── styles.css         # Styling
│   ├── admin.js           # Admin JS
│   └── draw.js            # Results JS
├── server.js              # Main server
├── package.json           # Dependencies
└── .env                   # Configuration
```

## 🔐 Security Notes

- ✅ Your Helius API key is pre-configured
- ✅ .env file is gitignored (not committed)
- ✅ Use Railway's secret management for production
- ✅ Database credentials are secure
- ⚠️ Never share .env file publicly

## 📞 Support & Resources

### Your Setup
- **GitHub**: https://github.com/Maxxwell69/onchainlottoaf
- **Helius Key**: `f749d6d6-c885-4a88-97a0-6ec0649500ea`

### External Resources
- **Helius Docs**: https://docs.helius.dev
- **Railway Docs**: https://docs.railway.app
- **Solana Docs**: https://docs.solana.com
- **Solscan Explorer**: https://solscan.io

### Community
- **Helius Discord**: https://discord.gg/helius
- **Railway Discord**: https://discord.gg/railway
- **Solana Discord**: https://discord.gg/solana

## ✅ Checklist

Before going live, make sure:

- [ ] Dependencies installed (`npm install`)
- [ ] .env file created with DATABASE_URL
- [ ] Database initialized (`npm run init-db`)
- [ ] Helius connection tested (`npm run test-helius`)
- [ ] Server runs locally (`npm run dev`)
- [ ] Created a test draw
- [ ] Scanned for transactions
- [ ] Verified results display correctly
- [ ] Pushed to GitHub
- [ ] Deployed to Railway
- [ ] Initialized Railway database
- [ ] Tested production deployment

## 🎉 You're Ready!

Your On Chain Lotto system is now complete and ready to use!

**Next Steps:**
1. Create your first draw
2. Scan for qualifying buys
3. Watch the lotto numbers fill up
4. Deploy to production when ready

Have fun and may the best buyers win! 🍀

---

**Questions?** Check the other documentation files or create a GitHub issue.

**Contributions welcome!** PRs appreciated.

Built with 💜 for the Solana meme coin community.

