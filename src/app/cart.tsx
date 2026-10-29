import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { ErrorView, Loading } from '../components/ScreenState';
import { ScreenHeader } from '../components/ScreenHeader';
import { colors, fontSize, radius, spacing } from '../theme';
import { formatPrice, getErrorMessage } from '../utils/format';
import type { Course } from '../types';

export default function CartScreen() {
  const router = useRouter();
  const { items, total, loading, remove, refresh } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRefresh = async () => {
    setError(null);
    try {
      await refresh();
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  };

  const handleRemove = async (courseId: number) => {
    setError(null);
    setRemovingId(courseId);
    try {
      await remove(courseId);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Giỏ hàng" />
      {loading && items.length === 0 ? <Loading /> : error && items.length === 0 ? (
        <ErrorView message={error} onRetry={handleRefresh} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={34} color={colors.primary} /></View>
          <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
          <Text style={styles.emptyNote}>Thêm khóa học bạn muốn học để xem lại tại đây.</Text>
          <Pressable style={styles.browseButton} onPress={() => router.replace('/(tabs)/search')}>
            <Text style={styles.browseButtonText}>Khám phá khóa học</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {error && <Text style={styles.errorBanner}>{error}</Text>}
          <FlatList
            data={items}
            keyExtractor={(course) => String(course.id)}
            contentContainerStyle={styles.list}
            onRefresh={handleRefresh}
            refreshing={loading}
            renderItem={({ item }) => (
              <CartCourseRow course={item} removing={removingId === item.id} onRemove={() => handleRemove(item.id)} onOpen={() => router.push(`/course/${item.id}`)} />
            )}
            ListFooterComponent={
              <View style={styles.summary}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                </View>
                <Text style={styles.secureNote}>Giá đã bao gồm toàn bộ nội dung khóa học.</Text>
              </View>
            }
          />
          <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
            <View style={styles.bottomBar}>
              <View><Text style={styles.bottomLabel}>Tổng cộng</Text><Text style={styles.bottomTotal}>{formatPrice(total)}</Text></View>
              <Pressable style={styles.continueButton} onPress={() => router.replace('/(tabs)/search')}>
                <Text style={styles.continueText}>Tiếp tục khám phá</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

function CartCourseRow({ course, removing, onRemove, onOpen }: { course: Course; removing: boolean; onRemove: () => void; onOpen: () => void }) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.courseInfo} onPress={onOpen} accessibilityRole="button">
        <Image source={{ uri: course.thumbnail_url ?? undefined }} style={styles.thumbnail} />
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>{course.title}</Text>
          {course.teacher && <Text style={styles.teacher} numberOfLines={1}>{course.teacher.full_name}</Text>}
          <Text style={styles.price}>{formatPrice(course.price)}</Text>
        </View>
      </Pressable>
      <Pressable style={styles.removeButton} onPress={onRemove} disabled={removing} accessibilityRole="button" accessibilityLabel={`Xóa ${course.title} khỏi giỏ hàng`}>
        {removing ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="trash-outline" size={20} color={colors.danger} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  courseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbnail: { width: 88, height: 76, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  details: { flex: 1, gap: spacing.xs },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  teacher: { color: colors.textMuted, fontSize: fontSize.sm },
  price: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  removeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  summary: { marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  totalValue: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800' },
  secureNote: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  emptyNote: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center', lineHeight: 22, marginTop: spacing.sm, marginBottom: spacing.lg },
  browseButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  browseButtonText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  errorBanner: { marginHorizontal: spacing.lg, marginTop: spacing.md, color: colors.danger, fontSize: fontSize.sm },
  bottomSafe: { backgroundColor: colors.surface },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  bottomLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  bottomTotal: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  continueButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
  continueText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },
});
