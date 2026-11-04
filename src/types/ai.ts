import type { Course } from './index';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };
export type AdvisorReply = { reply: string; courses: Course[]; source: 'ai' | 'fallback' };
export type AdvisorErrorCode = 'INVALID_INPUT' | 'UNAUTHORIZED' | 'RATE_LIMITED' |
  'EMBEDDING_UNAVAILABLE' | 'SERVER_ERROR' | 'NETWORK_ERROR';

export class AdvisorError extends Error {
  constructor(public readonly code: AdvisorErrorCode) {
    super(code);
  }
}
