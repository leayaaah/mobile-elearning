import { useThemedStyles } from '../../context/ThemeContext';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useConsent } from '../../context/ConsentContext';
import { useCart } from '../../context/CartContext';
import { useAsync } from '../../hooks/useAsync';
import {
  getCategories, getInspiringCourses, getPopularCourses, getRecommendedCourses, getTopTeachers,
} from '../../services/courseService';
import { clearCache } from '../../lib/cache';
import { getPersonalizedCourses } from '../../services/recommendationService';
import { CourseCard } from '../../components/CourseCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ErrorView, Loading } from '../../components/ScreenState';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';
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
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { status: consentStatus, revision: consentRevision } = useConsent();
  const userId = user?.id;
  const { items: cartItems } = useCart();
  const { data, loading, error, reload } = useAsync(loadHome, []);
  const [refreshing, setRefreshing] = useState(false);
  const [personalized, setPersonalized] = useState<Course[] | null>(null);

  useFocusEffect(useCallback(() => {
    void consentRevision;
    let active = true;
    setPersonalized(null);
    void getPersonalizedCourses(userId, 8, consentStatus === 'granted').then((courses) => {
      if (active) setPersonalized(courses);
    }).catch((cause: unknown) => {
      if (__DEV__) console.warn('Không thể tải gợi ý cá nhân.', cause);
    });
    return () => { active = false; };
  }, [userId, consentStatus, consentRevision]));

  const name = (user?.user_metadata?.full_name as string | undefined) || 'bạn';

  // Kéo để làm mới: xóa cache rồi tải lại
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await clearCache();
      reload();
      // Safe handling: only call getPersonalizedCourses if userId is valid
      if (userId) {
        setPersonalized(await getPersonalizedCourses(userId, 8, consentStatus === 'granted'));
      } else {
        setPersonalized(null);
      }
    } catch (cause) {
      if (__DEV__) console.warn('Không thể làm mới gợi ý.', cause);
    } finally {
      setRefreshing(false);
    }
  }, [reload, userId, consentStatus]);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <Text style={styles.hello}>Xin chào, {name}!</Text>
            <Text style={styles.helloSub}>Hôm nay bạn muốn học gì?</Text>
          </View>
          <Pressable onPress={() => router.push('/cart')} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="cart-outline" size={24} color={uiColors.textMuted} />
            {cartItems.length > 0 && (
              <View style={styles.dot}><Text style={styles.dotText}>{cartItems.length}</Text></View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={uiColors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Danh mục */}
        <SectionHeader title="Danh mục" onViewMore={() => router.push('/(tabs)/search')} />
        <View style={styles.catGrid}>
          {data.categories.map((c) => (
            <Pressable key={c.id} style={styles.catItem} onPress={() => router.push({ pathname: '/(tabs)/search', params: { categoryId: String(c.id) } })}>
              <View style={[styles.catIcon, { backgroundColor: c.color ?? uiColors.primary }]}>
                <Feather name={(c.icon ?? 'book') as keyof typeof Feather.glyphMap} size={18} color={uiColors.onPrimary} />
              </View>
              <Text style={styles.catName}>{c.name}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Khóa học phổ biến" onViewMore={() => router.push('/(tabs)/search')} />
        <HorizontalCourses courses={data.popular} />

        <SectionHeader title="Dành cho bạn" onViewMore={() => router.push('/(tabs)/search')} />
        <HorizontalCourses courses={personalized ?? data.recommended} />

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
      {user && (
        <Pressable style={styles.chatFloat} onPress={() => router.push('/chat')} accessibilityRole="button" accessibilityLabel="Hỏi trợ lý AI để tìm khóa học phù hợp">
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={uiColors.onPrimary} />
          <Text style={styles.chatFloatText}>Trợ lý AI</Text>
        </Pressable>
      )}
    </View>
  );
}

function HorizontalCourses({ courses }: { courses: Course[] }) {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={courses}
      keyExtractor={keyOf}
      contentContainerStyle={styles.hList}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => <CourseCard course={item} />}
    />
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  header: { backgroundColor: uiColors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: uiSpacing.gutter, paddingVertical: uiSpacing.sm },
  headerIdentity: { flex: 1 },
  hello: { color: uiColors.text, ...uiType.headlineSmall },
  helloSub: { color: uiColors.textMuted, ...uiType.bodySmall, marginTop: uiSpacing.xs },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.md },
  dot: { position: 'absolute', top: 0, right: 0, backgroundColor: uiColors.danger, minWidth: 16, height: 16, borderRadius: uiRadius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: uiSpacing.xs },
  dotText: { color: uiColors.onDanger, ...uiType.labelSmall },
  scrollContent: { paddingTop: uiSpacing.md, paddingBottom: uiSpacing.xl * 3 },
  chatFloat: { position: 'absolute', right: uiSpacing.gutter, bottom: uiSpacing.gutter, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.sm, paddingHorizontal: uiSpacing.md, borderRadius: uiRadius.pill, backgroundColor: uiColors.primary, ...uiShadow.large },
  chatFloatText: { color: uiColors.onPrimary, ...uiType.labelLarge },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: uiSpacing.gutter, gap: uiSpacing.md },
  catItem: { width: '47%', minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.sm, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, padding: uiSpacing.sm, ...uiShadow.small },
  catIcon: { width: 44, height: 44, borderRadius: uiRadius.md, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, ...uiType.labelLarge, color: uiColors.text },
  hList: { paddingHorizontal: uiSpacing.gutter },
  separator: { width: uiSpacing.md },
  teacherCard: { width: 150, marginRight: uiSpacing.md, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, padding: uiSpacing.md, ...uiShadow.small },
  teacherImg: { width: '100%', height: 110, borderRadius: uiRadius.md },
  teacherName: { ...uiType.labelLarge, fontWeight: '700', color: uiColors.text, marginTop: uiSpacing.sm },
  teacherSub: { ...uiType.bodySmall, color: uiColors.textMuted, marginTop: uiSpacing.xs },
});
