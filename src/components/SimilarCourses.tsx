import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CourseCard } from './CourseCard';
import { useAsync } from '../hooks/useAsync';
import { getSimilarCourses } from '../services/recommendationService';
import { colors, fontSize, spacing } from '../theme';
import type { Course } from '../types';

export function SimilarCourses({ course }: { course?: Course }) {
  // Handle null/undefined course prop safely by using the course.id for the hook dependency
  const safeCourseId = course?.id ?? 0;
  const { data, loading, error, reload } = useAsync(
    () => course ? getSimilarCourses(course) : Promise.resolve([]),
    [safeCourseId]
  );

  // Early return after all hooks have been called
  if (!course?.id) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Khóa học tương tự</Text>
      {loading && !data ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Pressable accessibilityRole="button" onPress={reload}><Text style={styles.note}>Không thể tải gợi ý. Nhấn để thử lại.</Text></Pressable> : null}
      {!loading && !error && data?.length === 0 ? <Text style={styles.note}>Chưa có khóa học tương tự.</Text> : null}
      {data?.map((item) => <CourseCard key={item.id} course={item} variant="horizontal" />)}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  title: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  note: { color: colors.textMuted, fontSize: fontSize.sm },
});
