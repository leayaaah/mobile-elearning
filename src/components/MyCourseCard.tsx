import { useThemedStyles } from '../context/ThemeContext';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';
import { formatMinutes } from '../utils/format';
import type { MyCourse } from '../types';

type Props = { course: MyCourse };

function MyCourseCardBase({ course }: Props) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
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
            <View style={styles.progressTrack}><View style={[styles.progressValue, progress >= 100 && styles.progressComplete, { width: `${progress}%` }]} /></View>
            <View style={styles.progressRow}>
              <Text style={[styles.progressText, progress >= 100 && styles.completeText]}>{progress}% tiến độ</Text>
              <View style={styles.action}>
                <Text style={styles.actionText}>{progress >= 100 ? 'Xem lại' : 'Tiếp tục học'}</Text>
                <Ionicons name="arrow-forward" size={16} color={uiColors.primary} />
              </View>
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

export const MyCourseCard = memo(MyCourseCardBase);

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  card: { flexDirection: 'row', gap: uiSpacing.md, padding: uiSpacing.md, marginBottom: uiSpacing.md, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, minHeight: 140, ...uiShadow.medium },
  thumbnail: { width: 96, height: 108, borderRadius: uiRadius.md, backgroundColor: uiColors.surfaceContainer },
  content: { flex: 1, minWidth: 0, justifyContent: 'space-between' },
  title: { color: uiColors.text, ...uiType.bodyLarge, fontWeight: '700' },
  meta: { color: uiColors.textMuted, ...uiType.bodySmall, marginTop: uiSpacing.xs },
  progressTrack: { height: 8, marginTop: uiSpacing.sm, overflow: 'hidden', backgroundColor: uiColors.surfaceContainer, borderRadius: uiRadius.pill },
  progressValue: { height: '100%', backgroundColor: uiColors.primary, borderRadius: uiRadius.pill },
  progressComplete: { backgroundColor: uiColors.success },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: uiSpacing.xs, marginTop: uiSpacing.sm },
  progressText: { color: uiColors.primary, ...uiType.labelMedium },
  completeText: { color: uiColors.success },
  action: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.xs },
  actionText: { color: uiColors.primary, ...uiType.labelMedium },
});
