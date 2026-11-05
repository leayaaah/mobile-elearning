import { useThemedStyles } from '../../context/ThemeContext';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAsync } from '../../hooks/useAsync';
import { getTeacher, getTeacherCourses } from '../../services/courseService';
import { ErrorView, Loading } from '../../components/ScreenState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CourseCard } from '../../components/CourseCard';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';

export default function TeacherScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const teacherId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : null;
  const request = useAsync(async () => {
    if (!teacherId || teacherId <= 0) throw new Error('ID giảng viên không hợp lệ');
    const [teacher, courses] = await Promise.all([getTeacher(teacherId), getTeacherCourses(teacherId)]);
    return { teacher, courses };
  }, [teacherId]);

  if (request.loading && !request.data) return <SafeAreaView style={styles.screen}><ScreenHeader title="Giảng viên" /><Loading /></SafeAreaView>;
  if (request.error && !request.data) return <SafeAreaView style={styles.screen}><ScreenHeader title="Giảng viên" /><ErrorView message={request.error} onRetry={request.reload} /></SafeAreaView>;
  if (!request.data) return null;
  const { teacher, courses } = request.data;
  const initials = teacher.full_name.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title="Giảng viên" />
      <FlatList
        data={courses}
        keyExtractor={(course) => String(course.id)}
        renderItem={({ item }) => <CourseCard course={item} variant="horizontal" />}
        ListHeaderComponent={<View style={styles.profile}>
          <View style={styles.identity}>
            {teacher.avatar_url ? <Image source={teacher.avatar_url} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Text style={styles.initials}>{initials}</Text></View>}
            <View style={styles.identityText}><Text style={styles.name}>{teacher.full_name}</Text>{teacher.headline && <Text style={styles.headline}>{teacher.headline}</Text>}</View>
          </View>
          <View style={styles.followers}><Text style={styles.followersNumber}>{teacher.followers_count}</Text><Text style={styles.followersLabel}>người theo dõi</Text></View>
          {teacher.location && <Text style={styles.detail}>⌖ {teacher.location}</Text>}
          {teacher.bio && <Text style={styles.bio}>{teacher.bio}</Text>}
          <Text style={styles.sectionTitle}>Khóa học của giảng viên</Text>
        </View>}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>Chưa có khóa học</Text><Text style={styles.emptyText}>Giảng viên này chưa có khóa học nào.</Text></View>}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={request.reload}
        refreshing={request.loading}
      />
    </SafeAreaView>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: uiColors.background },
  list: { paddingBottom: uiSpacing.xl },
  profile: { padding: uiSpacing.gutter },
  identity: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md },
  identityText: { flex: 1 },
  avatar: { width: 72, height: 72, borderRadius: uiRadius.pill, backgroundColor: uiColors.surfaceContainer },
  avatarFallback: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.pill, backgroundColor: uiColors.primarySoft },
  initials: { color: uiColors.primary, ...uiType.headlineLarge, fontWeight: '800' },
  name: { color: uiColors.text, ...uiType.headlineMedium, fontWeight: '800' },
  headline: { color: uiColors.textMuted, ...uiType.bodyMedium, marginTop: uiSpacing.xs },
  followers: { flexDirection: 'row', alignItems: 'baseline', gap: uiSpacing.xs, marginTop: uiSpacing.lg, padding: uiSpacing.md, borderRadius: uiRadius.lg, backgroundColor: uiColors.surface, ...uiShadow.small },
  followersNumber: { color: uiColors.primary, ...uiType.headlineSmall, fontWeight: '800' },
  followersLabel: { color: uiColors.textMuted, ...uiType.bodySmall },
  detail: { color: uiColors.textMuted, ...uiType.bodyMedium, marginTop: uiSpacing.md },
  bio: { color: uiColors.text, ...uiType.bodyMedium, marginTop: uiSpacing.md },
  sectionTitle: { color: uiColors.text, ...uiType.headlineSmall, marginTop: uiSpacing.lg },
  empty: { alignItems: 'center', padding: uiSpacing.xl },
  emptyTitle: { color: uiColors.text, ...uiType.headlineSmall },
  emptyText: { color: uiColors.textMuted, ...uiType.bodyMedium, textAlign: 'center', marginTop: uiSpacing.sm },
});
