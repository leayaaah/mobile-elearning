import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useAsync } from '../../hooks/useAsync';
import {
  getCategories, getInspiringCourses, getPopularCourses, getRecommendedCourses, getTopTeachers,
} from '../../services/courseService';
import { clearCache } from '../../lib/cache';
import { CourseCard } from '../../components/CourseCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ErrorView, Loading } from '../../components/ScreenState';
import { colors, fontSize, radius, spacing } from '../../theme';
import type { Category, Course, Teacher } from '../../types';

type HomeData = {
  categories: Category[];
  popular: Course[];
  recommended: Course[];
  inspiring: Course[];
  teachers: Teacher[];
};

async function loadHome(): Promise<HomeData> {
  const [categories, popular, recommended, inspiring, teachers] = await Promise.all([
    getCategories(), getPopularCourses(), getRecommendedCourses(), getInspiringCourses(), getTopTeachers(),
  ]);
  return { categories, popular, recommended, inspiring, teachers };
}

const keyOf = (c: Course) => String(c.id);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: cartItems } = useCart();
  const { data, loading, error, reload } = useAsync(loadHome, []);
  const [refreshing, setRefreshing] = useState(false);

  const name = (user?.user_metadata?.full_name as string | undefined) || 'bạn';

  // Kéo để làm mới: xóa cache rồi tải lại
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await clearCache();
      reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Xin chào, {name}!</Text>
            <Text style={styles.helloSub}>Hôm nay bạn muốn học gì?</Text>
          </View>
          <Pressable onPress={() => router.push('/cart')} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {cartItems.length > 0 && (
              <View style={styles.dot}><Text style={styles.dotText}>{cartItems.length}</Text></View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        {/* Banner khuyến mãi */}
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerLabel}>QUẢN LÝ DỰ ÁN</Text>
            <Text style={styles.bannerTitle}>Giảm 20%</Text>
            <Pressable style={styles.bannerBtn} onPress={() => router.push('/(tabs)/search')}>
              <Text style={styles.bannerBtnText}>Tham gia ngay</Text>
            </Pressable>
          </View>
        </View>

        {/* Danh mục */}
        <SectionHeader title="Danh mục" onViewMore={() => router.push('/(tabs)/search')} />
        <View style={styles.catGrid}>
          {data.categories.map((c) => (
            <Pressable key={c.id} style={styles.catItem} onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: String(c.id) } })}>
              <View style={[styles.catIcon, { backgroundColor: c.color ?? colors.primary }]}>
                <Feather name={(c.icon ?? 'book') as keyof typeof Feather.glyphMap} size={18} color="#fff" />
              </View>
              <Text style={styles.catName}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Khóa học phổ biến" onViewMore={() => router.push('/(tabs)/search')} />
        <HorizontalCourses courses={data.popular} />

        <SectionHeader title="Dành cho bạn" onViewMore={() => router.push('/(tabs)/search')} />
        <HorizontalCourses courses={data.recommended} />

        <SectionHeader title="Khóa học truyền cảm hứng" />
        {data.inspiring.map((c) => (
          <CourseCard key={c.id} course={c} variant="horizontal" />
        ))}

        <SectionHeader title="Giảng viên hàng đầu" />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data.teachers}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => (
            <Pressable style={styles.teacherCard} onPress={() => router.push(`/teacher/${item.id}`)}>
              <Image source={item.avatar_url} style={styles.teacherImg} contentFit="cover" cachePolicy="memory-disk" />
              <Text style={styles.teacherName} numberOfLines={1}>{item.full_name}</Text>
              <Text style={styles.teacherSub} numberOfLines={1}>{item.headline}</Text>
            </Pressable>
          )}
        />
      </ScrollView>
    </View>
  );
}

function HorizontalCourses({ courses }: { courses: Course[] }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={courses}
      keyExtractor={keyOf}
      contentContainerStyle={styles.hList}
      ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
      renderItem={({ item }) => <CourseCard course={item} />}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  hello: { color: '#fff', fontSize: fontSize.xl, fontWeight: '700' },
  helloSub: { color: '#fff', fontSize: fontSize.sm, marginTop: 2 },
  iconBtn: { padding: spacing.xs },
  dot: { position: 'absolute', top: -2, right: -4, backgroundColor: colors.danger, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  banner: { marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radius.md, backgroundColor: colors.purple, padding: spacing.xl, flexDirection: 'row' },
  bannerLabel: { color: '#fff', fontSize: fontSize.xs, opacity: 0.9 },
  bannerTitle: { color: '#fff', fontSize: fontSize.xxl, fontWeight: '800', marginVertical: spacing.sm },
  bannerBtn: { alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm },
  bannerBtnText: { color: '#fff', fontWeight: '600' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.md },
  catItem: { width: '47.5%', flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  catIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: fontSize.md, color: colors.text },
  hList: { paddingHorizontal: spacing.lg },
  teacherCard: { width: 150, marginRight: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  teacherImg: { width: '100%', height: 110, borderRadius: radius.sm },
  teacherName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  teacherSub: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
});
