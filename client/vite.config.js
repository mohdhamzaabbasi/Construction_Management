import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(clientDir, '..');

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, rootDir, '');

  return {
    envDir: rootDir,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: rootEnv.API_PROXY_TARGET,
          changeOrigin: true
        }
      }
    }
  };
});
