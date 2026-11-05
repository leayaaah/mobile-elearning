import { useThemedStyles } from '../context/ThemeContext';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../theme';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.body}>{children}</View>
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  section: { marginBottom: uiSpacing.lg },
  title: { color: uiColors.textMuted, ...uiType.labelLarge, marginBottom: uiSpacing.sm },
  body: { borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, backgroundColor: uiColors.surface, overflow: 'hidden' },
});
