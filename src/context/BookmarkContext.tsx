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
    let active = true;

    if (!user) {
      // Defer the reset so the effect does not synchronously cascade a render.
      Promise.resolve().then(() => {
        if (active) setIds(new Set());
      });
      return () => { active = false; };
    }

    getBookmarkIds(user.id)
      .then((list) => {
        if (active) setIds(new Set(list));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setIds(new Set());
        console.warn('Không thể tải danh sách khóa học đã lưu.', error);
      });

    return () => { active = false; };
  }, [user]);

  const isSaved = useCallback((id: number) => ids.has(id), [ids]);

  // Optimistic update: đổi UI ngay, lỗi thì hoàn lại
  const toggle = useCallback(
    async (courseId: number) => {
      if (!user) return;
      const was = ids.has(courseId);
      setIds((prev) => {
        const next = new Set(prev);
        if (was) next.delete(courseId);
        else next.add(courseId);
        return next;
      });
      try {
        if (was) await removeBookmark(user.id, courseId);
        else await addBookmark(user.id, courseId);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (was) next.add(courseId);
          else next.delete(courseId);
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
