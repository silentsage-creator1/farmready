import express from 'express';
import { calculate } from './calculators';
import teamAccessHandler from '../api/team/access';
import teamProjectsHandler from '../api/team/projects';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.all('/api/team/access', (req, res) => {
  void teamAccessHandler({ method: req.method, headers: req.headers, query: Object.fromEntries(Object.entries(req.query).map(([key, value]) => [key, typeof value === 'string' || Array.isArray(value) ? value as string | string[] : undefined])), body: req.body }, res);
});
app.all('/api/team/projects', (req, res) => {
  void teamProjectsHandler({ method: req.method, headers: req.headers, body: req.body }, res);
});
app.post('/api/calculators/:type', (req, res) => {
  try {
    const result = calculate(req.params.type, req.body ?? {});
    res.setHeader('Cache-Control', 'no-store');
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid calculator input' });
  }
});
app.listen(port, '0.0.0.0', () => console.log(`FarmReady calculator API listening on ${port}`));
