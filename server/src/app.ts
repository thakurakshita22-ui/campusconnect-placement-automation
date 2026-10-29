import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';

export const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// 404 Catch-all for API
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});
