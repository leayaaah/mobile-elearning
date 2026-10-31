import { supabase } from '../lib/supabase';
import type { Course, MyCourse, Profile } from '../types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, patch: Partial<Pick<Profile, 'full_name' | 'headline' | 'avatar_url'>>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

// ---------- Bookmark ----------
export async function getBookmarkIds(userId: string): Promise<number[]> {
  const { data, error } = await supabase.from('bookmarks').select('course_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.course_id as number);
}

export async function addBookmark(userId: string, courseId: number) {
  const { error } = await supabase.from('bookmarks').insert({ user_id: userId, course_id: courseId });
  if (error) throw error;
}

export async function removeBookmark(userId: string, courseId: number) {
  const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('course_id', courseId);
  if (error) throw error;
}

export async function getSavedCourses(userId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('course:courses(*, teacher:teachers(id, full_name, avatar_url, headline))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.course as Course);
}

// ---------- Khóa học của tôi ----------
export async function getMyCourses(userId: string): Promise<MyCourse[]> {
  const { data, error } = await supabase.from('my_courses').select('*').eq('user_id', userId);
  if (error) throw error;
  return data as MyCourse[];
}

export async function enroll(userId: string, courseId: number) {
  const { error } = await supabase.from('enrollments').insert({ user_id: userId, course_id: courseId });
  if (error && error.code !== '23505') throw error; // 23505: đã ghi danh rồi
}

export async function isEnrolled(userId: string, courseId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function getCompletedLessonIds(userId: string, courseId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from('lesson_progress').select('lesson_id').eq('user_id', userId).eq('course_id', courseId);
  if (error) throw error;
  return (data ?? []).map((r) => r.lesson_id as number);
}

export async function markLessonDone(userId: string, courseId: number, lessonId: number) {
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      { user_id: userId, course_id: courseId, lesson_id: lessonId },
      { onConflict: 'user_id,lesson_id', ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function createQAPost(userId: string, courseId: number, content: string) {
  const profile = await getProfile(userId);
  const { error } = await supabase.from('qa_posts').insert({
    user_id: userId,
    course_id: courseId,
    author_name: profile.full_name.trim() || 'Học viên',
    author_avatar: profile.avatar_url,
    content: content.trim(),
  });
  if (error) throw error;
}
