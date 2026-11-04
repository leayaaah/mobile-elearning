import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorView, Loading } from '../../components/ScreenState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { getCurriculum, getQAPosts, getResources } from '../../services/courseService';
import {
  createQAPost, getCompletedLessonIds, isEnrolled, markLessonDone,
} from '../../services/userService';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';
import type { CourseResource, Lesson, QAPost, Section } from '../../types';
import { formatDuration, getErrorMessage, timeAgo } from '../../utils/format';

type Tab = 'lessons' | 'qa' | 'resources';
type Access = 'checking' | 'allowed' | 'error';
type LoadState<T> = { loading: boolean; error: string | null; data: T | null };

const initialLoadState = <T,>(): LoadState<T> => ({ loading: true, error: null, data: null });
const tabs: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'lessons', label: 'Bài học', icon: 'play-circle-outline' },
  { key: 'qa', label: 'Hỏi đáp', icon: 'chatbubbles-outline' },
  { key: 'resources', label: 'Tài liệu', icon: 'folder-open-outline' },
];

export default function LearnScreen() {
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeId = Array.isArray(rawId) ? rawId[0] : rawId;
  const courseId = Number(routeId);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [access, setAccess] = useState<Access>('checking');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const [curriculum, setCurriculum] = useState<LoadState<Section[]>>(initialLoadState);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [progressState, setProgressState] = useState<LoadState<number[]>>(initialLoadState);
  const [resources, setResources] = useState<LoadState<CourseResource[]>>(initialLoadState);
  const [qaPosts, setQaPosts] = useState<LoadState<QAPost[]>>(initialLoadState);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<number | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(courseId) || courseId < 1) {
      setAccess('error');
      setAccessError('Không tìm thấy khóa học.');
      return () => { active = false; };
    }
    if (authLoading) return () => { active = false; };
    if (!user) {
      router.replace('/(auth)/login');
      return () => { active = false; };
    }

    setAccess('checking');
    setAccessError(null);
    void isEnrolled(user.id, courseId).then((enrolled) => {
      if (!active) return;
      if (!enrolled) {
        router.replace({
          pathname: '/course/[id]',
          params: { id: String(courseId), enrollmentRequired: '1' },
        });
        return;
      }
      setAccess('allowed');
    }).catch((error: unknown) => {
      if (!active) return;
      setAccessError(getErrorMessage(error));
      setAccess('error');
    });
    return () => { active = false; };
  }, [authLoading, courseId, router, user]);

  const loadCurriculum = useCallback(async () => {
    setCurriculum((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getCurriculum(courseId);
      setCurriculum({ data: result, error: null, loading: false });
    } catch (error) {
      setCurriculum((current) => ({ ...current, error: getErrorMessage(error), loading: false }));
    }
  }, [courseId]);

  const loadProgress = useCallback(async () => {
    if (!user) return;
    setProgressState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await getCompletedLessonIds(user.id, courseId);
      setCompletedIds(result);
      setProgressState({ data: result, error: null, loading: false });
    } catch (error) {
      setProgressState((current) => ({ ...current, error: getErrorMessage(error), loading: false }));
    }
  }, [courseId, user]);

  const loadResources = useCallback(async () => {
    setResources((current) => ({ ...current, loading: true, error: null }));
    try {
      setResources({ data: await getResources(courseId), error: null, loading: false });
    } catch (error) {
      setResources((current) => ({ ...current, error: getErrorMessage(error), loading: false }));
    }
  }, [courseId]);

  const loadQAPosts = useCallback(async () => {
    setQaPosts((current) => ({ ...current, loading: true, error: null }));
    try {
      setQaPosts({ data: await getQAPosts(courseId), error: null, loading: false });
    } catch (error) {
      setQaPosts((current) => ({ ...current, error: getErrorMessage(error), loading: false }));
    }
  }, [courseId]);

  useEffect(() => {
    if (access !== 'allowed') return;
    void Promise.all([loadCurriculum(), loadProgress(), loadResources(), loadQAPosts()]);
  }, [access, loadCurriculum, loadProgress, loadResources, loadQAPosts]);

  const lessons = useMemo(() => curriculum.data?.flatMap((section) => section.lessons) ?? [], [curriculum.data]);
  const selectedLesson: Lesson | undefined = lessons.find((lesson) => lesson.id === selectedLessonId) ?? lessons[0];
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const progressPercent = lessons.length ? Math.round((completedIds.length / lessons.length) * 100) : 0;

  const completeLesson = async (lesson: Lesson) => {
    if (!user || completedSet.has(lesson.id)) return;
    setSavingLessonId(lesson.id);
    setLessonError(null);
    try {
      await markLessonDone(user.id, courseId, lesson.id);
      setCompletedIds((current) => current.includes(lesson.id) ? current : [...current, lesson.id]);
      setProgressState((current) => ({ ...current, data: completedIds.includes(lesson.id) ? completedIds : [...completedIds, lesson.id] }));
    } catch (error) {
      setLessonError(getErrorMessage(error));
    } finally {
      setSavingLessonId(null);
    }
  };

  const submitQuestion = async () => {
    const content = question.trim();
    if (!user || !content) return;
    setPostingQuestion(true);
    setQuestionError(null);
    try {
      await createQAPost(user.id, courseId, content);
      setQuestion('');
      await loadQAPosts();
    } catch (error) {
      setQuestionError(getErrorMessage(error));
    } finally {
      setPostingQuestion(false);
    }
  };

  if (authLoading || access === 'checking') return <Loading />;
  if (access === 'error') {
    return <ErrorView message={accessError ?? 'Không thể xác nhận quyền học.'} onRetry={() => {
      setAccess('checking');
      setAccessError(null);
      if (!user) return;
      void isEnrolled(user.id, courseId).then((enrolled) => {
        if (enrolled) setAccess('allowed');
        else router.replace({
          pathname: '/course/[id]',
          params: { id: String(courseId), enrollmentRequired: '1' },
        });
      }).catch((error: unknown) => {
        setAccessError(getErrorMessage(error));
        setAccess('error');
      });
    }} />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.root}>
      <ScreenHeader title="Đang học" />
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <Pressable key={tab.key} style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]} onPress={() => setActiveTab(tab.key)}>
            <Ionicons name={tab.icon} size={17} color={activeTab === tab.key ? uiColors.primary : uiColors.textMuted} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'lessons' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeading}>
              <Text style={styles.cardTitle}>Tiến độ học tập</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>
            <ProgressBar progress={progressPercent} />
            <Text style={styles.mutedText}>{completedIds.length}/{lessons.length} bài đã hoàn thành</Text>
          </View>

          {curriculum.loading && !curriculum.data ? <Loading /> : curriculum.error && !curriculum.data ? (
            <ErrorView message={curriculum.error} onRetry={() => { void loadCurriculum(); }} />
          ) : lessons.length === 0 ? <EmptyState text="Khóa học chưa có bài học." /> : (
            <>
              <View style={styles.videoCard}>
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={54} color={uiColors.onPrimary} />
                  <Text style={styles.videoLabel}>{selectedLesson?.title ?? 'Chọn một bài học'}</Text>
                </View>
                {selectedLesson?.video_url ? (
                  <Pressable style={styles.videoLink} onPress={() => {
                    const url = selectedLesson?.video_url;
                    if (url) openExternalLink(url);
                  }}>
                    <Feather name="external-link" size={16} color={uiColors.primary} />
                    <Text style={styles.videoLinkText}>Mở video bài học</Text>
                  </Pressable>
                ) : <Text style={styles.mutedText}>Video sẽ được cập nhật sau.</Text>}
              </View>
              {progressState.error ? <InlineError message={progressState.error} onRetry={() => { void loadProgress(); }} /> : null}
              {lessonError ? <InlineError message={lessonError} /> : null}
              {curriculum.data?.map((section, index) => (
                <View key={section.id} style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>{index + 1}. {section.title}</Text>
                  {section.lessons.map((lesson) => {
                    const done = completedSet.has(lesson.id);
                    const selected = lesson.id === selectedLesson?.id;
                    return (
                      <View key={lesson.id} style={[styles.lessonRow, selected && styles.lessonRowActive]}>
                        <Pressable style={styles.lessonSelect} onPress={() => setSelectedLessonId(lesson.id)} accessibilityRole="button">
                          <Ionicons name={done ? 'checkmark-circle' : 'play-circle-outline'} size={22} color={done ? uiColors.primary : uiColors.textMuted} />
                          <Text style={[styles.lessonTitle, selected && styles.lessonTitleActive]} numberOfLines={2}>{lesson.title}</Text>
                          <Text style={styles.lessonDuration}>{formatDuration(lesson.duration_seconds)}</Text>
                        </Pressable>
                        {done ? null : (
                          <Pressable style={styles.lessonComplete} accessibilityRole="button" accessibilityLabel={`Đánh dấu ${lesson.title} hoàn thành`} onPress={() => { void completeLesson(lesson); }}>
                            {savingLessonId === lesson.id ? <ActivityIndicator color={uiColors.primary} /> : <Feather name="check" size={18} color={uiColors.primary} />}
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : null}

      {activeTab === 'qa' ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Hỏi đáp</Text>
          <Text style={styles.mutedText}>Đặt câu hỏi và trao đổi cùng giảng viên, học viên.</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Bạn muốn hỏi điều gì?"
            placeholderTextColor={uiColors.textMuted}
            multiline
            maxLength={2000}
            style={styles.questionInput}
            textAlignVertical="top"
          />
          {questionError ? <InlineError message={questionError} /> : null}
          <Pressable style={[styles.primaryButton, (!question.trim() || postingQuestion) && styles.disabledButton]} disabled={!question.trim() || postingQuestion} onPress={() => { void submitQuestion(); }}>
            {postingQuestion ? <ActivityIndicator color={uiColors.onPrimary} /> : <Text style={styles.primaryButtonText}>Đăng câu hỏi</Text>}
          </Pressable>
          {qaPosts.loading && !qaPosts.data ? <Loading /> : qaPosts.error && !qaPosts.data ? (
            <ErrorView message={qaPosts.error} onRetry={() => { void loadQAPosts(); }} />
          ) : qaPosts.data?.length ? qaPosts.data.map((post) => (
            <View key={post.id} style={styles.qaCard}>
              <View style={styles.qaHeader}><Text style={styles.qaAuthor}>{post.author_name}</Text><Text style={styles.qaDate}>{timeAgo(post.created_at)}</Text></View>
              <Text style={styles.qaContent}>{post.content}</Text>
              <Text style={styles.qaMeta}>{post.comments_count} phản hồi · {post.likes_count} lượt thích</Text>
            </View>
          )) : <EmptyState text="Chưa có câu hỏi nào. Hãy bắt đầu cuộc trao đổi!" />}
        </ScrollView>
        </KeyboardAvoidingView>
      ) : null}

      {activeTab === 'resources' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Tài liệu và dự án</Text>
          <Text style={styles.mutedText}>Tài liệu dành cho học viên đã ghi danh.</Text>
          {resources.loading && !resources.data ? <Loading /> : resources.error && !resources.data ? (
            <ErrorView message={resources.error} onRetry={() => { void loadResources(); }} />
          ) : resources.data?.length ? resources.data.map((resource) => (
            <Pressable
              key={resource.id}
              style={[styles.resourceCard, !resource.url && styles.resourceCardDisabled]}
              disabled={!resource.url}
              onPress={() => { if (resource.url) openExternalLink(resource.url); }}
            >
              <View style={styles.resourceIcon}><Ionicons name="document-text-outline" size={22} color={uiColors.primary} /></View>
              <View style={styles.resourceInfo}><Text style={styles.resourceName}>{resource.name}</Text><Text style={styles.mutedText}>{resource.size_label || 'Tài liệu khóa học'}</Text></View>
              <Feather name={resource.url ? 'download' : 'minus'} size={18} color={uiColors.primary} />
            </Pressable>
          )) : <EmptyState text="Chưa có tài liệu cho khóa học này." />}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function EmptyState({ text }: { text: string }) {
  return <View style={styles.emptyState}><Ionicons name="file-tray-outline" size={28} color={uiColors.textMuted} /><Text style={styles.emptyText}>{text}</Text></View>;
}

function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Thử lại</Text></Pressable> : null}
    </View>
  );
}

function openExternalLink(url: string) {
  void Linking.openURL(url).catch((error: unknown) => {
    Alert.alert('Không thể mở liên kết', getErrorMessage(error));
  });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  flex: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: uiColors.surface, borderBottomWidth: 1, borderBottomColor: uiColors.border },
  tabButton: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: uiSpacing.xs, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: uiColors.primary },
  tabText: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize, fontWeight: '600' },
  tabTextActive: { color: uiColors.primary },
  content: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl, gap: uiSpacing.md },
  progressCard: { padding: uiSpacing.md, borderRadius: uiRadius.lg, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, gap: uiSpacing.sm, ...uiShadow.small },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  progressPercent: { color: uiColors.primary, fontSize: uiType.bodyMedium.fontSize, fontWeight: '800' },
  mutedText: { color: uiColors.textMuted, fontSize: uiType.bodySmall.fontSize },
  videoCard: { overflow: 'hidden', borderRadius: uiRadius.lg, backgroundColor: uiColors.surface, paddingBottom: uiSpacing.md, gap: uiSpacing.sm },
  videoPlaceholder: { minHeight: 190, alignItems: 'center', justifyContent: 'center', gap: uiSpacing.sm, backgroundColor: uiColors.text, padding: uiSpacing.gutter },
  videoLabel: { color: uiColors.onPrimary, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700', textAlign: 'center' },
  videoLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.sm, paddingHorizontal: uiSpacing.md },
  videoLinkText: { color: uiColors.primary, fontSize: uiType.bodySmall.fontSize, fontWeight: '700' },
  sectionCard: { backgroundColor: uiColors.surface, borderRadius: uiRadius.lg, borderWidth: 1, borderColor: uiColors.border, overflow: 'hidden', ...uiShadow.small },
  sectionTitle: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700', padding: uiSpacing.md },
  lessonRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.sm, paddingHorizontal: uiSpacing.md, borderTopWidth: 1, borderTopColor: uiColors.border },
  lessonSelect: { flex: 1, minWidth: 0, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.sm },
  lessonComplete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  lessonRowActive: { backgroundColor: uiColors.primarySoft },
  lessonTitle: { flex: 1, color: uiColors.text, fontSize: uiType.bodySmall.fontSize },
  lessonTitleActive: { color: uiColors.primary, fontWeight: '700' },
  lessonDuration: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize },
  heading: { color: uiColors.text, fontSize: uiType.headlineMedium.fontSize, fontWeight: '800' },
  questionInput: { minHeight: 110, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.md, backgroundColor: uiColors.surface, color: uiColors.text, ...uiType.bodyMedium, padding: uiSpacing.md },
  primaryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: uiColors.primary, borderRadius: uiRadius.md },
  primaryButtonText: { color: uiColors.onPrimary, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
  qaCard: { padding: uiSpacing.md, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, gap: uiSpacing.sm, ...uiShadow.small },
  qaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiSpacing.sm },
  qaAuthor: { flex: 1, color: uiColors.text, fontSize: uiType.bodySmall.fontSize, fontWeight: '700' },
  qaDate: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize },
  qaContent: { color: uiColors.text, ...uiType.bodyMedium },
  qaMeta: { color: uiColors.textMuted, fontSize: uiType.labelSmall.fontSize },
  resourceCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md, backgroundColor: uiColors.surface, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.lg, padding: uiSpacing.md, ...uiShadow.small },
  resourceCardDisabled: { opacity: 0.65 },
  resourceIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.md, backgroundColor: uiColors.primarySoft },
  resourceInfo: { flex: 1, gap: uiSpacing.xs },
  resourceName: { color: uiColors.text, fontSize: uiType.bodyMedium.fontSize, fontWeight: '700' },
  emptyState: { alignItems: 'center', gap: uiSpacing.md, padding: uiSpacing.lg, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg },
  emptyText: { color: uiColors.textMuted, ...uiType.bodyMedium, textAlign: 'center' },
  errorBox: { padding: uiSpacing.md, borderRadius: uiRadius.lg, backgroundColor: uiColors.dangerSoft, gap: uiSpacing.sm },
  errorText: { color: uiColors.danger, fontSize: uiType.bodySmall.fontSize },
  retryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  retryText: { color: uiColors.primary, ...uiType.labelLarge },
});
