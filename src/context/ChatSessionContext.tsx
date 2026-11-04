import { createContext, useContext, useMemo, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import type { AdvisorReply } from '../types/ai';

export type ChatMessage = { id: number; role: 'user' | 'assistant'; content: string; result?: AdvisorReply };

type ChatSessionValue = {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  pending: boolean;
  setPending: Dispatch<SetStateAction<boolean>>;
  failure: string | null;
  setFailure: Dispatch<SetStateAction<string | null>>;
  retryText: string | null;
  setRetryText: Dispatch<SetStateAction<string | null>>;
  nextIdRef: RefObject<number>;
  sendingRef: RefObject<boolean>;
};

const ChatSessionContext = createContext<ChatSessionValue | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);
  const nextIdRef = useRef(1);
  const sendingRef = useRef(false);

  const value = useMemo(() => ({
    messages, setMessages, draft, setDraft, pending, setPending,
    failure, setFailure, retryText, setRetryText, nextIdRef, sendingRef,
  }), [messages, draft, pending, failure, retryText]);

  return <ChatSessionContext.Provider value={value}>{children}</ChatSessionContext.Provider>;
}

export function useChatSession() {
  const session = useContext(ChatSessionContext);
  if (!session) throw new Error('useChatSession phải được dùng bên trong <ChatSessionProvider>');
  return session;
}
