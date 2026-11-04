import { supabase } from '../lib/supabase';

export async function changePassword(email: string, currentPassword: string, nextPassword: string): Promise<void> {
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (verifyError) throw new Error('Mật khẩu hiện tại không đúng hoặc không thể xác thực.');
  const { error } = await supabase.auth.updateUser({ password: nextPassword });
  if (error) throw error;
}
