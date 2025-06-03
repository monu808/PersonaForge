import express from 'express';
import authRoutes from './routes/auth';
import { requireAuth } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/api', requireAuth);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});