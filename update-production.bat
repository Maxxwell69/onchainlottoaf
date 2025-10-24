@echo off
REM 🚀 PRODUCTION UPDATE SCRIPT (Windows)
REM This script updates the production site with latest timezone fixes

echo 🚀 Updating production site with latest timezone fixes...

REM 1. Pull latest changes from GitHub
echo 📥 Pulling latest changes from GitHub...
git pull origin main

REM 2. Install any new dependencies
echo 📦 Installing dependencies...
npm install

REM 3. Restart the production server
echo 🔄 Restarting production server...
pm2 restart onchain-lotto

REM 4. Check server status
echo ✅ Checking server status...
pm2 status

echo 🎉 Production update complete!
echo 📊 Latest fixes deployed:
echo    - EDT timezone conversion (UTC-4)
echo    - Manual entry validation
echo    - Timezone display fixes
echo.
echo 🌐 Production site: https://onchain.justalotto.com

pause
