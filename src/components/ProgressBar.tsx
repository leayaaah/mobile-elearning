import { StyleSheet, View } from 'react-native';
import { uiColors, uiRadius } from '../theme';

export function ProgressBar({ progress }: { progress: number }) {
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} /></View>;
}

const styles = StyleSheet.create({
  track: { height: 8, overflow: 'hidden', borderRadius: uiRadius.pill, backgroundColor: uiColors.primarySoft },
  fill: { height: '100%', borderRadius: uiRadius.pill, backgroundColor: uiColors.primary },
});
