import { useThemedStyles } from '../context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';
import { type UiColors, uiSpacing, uiType } from '../theme';

// Màn hình tạm: thay bằng UI thật khi code tới
export function Placeholder({ title, note }: { title: string; note?: string }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: uiSpacing.lg, backgroundColor: uiColors.background },
  title: { ...uiType.headlineMedium, color: uiColors.text, marginBottom: uiSpacing.sm },
  note: { ...uiType.bodyMedium, color: uiColors.textMuted, textAlign: 'center' },
});
