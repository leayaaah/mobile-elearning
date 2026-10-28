import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry<T> = { savedAt: number; data: T };

/**
 * Cache đơn giản bằng AsyncStorage có TTL (stale-while-error):
 * - còn hạn: trả luôn dữ liệu cache, không gọi mạng
 * - hết hạn: gọi mạng; nếu mạng lỗi thì dùng lại cache cũ
 */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const storageKey = `cache:${key}`;
  let entry: Entry<T> | null = null;
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    entry = raw ? (JSON.parse(raw) as Entry<T>) : null;
  } catch {
    entry = null;
  }
  if (entry && Date.now() - entry.savedAt < ttlMs) return entry.data;

  try {
    const data = await fetcher();
    AsyncStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), data })).catch(() => {});
    return data;
  } catch (e) {
    if (entry) return entry.data;
    throw e;
  }
}

export async function clearCache() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('cache:')));
}
