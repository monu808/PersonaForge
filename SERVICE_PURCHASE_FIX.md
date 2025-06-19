# Fix for "Database not available, using demo mode" Error

## The Problem
You're seeing a 400 Bad Request error because the `service_purchases` table is missing the `buyer_id` column. This happens when the database migrations haven't been applied to your remote Supabase instance.

## Quick Fix Options

### Option 1: Manual SQL Migration (Recommended)
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/ueoifolobucposyqafxe
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `MANUAL_MIGRATION.sql` from this project
4. Click **Run** to execute the migration

### Option 2: Fix Supabase CLI Authentication
If you can access your database password:
1. Run `npx supabase db push` 
2. Enter your database password when prompted
3. This will apply all pending migrations

### Option 3: Temporary Workaround (Current State)
The code has been updated to:
- Gracefully handle the missing `buyer_id` column
- Log clear error messages 
- Return empty arrays instead of crashing
- Show "demo mode" message when database is unavailable

## What Was Fixed in Code
1. **Enhanced Error Handling**: The `getUserPurchases` function now tests for the `buyer_id` column and falls back gracefully
2. **Robust Purchase Recording**: The `recordServicePurchase` function tries with `buyer_id` first, then falls back to inserting without it
3. **Better Logging**: Clear console messages explain what's happening

## After Applying the Migration
Once you run the manual migration, your purchases will:
- Be properly linked to user accounts via `buyer_id`
- Show up correctly in the services dashboard
- Have proper RLS (Row Level Security) policies
- Support both wallet-based and user-based queries

## Testing
After applying the migration:
1. Try purchasing a service again
2. The error should disappear
3. Your purchases should show up in the dashboard
4. No more "demo mode" fallbacks

## Files Modified
- `src/lib/api/persona-services.ts` - Enhanced getUserPurchases with fallback logic
- `src/lib/api/algorand.ts` - Enhanced recordServicePurchase with fallback logic  
- `MANUAL_MIGRATION.sql` - SQL to run manually in Supabase dashboard
