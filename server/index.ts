import express from 'express';
import { calculate } from './calculators';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
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
