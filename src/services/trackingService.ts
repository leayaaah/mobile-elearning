import { supabase } from '../lib/supabase';

const VIEW_INTERVAL_MS = 30 * 60 * 1000;
const lastViews = new Map<string, number>();

/** View is a weak signal. Action events are emitted by database triggers after success. */
export async function trackCourseView(userId: string | undefined, courseId: number): Promise<void> {
  if (!userId || !Number.isInteger(courseId) || courseId < 1) return;
  const key = `${userId}:${courseId}`;
  const now = Date.now();
  if (now - (lastViews.get(key) ?? 0) < VIEW_INTERVAL_MS) return;
  lastViews.set(key, now);
  try {
    const { error } = await supabase.from('user_events').insert({
      user_id: userId, course_id: courseId, event_type: 'course_view', metadata: {},
    });
    if (error) throw error;
  } catch (error) {
    lastViews.delete(key);
    // Tracking must not interrupt course navigation.
    if (__DEV__) console.warn('Không thể ghi nhận lượt xem khóa học.', error);
  }
}