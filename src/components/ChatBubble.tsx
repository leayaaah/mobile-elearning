import { useThemedStyles } from '../context/ThemeContext';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';

export function ChatBubble({ role, content, children }: { role: 'user' | 'assistant'; content: string; children?: ReactNode }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.bubble, role === 'user' ? styles.user : styles.assistant]}>
      <Text style={styles.text}>{content}</Text>
      {children}
    </View>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  bubble: { padding: uiSpacing.md, borderRadius: uiRadius.lg },
  user: { alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: uiColors.primarySoft },
  assistant: { alignSelf: 'flex-start', width: '100%', backgroundColor: uiColors.surface, ...uiShadow.small },
  text: { color: uiColors.text, ...uiType.bodyMedium },
});
