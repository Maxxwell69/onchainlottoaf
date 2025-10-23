# On Chain Lotto - Production Deployment Guide

## 🚀 Quick Start

### 1. Backup Current Data
```bash
# Create a backup of your current database
node create-backup.js
```

### 2. Prepare Production Environment
```bash
# Copy production configuration
cp env.production.example .env.production

# Edit production configuration
nano .env.production
```

### 3. Deploy to Production Server
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment script (requires sudo)
sudo ./deploy.sh
```

## 📋 Pre-Deployment Checklist

### Database Configuration
- [ ] Create production PostgreSQL database
- [ ] Update database credentials in `.env.production`
- [ ] Test database connection
- [ ] Run database migrations if needed

### Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Configure database connection strings
- [ ] Set secure JWT secret
- [ ] Configure Helius API key
- [ ] Set CORS origin to your domain
- [ ] Configure SSL certificates path

### Security
- [ ] Generate strong JWT secret
- [ ] Set secure session secret
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Update all default passwords

## 🗄️ Database Setup

### Create Production Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE onchain_lotto_prod;
CREATE USER lotto_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE onchain_lotto_prod TO lotto_user;
```

### Restore Data from Backup
```bash
# Copy backup file to production server
scp backups/backup-*.json user@production-server:/var/www/on-chain-lotto/

# Restore database
node restore-backup.js backups/backup-*.json
```

## 🌐 Web Server Configuration

### Nginx Setup
```bash
# Install nginx
sudo apt update
sudo apt install nginx

# Copy configuration
sudo cp nginx.conf.template /etc/nginx/sites-available/on-chain-lotto
sudo ln -s /etc/nginx/sites-available/on-chain-lotto /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Application Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Systemd Service
```bash
# Start service
sudo systemctl start on-chain-lotto

# Enable auto-start
sudo systemctl enable on-chain-lotto

# Check status
sudo systemctl status on-chain-lotto
```

## 📊 Monitoring & Maintenance

### Log Monitoring
```bash
# View application logs
pm2 logs on-chain-lotto

# View system logs
sudo journalctl -u on-chain-lotto -f
```

### Automated Backups
```bash
# Test backup script
./backup.sh

# Backup runs automatically daily at 2 AM
# Check cron job
crontab -u lotto -l
```

### Health Checks
```bash
# Check application health
curl https://yourdomain.com/health

# Check API endpoints
curl https://yourdomain.com/api/draws
```

## 🔒 Security Configuration

### Firewall Setup
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2Ban Setup
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure for nginx
sudo nano /etc/fail2ban/jail.local
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U lotto_user -d onchain_lotto_prod
```

#### Application Won't Start
```bash
# Check logs
pm2 logs on-chain-lotto

# Check environment variables
pm2 show on-chain-lotto

# Restart application
pm2 restart on-chain-lotto
```

#### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload configuration
sudo systemctl reload nginx
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_lotto_entries_draw_id ON lotto_entries(draw_id);
CREATE INDEX CONCURRENTLY idx_lotto_entries_wallet ON lotto_entries(wallet_address);
CREATE INDEX CONCURRENTLY idx_scan_history_timestamp ON scan_history(created_at);
```

#### Application Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Use PM2 cluster mode
pm2 start ecosystem.config.js --env production -i max
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx/HAProxy)
- Multiple application instances
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching (Redis)
- Use connection pooling

## 🔄 Backup & Recovery

### Automated Backups
- Daily backups at 2 AM
- 30-day retention policy
- Compressed backup files
- Automated cleanup

### Manual Backup
```bash
# Create manual backup
node create-backup.js

# Backup specific table
pg_dump -h localhost -U lotto_user -t lotto_draws onchain_lotto_prod > draws_backup.sql
```

### Recovery Process
```bash
# Restore from backup
node restore-backup.js backups/backup-*.json

# Restore specific table
psql -h localhost -U lotto_user -d onchain_lotto_prod < draws_backup.sql
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Monitor disk space
- [ ] Check log file sizes
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Test backup/restore process
- [ ] Monitor performance metrics

### Emergency Procedures
- [ ] Database recovery process
- [ ] Application rollback procedure
- [ ] SSL certificate renewal
- [ ] Security incident response

---

## 📝 Production Environment Summary

### Current System Status
- **Database**: PostgreSQL with 10 tables
- **Active Draws**: 1 (Lotto AF-18)
- **Users**: 2 (Maxx - super_admin, admin)
- **Lotto Entries**: 5 entries across balls 1-5
- **Tokens**: 1 managed token ($af)
- **Scan History**: 314 scan records

### Backup Created
- **File**: `backups/backup-2025-10-23T21-28-02-298Z.json`
- **Tables**: 10 tables backed up
- **Total Rows**: 324 rows across all tables
- **Size**: Complete system state preserved

### Ready for Production
✅ Database backup created  
✅ Production configuration prepared  
✅ Deployment scripts created  
✅ Security configurations included  
✅ Monitoring setup included  
✅ Backup/restore procedures documented  

The system is now ready for production deployment! 🎉
