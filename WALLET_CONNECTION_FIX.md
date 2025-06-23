# Wallet Connection Fix Guide

## Problem Summary
Your wallet is showing as connected to multiple email accounts:
- ✅ Connected to: `monu80850raj@gmail.com`
- ❌ Incorrectly connected to: `narendrasinghchouhan2022@vitbhopal.ac.in`
- ❌ Not connected to: `rmonu3605@gmail.com` (if needed)

## Quick Fix Options

### Option 1: Using the Diagnostic Page (Recommended)
1. Navigate to: `http://localhost:5173/debug/wallet`
2. The page will show you the current wallet connections
3. Use the "Remove Wallet" button next to unwanted connections
4. Reconnect your wallet to the correct account(s)

### Option 2: Using SQL in Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the investigation script from `scripts/fix-wallet-connections.sql`
4. Update the wallet connections as needed

### Option 3: Using Browser Console (Advanced)
1. Open your PersonaForge app in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Copy and paste the code from `scripts/wallet-management-tool.js`
5. Update the WALLET_ADDRESS variable with your actual wallet address
6. Run `walletTools.fixAll()`

## Step-by-Step Fix

### Step 1: Identify Your Wallet Address
```javascript
// Run this in console to get your current wallet address
const walletAddress = localStorage.getItem('algorand_wallet');
console.log('Your wallet address:', walletAddress);
```

### Step 2: Remove Wallet from Unwanted Account
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET wallet_address = NULL 
WHERE email = 'narendrasinghchouhan2022@vitbhopal.ac.in';
```

### Step 3: Ensure Wallet is Connected to Correct Account
```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET wallet_address = 'YOUR_ACTUAL_WALLET_ADDRESS' 
WHERE email = 'monu80850raj@gmail.com';
```

### Step 4: Add to Third Account (If Needed)
```sql
-- Run in Supabase SQL Editor (optional)
UPDATE auth.users 
SET wallet_address = 'YOUR_ACTUAL_WALLET_ADDRESS' 
WHERE email = 'rmonu3605@gmail.com';
```

### Step 5: Verify the Fix
```sql
-- Run in Supabase SQL Editor to verify
SELECT 
    email,
    wallet_address,
    raw_user_meta_data->>'wallet_address' as metadata_wallet
FROM auth.users 
WHERE email IN (
    'monu80850raj@gmail.com',
    'narendrasinghchouhan2022@vitbhopal.ac.in', 
    'rmonu3605@gmail.com'
)
ORDER BY email;
```

## Understanding the Issue

The wallet connection issue likely occurred because:
1. **Shared Local Storage**: If you used the same browser for multiple accounts, the wallet connection might have been stored for the wrong user
2. **Session Overlap**: Logging into different accounts without fully logging out
3. **Database Sync Issue**: The wallet address got assigned to multiple users during connection

## Prevention Tips

1. **Clear Browser Data**: Clear localStorage when switching between accounts
2. **Use Incognito/Private Mode**: For testing different user accounts
3. **Full Logout**: Always fully log out before switching accounts
4. **One Wallet Per Account**: Avoid connecting the same wallet to multiple accounts

## Troubleshooting

If the fix doesn't work:
1. Clear your browser cache and localStorage
2. Log out and log back in
3. Reconnect your wallet fresh
4. Check the diagnostic page again

## Files Created for This Fix
- `/debug/wallet` - Diagnostic page
- `scripts/investigate-wallet-connections.sql` - Database investigation
- `scripts/fix-wallet-connections.sql` - SQL fix scripts
- `scripts/wallet-management-tool.js` - JavaScript management tool

## Need Help?
If you're still having issues:
1. Check the browser console for errors
2. Verify your Supabase connection is working
3. Make sure you have the correct wallet address
4. Contact support with the diagnostic information
