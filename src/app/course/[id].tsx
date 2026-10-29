import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorView, Loading } from '../../components/ScreenState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useBookmarks } from '../../context/BookmarkContext';
import { useCart } from '../../context/CartContext';
import { useAsync } from '../../hooks/useAsync';
import { getCourseById, getCurriculum, getReviews } from '../../services/courseService';
import { enroll, isEnrolled } from '../../services/userService';
import { colors, fontSize, radius, spacing } from '../../theme';
import type { Course, Review, Section } from '../../types';
import { formatMinutes, formatPrice, getErrorMessage, timeAgo } from '../../utils/format';

type DetailTab = 'overview' | 'lessons' | 'reviews';
type CourseDetails = { course: Course; sections: Section[]; reviews: Review[]; enrolled: boolean };

async function loadCourseDetails(courseId: number, userId?: string): Promise<CourseDetails> {
  if (!Number.isInteger(courseId) || courseId < 1) throw new Error('Không tìm thấy khóa học');
  const [course, sections, reviews, enrolled] = await Promise.all([
    getCourseById(courseId),
    getCurriculum(courseId),
    getReviews(courseId),
    userId ? isEnrolled(userId, courseId) : Promise.resolve(false),
  ]);
  return { course, sections, reviews, enrolled };
}

const tabs: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'lessons', label: 'Bài học' },
  { key: 'reviews', label: 'Đánh giá' },
];

