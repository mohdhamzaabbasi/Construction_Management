import User from '../models/User.js';
import { env } from '../config/env.js';

export async function ensureAdminUser() {
  const username = env.adminUsername.toLowerCase().trim();
  const exists = await User.findOne({ username });
  if (exists) return;

  await User.create({
    name: env.adminName,
    username,
    password: env.adminPassword,
    role: 'Manager'
  });
  console.log(`Created initial admin user: ${username}`);
}
