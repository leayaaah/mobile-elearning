import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConsent } from '../context/ConsentContext';
import { uiColors, uiRadius, uiSpacing, uiType } from '../theme';

export default function ConsentScreen() {
  const router = useRouter();
  const { choose, busy } = useConsent();
  const [error, setError] = useState<string | null>(null);
  const close = () => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); };
  const decide = async (granted: boolean) => {
    if (busy) return;
    setError(null);
    try { await choose(granted); close(); }
    catch { setError('Không thể lưu lựa chọn. Vui lòng kiểm tra kết nối và thử lại.'); }
  };
  return <SafeAreaView style={styles.root}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Bạn có muốn cá nhân hóa gợi ý?</Text>
    <Text style={styles.body}>Nếu bạn đồng ý, ứng dụng ghi nhận khóa học đã xem, tìm kiếm, lưu, thêm vào giỏ và tiến độ học để gợi ý khóa học phù hợp.</Text>
    <Text style={styles.body}>Bạn có thể tắt quyền này hoặc xóa dữ liệu trong Cài đặt → Quyền riêng tư. Nếu không đồng ý, bạn vẫn dùng đầy đủ ứng dụng; gợi ý sẽ là các khóa học phổ biến.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>
      <Pressable style={[styles.choice, styles.yes]} disabled={busy} onPress={() => { void decide(true); }} accessibilityRole="button"><Text style={styles.yesText}>{busy ? 'Đang lưu...' : 'Đồng ý'}</Text></Pressable>
      <Pressable style={[styles.choice, styles.no]} disabled={busy} onPress={() => { void decide(false); }} accessibilityRole="button"><Text style={styles.noText}>Không, cảm ơn</Text></Pressable>
      <Pressable style={styles.later} disabled={busy} onPress={close} accessibilityRole="button"><Text style={styles.laterText}>Để sau</Text></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background }, content: { flexGrow: 1, justifyContent: 'center', padding: uiSpacing.gutter, gap: uiSpacing.md },
  title: { color: uiColors.text, ...uiType.headlineLarge }, body: { color: uiColors.textMuted, ...uiType.bodyLarge },
  error: { color: uiColors.danger, ...uiType.bodySmall }, actions: { gap: uiSpacing.sm, marginTop: uiSpacing.lg },
  choice: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.md, borderWidth: 2, borderColor: uiColors.primary },
  yes: { backgroundColor: uiColors.primary }, no: { backgroundColor: uiColors.surface },
  yesText: { color: uiColors.onPrimary, ...uiType.labelLarge }, noText: { color: uiColors.primary, ...uiType.labelLarge },
  later: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, laterText: { color: uiColors.textMuted, ...uiType.labelLarge },
});
