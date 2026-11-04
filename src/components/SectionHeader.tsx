import { Pressable, StyleSheet, Text, View } from 'react-native';
import { uiColors, uiSpacing, uiType } from '../theme';

export function SectionHeader({ title, onViewMore }: { title: string; onViewMore?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onViewMore && (
        <Pressable onPress={onViewMore} hitSlop={8} style={styles.moreButton}>
          <Text style={styles.more}>Xem thêm</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: uiSpacing.gutter, marginTop: uiSpacing.lg, marginBottom: uiSpacing.sm },
  title: { ...uiType.headlineSmall, color: uiColors.text, flex: 1 },
  moreButton: { minHeight: 44, justifyContent: 'center', paddingLeft: uiSpacing.sm },
  more: { ...uiType.labelMedium, color: uiColors.primary },
});
