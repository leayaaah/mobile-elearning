import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CourseCard } from '../../components/CourseCard';
import { ErrorView, Loading } from '../../components/ScreenState';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { getCategories, getRecommendedCourses, searchCourses } from '../../services/courseService';
import { colors, fontSize, radius, spacing } from '../../theme';
import type { Category, Course, SearchResult } from '../../types';
import { getErrorMessage } from '../../utils/format';

const PAGE_SIZE = 10;
const HOT_TOPICS = ['Python', 'JavaScript', 'UI/UX', 'Digital Marketing', 'Photoshop'];
const keyOf = (course: Course) => String(course.id);

type DiscoveryData = { categories: Category[]; recommended: Course[] };

async function loadDiscovery(): Promise<DiscoveryData> {
  const [categories, recommended] = await Promise.all([
    getCategories(), getRecommendedCourses(6),
  ]);
  return { categories, recommended };
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ categoryId?: string | string[] }>();
  const categoryParam = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const parsedCategoryId = Number(categoryParam);
  const initialCategoryId = Number.isInteger(parsedCategoryId) && parsedCategoryId > 0 ? parsedCategoryId : undefined;
  return <SearchContent key={categoryParam ?? 'all'} initialCategoryId={initialCategoryId} />;
}

function SearchContent({ initialCategoryId }: { initialCategoryId?: number }) {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(initialCategoryId);
  const debouncedQuery = useDebounce(query, 400);
  const { data: discovery, loading: discoveryLoading, error: discoveryError, reload: reloadDiscovery } = useAsync(loadDiscovery, []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetry, setSearchRetry] = useState(0);
  const nextPage = useRef(1);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const request = ++requestId.current;
    nextPage.current = 1;
    loadingMoreRef.current = false;
    // These values reset pagination and stale results when the active search changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCourses([]);
    setTotal(0);
    setLoadingMore(false);
    setLoadingResults(true);
    setSearchError(null);

    searchCourses({ query: debouncedQuery, categoryId: selectedCategoryId, page: 0, pageSize: PAGE_SIZE })
      .then((result: SearchResult) => {
        if (request !== requestId.current) return;
        setCourses(result.items);
        setTotal(result.total);
      })
      .catch((error: unknown) => {
        if (request === requestId.current) setSearchError(getErrorMessage(error));
      })
      .finally(() => {
        if (request === requestId.current) setLoadingResults(false);
      });

    return () => {
      requestId.current += 1;
    };
  }, [debouncedQuery, searchRetry, selectedCategoryId]);

  const loadMore = useCallback(async () => {
    if (loadingResults || loadingMoreRef.current || courses.length >= total || searchError) return;
    const page = nextPage.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const request = requestId.current;
    try {
      const result = await searchCourses({
        query: debouncedQuery, categoryId: selectedCategoryId, page, pageSize: PAGE_SIZE,
      });
      if (request !== requestId.current) return;
      setCourses((current) => [...current, ...result.items]);
      setTotal(result.total);
      nextPage.current = page + 1;
    } catch (error) {
      if (request === requestId.current) setSearchError(getErrorMessage(error));
    } finally {
      loadingMoreRef.current = false;
      if (request === requestId.current) setLoadingMore(false);
    }
  }, [courses.length, debouncedQuery, loadingResults, searchError, selectedCategoryId, total]);

  const selectTopic = useCallback((topic: string) => setQuery(topic), []);
  const showDiscovery = query.trim().length === 0;
  const selectedCategory = discovery?.categories.find((category) => category.id === selectedCategoryId);

  const header = (
    <View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Text style={styles.title}>Tìm kiếm</Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Tìm khóa học"
            placeholder="Tìm khóa học bạn quan tâm"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            style={styles.input}
          />
          {query.length > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel="Xóa từ khóa" onPress={() => setQuery('')} hitSlop={10}>
              <Feather name="x-circle" size={19} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {discoveryLoading && !discovery ? <View style={styles.inlineLoading}><ActivityIndicator color={colors.primary} /></View> : null}
      {discoveryError && !discovery ? (
        <ErrorView message={discoveryError} onRetry={reloadDiscovery} />
      ) : null}

      {discovery && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chủ đề nổi bật</Text>
            <View style={styles.chipWrap}>
              {HOT_TOPICS.map((topic) => (
                <Pressable key={topic} style={styles.topicChip} onPress={() => selectTopic(topic)}>
                  <Text style={styles.topicText}>{topic}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <View style={styles.chipWrap}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedCategoryId === undefined }}
                style={[styles.categoryChip, selectedCategoryId === undefined && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(undefined)}
              >
                <Text style={[styles.categoryText, selectedCategoryId === undefined && styles.categoryTextActive]}>Tất cả</Text>
              </Pressable>
              {discovery.categories.map((category) => {
                const active = selectedCategoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setSelectedCategoryId(active ? undefined : category.id)}
                  >
                    <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {showDiscovery && !selectedCategoryId && discovery.recommended.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {marginBottom: 10}]}>Dành cho bạn</Text>
              {discovery.recommended.map((course) => <CourseCard key={course.id} course={course} variant="horizontal" />)}
            </View>
          )}
        </>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>{selectedCategory ? selectedCategory.name : 'Kết quả tìm kiếm'}</Text>
        {!loadingResults && !searchError && <Text style={styles.resultCount}>{total} kết quả</Text>}
      </View>
      {loadingResults && courses.length === 0 ? <Loading /> : null}
      {searchError ? <ErrorView message={searchError} onRetry={() => setSearchRetry((value) => value + 1)} /> : null}
      {!loadingResults && !searchError && courses.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="search" size={28} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Chưa tìm thấy khóa học</Text>
          <Text style={styles.emptyText}>Thử từ khóa khác hoặc chọn một danh mục.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={courses}
      keyExtractor={keyOf}
      renderItem={({ item }) => <CourseCard course={item} variant="horizontal" />}
      ListHeaderComponent={header}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : undefined}
      onEndReached={loadMore}
      onEndReachedThreshold={0.45}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  safeArea: { backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.md },
  searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: spacing.sm },
  inlineLoading: { padding: spacing.lg },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  chipWrap: { width: '100%', alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  topicChip: { backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  topicText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  categoryChip: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textMuted, fontSize: fontSize.sm },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  resultCount: { color: colors.textMuted, fontSize: fontSize.sm },
  emptyState: { alignItems: 'center', padding: spacing.xl, marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.xs },
  footer: { paddingVertical: spacing.lg },
});
