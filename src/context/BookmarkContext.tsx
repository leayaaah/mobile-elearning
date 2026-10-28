import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { addBookmark, getBookmarkIds, removeBookmark } from '../services/userService';

type BookmarkContextValue = {
  isSaved: (courseId: number) => boolean;
  toggle: (courseId: number) => Promise<void>;
  count: number;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    getBookmarkIds(user.id).then((list) => setIds(new Set(list))).catch(() => {});
  }, [user]);

  const isSaved = useCallback((id: number) => ids.has(id), [ids]);

  // Optimistic update: đổi UI ngay, lỗi thì hoàn lại
  const toggle = useCallback(
    async (courseId: number) => {
      if (!user) return;
      const was = ids.has(courseId);
      setIds((prev) => {
        const next = new Set(prev);
        was ? next.delete(courseId) : next.add(courseId);
        return next;
      });
      try {
        if (was) await removeBookmark(user.id, courseId);
        else await addBookmark(user.id, courseId);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          was ? next.add(courseId) : next.delete(courseId);
          return next;
        });
      }
    },
    [user, ids],
  );

  const value = useMemo(() => ({ isSaved, toggle, count: ids.size }), [isSaved, toggle, ids]);
  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks phải được dùng bên trong <BookmarkProvider>');
  return ctx;
}
