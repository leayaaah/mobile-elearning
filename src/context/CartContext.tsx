import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { addToCart, checkout as checkoutRpc, getCartCourses, removeFromCart } from '../services/cartService';
import type { Course } from '../types';

type CartContextValue = {
  items: Course[];
  total: number;
  loading: boolean;
  has: (courseId: number) => boolean;
  add: (course: Course) => Promise<void>;
  remove: (courseId: number) => Promise<void>;
  refresh: () => Promise<void>;
  checkout: () => Promise<number>; // bước mở rộng: thanh toán giả lập
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await getCartCourses(user.id));
    } catch {
      // giữ nguyên giỏ hàng hiện tại nếu lỗi mạng
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (course: Course) => {
      if (!user) return;
      await addToCart(user.id, course.id);
      setItems((prev) => (prev.some((c) => c.id === course.id) ? prev : [course, ...prev]));
    },
    [user],
  );

  const remove = useCallback(
    async (courseId: number) => {
      if (!user) return;
      await removeFromCart(user.id, courseId);
      setItems((prev) => prev.filter((c) => c.id !== courseId));
    },
    [user],
  );

  const checkout = useCallback(async () => {
    const orderId = await checkoutRpc();
    setItems([]);
    return orderId;
  }, []);

  const has = useCallback((id: number) => items.some((c) => c.id === id), [items]);
  const total = useMemo(() => items.reduce((sum, c) => sum + c.price, 0), [items]);

  const value = useMemo(
    () => ({ items, total, loading, has, add, remove, refresh, checkout }),
    [items, total, loading, has, add, remove, refresh, checkout],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải được dùng bên trong <CartProvider>');
  return ctx;
}
