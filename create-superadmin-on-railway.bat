@echo off
echo ========================================
echo Creating Superadmin User on Railway
echo ========================================
echo.
echo This script will:
echo 1. Link to your Railway project (you'll need to select it)
echo 2. Create the superadmin user in production database
echo.
echo Press any key to continue...
pause >nul
echo.
echo Linking to Railway project...
railway link
echo.
echo Creating superadmin user...
railway run npm run create-superadmin
echo.
echo ========================================
echo Done! Check the output above for results.
echo ========================================
pause

