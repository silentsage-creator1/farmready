import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { calculate } from './server/calculators.ts';
import teamAccessHandler from './api/team/access.ts';
import teamProjectsHandler from './api/team/projects.ts';

const calculatorApi = {
  name: 'farmready-calculator-api',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use(calculatorMiddleware);
  },
  configurePreviewServer(server: import('vite').PreviewServer) {
    server.middlewares.use(calculatorMiddleware);
  },
};

async function calculatorMiddleware(req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: (error?: unknown) => void) {
      if (req.url?.startsWith('/api/team/')) {
        try {
          let raw = '';
          for await (const chunk of req) raw += chunk;
          const parsedUrl = new URL(req.url, 'http://localhost');
          const body = raw ? JSON.parse(raw) : {};
          const query = Object.fromEntries(parsedUrl.searchParams.entries());
          const responseAdapter = {
            status(code: number) { res.statusCode = code; return this; },
            json(payload: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(payload)); },
            setHeader(name: string, value: string) { res.setHeader(name, value); },
            end() { res.end(); },
          };
          const handler = parsedUrl.pathname === '/api/team/projects' ? teamProjectsHandler : teamAccessHandler;
          await handler({ method: req.method, headers: req.headers, query, body }, responseAdapter);
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid team access request.' }));
        }
        return;
      }
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
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.SUPABASE_URL ??= env.VITE_SUPABASE_URL;
  process.env.SUPABASE_PUBLISHABLE_KEY ??= env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_SECRET_KEY ??= env.SUPABASE_SECRET_KEY;
  process.env.APP_URL ??= env.APP_URL;
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
