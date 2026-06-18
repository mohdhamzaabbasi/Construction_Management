import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDir, '../../.env');
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  throw new Error(`Unable to load environment file at ${envPath}: ${result.error.message}`);
}

const required = ['MONGODB_URI', 'JWT_SECRET', 'PORT', 'CLIENT_ORIGIN'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing required .env variable(s): ${missing.join(', ')}`);
}

export const env = Object.freeze({
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN
});
