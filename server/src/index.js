import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from '../routes/auth.js';
import protectedRoutes from '../routes/index.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Construction Project Expense & Profit Manager' }));
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, protectedRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong' });
});

mongoose
  .connect(env.mongoUri)
  .then(() => app.listen(env.port, () => console.log(`API running on http://localhost:${env.port}`)))
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  });
