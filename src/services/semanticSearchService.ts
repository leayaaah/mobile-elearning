import { supabase } from '../lib/supabase';
import { getCoursesByIds, searchCourses } from './courseService';
import type { SearchParams, SearchResult } from '../types';

const cache = new Map<string, { ids: number[] | null; expires: number }>();
const CACHE_MS = 5 * 60 * 1000;

export async function searchCoursesWithAI(params: SearchParams, userId?: string): Promise<SearchResult> {
  const query = params.query?.trim() ?? '';
  if (!userId || query.length < 2 || query.length > 160) return searchCourses(params);
  const key = `${userId}:${params.categoryId ?? 'all'}:${query.toLocaleLowerCase()}`;
  try {
    let cached = cache.get(key);
    if (!cached || cached.expires < Date.now()) {
      const { data, error } = await supabase.functions.invoke<{ courseIds: number[] }>('semantic-search', {
        body: { query, categoryId: params.categoryId ?? null },
      });
      if (error || !Array.isArray(data?.courseIds)) throw error ?? new Error('Invalid semantic search response');
      cached = {
        ids: data.courseIds.filter((id) => Number.isInteger(id) && id > 0).slice(0, 60),
        expires: Date.now() + CACHE_MS,
      };
      cache.set(key, cached);
    }
    if (!cached.ids || cached.ids.length === 0) return searchCourses(params);
    const page = params.page ?? 0;
    const pageSize = params.pageSize ?? 10;
    const items = await getCoursesByIds(cached.ids.slice(page * pageSize, (page + 1) * pageSize));
    return { items, total: cached.ids.length, source: 'semantic' };
  } catch (error) {
    if (__DEV__) console.warn('Dùng tìm kiếm từ khóa.', error);
    cache.set(key, { ids: null, expires: Date.now() + CACHE_MS });
    return searchCourses(params);
  }
}