import { calculate } from '../../server/calculators';

interface CashFlowRequest {
  method?: string;
  body?: unknown;
}

interface CashFlowResponse {
  status: (code: number) => CashFlowResponse;
  setHeader: (name: string, value: string) => CashFlowResponse;
  json: (body: unknown) => void;
}

export default function handler(request: CashFlowRequest, response: CashFlowResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const input = request.body && typeof request.body === 'object'
      ? request.body as Record<string, unknown>
      : {};
    return response.status(200).json({ result: calculate('cashflow', input) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid cash-flow input';
    return response.status(400).json({ error: message });
  }
}
