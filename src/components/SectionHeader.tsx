import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

export function SectionHeader({ title, onViewMore }: { title: string; onViewMore?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onViewMore && (
        <Pressable onPress={onViewMore} hitSlop={8}>
          <Text style={styles.more}>Xem thêm</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  more: { fontSize: fontSize.sm, color: colors.primary },
});
