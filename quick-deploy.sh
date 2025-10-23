#!/bin/bash

# Quick Production Deployment Script
# Run this on your production server after uploading files

echo "🚀 Starting On Chain Lotto Production Deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Install required packages
echo "📦 Installing required packages..."
apt update
apt install -y nodejs npm postgresql-client nginx certbot python3-certbot-nginx

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Create application directory
echo "📁 Setting up directories..."
mkdir -p /var/www/on-chain-lotto
cd /var/www/on-chain-lotto

# Set up database
echo "🗄️ Setting up database..."
sudo -u postgres createdb onchain_lotto_prod 2>/dev/null || echo "Database already exists"
sudo -u postgres createuser lotto_user 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "ALTER USER lotto_user PASSWORD 'secure_password123';" 2>/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE onchain_lotto_prod TO lotto_user;" 2>/dev/null

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Set up environment
echo "⚙️ Setting up environment..."
if [ ! -f .env.production ]; then
    cp env.production.example .env.production
    echo "📝 Please edit .env.production with your production values"
fi

# Set up nginx
echo "🌐 Setting up nginx..."
cp nginx.conf.template /etc/nginx/sites-available/on-chain-lotto
ln -sf /etc/nginx/sites-available/on-chain-lotto /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Set up firewall
echo "🔥 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Start services
echo "🚀 Starting services..."
systemctl restart nginx
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.production with your production values"
echo "2. Restore database: node restore-backup.js backups/backup-*.json"
echo "3. Configure your domain in nginx configuration"
echo "4. Get SSL certificate: certbot --nginx -d yourdomain.com"
echo "5. Test your deployment: curl https://yourdomain.com/health"
echo ""
echo "🎉 Your On Chain Lotto system is ready for production!"
