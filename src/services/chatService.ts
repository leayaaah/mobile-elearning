import { supabase } from '../lib/supabase';
import { AdvisorError, type AdvisorErrorCode, type AdvisorReply, type ChatTurn } from '../types/ai';

const codes: AdvisorErrorCode[] = [
  'INVALID_INPUT', 'UNAUTHORIZED', 'RATE_LIMITED', 'EMBEDDING_UNAVAILABLE', 'SERVER_ERROR', 'NETWORK_ERROR',
];

export async function sendAdvisorMessage(message: string, history: ChatTurn[]): Promise<AdvisorReply> {
  const trimmed = message.trim();
  if (!trimmed || message.length > 500) throw new AdvisorError('INVALID_INPUT');
  const started = Date.now();
  const { data, error } = await supabase.functions.invoke<AdvisorReply>('chat-advisor', {
    body: { message: trimmed, history: history.slice(-6) },
  });
  const clientMs = Date.now() - started;
  if (error) {
    let code: AdvisorErrorCode = 'NETWORK_ERROR';
    const response = (error as { context?: unknown }).context;
    if (response instanceof Response) {
      if (response.status === 401) code = 'UNAUTHORIZED';
      else if (response.status === 429) code = 'RATE_LIMITED';
      else if (response.status === 400) code = 'INVALID_INPUT';
      try {
        const body: unknown = await response.json();
        const remote = body && typeof body === 'object' && 'error_code' in body ? body.error_code : null;
        const timings = body && typeof body === 'object' && 'timings' in body ? body.timings : null;
        if (__DEV__ && timings) console.log('[chat-timing]', { clientMs, server: timings, status: response.status });
        if (typeof remote === 'string' && codes.includes(remote as AdvisorErrorCode)) code = remote as AdvisorErrorCode;
      } catch { /* A network or gateway response may have no JSON body. */ }
    }
    throw new AdvisorError(code);
  }
  if (!data || typeof data.reply !== 'string' || !Array.isArray(data.courses) ||
    (data.source !== 'ai' && data.source !== 'fallback')) throw new AdvisorError('SERVER_ERROR');
  if (__DEV__ && data.timings) console.log('[chat-timing]', { clientMs, server: data.timings, source: data.source });
  return data;
}
