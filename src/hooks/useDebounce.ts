import { useEffect, useState } from 'react';

// Dùng cho ô tìm kiếm: chỉ gọi API khi người dùng ngừng gõ
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
