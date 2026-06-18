import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const localEnvPath = path.resolve(currentDir, '../../.env');
const renderEnvPath = '/etc/secrets/.env';
const envPath = process.env.RENDER ? renderEnvPath : localEnvPath;
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`Unable to load environment file at ${envPath}: ${result.error.message}`);
}

const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'CLIENT_ORIGIN', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required .env variable(s): ${missing.join(', ')}`);
}

export const env = Object.freeze({
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN,
  adminName: process.env.ADMIN_NAME || 'Admin Manager',
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD
});
