# 🔑 Helius API Configuration

Your Helius API Key: **f749d6d6-c885-4a88-97a0-6ec0649500ea**

## ✅ Configuration Checklist

### Local Development

Add to your `.env` file:
```env
HELIUS_API_KEY=f749d6d6-c885-4a88-97a0-6ec0649500ea
```

### Railway Production

1. Go to Railway project → Your service
2. Click **"Variables"** tab
3. Add variable:
   - Name: `HELIUS_API_KEY`
   - Value: `f749d6d6-c885-4a88-97a0-6ec0649500ea`

## 📊 Helius Dashboard

Access your Helius dashboard:
- URL: https://dashboard.helius.dev
- API Key: `f749d6d6-c885-4a88-97a0-6ec0649500ea`

### Features Being Used

1. **Enhanced Transactions API**
   - Endpoint: `https://api.helius.xyz/v0/addresses/{address}/transactions`
   - Used for: Fetching token purchase transactions

2. **Helius RPC**
   - Endpoint: `https://mainnet.helius-rpc.com/?api-key={API_KEY}`
   - Used for: Blockchain data access

3. **Token Metadata API**
   - Endpoint: `https://api.helius.xyz/v0/token-metadata`
   - Used for: Fetching token symbols automatically

## 🔍 Monitoring Usage

Check your API usage:
1. Go to https://dashboard.helius.dev
2. View "API Usage" section
3. Monitor rate limits and requests

### Rate Limits

Helius Free Tier:
- 100,000 requests/month
- Good for testing and small draws

Helius Pro Tier (if needed):
- Unlimited requests
- Priority support

## 🧪 Testing the Connection

Run this test script to verify Helius is working:

```bash
node -e "
const axios = require('axios');
const API_KEY = 'f749d6d6-c885-4a88-97a0-6ec0649500ea';
axios.get('https://mainnet.helius-rpc.com/?api-key=' + API_KEY, {
  data: {
    jsonrpc: '2.0',
    id: 1,
    method: 'getHealth'
  }
}).then(res => console.log('✅ Helius connection successful!'))
  .catch(err => console.error('❌ Connection failed:', err.message));
"
```

## 🛠️ Troubleshooting

### "Invalid API Key" Error
- Verify key is exactly: `f749d6d6-c885-4a88-97a0-6ec0649500ea`
- Check for extra spaces or line breaks
- Ensure environment variable is loaded

### Rate Limit Errors
- Check usage in Helius dashboard
- Consider upgrading to Pro tier
- Increase scan interval (reduce frequency)

### Transaction Not Found
- Token might be new (not enough history)
- Verify token address is correct
- Check start time is not too far in past

## 📞 Helius Support

- **Documentation**: https://docs.helius.dev
- **Discord**: https://discord.gg/helius
- **Email**: support@helius.dev

## 🔐 Security Notes

- ✅ Already configured for this project
- ⚠️ Keep API key secure
- ⚠️ Don't share in public repositories
- ⚠️ Rotate key if compromised

---

Your Helius integration is ready to use! 🚀

