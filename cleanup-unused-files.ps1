# PowerShell script to remove unused files safely
# Run this in the project root directory

Write-Host "Removing unused backup/alternative component files..." -ForegroundColor Yellow

# Wallet diagnostic backup files
if (Test-Path "src/pages/wallet-diagnostic-simple.tsx") {
    Remove-Item "src/pages/wallet-diagnostic-simple.tsx"
    Write-Host "✓ Removed wallet-diagnostic-simple.tsx" -ForegroundColor Green
}

if (Test-Path "src/pages/wallet-diagnostic-new.tsx") {
    Remove-Item "src/pages/wallet-diagnostic-new.tsx" 
    Write-Host "✓ Removed wallet-diagnostic-new.tsx" -ForegroundColor Green
}

# Pricing page alternatives
if (Test-Path "src/components/subscription/pricing-page-new.tsx") {
    Remove-Item "src/components/subscription/pricing-page-new.tsx"
    Write-Host "✓ Removed pricing-page-new.tsx" -ForegroundColor Green
}

if (Test-Path "src/components/subscription/pricing-page-clean.tsx") {
    Remove-Item "src/components/subscription/pricing-page-clean.tsx"
    Write-Host "✓ Removed pricing-page-clean.tsx" -ForegroundColor Green
}

if (Test-Path "src/components/subscription/new-pricing-page.tsx") {
    Remove-Item "src/components/subscription/new-pricing-page.tsx"
    Write-Host "✓ Removed new-pricing-page.tsx" -ForegroundColor Green
}

# Podcast component backups
if (Test-Path "src/components/podcast/PodcastList_new.tsx") {
    Remove-Item "src/components/podcast/PodcastList_new.tsx"
    Write-Host "✓ Removed PodcastList_new.tsx" -ForegroundColor Green
}

if (Test-Path "src/components/podcast/PodcastList_backup.tsx") {
    Remove-Item "src/components/podcast/PodcastList_backup.tsx"
    Write-Host "✓ Removed PodcastList_backup.tsx" -ForegroundColor Green
}

# Persona component backup
if (Test-Path "src/components/coruscant/PersonaMonetization_new.tsx") {
    Remove-Item "src/components/coruscant/PersonaMonetization_new.tsx"
    Write-Host "✓ Removed PersonaMonetization_new.tsx" -ForegroundColor Green
}

# Page backups
if (Test-Path "src/pages/neurovia-backup.tsx") {
    Remove-Item "src/pages/neurovia-backup.tsx"
    Write-Host "✓ Removed neurovia-backup.tsx" -ForegroundColor Green
}

if (Test-Path "src/pages/stock-replicas.tsx") {
    Remove-Item "src/pages/stock-replicas.tsx"
    Write-Host "✓ Removed stock-replicas.tsx" -ForegroundColor Green
}

# Test/debug files (unused)
if (Test-Path "src/lib/api/elevenlabs-test.ts") {
    Remove-Item "src/lib/api/elevenlabs-test.ts"
    Write-Host "✓ Removed elevenlabs-test.ts" -ForegroundColor Green
}

if (Test-Path "src/lib/test-utils.ts") {
    Remove-Item "src/lib/test-utils.ts"
    Write-Host "✓ Removed test-utils.ts" -ForegroundColor Green
}

if (Test-Path "src/pages/email-debug.tsx") {
    Remove-Item "src/pages/email-debug.tsx"
    Write-Host "✓ Removed email-debug.tsx" -ForegroundColor Green
}

# Temporary SQL files
if (Test-Path "URGENT_FIX.sql") {
    Remove-Item "URGENT_FIX.sql"
    Write-Host "✓ Removed URGENT_FIX.sql" -ForegroundColor Green
}

if (Test-Path "temp_supabase_fix.sql") {
    Remove-Item "temp_supabase_fix.sql"
    Write-Host "✓ Removed temp_supabase_fix.sql" -ForegroundColor Green
}

Write-Host "Cleanup completed! Removed unused backup and alternative files." -ForegroundColor Green
Write-Host "Note: Important files like auth-debug.ts, storage-test.ts, and migration files were preserved." -ForegroundColor Cyan
