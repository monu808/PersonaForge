import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import stripeRoutes from './routes/stripe';
import elevenLabsRoutes from './routes/elevenlabs';
import tavusRoutes from './routes/tavus';
import podcastsRoutes from './routes/podcasts';
import supportRoutes from './routes/support';
import { requireAuth } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://personaforge.social'] 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8888'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

// Raw body parser for Stripe webhooks (must be before express.json())
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

// Protected routes
app.use('/api/elevenlabs', requireAuth, elevenLabsRoutes);
app.use('/api/tavus', requireAuth, tavusRoutes);
app.use('/api', podcastsRoutes);

// Public routes (no auth required)
app.use('/api/support', supportRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`PersonaForge API server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});