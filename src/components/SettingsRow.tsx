import { useThemedStyles } from '../context/ThemeContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type UiColors, uiSpacing, uiType } from '../theme';

export function SettingsRow({ title, detail, onPress, disabled = false }: {
  title: string; detail?: string; onPress?: () => void; disabled?: boolean;
}) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return <Pressable
    onPress={onPress} disabled={disabled || !onPress} accessibilityRole="button"
    accessibilityState={{ disabled: disabled || !onPress }} style={styles.row}
  >
    <View style={styles.text}><Text style={[styles.title, disabled && styles.disabled]}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}</View>
    {disabled ? <Text style={styles.soon}>Sắp có</Text> : onPress ? <Ionicons name="chevron-forward" size={20} color={uiColors.outline} /> : null}
  </Pressable>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: uiSpacing.md, paddingVertical: uiSpacing.sm, borderBottomWidth: 1, borderBottomColor: uiColors.border },
  text: { flex: 1 }, title: { color: uiColors.text, ...uiType.bodyLarge },
  disabled: { color: uiColors.textMuted }, detail: { color: uiColors.textMuted, ...uiType.bodySmall },
  soon: { color: uiColors.textMuted, ...uiType.labelSmall },
});
