import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getMyCourses } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import { ErrorView, Loading } from '../../components/ScreenState';
import { MyCourseCard } from '../../components/MyCourseCard';
import { colors, fontSize, radius, spacing } from '../../theme';

type Filter = 'all' | 'learning' | 'completed';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' }, { key: 'learning', label: 'Đang học' }, { key: 'completed', label: 'Hoàn thành' },
];

export default function MyCoursesScreen() {
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
  ), [request.data]);

  if (!user) return <SafeAreaView style={styles.screen}><ErrorView message="Vui lòng đăng nhập để xem khóa học của bạn." /></SafeAreaView>;
  if (request.loading && !request.data) return <SafeAreaView style={styles.screen}><Loading /></SafeAreaView>;
  if (request.error && !request.data) return <SafeAreaView style={styles.screen}><ErrorView message={request.error} onRetry={request.reload} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}><Text style={styles.heading}>Khóa học của tôi</Text></View>
      <View style={styles.tabs}>{FILTERS.map((item) => (
        <Pressable key={item.key} style={[styles.tab, filter === item.key && styles.tabActive]} onPress={() => setFilter(item.key)}>
          <Text style={[styles.tabText, filter === item.key && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}</View>
      <FlatList
        contentContainerStyle={styles.list}
        data={courses}
        keyExtractor={(item) => String(item.course_id)}
        renderItem={({ item }) => <MyCourseCard course={item} />}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={request.loading} onRefresh={request.reload} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
      {request.error && <Text style={styles.refreshError}>{request.error}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  heading: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  list: { flexGrow: 1, padding: spacing.lg, paddingTop: 0 },
  empty: { alignItems: 'center', padding: spacing.xxl, marginTop: spacing.xxl },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  refreshError: { color: colors.danger, fontSize: fontSize.xs, textAlign: 'center', padding: spacing.sm },
});
