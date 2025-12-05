# PowerShell script to create superadmin on Railway
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Superadmin User on Railway" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayCheck = railway --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Railway CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Railway login status..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway. Please run: railway login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in to Railway" -ForegroundColor Green
Write-Host ""

# Link to project (interactive)
Write-Host "Linking to Railway project..." -ForegroundColor Yellow
Write-Host "Please select your onchain lotto project from the list:" -ForegroundColor Yellow
Write-Host ""
railway link
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Create superadmin user
Write-Host "Creating superadmin user in production database..." -ForegroundColor Yellow
Write-Host ""
railway run npm run create-superadmin
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Superadmin user created successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now login with:" -ForegroundColor Cyan
    Write-Host "  Username: maxx" -ForegroundColor White
    Write-Host "  Email: maxx@pantherpilot.com" -ForegroundColor White
    Write-Host "  Password: ShogunMaxx1969!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to create superadmin user" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    exit 1
}

