import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme, useThemedStyles, type ThemeMode } from '../../context/ThemeContext';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../../theme';

const options: { value: ThemeMode; title: string; note: string }[] = [
  { value: 'system', title: 'Theo thiết bị', note: 'Tự chuyển theo cài đặt sáng hoặc tối của thiết bị.' },
  { value: 'light', title: 'Sáng', note: 'Luôn dùng giao diện sáng.' },
  { value: 'dark', title: 'Tối', note: 'Luôn dùng giao diện tối.' },
];

export default function AppearanceScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const { mode, resolved, loading, setMode } = useTheme();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choose = async (value: ThemeMode) => {
    if (busyRef.current || loading || value === mode) return;
    busyRef.current = true; setBusy(true); setError(null);
    try { await setMode(value); }
    catch { setError('Không thể lưu tùy chọn giao diện. Vui lòng thử lại.'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <View style={styles.root}>
    <ScreenHeader title="Tùy chỉnh giao diện" />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.description}>Chọn cách hiển thị phù hợp với bạn.</Text>
      {loading ? <Text style={styles.note}>Đang tải tùy chọn...</Text> : options.map((option) => <Pressable
        key={option.value} onPress={() => { void choose(option.value); }} disabled={busy}
        accessibilityRole="radio" accessibilityState={{ checked: mode === option.value, disabled: busy }}
        style={[styles.option, mode === option.value && styles.selected]}
      >
        <View style={styles.optionText}><Text style={styles.title}>{option.title}</Text><Text style={styles.note}>{option.note}</Text></View>
        <Ionicons name={mode === option.value ? 'radio-button-on' : 'radio-button-off'} size={23} color={uiColors.primary} />
      </Pressable>)}
      <Text style={styles.note}>Đang hiển thị: {resolved === 'dark' ? 'Tối' : 'Sáng'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
    <SafeAreaView edges={['bottom']} />
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  content: { padding: uiSpacing.gutter, gap: uiSpacing.md },
  description: { color: uiColors.textMuted, ...uiType.bodyMedium },
  option: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md, minHeight: 74, padding: uiSpacing.md, backgroundColor: uiColors.surface, borderColor: uiColors.border, borderWidth: 1, borderRadius: uiRadius.lg },
  selected: { borderColor: uiColors.primary, borderWidth: 2 },
  optionText: { flex: 1 }, title: { color: uiColors.text, ...uiType.bodyLarge, fontWeight: '700' },
  note: { color: uiColors.textMuted, ...uiType.bodySmall }, error: { color: uiColors.danger, ...uiType.bodySmall },
});
