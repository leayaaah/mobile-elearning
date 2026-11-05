import { useThemedStyles } from '../context/ThemeContext';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from './ScreenHeader';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../theme';

export function LegalPending({ title }: { title: string }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return <View style={styles.root}>
    <ScreenHeader title={title} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.heading}>Nội dung đang chờ phê duyệt</Text>
        <Text style={styles.body}>Tài liệu này chưa có bản chính thức. Nội dung sẽ được cập nhật sau khi được phê duyệt.</Text>
      </View>
    </ScrollView>
    <SafeAreaView edges={['bottom']} />
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  content: { padding: uiSpacing.gutter },
  card: { gap: uiSpacing.sm, padding: uiSpacing.lg, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, backgroundColor: uiColors.surface },
  heading: { color: uiColors.text, ...uiType.headlineSmall },
  body: { color: uiColors.textMuted, ...uiType.bodyMedium },
});
