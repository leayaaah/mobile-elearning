import { useThemedStyles } from '../context/ThemeContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type UiColors, uiSpacing, uiType } from '../theme';

export function ScreenHeader({ title }: { title: string }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại" onPress={goBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={uiColors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.trailingSpace} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  safe: { backgroundColor: uiColors.background },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: uiSpacing.gutter, paddingVertical: uiSpacing.sm },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  trailingSpace: { width: 44 },
  title: { flex: 1, textAlign: 'center', ...uiType.headlineSmall, color: uiColors.text },
});
