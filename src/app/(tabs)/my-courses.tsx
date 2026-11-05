import { useThemedStyles } from '../../context/ThemeContext';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { getMyCourses } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import { ErrorView, Loading } from '../../components/ScreenState';
import { MyCourseCard } from '../../components/MyCourseCard';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';

type Filter = 'all' | 'learning' | 'completed';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' }, { key: 'learning', label: 'Đang học' }, { key: 'completed', label: 'Hoàn thành' },
];

export default function MyCoursesScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const request = useAsync(() => {
    if (!user) throw new Error('Vui lòng đăng nhập để xem khóa học của bạn');
    return getMyCourses(user.id);
  }, [user?.id]);
  const courses = useMemo(() => {
    const all = request.data ?? [];
    if (filter === 'learning') return all.filter((course) => course.progress > 0 && course.progress < 100);
    if (filter === 'completed') return all.filter((course) => course.progress >= 100);
    return all;
  }, [filter, request.data]);
  const renderEmpty = useCallback(() => (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{request.data?.length ? 'Không có khóa học phù hợp' : 'Bạn chưa có khóa học nào'}</Text>
      <Text style={styles.emptyText}>{request.data?.length ? 'Hãy thử chọn tab khác.' : 'Các khóa học bạn ghi danh sẽ xuất hiện ở đây.'}</Text>
    </View>
  ), [request.data, styles.empty, styles.emptyText, styles.emptyTitle]);

  if (!user) return <SafeAreaView style={styles.screen}><ErrorView message="Vui lòng đăng nhập để xem khóa học của bạn." /></SafeAreaView>;
  if (request.loading && !request.data) return <SafeAreaView style={styles.screen}><Loading /></SafeAreaView>;
  if (request.error && !request.data) return <SafeAreaView style={styles.screen}><ErrorView message={request.error} onRetry={request.reload} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Khóa học của tôi</Text>
        <View style={styles.headingAccent} />
      </View>
      <View style={styles.tabs}>{FILTERS.map((item) => (
        <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: filter === item.key }} style={[styles.tab, filter === item.key && styles.tabActive]} onPress={() => setFilter(item.key)}>
          <Text style={[styles.tabText, filter === item.key && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}</View>
      <FlatList
        contentContainerStyle={styles.list}
        data={courses}
        keyExtractor={(item) => String(item.course_id)}
        renderItem={({ item }) => <MyCourseCard course={item} />}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={request.loading} onRefresh={request.reload} tintColor={uiColors.primary} />}
        showsVerticalScrollIndicator={false}
      />
      {request.error && <Text style={styles.refreshError}>{request.error}</Text>}
    </SafeAreaView>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: uiColors.background },
  header: { paddingHorizontal: uiSpacing.gutter, paddingTop: uiSpacing.md, paddingBottom: uiSpacing.md },
  heading: { color: uiColors.text, ...uiType.headlineLarge },
  headingAccent: { width: uiSpacing.xl, height: uiSpacing.xs, borderRadius: uiRadius.pill, backgroundColor: uiColors.primary, marginTop: uiSpacing.sm },
  tabs: { flexDirection: 'row', marginHorizontal: uiSpacing.gutter, marginBottom: uiSpacing.md, padding: uiSpacing.xs, backgroundColor: uiColors.surfaceLow, borderRadius: uiRadius.md, borderWidth: 1, borderColor: uiColors.border },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.sm },
  tabActive: { backgroundColor: uiColors.surface, ...uiShadow.small },
  tabText: { color: uiColors.textMuted, ...uiType.labelMedium },
  tabTextActive: { color: uiColors.primary },
  list: { flexGrow: 1, paddingHorizontal: uiSpacing.gutter, paddingTop: uiSpacing.xs, paddingBottom: uiSpacing.xl },
  empty: { alignItems: 'center', padding: uiSpacing.xl, marginTop: uiSpacing.xl, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, ...uiShadow.small },
  emptyTitle: { color: uiColors.text, ...uiType.headlineSmall, textAlign: 'center' },
  emptyText: { color: uiColors.textMuted, ...uiType.bodyMedium, textAlign: 'center', marginTop: uiSpacing.sm },
  refreshError: { color: uiColors.danger, ...uiType.bodySmall, textAlign: 'center', padding: uiSpacing.sm },
});
