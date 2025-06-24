# Deployment Troubleshooting Guide

## Issues After Deployment

### 1. Console Errors After Deployment

If you see console errors like:
```
/api/deployment-status:1 Failed to load resource: the server responded with a status of 404 ()
POST http://localhost:8888/.netlify/functions/gemini-chat net::ERR_CONNECTION_REFUSED
```

This indicates:
- **Browser cache issues** - Old JavaScript is cached
- **Incomplete migration** - Some endpoints still use `/api/` instead of Netlify Functions

### 2. Immediate Fixes

#### Clear Browser Cache
1. **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. **Clear cache**: Developer Tools → Application → Storage → Clear site data
3. **Incognito/Private browsing**: Test in a fresh browser session

#### Verify Netlify Functions
Check that your Netlify Functions are deployed:
- Visit: `https://your-site.netlify.app/.netlify/functions/gemini-chat`
- Visit: `https://your-site.netlify.app/.netlify/functions/deployment-status`
- Visit: `https://your-site.netlify.app/.netlify/functions/health-check`

### 3. Build and Deploy Process

```bash
# 1. Clean build
npm run build

# 2. Verify no localhost URLs in built files
grep -r "localhost" dist/

# 3. Deploy to Netlify
netlify deploy --prod
```

### 4. Environment Variables

Ensure these are set in Netlify:
```bash
# Server-side only (no VITE_ prefix)
GOOGLE_GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
TAVUS_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

### 5. Pending Migrations

The following endpoints still need to be migrated to Netlify Functions:

#### Stripe Endpoints (`/api/stripe/...`)
- `create-checkout-session`
- `create-subscription`
- `update-subscription`
- `cancel-subscription`
- `create-portal-session`
- `subscription/{id}`
- `customer/{id}`
- `setup-payment-method`
- `payment-methods/{id}`

#### Other API Endpoints (`/api/...`)
- ElevenLabs endpoints (in `src/server/routes/elevenlabs.ts`)
- Tavus endpoints (in `src/server/routes/tavus.ts`)
- Tavus webhook (`/api/tavus-webhook`)

### 6. Current Status

✅ **Completed**:
- Gemini chat (secure Netlify Function)
- Health check endpoint
- Deployment status endpoint
- Environment variable security

⚠️ **Pending**:
- Stripe payment processing
- ElevenLabs voice generation
- Tavus video processing
- Express.js server endpoints

### 7. Quick Debug Commands

```bash
# Check if functions are accessible
curl https://your-site.netlify.app/.netlify/functions/health-check

# Check deployment status
curl https://your-site.netlify.app/.netlify/functions/deployment-status

# Test Gemini chat
curl -X POST https://your-site.netlify.app/.netlify/functions/gemini-chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "chatHistory": []}'
```

### 8. Console Debug Tips

Open Developer Tools and look for:
```javascript
// These should show relative URLs in production
console.log('SecureAIService initialized with baseUrl:', baseUrl);

// These should show successful responses
console.log('🔍 Fetching deployment status from:', url);
console.log('📡 Response status:', response.status);
```

### 9. If Issues Persist

1. **Check Netlify Function logs** in your Netlify dashboard
2. **Verify environment variables** are set correctly
3. **Test functions directly** using the curl commands above
4. **Clear all browser data** and test in incognito mode
5. **Check network tab** in DevTools to see actual requests being made

### 10. Production Deployment Checklist

- [ ] All environment variables set in Netlify (without VITE_ prefix)
- [ ] `npm run build` completes without errors
- [ ] No localhost URLs in `dist/` files
- [ ] Functions respond correctly when tested directly
- [ ] Browser cache cleared after deployment
- [ ] All critical features tested in production
