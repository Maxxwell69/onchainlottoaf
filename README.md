# 🎰 On Chain Lotto

A premium Solana meme coin lotto system with transparent, on-chain draws and comprehensive user management.

![On Chain Lotto](https://img.shields.io/badge/Solana-Lotto-gold?style=for-the-badge&logo=solana)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 🌟 Features

### 🎯 Core Functionality
- **Transparent Lotto Draws**: On-chain verification of all draws
- **Real-time Scanning**: Automatic detection of qualifying token purchases
- **User Management**: Complete admin panel with role-based access
- **Token Support**: Multi-token lotto system with Helius integration
- **Wallet Integration**: Solana wallet address tracking and validation

### 🎨 User Interface
- **Modern Design**: Gold-themed premium interface
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Updates**: Live lotto ball animations
- **Admin Dashboard**: Comprehensive management tools
- **User Registration**: Public registration with admin approval

### 🔧 Technical Features
- **RESTful API**: Complete API for all operations
- **Database Backup**: Automated backup and restore system
- **Production Ready**: SSL, security headers, rate limiting
- **Monitoring**: Health checks and comprehensive logging
- **Scalable**: PM2 cluster mode and load balancer ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Helius API key (for Solana integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/on-chain-lotto.git
   cd on-chain-lotto
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   ```bash
   # Create database
   createdb onchain_lotto
   
   # Run database setup
   node setup-database.js
   ```

4. **Configure environment**
   ```bash
   cp env.production.example .env
   # Edit .env with your configuration
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Home: http://localhost:3000/home.html
   - Admin: http://localhost:3000/index.html
   - Navigation: http://localhost:3000/navigation.html

## 📊 System Overview

### Current Data
- **Active Draws**: 1 (Lotto AF-18)
- **Users**: 2 (Maxx - super_admin, admin)
- **Lotto Entries**: 5 entries across balls 1-5
- **Tokens**: 1 managed token ($af)
- **Scan History**: 314 scan records

### Database Schema
- **lotto_draws**: Draw information and configuration
- **lotto_entries**: Individual lotto ball assignments
- **users**: User accounts and roles
- **managed_tokens**: Supported tokens
- **scan_history**: Transaction scanning logs
- **wallet_blacklist**: Blocked wallet addresses

## 🎮 Usage

### For Users
1. **Register**: Create account at `/register.html`
2. **Wait for Approval**: Admin must approve new accounts
3. **Participate**: Buy qualifying tokens to enter lotto
4. **Track**: View your entries in the draw

### For Admins
1. **Login**: Use admin credentials
2. **Create Draws**: Set up new lotto draws
3. **Manage Users**: Approve/deny registrations
4. **Monitor**: Track all system activity

### Default Admin Access
- **Email**: Maxx@pantherpilot.com
- **Password**: ShogunMaxx1969!

## 🔧 API Endpoints

### Draws
- `GET /api/draws` - List all draws
- `GET /api/draws/active` - Get active draws
- `GET /api/draws/:id` - Get specific draw
- `POST /api/draws` - Create new draw
- `POST /api/draws/:id/scan` - Scan for new entries

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Tokens
- `GET /api/tokens` - List managed tokens
- `POST /api/tokens` - Add new token (admin only)

## 🚀 Production Deployment

### Automated Deployment
```bash
# Run deployment script
sudo ./deploy.sh
```

### Manual Deployment
1. **Prepare Server**: Install Node.js, PostgreSQL, Nginx
2. **Upload Files**: Copy all files to production server
3. **Configure Database**: Create production database
4. **Set Environment**: Configure production environment variables
5. **Restore Data**: Restore from backup file
6. **Start Services**: Start with PM2 and Nginx
7. **SSL Setup**: Configure SSL certificates

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📁 Project Structure

```
on-chain-lotto/
├── public/                 # Frontend files
│   ├── *.html             # Web pages
│   ├── *.js               # Frontend JavaScript
│   ├── *.css              # Stylesheets
│   └── fonts/             # Custom fonts
├── routes/                # API routes
│   ├── auth.js            # Authentication
│   ├── draws.js           # Lotto draws
│   ├── users.js           # User management
│   └── tokens.js          # Token management
├── models/                # Database models
├── services/              # Business logic
├── middleware/            # Express middleware
├── database/              # Database configuration
├── backups/               # Database backups
├── scripts/               # Utility scripts
└── server.js              # Main server file
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt password security
- **CORS Protection**: Configurable cross-origin policies
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📈 Monitoring & Maintenance

### Health Checks
- `GET /health` - Application health status
- Database connection monitoring
- API endpoint availability

### Logging
- Application logs via PM2
- Nginx access/error logs
- Database query logging
- Security event logging

### Backups
- Automated daily backups
- 30-day retention policy
- One-click restore functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `DEPLOYMENT_GUIDE.md` and `PRODUCTION_DEPLOYMENT_STEPS.md`
- **Issues**: Report bugs via GitHub Issues
- **Email**: Maxx@pantherpilot.com

## 🎉 Acknowledgments

- **Solana**: For the amazing blockchain platform
- **Helius**: For Solana RPC and API services
- **PostgreSQL**: For reliable database storage
- **Express.js**: For the robust web framework

---

**Built with ❤️ for the Solana ecosystem**

![Solana](https://img.shields.io/badge/Powered%20by-Solana-purple?style=for-the-badge&logo=solana)