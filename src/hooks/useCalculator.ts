import { useEffect, useState } from 'react';

export type CalculatorResult = Record<string, number | string | boolean | null | undefined>;

export function useCalculator(type: string, input: Record<string, unknown>) {
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payload = JSON.stringify(input);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/calculators/${type}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, signal: controller.signal,
        });
        const responseText = await response.text();
        let data: { result?: CalculatorResult; error?: string };
        try {
          data = JSON.parse(responseText) as { result?: CalculatorResult; error?: string };
        } catch {
          const contentType = response.headers.get('content-type') ?? '';
          const reason = contentType.includes('text/html')
            ? 'The calculator API returned a web page instead of JSON. Restart the FarmReady development server or configure the production API route.'
            : 'The calculator API returned an invalid response. Check that the FarmReady API server is running.';
          throw new Error(reason);
        }
        if (!response.ok) throw new Error(data.error ?? 'Unable to calculate');
        if (!data.result || typeof data.result !== 'object') throw new Error('The calculator API response is missing its result.');
        setResult(data.result);
        setError(null);
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to calculate');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [type, payload]);

  return { result, loading, error };
}
