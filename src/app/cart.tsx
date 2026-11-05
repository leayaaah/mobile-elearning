import { useThemedStyles } from '../context/ThemeContext';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { ErrorView, Loading } from '../components/ScreenState';
import { ScreenHeader } from '../components/ScreenHeader';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';
import { formatPrice, getErrorMessage } from '../utils/format';
import type { Course } from '../types';

export default function CartScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
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
          <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={34} color={uiColors.primary} /></View>
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
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
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
        {removing ? <ActivityIndicator size="small" color={uiColors.danger} /> : <Ionicons name="trash-outline" size={20} color={uiColors.danger} />}
      </Pressable>
    </View>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  list: { paddingTop: uiSpacing.md, paddingBottom: uiSpacing.gutter },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: uiSpacing.gutter, marginBottom: uiSpacing.md, padding: uiSpacing.md, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, ...uiShadow.small },
  courseInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md },
  thumbnail: { width: 88, height: 76, borderRadius: uiRadius.md, backgroundColor: uiColors.primarySoft },
  details: { flex: 1, gap: uiSpacing.xs },
  title: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  teacher: { color: uiColors.textMuted, fontSize: uiType.bodySmall.fontSize },
  price: { color: uiColors.primary, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: uiSpacing.xs },
  summary: { marginHorizontal: uiSpacing.gutter, padding: uiSpacing.gutter, borderRadius: uiRadius.lg, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, ...uiShadow.small },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '600' },
  totalValue: { color: uiColors.primary, fontSize: uiType.headlineMedium.fontSize, fontWeight: '800' },
  secureNote: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize, marginTop: uiSpacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: uiSpacing.lg },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: uiColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: uiSpacing.gutter },
  emptyTitle: { color: uiColors.text, fontSize: uiType.headlineMedium.fontSize, fontWeight: '700' },
  emptyNote: { color: uiColors.textMuted, ...uiType.bodyMedium, textAlign: 'center', marginTop: uiSpacing.sm, marginBottom: uiSpacing.gutter },
  browseButton: { minHeight: 48, justifyContent: 'center', backgroundColor: uiColors.primary, paddingHorizontal: uiSpacing.lg, borderRadius: uiRadius.md },
  browseButtonText: { color: uiColors.onPrimary, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  errorBanner: { marginHorizontal: uiSpacing.gutter, marginTop: uiSpacing.md, color: uiColors.danger, fontSize: uiType.bodySmall.fontSize },
  bottomSafe: { backgroundColor: uiColors.surface },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: uiSpacing.gutter, paddingVertical: uiSpacing.md, borderTopWidth: 1, borderTopColor: uiColors.border },
  bottomLabel: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize },
  bottomTotal: { color: uiColors.text, fontSize: uiType.headlineSmall.fontSize, fontWeight: '800' },
  continueButton: { minHeight: 48, justifyContent: 'center', backgroundColor: uiColors.primary, paddingHorizontal: uiSpacing.md, borderRadius: uiRadius.md },
  continueText: { color: uiColors.onPrimary, fontSize: uiType.bodySmall.fontSize, fontWeight: '700' },
});
