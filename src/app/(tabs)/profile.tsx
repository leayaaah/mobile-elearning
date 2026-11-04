import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getMyCourses, getProfile, getSavedCourses, removeBookmark, updateProfile } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import { ErrorView, Loading } from '../../components/ScreenState';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';
import type { Course, Profile } from '../../types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const request = useAsync(async () => {
    if (!user) throw new Error('Vui lòng đăng nhập để xem hồ sơ');
    const [nextProfile, nextSaved, myCourses] = await Promise.all([getProfile(user.id), getSavedCourses(user.id), getMyCourses(user.id)]);
    setProfile(nextProfile);
    setSavedCourses(nextSaved);
    return { nextProfile, nextSaved, myCourses };
  }, [user?.id]);

  const refresh = () => request.reload();
  const openEdit = () => { setNameDraft(profile?.full_name ?? ''); setActionError(null); setEditVisible(true); };
  const saveName = async () => {
    if (!user || !profile) return;
    const fullName = nameDraft.trim();
    if (!fullName) { setActionError('Họ tên không được để trống'); return; }
    setSaveLoading(true); setActionError(null);
    try {
      await updateProfile(user.id, { full_name: fullName });
      setProfile({ ...profile, full_name: fullName });
      setEditVisible(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể cập nhật họ tên');
    } finally { setSaveLoading(false); }
  };
  const unsave = async (courseId: number) => {
    if (!user) return;
    const previous = savedCourses;
    setSavedCourses((courses) => courses.filter((course) => course.id !== courseId));
    try { await removeBookmark(user.id, courseId); }
    catch (error) {
      setSavedCourses(previous);
      Alert.alert('Không thể bỏ lưu', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };
  const logout = async () => {
    setSigningOut(true); setActionError(null);
    try { await signOut(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Đăng xuất thất bại'); setSigningOut(false); }
  };

  if (!user) return <SafeAreaView style={styles.screen}><ErrorView message="Vui lòng đăng nhập để xem hồ sơ." /></SafeAreaView>;
  if (request.loading && !request.data) return <SafeAreaView style={styles.screen}><Loading /></SafeAreaView>;
  if (request.error && !request.data) return <SafeAreaView style={styles.screen}><ErrorView message={request.error} onRetry={request.reload} /></SafeAreaView>;
  if (!profile || !request.data) return null;

  const initials = profile.full_name.trim().slice(0, 1).toUpperCase() || (user.email?.slice(0, 1).toUpperCase() ?? '?');
  const completed = request.data.myCourses.filter((course) => course.progress >= 100).length;
  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={savedCourses}
        keyExtractor={(course) => String(course.id)}
        renderItem={({ item }) => <SavedCourseRow course={item} onRemove={() => unsave(item.id)} onOpen={() => router.push(`/course/${item.id}`)} />}
        ListHeaderComponent={<View>
          <View style={styles.top}><View style={styles.avatarWrap}>{profile.avatar_url ? <Image source={profile.avatar_url} style={styles.avatar} contentFit="cover" /> : <Text style={styles.initials}>{initials}</Text>}</View><View style={styles.identity}><Text style={styles.name}>{profile.full_name || 'Chưa đặt tên'}</Text><Text style={styles.email}>{user.email ?? ''}</Text></View><Pressable onPress={openEdit} hitSlop={10} style={styles.editButton}><Ionicons name="create-outline" size={24} color={uiColors.primary} /></Pressable></View>
          <View style={styles.stats}><Stat value={String(request.data.myCourses.length)} label="Đã ghi danh" /><Stat value={String(completed)} label="Đã hoàn thành" /><Stat value={String(savedCourses.length)} label="Đã lưu" /></View>
          <Text style={styles.sectionTitle}>Khóa học đã lưu</Text>
        </View>}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="bookmark-outline" size={30} color={uiColors.textMuted} /><Text style={styles.emptyTitle}>Chưa có khóa học đã lưu</Text><Text style={styles.emptyText}>Nhấn biểu tượng lưu ở khóa học để xem lại tại đây.</Text></View>}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={request.loading} onRefresh={refresh} tintColor={uiColors.primary} />}
        showsVerticalScrollIndicator={false}
      />
      {actionError && <Text style={styles.actionError}>{actionError}</Text>}
      <Pressable style={styles.logout} onPress={logout} disabled={signingOut}><Text style={styles.logoutText}>{signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text></Pressable>
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.modal}><Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text><Text style={styles.label}>Họ tên</Text><TextInput value={nameDraft} onChangeText={setNameDraft} style={styles.input} autoFocus maxLength={120} /><View style={styles.modalActions}><Pressable onPress={() => setEditVisible(false)} style={styles.cancel}><Text style={styles.cancelText}>Hủy</Text></Pressable><Pressable onPress={saveName} disabled={saveLoading} style={styles.save}><Text style={styles.saveText}>{saveLoading ? 'Đang lưu...' : 'Lưu'}</Text></Pressable></View></View></KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

function SavedCourseRow({ course, onRemove, onOpen }: { course: Course; onRemove: () => void; onOpen: () => void }) {
  return <Pressable style={styles.courseRow} onPress={onOpen}><Image source={course.thumbnail_url} style={styles.courseImage} contentFit="cover" /><View style={styles.courseInfo}><Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>{course.teacher && <Text style={styles.courseTeacher} numberOfLines={1}>{course.teacher.full_name}</Text>}</View><Pressable onPress={onRemove} hitSlop={10} style={styles.removeSavedButton}><Ionicons name="bookmark" size={22} color={uiColors.primary} /></Pressable></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: uiColors.background }, list: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md, paddingBottom: uiSpacing.lg },
  avatarWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36, backgroundColor: uiColors.primarySoft, overflow: 'hidden' }, avatar: { width: '100%', height: '100%' }, initials: { color: uiColors.primary, fontSize: uiType.headlineLarge.fontSize, fontWeight: '800' }, identity: { flex: 1 }, name: { color: uiColors.text, fontSize: uiType.headlineMedium.fontSize, fontWeight: '800' }, email: { color: uiColors.textMuted, fontSize: uiType.bodySmall.fontSize, marginTop: uiSpacing.xs },
  stats: { flexDirection: 'row', paddingVertical: uiSpacing.gutter, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, ...uiShadow.small }, stat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: uiColors.border }, statValue: { color: uiColors.primary, fontSize: uiType.headlineMedium.fontSize, fontWeight: '800' }, statLabel: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize, marginTop: uiSpacing.xs, textAlign: 'center' },
  sectionTitle: { color: uiColors.text, fontSize: uiType.headlineSmall.fontSize, fontWeight: '800', marginTop: uiSpacing.lg, marginBottom: uiSpacing.md }, courseRow: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md, padding: uiSpacing.md, marginBottom: uiSpacing.md, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, ...uiShadow.small }, courseImage: { width: 92, height: 72, borderRadius: uiRadius.md, backgroundColor: uiColors.border }, courseInfo: { flex: 1 }, courseTitle: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' }, courseTeacher: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize, marginTop: uiSpacing.sm }, empty: { alignItems: 'center', padding: uiSpacing.xl }, emptyTitle: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700', marginTop: uiSpacing.md }, emptyText: { color: uiColors.textMuted, fontSize: uiType.bodySmall.fontSize, textAlign: 'center', marginTop: uiSpacing.sm },
  logout: { minHeight: 48, margin: uiSpacing.gutter, marginTop: 0, alignItems: 'center', padding: uiSpacing.md, borderWidth: 1, borderColor: uiColors.danger, borderRadius: uiRadius.lg }, logoutText: { color: uiColors.danger, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' }, actionError: { color: uiColors.danger, fontSize: uiType.bodySmall.fontSize, textAlign: 'center', paddingHorizontal: uiSpacing.gutter, marginBottom: uiSpacing.sm },
  editButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeSavedButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' }, modal: { padding: uiSpacing.lg, backgroundColor: uiColors.surface, borderTopLeftRadius: uiRadius.lg, borderTopRightRadius: uiRadius.lg }, modalTitle: { color: uiColors.text, fontSize: uiType.headlineMedium.fontSize, fontWeight: '800', marginBottom: uiSpacing.gutter }, label: { color: uiColors.textMuted, fontSize: uiType.bodySmall.fontSize, marginBottom: uiSpacing.xs }, input: { minHeight: 48, backgroundColor: uiColors.surface, color: uiColors.text, ...uiType.bodyMedium, padding: uiSpacing.md, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: uiSpacing.md, marginTop: uiSpacing.lg }, cancel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: uiSpacing.md }, cancelText: { color: uiColors.textMuted, fontWeight: '700' }, save: { minHeight: 48, justifyContent: 'center', paddingHorizontal: uiSpacing.lg, backgroundColor: uiColors.primary, borderRadius: uiRadius.lg }, saveText: { color: uiColors.surface, fontWeight: '700' },
});
