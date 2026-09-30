import { calculate } from '../../server/calculators';

interface CalculatorRequest {
  method?: string;
  query: { type?: string | string[] };
  body?: unknown;
}

interface CalculatorResponse {
  status: (code: number) => CalculatorResponse;
  setHeader: (name: string, value: string) => CalculatorResponse;
  json: (body: unknown) => void;
}

export default function handler(request: CalculatorRequest, response: CalculatorResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const routeType = Array.isArray(request.query.type) ? request.query.type[0] : request.query.type;
  if (!routeType) {
    return response.status(400).json({ error: 'A calculator type is required.' });
  }

  try {
    const input = request.body && typeof request.body === 'object'
      ? request.body as Record<string, unknown>
      : {};
    return response.status(200).json({ result: calculate(routeType, input) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid calculator input';
    return response.status(400).json({ error: message });
  }
}
