import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from '../routes/auth.js';
import protectedRoutes from '../routes/index.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { ensureAdminUser } from '../utils/bootstrap.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(serverDir, '../../client/dist');

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Construction Project Expense & Profit Manager' }));
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, protectedRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong' });
});

mongoose
  .connect(env.mongoUri)
  .then(async () => {
    await ensureAdminUser();
    app.listen(env.port, '0.0.0.0', () => console.log(`App running on port ${env.port}`));
  })
  .catch((error) => {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  });
