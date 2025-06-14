# PersonaForge Production Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Supabase project setup
- Stripe account configured
- ElevenLabs API access
- Tavus API access
- Google Gemini API access

## Environment Setup

1. Copy environment variables:
```bash
cp .env.example .env
```

2. Fill in all required environment variables in `.env`:
   - Supabase URL and keys
   - Stripe keys and webhook secret
   - ElevenLabs API key
   - Tavus API key and webhook secret
   - Google Gemini API key
   - JWT secret
   - RevenueCat API key

## Database Setup

1. Run Supabase migrations:
```bash
npm run supabase:migrate
```

2. Set up storage buckets:
```bash
npm run supabase:storage:setup
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development servers:
```bash
# Frontend (Vite)
npm run dev

# Backend (Express)
npm run server:dev
```

## Production Build

1. Build the application:
```bash
npm run build
```

2. Preview production build:
```bash
npm run preview
```

## Production Deployment

### Frontend (Vercel/Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set environment variables in platform dashboard

### Backend (Railway/Heroku/DigitalOcean)
1. Set environment variables
2. Start command: `npm run server:start`
3. Health check endpoint: `/health`

### Supabase Edge Functions
Deploy webhook functions:
```bash
supabase functions deploy tavus-webhook
supabase functions deploy elevenlabs-voices
supabase functions deploy video-status
supabase functions deploy tavus-api
```

## Webhook Configuration

### Stripe Webhooks
Configure webhook endpoint: `https://your-api-domain.com/api/stripe/webhook`
Events to listen for:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

### Tavus Webhooks
Configure webhook endpoint: `https://your-supabase-project.supabase.co/functions/v1/tavus-webhook`
Events to listen for:
- `video.completed`
- `video.failed`
- `replica.created`
- `replica.failed`

## Security Checklist

- [ ] Environment variables secured
- [ ] Database RLS policies enabled
- [ ] API rate limiting configured
- [ ] Webhook signature validation
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] File upload validation
- [ ] Input sanitization
- [ ] Error handling without sensitive data exposure

## Monitoring & Analytics

1. Set up error tracking (Sentry)
2. Configure performance monitoring
3. Set up uptime monitoring
4. Database query performance monitoring
5. API endpoint monitoring

## Backup Strategy

1. Supabase automatic backups
2. Regular database exports
3. Storage bucket backups
4. Configuration backups

## Performance Optimization

1. Enable compression
2. Configure CDN
3. Optimize images
4. Database indexing
5. Caching strategies
6. Bundle optimization

## Scaling Considerations

1. Database connection pooling
2. API rate limiting per user
3. File storage optimization
4. Background job processing
5. Load balancing

## Troubleshooting

### Common Issues

1. **Webhook failures**: Check endpoint URLs and signatures
2. **Payment processing**: Verify Stripe keys and webhook configuration
3. **File uploads**: Check storage permissions and file size limits
4. **API errors**: Verify third-party API keys and rate limits
5. **Database errors**: Check RLS policies and permissions

### Debug Mode
Set `NODE_ENV=development` for detailed error messages.

### Logs
- Application logs: Check server console
- Database logs: Supabase dashboard
- API logs: Third-party service dashboards

## Support & Maintenance

1. Regular dependency updates
2. Security patch management
3. Performance monitoring
4. User feedback collection
5. Feature usage analytics
