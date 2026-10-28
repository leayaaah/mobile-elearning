import { supabase } from '../lib/supabase';
import type { Course } from '../types';

export async function getCartCourses(userId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('course:courses(*, teacher:teachers(id, full_name, avatar_url, headline))')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.course as Course);
}

export async function addToCart(userId: string, courseId: number) {
  const { error } = await supabase.from('cart_items').upsert({ user_id: userId, course_id: courseId });
  if (error) throw error;
}

export async function removeFromCart(userId: string, courseId: number) {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId).eq('course_id', courseId);
  if (error) throw error;
}

// Bước mở rộng: thanh toán giả lập (RPC checkout_cart trong schema.sql)
export async function checkout(): Promise<number> {
  const { data, error } = await supabase.rpc('checkout_cart');
  if (error) throw error;
  return data as number;
}
