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
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, credentials: 'same-origin', signal: controller.signal,
        });
        const responseText = await response.text();
        let data: { result?: CalculatorResult; error?: unknown; message?: unknown; protection?: unknown };
        try {
          data = JSON.parse(responseText) as { result?: CalculatorResult; error?: string };
        } catch {
          const contentType = response.headers.get('content-type') ?? '';
          const excerpt = responseText.replace(/\s+/g, ' ').trim().slice(0, 180);
          const reason = contentType.includes('text/html')
            ? `The calculator API returned a web page (HTTP ${response.status}) instead of JSON. Check the deployed API route. ${excerpt}`
            : `The calculator API returned a non-JSON response (HTTP ${response.status}, ${contentType || 'unknown content type'}). ${excerpt || 'The response body was empty.'}`;
          throw new Error(reason);
        }
        if (!response.ok) {
          const errorMessage = typeof data.error === 'string'
            ? data.error
            : typeof data.message === 'string'
              ? data.message
              : undefined;
          const protectedDeployment = response.status === 401 || response.status === 403 || data.protection != null;
          throw new Error(protectedDeployment
            ? 'Vercel Authentication blocked the calculator API request. Open this deployment in an authenticated session or use the public production URL.'
            : errorMessage ?? `Calculator API request failed (HTTP ${response.status}).`);
        }
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
