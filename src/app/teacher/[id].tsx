import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAsync } from '../../hooks/useAsync';
import { getTeacher, getTeacherCourses } from '../../services/courseService';
import { ErrorView, Loading } from '../../components/ScreenState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CourseCard } from '../../components/CourseCard';
import { colors, fontSize, spacing } from '../../theme';

export default function TeacherScreen() {
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.lg },
  profile: { padding: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityText: { flex: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border },
  avatarFallback: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: colors.primarySoft },
  initials: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '800' },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  headline: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  followers: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.lg },
  followersNumber: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  followersLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  detail: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.md },
  bio: { color: colors.text, fontSize: fontSize.sm, lineHeight: 21, marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800', marginTop: spacing.xl },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
});
