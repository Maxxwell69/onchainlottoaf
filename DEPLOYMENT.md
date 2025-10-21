# 🚀 Deployment Guide for Railway

This guide will walk you through deploying the On Chain Lotto system to Railway.

## 📋 Prerequisites

1. GitHub account with your repository
2. Railway account (sign up at [railway.app](https://railway.app))
3. Helius API key: `f749d6d6-c885-4a88-97a0-6ec0649500ea`

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to GitHub:
```bash
git add .
git commit -m "Initial commit - On Chain Lotto system"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select repository: `Maxxwell69/onchainlottoaf`

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically provision a database and set `DATABASE_URL`

### Step 4: Configure Environment Variables

1. Click on your service (the Node.js app)
2. Go to **"Variables"** tab
3. Add the following variables:

```env
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea
NODE_ENV=production
PORT=3000
```

**Note**: `DATABASE_URL` is automatically set by Railway when you add PostgreSQL.

For `FRONTEND_URL`, you'll need to get your app's URL first:
1. Go to **"Settings"** tab
2. Under **"Domains"**, click **"Generate Domain"**
3. Copy the generated URL (e.g., `https://onchainlottoaf-production.up.railway.app`)
4. Go back to **"Variables"** and add:
```env
FRONTEND_URL=https://your-generated-url.up.railway.app
```

### Step 5: Deploy the Application

Railway will automatically deploy when you push to GitHub. To manually trigger:

1. Go to **"Deployments"** tab
2. Click **"Deploy"** on the latest commit

### Step 6: Initialize Database

After first deployment, you need to create the database tables:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run database initialization
railway run npm run init-db
```

**Option B: Using Railway Dashboard**
1. Go to your project dashboard
2. Click on your service
3. Go to **"Settings"** → **"Service"**
4. Under **"Build Command"**, temporarily add: `npm install && npm run init-db`
5. Redeploy
6. Remove the init-db command after successful deployment

### Step 7: Verify Deployment

1. Click on your generated domain URL
2. You should see the On Chain Lotto admin panel
3. Test creating a draw to ensure everything works

## 🔧 Configuration Details

### Automatic Deployments

Railway automatically deploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Auto-generated | PostgreSQL connection string |
| `HELIUS_API_KEY` | `f749d6d6-c885-4a88-97a0-6ec0649500ea` | Helius API key for Solana |
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port (Railway will assign if not set) |
| `FRONTEND_URL` | Your Railway URL | For CORS configuration |

### Build Configuration

Railway uses your `package.json` scripts:
- **Build**: `npm install` (automatic)
- **Start**: `npm start`

### Database Migrations

For future database changes, you can run migrations using:
```bash
railway run node scripts/migrate.js
```

## 📊 Monitoring & Logs

### View Logs
1. Go to your service in Railway dashboard
2. Click **"Deployments"** tab
3. Select a deployment to see logs
4. Or use CLI: `railway logs`

### Monitor Database
1. Click on PostgreSQL service
2. Go to **"Data"** tab to view tables
3. Or use CLI: `railway run psql`

### Check Health
Visit: `https://your-app.up.railway.app/health`

## 🔄 Updating the Application

1. Make changes locally
2. Commit and push:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
3. Railway automatically deploys the update

## 🐛 Troubleshooting

### Deployment Fails

**Check build logs:**
1. Go to **"Deployments"** → Click failed deployment
2. Review logs for errors

**Common issues:**
- Missing dependencies: Add to `package.json`
- Database connection: Verify `DATABASE_URL` exists
- Port conflicts: Railway assigns port automatically

### Database Connection Issues

1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` variable exists
3. Ensure database is initialized (run `npm run init-db`)

### Application Not Responding

1. Check if service is running in Railway dashboard
2. View logs for errors
3. Verify all environment variables are set
4. Check domain is correctly generated

### Helius API Issues

1. Verify API key is correct: `f749d6d6-c885-4a88-97a0-6ec0649500ea`
2. Check Helius dashboard for rate limits
3. Review scan logs for errors

## 💰 Cost Considerations

Railway offers:
- **Free Tier**: $5 free credit per month
- **Pro Plan**: $20/month for team features

Expected usage:
- **Database**: ~$5-10/month for small usage
- **App Instance**: ~$5-10/month
- **Total**: Can run on free tier for testing

## 🔐 Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   
2. **Use Railway's secret management**
   - All variables set through dashboard are encrypted

3. **Rotate API keys regularly**
   - Update Helius key in Railway variables

4. **Monitor access logs**
   - Check Railway logs for suspicious activity

## 📱 Custom Domain (Optional)

1. Go to your service settings
2. Under **"Domains"**, click **"Custom Domain"**
3. Add your domain (e.g., `lotto.yourdomain.com`)
4. Update DNS records as shown
5. Update `FRONTEND_URL` variable with new domain

## 🔄 Backup & Recovery

### Database Backups

Railway Pro includes automatic backups. To manually backup:

```bash
# Export database
railway run pg_dump > backup.sql

# Restore database
railway run psql < backup.sql
```

### Code Backups

Your code is backed up in GitHub. To restore:
```bash
git checkout <commit-hash>
git push -f origin main
```

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Helius Support**: [docs.helius.dev](https://docs.helius.dev)

---

🎉 **Congratulations!** Your On Chain Lotto system is now live on Railway!

