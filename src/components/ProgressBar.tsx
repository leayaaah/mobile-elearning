import { useThemedStyles } from '../context/ThemeContext';
import { StyleSheet, View } from 'react-native';
import { type UiColors, uiRadius } from '../theme';

export function ProgressBar({ progress }: { progress: number }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} /></View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  track: { height: 8, overflow: 'hidden', borderRadius: uiRadius.pill, backgroundColor: uiColors.primarySoft },
  fill: { height: '100%', borderRadius: uiRadius.pill, backgroundColor: uiColors.primary },
});
