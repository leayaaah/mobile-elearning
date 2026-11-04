import { supabase } from '../lib/supabase';
import { getCoursesByIds, getPopularCourses, getRecommendedCourses, getSimilarCourses as getCategorySimilar } from './courseService';
import { getEnrolledCourseIds } from './cartService';
import type { Course } from '../types';

type RankedId = { course_id: number };

export async function getSimilarCourses(course: Course, limit = 3): Promise<Course[]> {
  try {
    const { data, error } = await supabase.rpc('similar_ai_courses', {
      p_course_id: course.id, p_limit: limit,
    });
    if (error) throw error;
    const ids = ((data ?? []) as RankedId[]).map((row) => row.course_id);
    if (ids.length > 0) return getCoursesByIds(ids);
  } catch (error) {
    if (__DEV__) console.warn('Dùng gợi ý cùng danh mục.', error);
  }
  return getCategorySimilar(course, limit);
}

export async function getPersonalizedCourses(userId: string | undefined, limit = 8, consentGranted = false): Promise<Course[]> {
  // Validate userId before proceeding with RPC call
  if (!userId) return getRecommendedCourses(limit);
  if (consentGranted) try {
    const { data, error } = await supabase.rpc('recommend_ai_courses', { p_limit: limit });
    if (error) throw error;
    const ids = ((data ?? []) as RankedId[]).map((row) => row.course_id);
    if (ids.length > 0) return getCoursesByIds(ids);
  } catch (error) {
    if (__DEV__) console.warn('Dùng gợi ý phổ biến.', error);
  }
  const [enrolled, recommended, popular] = await Promise.all([
    getEnrolledCourseIds(userId), getRecommendedCourses(limit), getPopularCourses(limit),
  ]);
  const excluded = new Set(enrolled);
  return [...recommended, ...popular]
    .filter((course, index, all) => !excluded.has(course.id) && all.findIndex((item) => item.id === course.id) === index)
    .slice(0, limit);
}
