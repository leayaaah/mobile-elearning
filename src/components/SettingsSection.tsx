import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { uiColors, uiRadius, uiSpacing, uiType } from '../theme';

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}>
    <Text style={styles.title}>{title}</Text>
    <View style={styles.body}>{children}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginBottom: uiSpacing.lg },
  title: { color: uiColors.textMuted, ...uiType.labelLarge, marginBottom: uiSpacing.sm },
  body: { borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, backgroundColor: uiColors.surface, overflow: 'hidden' },
});
