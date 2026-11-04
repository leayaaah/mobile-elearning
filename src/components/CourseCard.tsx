import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBookmarks } from '../context/BookmarkContext';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';
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
  const badgeColor = course.badge === 'discount' ? uiColors.primaryContainer : uiColors.secondary;

  return (
    <View style={[styles.card, horizontal ? styles.cardH : styles.cardV]}>
      <Pressable onPress={() => router.push(`/course/${course.id}`)} accessibilityRole="button">
        <Image
          source={course.thumbnail_url}
          style={horizontal ? styles.imgH : styles.imgV}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        {badgeText && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, course.badge === 'discount' && styles.discountBadgeText]}>{badgeText}</Text>
          </View>
        )}
      </Pressable>

      <View style={horizontal ? styles.bodyH : styles.bodyV}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.push(`/course/${course.id}`)} accessibilityRole="button" style={styles.titleOpen}>
            <Text style={styles.title} numberOfLines={horizontal ? 2 : 1}>{course.title}</Text>
          </Pressable>
          <Pressable onPress={() => toggle(course.id)} accessibilityRole="button" accessibilityLabel={saved ? 'Bỏ lưu khóa học' : 'Lưu khóa học'} style={styles.bookmarkButton}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? uiColors.primary : uiColors.text}
            />
          </Pressable>
        </View>
        <Pressable onPress={() => router.push(`/course/${course.id}`)} accessibilityRole="button" style={styles.detailsOpen}>
          {course.teacher && <Text style={styles.teacher} numberOfLines={1}>{course.teacher.full_name}</Text>}
          <Text style={styles.price}>{formatPrice(course.price)}</Text>
          <View style={styles.meta}>
            <Ionicons name="star-outline" size={14} color={uiColors.secondary} />
            <Text style={styles.metaText}>
              {course.rating.toFixed(1)} ({course.rating_count}) · {course.lessons_count} bài
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export const CourseCard = memo(CourseCardBase);

const styles = StyleSheet.create({
  card: { backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, padding: uiSpacing.md, ...uiShadow.small },
  cardV: { width: 260 },
  cardH: { flexDirection: 'row', gap: uiSpacing.md, marginHorizontal: uiSpacing.gutter, marginBottom: uiSpacing.md },
  imgV: { width: '100%', height: 144, borderRadius: uiRadius.md },
  imgH: { width: 96, height: 96, borderRadius: uiRadius.md },
  bodyV: { marginTop: uiSpacing.md },
  bodyH: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: uiSpacing.sm },
  titleOpen: { flex: 1, minWidth: 0 },
  detailsOpen: { flex: 1 },
  bookmarkButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -uiSpacing.sm, marginRight: -uiSpacing.sm },
  title: { flex: 1, ...uiType.bodyLarge, fontWeight: '700', color: uiColors.text },
  teacher: { ...uiType.bodySmall, color: uiColors.textMuted, marginTop: uiSpacing.xs },
  price: { ...uiType.headlineSmall, fontWeight: '800', color: uiColors.primary, marginTop: uiSpacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.xs, marginTop: uiSpacing.xs },
  metaText: { ...uiType.bodySmall, color: uiColors.textMuted },
  badge: { position: 'absolute', top: uiSpacing.sm, left: uiSpacing.sm, paddingHorizontal: uiSpacing.sm, paddingVertical: uiSpacing.xs, borderRadius: uiRadius.sm },
  badgeText: { color: uiColors.onSecondary, ...uiType.labelSmall },
  discountBadgeText: { color: uiColors.onPrimary },
});
