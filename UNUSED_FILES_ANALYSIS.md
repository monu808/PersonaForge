# Unused Files Analysis

## Safe to Delete - Backup/Alternative Component Files
These are backup or alternative versions of components that are not being imported or used:

### 1. Wallet Diagnostic Files (Unused)
- `src/pages/wallet-diagnostic-simple.tsx` - Not imported anywhere
- `src/pages/wallet-diagnostic-new.tsx` - Not imported anywhere

### 2. Pricing Page Alternatives (Unused)
- `src/components/subscription/pricing-page-new.tsx` - Not imported anywhere
- `src/components/subscription/pricing-page-clean.tsx` - Not imported anywhere  
- `src/components/subscription/new-pricing-page.tsx` - Not imported anywhere

### 3. Podcast Component Backups (Unused)
- `src/components/podcast/PodcastList_new.tsx` - Not imported anywhere
- `src/components/podcast/PodcastList_backup.tsx` - Not imported anywhere

### 4. Persona Component Backup (Unused)
- `src/components/coruscant/PersonaMonetization_new.tsx` - Not imported anywhere

### 5. Page Backups (Unused)
- `src/pages/neurovia-backup.tsx` - Not imported anywhere
- `src/pages/stock-replicas.tsx` - Not imported anywhere

### 6. Test/Debug Files (Unused)
- `src/lib/api/elevenlabs-test.ts` - Not imported anywhere
- `src/lib/test-utils.ts` - Not imported anywhere
- `src/pages/email-debug.tsx` - Not imported anywhere

## Potentially Safe to Delete - Temporary Documentation

### Development/Debug Documentation (After setup is complete)
- `WALLET_CONNECTION_FIX.md` - Setup guide, can be removed after implementation
- `VIDEO_UPLOAD_GUIDE.md` - Setup guide  
- `TEST_EMAIL_URL.md` - Testing documentation
- `SERVICE_PURCHASE_FIX.md` - Fix documentation
- `QUICK_FIX_GUIDE.md` - Development notes
- `NODELY_INTEGRATION_GUIDE.md` - Integration guide
- `EMAIL_CONFIRMATION_TEST.md` - Testing documentation
- `DIAGNOSTIC_ANALYSIS.md` - Debug documentation

### Temporary SQL Files
- `URGENT_FIX.sql` - One-time fix script
- `temp_supabase_fix.sql` - Temporary fix script

## DO NOT DELETE - Still Being Used

### Debug Files (Still Referenced)
- `src/lib/auth-debug.ts` - Used in auth-form.tsx
- `src/lib/storage-test.ts` - Used in StorageTester.tsx
- `src/pages/password-reset-test.tsx` - Imported in App.tsx

### Server Directory
- `src/server/*` - Referenced in package.json scripts

### Important Documentation
- `README.md` - Project documentation
- `PASSWORD_RESET_GUIDE.md` - User documentation  
- `GOOGLE_OAUTH_SETUP.md` - Setup documentation
- `EMAIL_SETUP_GUIDE.md` - Setup documentation
- `DATABASE_ERROR_FIX.md` - Important troubleshooting

### Migration Files
- All `supabase/migrations/*.sql` - Database schema history (keep for rollback capability)