export default function CourseDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const courseId = Number(routeId);
  const { user } = useAuth();
  const router = useRouter();
  const { isSaved, toggle } = useBookmarks();
  const cart = useCart();
  const { data, loading, error, reload } = useAsync(
    () => loadCourseDetails(courseId, user?.id),
    [courseId, user?.id],
  );
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(() => new Set());
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [action, setAction] = useState<'cart' | 'enroll' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isEnrolledNow, setIsEnrolledNow] = useState(false);

  const enrolled = Boolean(data?.enrolled || isEnrolledNow);
  const saved = data ? isSaved(data.course.id) : false;
  const alreadyInCart = data ? cart.has(data.course.id) : false;
  const visibleReviews = useMemo(() => {
    const all = data?.reviews ?? [];
    return ratingFilter === null ? all : all.filter((review) => review.rating === ratingFilter);
  }, [data?.reviews, ratingFilter]);

  const addCourseToCart = async () => {
    if (!data || !user || enrolled || alreadyInCart || action) return;
    setAction('cart');
    setActionError(null);
    setNotice(null);
    try {
      await cart.add(data.course);
      setNotice('Đã thêm khóa học vào giỏ hàng.');
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setAction(null);
    }
  };

  const enrollForFree = async () => {
    if (!data || !user || enrolled || action) return;
    setAction('enroll');
    setActionError(null);
    setNotice(null);
    try {
      await enroll(user.id, data.course.id);
      setIsEnrolledNow(true);
      if (alreadyInCart) await cart.remove(data.course.id);
      setNotice('Ghi danh thành công. Khóa học đã có trong Khóa học của tôi.');
    } catch (cause) {
      setActionError(getErrorMessage(cause));
    } finally {
      setAction(null);
    }
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Chi tiết khóa học" />
      {loading && !data ? <Loading /> : null}
      {error && !data ? <ErrorView message={error} onRetry={reload} /> : null}
      {!loading && !error && !data ? <ErrorView message="Không tìm thấy khóa học." /> : null}

      {data && (
        <>
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'overview' && (
              <OverviewTab
                course={data.course}
                saved={saved}
                enrolled={enrolled}
                onToggleBookmark={() => void toggle(data.course.id)}
                onEnroll={() => void enrollForFree()}
                enrolling={action === 'enroll'}
                onOpenTeacher={data.course.teacher ? () => router.push(`/teacher/${data.course.teacher?.id}`) : undefined}
              />
            )}
            {activeTab === 'lessons' && (
              <LessonsTab sections={data.sections} expanded={expandedSections} onToggle={toggleSection} />
            )}
            {activeTab === 'reviews' && (
              <ReviewsTab
                reviews={visibleReviews}
                allReviews={data.reviews}
                selectedRating={ratingFilter}
                onSelectRating={setRatingFilter}
              />
            )}

            {(actionError || notice) && (
              <View style={[styles.notice, actionError ? styles.errorNotice : styles.successNotice]}>
                <Text style={[styles.noticeText, actionError && styles.errorNoticeText]}>
                  {actionError ?? notice}
                </Text>
              </View>
            )}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{formatPrice(data.course.price)}</Text>
              {data.course.original_price !== null && data.course.original_price > data.course.price && (
                <Text style={styles.originalPrice}>{formatPrice(data.course.original_price)}</Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={enrolled || alreadyInCart || action !== null || cart.loading}
              onPress={() => void addCourseToCart()}
              style={[styles.cartButton, (enrolled || alreadyInCart || action !== null || cart.loading) && styles.disabledButton]}
            >
              {action === 'cart' ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name={enrolled ? 'checkmark-circle-outline' : alreadyInCart ? 'cart' : 'cart-outline'} size={18} color="#fff" />
                  <Text style={styles.cartButtonText}>
                    {enrolled ? 'Đã ghi danh' : alreadyInCart ? 'Đã có trong giỏ' : 'Thêm vào giỏ'}
                  </Text>
                </>
              )}
            </Pressable>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

function OverviewTab({
  course, saved, enrolled, onToggleBookmark, onEnroll, enrolling, onOpenTeacher,
}: {
  course: Course;
  saved: boolean;
  enrolled: boolean;
  onToggleBookmark: () => void;
  onEnroll: () => void;
  enrolling: boolean;
  onOpenTeacher?: () => void;
}) {
  return (
    <View>
      <View style={styles.heroWrap}>
        <Image source={course.thumbnail_url} style={styles.hero} contentFit="cover" cachePolicy="memory-disk" />
        {course.badge && (
          <View style={styles.courseBadge}>
            <Text style={styles.courseBadgeText}>{course.badge === 'best-seller' ? 'Bán chạy' : `Giảm ${course.discount_percent}%`}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Bỏ lưu khóa học' : 'Lưu khóa học'}
          onPress={onToggleBookmark}
          style={styles.bookmarkButton}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? colors.primary : colors.text} />
        </Pressable>
      </View>

      <View style={styles.overviewBody}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.courseMeta}>
          <Ionicons name="star" size={16} color={colors.star} />
          <Text style={styles.ratingText}>{course.rating.toFixed(1)} ({course.rating_count} đánh giá)</Text>
          <Text style={styles.metaSeparator}>·</Text>
          <Text style={styles.metaText}>{course.lessons_count} bài học</Text>
          <Text style={styles.metaSeparator}>·</Text>
          <Text style={styles.metaText}>{formatMinutes(course.duration_minutes)}</Text>
        </View>

        {course.teacher && (
          <Pressable onPress={onOpenTeacher} disabled={!onOpenTeacher} style={styles.teacherCard}>
            <Image source={course.teacher.avatar_url} style={styles.teacherAvatar} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>{course.teacher.full_name}</Text>
              {course.teacher.headline && <Text style={styles.teacherHeadline}>{course.teacher.headline}</Text>}
            </View>
            {onOpenTeacher && <Feather name="chevron-right" size={20} color={colors.textMuted} />}
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Giới thiệu khóa học</Text>
        <Text style={styles.description}>{course.description || 'Khóa học chưa có phần giới thiệu.'}</Text>

        {enrolled ? (
          <View style={styles.enrolledPill}>
            <Ionicons name="checkmark-circle" size={19} color={colors.primary} />
            <Text style={styles.enrolledText}>Bạn đã ghi danh khóa học này</Text>
          </View>
        ) : (
          <Pressable onPress={onEnroll} disabled={enrolling} style={[styles.enrollButton, enrolling && styles.disabledButton]}>
            {enrolling ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.enrollButtonText}>Ghi danh miễn phí</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function LessonsTab({ sections, expanded, onToggle }: {
  sections: Section[];
  expanded: Set<number>;
  onToggle: (sectionId: number) => void;
}) {
  if (sections.length === 0) {
    return <EmptyTab message="Khóa học chưa có chương hoặc bài học." />;
  }
  return (
    <View style={styles.tabContent}>
      <Text style={styles.contentHeading}>Nội dung khóa học</Text>
      <Text style={styles.contentSubheading}>{sections.length} chương · {sections.reduce((sum, section) => sum + section.lessons.length, 0)} bài học</Text>
      {sections.map((section, index) => {
        const isOpen = expanded.has(section.id);
        return (
          <View key={section.id} style={styles.sectionCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => onToggle(section.id)}
              style={styles.chapterButton}
            >
              <View style={styles.chapterNumber}><Text style={styles.chapterNumberText}>{index + 1}</Text></View>
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{section.title}</Text>
                <Text style={styles.chapterMeta}>{section.lessons.length} bài học</Text>
              </View>
              <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>
            {isOpen && section.lessons.map((lesson) => (
              <View key={lesson.id} style={styles.lessonRow}>
                <Ionicons name={lesson.is_preview ? 'play-circle-outline' : 'document-text-outline'} size={18} color={colors.primary} />
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDuration}>{formatMinutes(Math.ceil(lesson.duration_seconds / 60))}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function ReviewsTab({
  reviews, allReviews, selectedRating, onSelectRating,
}: {
  reviews: Review[];
  allReviews: Review[];
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.reviewsSummary}>
        <View>
          <Text style={styles.reviewScore}>{allReviews.length ? averageRating(allReviews).toFixed(1) : '—'}</Text>
          <Stars rating={allReviews.length ? averageRating(allReviews) : 0} size={16} />
          <Text style={styles.reviewTotal}>{allReviews.length} đánh giá</Text>
        </View>
        <View style={styles.ratingFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratingFilterList}>
            <RatingChip label="Tất cả" active={selectedRating === null} onPress={() => onSelectRating(null)} />
            {[5, 4, 3, 2, 1].map((rating) => (
              <RatingChip
                key={rating}
                label={`${rating} ★`}
                active={selectedRating === rating}
                onPress={() => onSelectRating(rating)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
      {reviews.length === 0 ? <EmptyTab message="Chưa có đánh giá phù hợp với bộ lọc này." /> : reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewTopRow}>
            <View style={styles.reviewerIdentity}>
              <Image source={review.reviewer_avatar} style={styles.reviewerAvatar} contentFit="cover" cachePolicy="memory-disk" />
              <View>
                <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                <Text style={styles.reviewDate}>{timeAgo(review.created_at)}</Text>
              </View>
            </View>
            <Stars rating={review.rating} size={14} />
          </View>
          {!!review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
        </View>
      ))}
    </View>
  );
}

function RatingChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.ratingChip, active && styles.ratingChipActive]}>
      <Text style={[styles.ratingChipText, active && styles.ratingChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Stars({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons key={star} name={star <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color={colors.star} />
      ))}
    </View>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <View style={styles.emptyTab}>
      <Feather name="book-open" size={27} color={colors.textMuted} />
      <Text style={styles.emptyTabText}>{message}</Text>
    </View>
  );
}

function averageRating(reviews: Review[]) {
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  scrollContent: { paddingBottom: spacing.xl },
  heroWrap: { position: 'relative', marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.md, overflow: 'hidden' },
  hero: { width: '100%', height: 210, backgroundColor: colors.border },
  courseBadge: { position: 'absolute', top: spacing.md, left: spacing.md, backgroundColor: colors.purple, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  courseBadgeText: { color: '#fff', fontWeight: '700', fontSize: fontSize.xs },
  bookmarkButton: { position: 'absolute', top: spacing.md, right: spacing.md, width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  overviewBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  courseTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', lineHeight: 28 },
  courseMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  ratingText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  metaSeparator: { color: colors.textMuted, marginHorizontal: 2 },
  metaText: { color: colors.textMuted, fontSize: fontSize.sm },
  teacherCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, marginTop: spacing.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.border },
  teacherInfo: { flex: 1 },
  teacherName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  teacherHeadline: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.sm },
  description: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 23 },
  enrollButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple, borderRadius: radius.md, marginTop: spacing.lg },
  enrollButtonText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  enrolledPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginTop: spacing.lg, backgroundColor: colors.primarySoft, borderRadius: radius.md },
  enrolledText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  priceBlock: { flex: 1 },
  price: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800' },
  originalPrice: { color: colors.textMuted, fontSize: fontSize.xs, textDecorationLine: 'line-through', marginTop: 2 },
  cartButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  cartButtonText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
  tabContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  contentHeading: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  contentSubheading: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, marginBottom: spacing.lg },
  sectionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: spacing.md, overflow: 'hidden' },
  chapterButton: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  chapterNumber: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.pill },
  chapterNumberText: { color: colors.primary, fontWeight: '700' },
  chapterInfo: { flex: 1 },
  chapterTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  chapterMeta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 3 },
  lessonRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  lessonTitle: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  lessonDuration: { color: colors.textMuted, fontSize: fontSize.xs },
  reviewsSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  reviewScore: { color: colors.text, fontSize: 30, fontWeight: '800' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviewTotal: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  ratingFilters: { flex: 1, minWidth: 0 },
  ratingFilterList: { alignItems: 'center', gap: spacing.xs, paddingRight: spacing.xs },
  ratingChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, backgroundColor: colors.surface },
  ratingChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ratingChipText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  ratingChipTextActive: { color: colors.primary },
  reviewCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  reviewTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  reviewerIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  reviewerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.border },
  reviewerName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  reviewDate: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  reviewComment: { color: colors.text, fontSize: fontSize.sm, lineHeight: 21, marginTop: spacing.md },
  emptyTab: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md },
  emptyTabText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
  notice: { padding: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.md },
  successNotice: { backgroundColor: colors.primarySoft },
  errorNotice: { backgroundColor: '#FCEAEA' },
  noticeText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  errorNoticeText: { color: colors.danger },
});
