import { supabase } from '../lib/supabase';
import type { TrackingConsent } from '../types/consent';

function parseConsent(value: unknown): TrackingConsent {
  if (typeof value !== 'object' || value === null || !('tracking_consent' in value) || !('tracking_consent_at' in value)) {
    throw new Error('Không đọc được trạng thái quyền riêng tư.');
  }
  const granted = value.tracking_consent;
  const updatedAt = value.tracking_consent_at;
  if ((granted !== null && typeof granted !== 'boolean') || (updatedAt !== null && typeof updatedAt !== 'string')) {
    throw new Error('Trạng thái quyền riêng tư không hợp lệ.');
  }
  return { status: granted === null ? 'unset' : granted ? 'granted' : 'denied', updatedAt };
}

export async function getMyConsent(): Promise<TrackingConsent> {
  const { data, error } = await supabase.from('profiles')
    .select('tracking_consent, tracking_consent_at').single();
  if (error) throw error;
  return parseConsent(data);
}

export async function setTrackingConsent(granted: boolean): Promise<TrackingConsent> {
  const { data, error } = await supabase.rpc('set_tracking_consent', { p_granted: granted });
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error('Không xác nhận được thay đổi quyền riêng tư.');
  return parseConsent(data[0]);
}

export async function deleteMyTrackingData(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_tracking_data');
  if (error) throw error;
}
