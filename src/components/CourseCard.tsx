import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBookmarks } from '../context/BookmarkContext';
import { colors, fontSize, radius, spacing } from '../theme';
import { formatPrice } from '../utils/format';
import type { Course } from '../types';

type Props = {
  course: Course;
  // vertical: thẻ dọc trong danh sách cuộn ngang (Trang chủ)
  // horizontal: thẻ ngang trong danh sách dọc (Tìm kiếm, Đã lưu...)
  variant?: 'vertical' | 'horizontal';
};

function CourseCardBase({ course, variant = 'vertical' }: Props) {
  const router = useRouter();
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(course.id);
  const horizontal = variant === 'horizontal';

  const badgeText = course.badge === 'best-seller' ? 'Bán chạy' : course.badge === 'discount' ? `Giảm ${course.discount_percent}%` : null;
  const badgeColor = course.badge === 'discount' ? colors.purple : colors.primary;

  return (
    <Pressable
      onPress={() => router.push(`/course/${course.id}`)}
      style={[styles.card, horizontal ? styles.cardH : styles.cardV]}
    >
      <View>
        <Image
          source={course.thumbnail_url}
          style={horizontal ? styles.imgH : styles.imgV}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        {badgeText && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}
      </View>

      <View style={horizontal ? styles.bodyH : styles.bodyV}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={horizontal ? 2 : 1}>{course.title}</Text>
          <Pressable onPress={() => toggle(course.id)} hitSlop={10}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? colors.primary : colors.text}
            />
          </Pressable>
        </View>
        {course.teacher && <Text style={styles.teacher} numberOfLines={1}>{course.teacher.full_name}</Text>}
        <Text style={styles.price}>{formatPrice(course.price)}</Text>
        <View style={styles.meta}>
          <Ionicons name="star-outline" size={14} color={colors.star} />
          <Text style={styles.metaText}>
            {course.rating.toFixed(1)} ({course.rating_count}) · {course.lessons_count} bài
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const CourseCard = memo(CourseCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cardV: { width: 220 },
  cardH: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  imgV: { width: '100%', height: 120, borderRadius: radius.sm },
  imgH: { width: 96, height: 96, borderRadius: radius.sm },
  bodyV: { marginTop: spacing.md },
  bodyH: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  teacher: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },
  badge: { position: 'absolute', top: 6, left: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { color: '#fff', fontSize: fontSize.xs, fontWeight: '600' },
});
