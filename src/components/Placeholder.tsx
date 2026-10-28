import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

// Màn hình tạm: thay bằng UI thật khi code tới
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  note: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
