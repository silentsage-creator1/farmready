import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { calculate } from './server/calculators.ts';

const calculatorApi = {
  name: 'farmready-calculator-api',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const match = req.url?.match(/^\/api\/calculators\/([a-z-]+)$/);
      if (req.method !== 'POST' || !match) return next();
      try {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const input = raw ? JSON.parse(raw) : {};
        const result = calculate(match[1], input);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ result }));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid calculator input' }));
      }
    });
  },
};

export default defineConfig(() => {
  return {
    plugins: [calculatorApi, react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
