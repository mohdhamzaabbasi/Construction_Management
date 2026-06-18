import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, requireFields } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = express.Router();

function sign(user) {
  return jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: '7d' });
}

router.post('/login', asyncHandler(async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const user = await User.findOne({ username: String(req.body.username).toLowerCase() });
  if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Invalid username or password' });
  res.json({ token: sign(user), user: { id: user._id, name: user.name, username: user.username, role: user.role, phone: user.phone } });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

export default router;
