import { supabase } from '../lib/supabase';
import { cached } from '../lib/cache';
import type {
  Category, Course, CourseResource, QAPost, Review, SearchParams, SearchResult, Section, Teacher,
} from '../types';

const TEN_MIN = 10 * 60 * 1000;
const COURSE_SELECT = '*, teacher:teachers(id, full_name, avatar_url, headline)';

// ---------- Trang chủ (có cache AsyncStorage) ----------
export const getCategories = () =>
  cached<Category[]>('categories', TEN_MIN, async () => {
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) throw error;
    return data as Category[];
  });

async function getFlaggedCourses(flag: 'is_popular' | 'is_recommended' | 'is_inspiring', limit: number) {
  return cached<Course[]>(`courses:${flag}:${limit}`, TEN_MIN, async () => {
    const { data, error } = await supabase
      .from('courses').select(COURSE_SELECT).eq(flag, true).limit(limit);
    if (error) throw error;
    return data as Course[];
  });
}
export const getPopularCourses = (limit = 8) => getFlaggedCourses('is_popular', limit);
export const getRecommendedCourses = (limit = 8) => getFlaggedCourses('is_recommended', limit);
export const getInspiringCourses = (limit = 3) => getFlaggedCourses('is_inspiring', limit);

export const getTopTeachers = (limit = 6) =>
  cached<Teacher[]>(`teachers:top:${limit}`, TEN_MIN, async () => {
    const { data, error } = await supabase
      .from('teachers').select('*').order('followers_count', { ascending: false }).limit(limit);
    if (error) throw error;
    return data as Teacher[];
  });

// ---------- Tìm kiếm + phân trang ----------
export async function searchCourses({
  query = '', categoryId, page = 0, pageSize = 10,
}: SearchParams): Promise<SearchResult> {
  const from = page * pageSize;
  let req = supabase.from('courses').select(COURSE_SELECT, { count: 'exact' });
  const text = query.trim();
  if (text) req = req.ilike('title', `%${text}%`);
  if (categoryId) req = req.eq('category_id', categoryId);
  const { data, error, count } = await req.order('id').range(from, from + pageSize - 1);
  if (error) throw error;
  return { items: data as Course[], total: count ?? 0 };
}

// ---------- Chi tiết khóa học ----------
export async function getCourseById(id: number): Promise<Course> {
  const { data, error } = await supabase.from('courses').select(COURSE_SELECT).eq('id', id).single();
  if (error) throw error;
  return data as Course;
}

export async function getCurriculum(courseId: number): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*, lessons(*)')
    .eq('course_id', courseId)
    .order('position');
  if (error) throw error;
  return (data as Section[]).map((s) => ({
    ...s,
    lessons: [...s.lessons].sort((a, b) => a.position - b.position),
  }));
}

export async function getReviews(courseId: number, rating?: number): Promise<Review[]> {
  let req = supabase.from('reviews').select('*').eq('course_id', courseId);
  if (rating) req = req.eq('rating', rating);
  const { data, error } = await req.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Review[];
}

export async function getSimilarCourses(course: Course, limit = 3): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses').select(COURSE_SELECT)
    .eq('category_id', course.category_id).neq('id', course.id).limit(limit);
  if (error) throw error;
  return data as Course[];
}

export async function getResources(courseId: number): Promise<CourseResource[]> {
  const { data, error } = await supabase.from('course_resources').select('*').eq('course_id', courseId);
  if (error) throw error;
  return data as CourseResource[];
}

export async function getQAPosts(courseId: number): Promise<QAPost[]> {
  const { data, error } = await supabase
    .from('qa_posts').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as QAPost[];
}

// ---------- Giảng viên ----------
export async function getTeacher(id: number): Promise<Teacher> {
  const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Teacher;
}

export async function getTeacherCourses(teacherId: number): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses').select(COURSE_SELECT).eq('teacher_id', teacherId).order('id');
  if (error) throw error;
  return data as Course[];
}
