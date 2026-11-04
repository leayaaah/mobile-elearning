import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';
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
              <Ionicons name="arrow-forward" size={16} color={uiColors.primary} />
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
}

export const MyCourseCard = memo(MyCourseCardBase);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: uiSpacing.md, padding: uiSpacing.md, marginBottom: uiSpacing.md, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, ...uiShadow.small },
  thumbnail: { width: 104, height: 104, borderRadius: uiRadius.md, backgroundColor: uiColors.surfaceContainer },
  content: { flex: 1, minWidth: 0, justifyContent: 'center' },
  title: { color: uiColors.text, ...uiType.bodyLarge, fontWeight: '700' },
  meta: { color: uiColors.textMuted, ...uiType.bodySmall, marginTop: uiSpacing.sm },
  progressTrack: { height: 8, marginTop: uiSpacing.md, overflow: 'hidden', backgroundColor: uiColors.primarySoft, borderRadius: uiRadius.pill },
  progressValue: { height: '100%', backgroundColor: uiColors.primary, borderRadius: uiRadius.pill },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.xs, marginTop: uiSpacing.sm },
  progressText: { flex: 1, color: uiColors.textMuted, ...uiType.bodySmall },
  actionText: { color: uiColors.primary, ...uiType.labelMedium },
});
