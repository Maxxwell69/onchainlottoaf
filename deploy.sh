#!/bin/bash

# On Chain Lotto - Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting On Chain Lotto Production Deployment..."

# Configuration
APP_NAME="on-chain-lotto"
APP_DIR="/var/www/on-chain-lotto"
BACKUP_DIR="/var/backups/on-chain-lotto"
LOG_DIR="/var/log/on-chain-lotto"
SERVICE_USER="lotto"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p $APP_DIR
mkdir -p $BACKUP_DIR
mkdir -p $LOG_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/backups

# Create service user if it doesn't exist
if ! id "$SERVICE_USER" &>/dev/null; then
    print_status "Creating service user: $SERVICE_USER"
    useradd -r -s /bin/false -d $APP_DIR $SERVICE_USER
fi

# Set permissions
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $BACKUP_DIR
chown -R $SERVICE_USER:$SERVICE_USER $LOG_DIR

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Install PostgreSQL client if not present
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL client..."
    apt-get update
    apt-get install -y postgresql-client
fi

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Install dependencies
print_status "Installing dependencies..."
npm install --production

# Create systemd service file
print_status "Creating systemd service..."
cat > /etc/systemd/system/on-chain-lotto.service << EOF
[Unit]
Description=On Chain Lotto API Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server-production.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env.production

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=on-chain-lotto

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR $LOG_DIR $BACKUP_DIR

[Install]
WantedBy=multi-user.target
EOF

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'on-chain-lotto',
    script: 'server-production.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: '$LOG_DIR/error.log',
    out_file: '$LOG_DIR/out.log',
    log_file: '$LOG_DIR/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create backup script
print_status "Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash
# Automated backup script for On Chain Lotto

BACKUP_DIR="/var/backups/on-chain-lotto"
APP_DIR="/var/www/on-chain-lotto"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup
cd $APP_DIR
node create-backup.js

# Move backup to backup directory
mv backups/* $BACKUP_DIR/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup-*.json" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x $APP_DIR/backup.sh

# Create log rotation configuration
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/on-chain-lotto << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        systemctl reload on-chain-lotto
    endscript
}
EOF

# Setup cron job for backups
print_status "Setting up automated backups..."
(crontab -u $SERVICE_USER -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -u $SERVICE_USER -

# Create nginx configuration template
print_status "Creating nginx configuration template..."
cat > $APP_DIR/nginx.conf.template << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (update with your certificates)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Create deployment checklist
print_status "Creating deployment checklist..."
cat > $APP_DIR/DEPLOYMENT_CHECKLIST.md << EOF
# On Chain Lotto - Production Deployment Checklist

## Pre-Deployment
- [ ] Update .env.production with production values
- [ ] Configure database connection
- [ ] Set up SSL certificates
- [ ] Configure domain name in nginx.conf.template
- [ ] Update Helius API key
- [ ] Set secure JWT secret

## Database Setup
- [ ] Create production database
- [ ] Run database migrations
- [ ] Restore data from backup if needed
- [ ] Test database connection

## Server Configuration
- [ ] Install nginx
- [ ] Copy nginx configuration
- [ ] Start and enable nginx
- [ ] Configure firewall (ports 80, 443)
- [ ] Set up SSL certificates

## Application Deployment
- [ ] Copy application files
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Start application service
- [ ] Test all endpoints

## Monitoring & Maintenance
- [ ] Set up log monitoring
- [ ] Configure backup automation
- [ ] Set up health checks
- [ ] Configure alerts
- [ ] Test backup/restore process

## Security
- [ ] Update all passwords
- [ ] Configure firewall rules
- [ ] Set up fail2ban
- [ ] Enable automatic security updates
- [ ] Review file permissions

## Post-Deployment Testing
- [ ] Test all API endpoints
- [ ] Test user registration/login
- [ ] Test lotto draw creation
- [ ] Test token management
- [ ] Test backup system
EOF

print_status "Deployment preparation completed!"
print_warning "Please review and complete the deployment checklist before going live."
print_status "Next steps:"
echo "1. Update .env.production with your production values"
echo "2. Configure your database"
echo "3. Set up nginx and SSL"
echo "4. Start the service: systemctl start on-chain-lotto"
echo "5. Enable auto-start: systemctl enable on-chain-lotto"

print_status "Deployment script completed successfully! 🎉"
