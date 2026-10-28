export function formatPrice(value: number): string {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} phút`;
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / 86_400_000);
  if (day <= 0) return 'Hôm nay';
  if (day === 1) return '1 ngày trước';
  return `${day} ngày trước`;
}

// Supabase trả về PostgrestError (không phải instance của Error)
export function getErrorMessage(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Đã có lỗi xảy ra, vui lòng thử lại';
}
