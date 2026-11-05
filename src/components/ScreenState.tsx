import { useThemedStyles } from '../context/ThemeContext';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../theme';

export function Loading() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={uiColors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Pressable style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>Thử lại</Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: uiSpacing.lg, backgroundColor: uiColors.background },
  errorText: { color: uiColors.textMuted, ...uiType.bodyLarge, textAlign: 'center', marginBottom: uiSpacing.md },
  btn: { minHeight: 44, justifyContent: 'center', backgroundColor: uiColors.primary, paddingHorizontal: uiSpacing.lg, borderRadius: uiRadius.md },
  btnText: { color: uiColors.onPrimary, ...uiType.labelLarge },
});
