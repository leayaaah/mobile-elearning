import { createClient } from 'npm:@supabase/supabase-js@2';

export const MODEL = 'gemini-embedding-2';
export const DIMENSIONS = 768;
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function defaultSecretKey(): string | null {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, unknown>;
    return typeof keys.default === 'string' ? keys.default : null;
  } catch {
    return null;
  }
}

export function isAdminRequest(req: Request): boolean {
  const key = req.headers.get('apikey');
  return Boolean(key && (key === defaultSecretKey() || key === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')));
}

export function adminClient() {
  const key = defaultSecretKey() ?? env('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(env('SUPABASE_URL'), key);
}

export async function userClient(req: Request) {
  const authorization = req.headers.get('Authorization') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  if (!token || token === authorization) throw new Error('Unauthorized');
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');
  return { client, user: data.user };
}

export function vectorLiteral(values: unknown): string {
  if (!Array.isArray(values) || values.length !== DIMENSIONS || values.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error('Invalid embedding dimension');
  }
  return `[${values.join(',')}]`;
}

export async function embed(text: string): Promise<number[]> {
  const key = env('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          model: `models/${MODEL}`,
          content: { parts: [{ text }] },
          output_dimensionality: DIMENSIONS,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }
        throw new Error(`Gemini embedding failed (${response.status})`);
      }
      const payload = await response.json();
      const values = payload.embeddings?.[0]?.values ?? payload.embedding?.values;
      vectorLiteral(values);
      return values;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Gemini embedding unavailable');
}
