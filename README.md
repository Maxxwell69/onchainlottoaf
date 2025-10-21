# 🎰 On Chain Lotto Draw

A Solana-based lottery system for meme coins that automatically assigns lotto numbers (1-69) to buyers who purchase a minimum USD amount of tokens. Built with Node.js, PostgreSQL, and Helius API.

## 🌟 Features

- **Automated Draw Management** - Create lottery draws with custom parameters
- **Real-time Transaction Monitoring** - Scans Solana blockchain via Helius API
- **First-Come, First-Served** - Automatic number assignment (1-69)
- **USD-Based Qualification** - Set minimum purchase amounts in USD
- **Live Results Dashboard** - Real-time updates with refresh functionality
- **Auto-Scanning** - Scheduled checks every 2 minutes for new qualifying buys
- **Beautiful UI** - Modern, responsive interface with Solana-inspired design

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (Railway recommended)
- Helius API key ([Get one here](https://helius.dev))

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Maxxwell69/onchainlottoaf.git
cd onchainlottoaf
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration (Railway PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Helius API Configuration
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Initialize Database

```bash
npm run init-db
```

This will create the necessary tables:
- `lotto_draws` - Stores lottery draw information
- `lotto_entries` - Stores qualified buyer entries
- `scan_history` - Tracks scan operations

### 5. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 🎮 How to Use

### Creating a Lotto Draw

1. Open `http://localhost:3000` in your browser
2. Fill out the "Create New Lotto Draw" form:
   - **Draw Name**: Custom name for your draw (e.g., "BONK Mega Draw #1")
   - **Token Address**: Solana token mint address to monitor
   - **Token Symbol**: Optional (auto-fetched if left empty)
   - **Minimum USD Amount**: Minimum purchase to qualify
   - **Start Date & Time**: When the draw begins accepting entries

3. Click "Create Lotto Draw"
4. You'll be redirected to the draw results page

### Viewing Draw Results

1. Click "View Draw" on any active draw
2. See the live grid of numbers 1-69 (filled = assigned, gray = available)
3. View all qualified entries with:
   - Lotto number assigned
   - Wallet address (clickable to Solscan)
   - Token amount purchased
   - USD value
   - Transaction signature (clickable to Solscan)
   - Timestamp

### Scanning for New Buys

**Manual Scan:**
- Click "🔍 Scan for New Buys" on the draw page
- System checks blockchain for qualifying transactions
- New entries are automatically assigned the next available lotto number

**Automatic Scan:**
- Runs every 2 minutes for all active draws
- No manual intervention needed

## 📡 API Endpoints

### Draws

- `POST /api/draws` - Create a new draw
- `GET /api/draws` - Get all draws
- `GET /api/draws/active` - Get active draws
- `GET /api/draws/:id` - Get specific draw with entries
- `POST /api/draws/:id/scan` - Manually trigger scan
- `GET /api/draws/:id/entries` - Get entries for a draw
- `PUT /api/draws/:id/status` - Update draw status

### Health

- `GET /health` - Check API health

## 🚂 Deploying to Railway

### Option 1: Deploy from GitHub

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add PostgreSQL database:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will auto-generate `DATABASE_URL`

5. Add environment variables:
   ```
   HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-app.up.railway.app
   ```

6. Deploy and initialize database:
   ```bash
   railway run npm run init-db
   ```

### Option 2: Deploy with Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add

# Set environment variables
railway variables set HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea

# Deploy
railway up
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Blockchain**: Solana (via Helius API)
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Styling**: Custom CSS with Solana gradient theme

## 📊 Database Schema

### lotto_draws
- Draw configuration and metadata
- Status tracking (active, completed, cancelled)
- Slot filling progress (0-69)

### lotto_entries
- Qualified buyer entries
- First-come, first-served number assignment
- Transaction details and USD values

### scan_history
- Audit trail of blockchain scans
- Last processed transaction tracking

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use Railway's secret management for production
- Helius API key should be kept secure
- Database credentials should use Railway's auto-generated values

## 🐛 Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify network connectivity to Railway

### "Could not fetch token price"
- Token might not be listed on Jupiter
- Check token address is correct
- Ensure Helius API key is valid

### "No qualifying buys found"
- Verify token address is correct
- Check start time is in the past
- Ensure minimum USD amount is reasonable
- Verify Helius API is working

## 📝 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/Maxxwell69/onchainlottoaf/issues)
- Helius Docs: [helius.dev/docs](https://docs.helius.dev)
- Solana Docs: [docs.solana.com](https://docs.solana.com)

---

Built with 💜 for the Solana ecosystem

