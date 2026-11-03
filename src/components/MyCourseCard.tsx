import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fontSize, radius, spacing } from '../theme';
import { formatMinutes } from '../utils/format';
import type { MyCourse } from '../types';

type Props = { course: MyCourse };

function MyCourseCardBase({ course }: Props) {
  const router = useRouter();
  const progress = Math.max(0, Math.min(100, course.progress));
  const hasLessons = course.lessons_count > 0;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/learn/${course.course_id}`)}>
      <Image source={course.thumbnail_url} style={styles.thumbnail} contentFit="cover" cachePolicy="memory-disk" />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.meta}>
          {hasLessons ? `${course.completed_lessons}/${course.lessons_count} bài đã hoàn thành` : 'Khóa học chưa có bài học'}
          {' · '}{formatMinutes(course.duration_minutes)}
        </Text>
        {hasLessons && (
          <>
            <View style={styles.progressTrack}><View style={[styles.progressValue, { width: `${progress}%` }]} /></View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{progress}% tiến độ</Text>
              <Text style={styles.actionText}>{progress >= 100 ? 'Xem lại' : 'Tiếp tục học'}</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

export const MyCourseCard = memo(MyCourseCardBase);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  thumbnail: { width: 104, height: 104, borderRadius: radius.sm, backgroundColor: colors.border },
  content: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm },
  progressTrack: { height: 7, marginTop: spacing.md, overflow: 'hidden', backgroundColor: colors.border, borderRadius: radius.pill },
  progressValue: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  progressText: { flex: 1, color: colors.textMuted, fontSize: fontSize.xs },
  actionText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
});
