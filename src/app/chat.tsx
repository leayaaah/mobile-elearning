import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CourseCard } from '../components/CourseCard';
import { ChatBubble } from '../components/ChatBubble';
import { useAuth } from '../context/AuthContext';
import { sendAdvisorMessage } from '../services/chatService';
import { AdvisorError, type AdvisorReply, type ChatTurn } from '../types/ai';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../theme';

type Message = { id: number; role: 'user' | 'assistant'; content: string; result?: AdvisorReply };
const errorText = (cause: unknown) => {
  if (cause instanceof AdvisorError) {
    switch (cause.code) {
      case 'INVALID_INPUT': return 'Tin nhắn phải có nội dung và không quá 500 ký tự.';
      case 'UNAUTHORIZED': return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      case 'RATE_LIMITED': return 'Bạn đã dùng hết 30 lượt tư vấn hôm nay. Hãy quay lại ngày mai.';
      case 'EMBEDDING_UNAVAILABLE': return 'Chưa thể tìm khóa học lúc này. Vui lòng thử lại sau.';
      default: return 'Trợ lý tạm thời không phản hồi. Vui lòng thử lại.';
    }
  }
  return 'Không thể kết nối. Vui lòng thử lại.';
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);
  const nextId = useRef(1);
  const list = useRef<FlatList<Message>>(null);
  const sending = useRef(false);

  async function send(text: string, retry = false) {
    const content = text.trim();
    if (!content || sending.current || !user) return;
    if (text.length > 500) { setFailure('Tin nhắn không được vượt quá 500 ký tự.'); return; }
    sending.current = true;
    setPending(true);
    setFailure(null);
    setRetryText(null);
    const previous = retry ? messages.slice(0, -1) : messages;
    const history: ChatTurn[] = previous.slice(-6).map(({ role, content: value }) => ({ role, content: value }));
    if (!retry) {
      setMessages((current) => [...current, { id: nextId.current++, role: 'user', content }]);
      setDraft('');
    }
    try {
      const result = await sendAdvisorMessage(content, history);
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', content: result.reply, result }]);
    } catch (cause) {
      setFailure(errorText(cause));
      setRetryText(content);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}><Text style={styles.back}>‹  Quay lại</Text></Pressable>
        <Text style={styles.title}>Trợ lý tư vấn khóa học</Text>
      </View>
      {!user ? <Text style={styles.notice}>Vui lòng đăng nhập để hỏi trợ lý.</Text> : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={<Text style={styles.welcome}>Bạn muốn học gì? Hãy mô tả mục tiêu của mình để nhận gợi ý khóa học.</Text>}
            renderItem={({ item }) => (
              <ChatBubble role={item.role} content={item.content}>
                {item.result?.courses.map((course) => <View key={course.id} style={styles.course}><CourseCard course={course} variant="horizontal" /></View>)}
              </ChatBubble>
            )}
            ListFooterComponent={<>
              {pending && <View style={styles.waiting}><ActivityIndicator color={uiColors.primary} /><Text style={styles.waitingText}> Đang soạn câu trả lời...</Text></View>}
              {failure && <View style={styles.errorBox}><Text style={styles.errorText}>{failure}</Text>
                {retryText && <Pressable disabled={pending} onPress={() => void send(retryText, true)} style={styles.retryButton}><Text style={styles.retry}>Thử lại</Text></Pressable>}
              </View>}
            </>}
          />
          <View style={styles.inputRow}>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Nhập nhu cầu học của bạn..." placeholderTextColor={uiColors.outline} multiline maxLength={500}
              style={styles.input} editable={!pending} accessibilityLabel="Tin nhắn tư vấn" />
            <Pressable disabled={pending || !draft.trim()} onPress={() => void send(draft)} style={[styles.send, (pending || !draft.trim()) && styles.disabled]}>
              <Text style={styles.sendText}>Gửi</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background }, flex: { flex: 1 },
  header: { paddingHorizontal: uiSpacing.gutter, paddingVertical: uiSpacing.sm, backgroundColor: uiColors.background, borderBottomWidth: 1, borderColor: uiColors.border },
  backButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  back: { color: uiColors.primary, ...uiType.labelLarge }, title: { color: uiColors.text, ...uiType.headlineMedium, marginTop: uiSpacing.xs },
  messages: { flexGrow: 1, padding: uiSpacing.gutter, gap: uiSpacing.md },
  welcome: { color: uiColors.textMuted, ...uiType.bodyMedium, textAlign: 'center', marginTop: uiSpacing.lg },
  notice: { padding: uiSpacing.gutter, color: uiColors.text, ...uiType.bodyMedium },
  course: { marginTop: uiSpacing.md, marginHorizontal: -uiSpacing.md },
  waiting: { flexDirection: 'row', alignItems: 'center', padding: uiSpacing.md },
  waitingText: { color: uiColors.textMuted, ...uiType.bodyMedium },
  errorBox: { backgroundColor: uiColors.dangerSoft, padding: uiSpacing.md, borderRadius: uiRadius.lg },
  errorText: { color: uiColors.danger, ...uiType.bodyMedium },
  retryButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  retry: { color: uiColors.primary, ...uiType.labelLarge },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: uiSpacing.md, backgroundColor: uiColors.surface, gap: uiSpacing.sm, borderTopWidth: 1, borderTopColor: uiColors.border, ...uiShadow.small },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.md, padding: uiSpacing.md, color: uiColors.text, ...uiType.bodyMedium },
  send: { minHeight: 44, justifyContent: 'center', backgroundColor: uiColors.primary, paddingHorizontal: uiSpacing.gutter, borderRadius: uiRadius.md },
  disabled: { opacity: 0.5 }, sendText: { color: uiColors.onPrimary, ...uiType.labelLarge },
});
