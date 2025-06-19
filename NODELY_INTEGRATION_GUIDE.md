# How to Use Nodely in PersonaForge - Your 2-Month Subscription Guide

## Overview
You have a **2-month Nodely subscription** (API credit: BOLThieppgjvg512) that provides premium Algorand infrastructure access. Here's how to leverage it in your PersonaForge project.

## Current Implementation
✅ **Basic Integration**: Using Nodely's free tier for wallet transactions
✅ **Enhanced Integration**: Added premium features in `src/lib/api/nodely-enhanced.ts`
✅ **Analytics Dashboard**: New component in `src/components/analytics/EnhancedAnalyticsDashboard.tsx`

## Your Subscription Benefits

### 1. **Performance Boost**
- **6,000 requests/second** (vs 60 free tier)
- **500 requests/second per IP** (vs 60 free tier)
- **99.995% SLA** with reimbursement
- **Unlimited monthly requests**

### 2. **Features Available**
- ✅ **IPFS Gateway**: Store persona content, analytics, media
- ✅ **Archival Data**: Full transaction history analysis
- ✅ **Enhanced Indexer**: Advanced search capabilities
- ✅ **Real-time Monitoring**: Transaction watching
- ✅ **Network Analytics**: Performance metrics

## How to Use in PersonaForge

### 1. **Enhanced User Analytics** 
```typescript
// Get detailed account information
import { getEnhancedAccountInfo } from '@/lib/api/nodely-enhanced';

const analytics = await getEnhancedAccountInfo(walletAddress);
// Returns: balance, transaction count, apps, assets, history
```

### 2. **Service Payment Analytics**
```typescript
// Analyze payment patterns
import { getServicePaymentHistory } from '@/lib/api/nodely-enhanced';

const history = await getServicePaymentHistory(walletAddress);
// Returns: total payments, top services, revenue analytics
```

### 3. **IPFS Storage for Personas**
```typescript
// Store persona metadata permanently
import { uploadToIPFS } from '@/lib/api/nodely-enhanced';

const result = await uploadToIPFS(
  JSON.stringify(personaData), 
  'persona-metadata.json'
);
// Returns: IPFS hash and public URL
```

### 4. **Real-time Transaction Monitoring**
```typescript
// Watch for new transactions
import { watchTransactions } from '@/lib/api/nodely-enhanced';

const stopWatching = await watchTransactions(
  walletAddress, 
  (transaction) => {
    console.log('New payment received:', transaction);
    // Update UI, send notifications, etc.
  }
);
```

### 5. **Network Performance Monitoring**
```typescript
// Monitor Algorand network health
import { getNetworkMetrics } from '@/lib/api/nodely-enhanced';

const metrics = await getNetworkMetrics();
// Returns: TPS, block time, network status
```

## Practical Use Cases in PersonaForge

### 1. **Persona Content Storage on IPFS**
- Store large persona training data
- Backup user preferences and settings
- Store conversation histories
- Create permanent links to persona assets

### 2. **Advanced Revenue Analytics**
- Track which personas generate most revenue
- Analyze payment patterns by time/geography
- Export financial reports to IPFS
- Monitor subscriber retention

### 3. **User Experience Enhancements**
- Real-time payment confirmations
- Detailed transaction history
- Account balance tracking
- Network status indicators

### 4. **Marketplace Insights**
- Track popular service types
- Analyze pricing trends
- Monitor user engagement patterns
- Generate market reports

## Implementation Status

### ✅ **Already Implemented**
1. Enhanced analytics dashboard in Monetize tab
2. IPFS export functionality
3. Payment history analysis
4. Network metrics display

### 🔄 **Easy to Add**
1. **Persona Backup to IPFS**
   ```typescript
   // Add to persona creation flow
   const backupResult = await uploadToIPFS(
     JSON.stringify(persona), 
     `persona-${persona.id}-backup.json`
   );
   ```

2. **Real-time Payment Notifications**
   ```typescript
   // Add to payment processing
   const stopWatcher = await watchTransactions(
     creatorWallet,
     (tx) => {
       if (isServicePayment(tx)) {
         showNotification('Payment received!');
         updateRevenue(tx.amount);
       }
     }
   );
   ```

3. **Advanced Service Analytics**
   ```typescript
   // Add to service management
   const serviceAnalytics = await getServicePaymentHistory(
     creatorWallet, 
     serviceId
   );
   ```

## How to Access Features

### 1. **Via Analytics Dashboard**
- Go to Coruscant → Monetize tab
- Connect your Algorand wallet
- Click "Analytics" button
- View enhanced metrics and export to IPFS

### 2. **Programmatically**
- Import functions from `@/lib/api/nodely-enhanced`
- Use in any component that needs blockchain data
- All functions handle errors gracefully

## API Endpoints Your Subscription Provides

### **Node API** (https://mainnet-api.algonode.cloud)
- Account information
- Transaction submission
- Block data
- Network status

### **Indexer API** (https://mainnet-idx.algonode.cloud)
- Transaction search
- Account history
- Application data
- Asset information

### **IPFS Gateway** (https://ipfs.algonode.xyz)
- File upload/download
- Permanent storage
- Public access URLs

## Rate Limits & Performance

With your subscription:
- **6,000 requests/second** (vs 60 free)
- **500 requests/second per IP**
- **99.995% uptime SLA**
- **Unlimited monthly requests**

## Cost Savings

Your 2-month subscription ($256/month value) provides:
- Equivalent of ~$500 value in other providers
- No need for separate IPFS storage services
- Built-in monitoring and analytics
- 24/7 support access

## Next Steps

1. **Test the Analytics Dashboard**: Go to Monetize tab → Connect wallet → Click Analytics
2. **Try IPFS Export**: Export your analytics data to IPFS
3. **Monitor Real-time**: Implement transaction watching for payments
4. **Backup Personas**: Add IPFS backup for persona data
5. **Enhanced UX**: Use network metrics for status indicators

## Support

Your subscription includes support:
- Telegram: @AlgoNode
- Discord: https://discord.gg/AnH2s9dMkN
- Email: sales@nodely.io

## Monitoring Your Usage

- Dashboard: https://g.nodely.io/d/nodelyapi
- Status: https://algonode.betteruptime.com/
- Logs: https://d.algonode.cloud/
