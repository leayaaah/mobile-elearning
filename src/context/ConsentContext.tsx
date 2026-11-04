import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { deleteMyTrackingData, getMyConsent, setTrackingConsent } from '../services/consentService';
import type { ConsentStatus, TrackingConsent } from '../types/consent';

type Snapshot = { userId: string | null; status: ConsentStatus; updatedAt: string | null };
type ConsentContextValue = {
  status: ConsentStatus;
  updatedAt: string | null;
  busy: boolean;
  error: string | null;
  revision: number;
  reload: () => Promise<void>;
  choose: (granted: boolean) => Promise<void>;
  deleteData: () => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);
const empty: Snapshot = { userId: null, status: 'unset', updatedAt: null };
const message = (error: unknown) => error instanceof Error ? error.message : 'Vui lòng thử lại.';

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<Snapshot>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const busyRef = useRef(false);

  const load = useCallback(async (id: string) => {
    const current = ++generation.current;
    setSnapshot({ userId: id, status: 'loading', updatedAt: null });
    setError(null);
    try {
      const value = await getMyConsent();
      if (generation.current === current) setSnapshot({ userId: id, ...value });
    } catch (cause) {
      if (generation.current === current) {
        setSnapshot({ userId: id, status: 'unset', updatedAt: null });
        setError(`Không thể tải quyền riêng tư: ${message(cause)}`);
      }
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (userId) void load(userId);
    else {
      generation.current += 1;
      setSnapshot(empty);
      setError(null);
      setRevision(0);
    }
  }, [authLoading, userId, load]);

  const reload = useCallback(async () => {
    if (userId) await load(userId);
  }, [userId, load]);

  const mutate = useCallback(async (operation: () => Promise<TrackingConsent | void>) => {
    if (!userId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    const current = generation.current;
    try {
      const result = await operation();
      if (generation.current === current) {
        if (result) setSnapshot({ userId, ...result });
        setRevision((value) => value + 1);
      }
    } catch (cause) {
      if (generation.current === current) setError(`Thao tác quyền riêng tư thất bại: ${message(cause)}`);
      throw cause;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [userId]);

  const choose = useCallback(async (granted: boolean) => {
    await mutate(() => setTrackingConsent(granted));
  }, [mutate]);
  const deleteData = useCallback(async () => {
    await mutate(deleteMyTrackingData);
  }, [mutate]);

  const current = snapshot.userId === userId ? snapshot : { userId, status: 'loading' as const, updatedAt: null };
  return <ConsentContext.Provider value={{
    status: authLoading ? 'loading' : current.status, updatedAt: current.updatedAt,
    busy, error, revision, reload, choose, deleteData,
  }}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) throw new Error('useConsent phải được dùng bên trong <ConsentProvider>');
  return context;
}
