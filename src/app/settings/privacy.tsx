import { useThemedStyles } from '../../context/ThemeContext';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { useConsent } from '../../context/ConsentContext';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../../theme';

type ConfirmMode = 'disable' | 'delete' | null;

export default function PrivacySettingsScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const { status, updatedAt, busy, error, reload, choose, deleteData } = useConsent();
  const [confirm, setConfirm] = useState<ConfirmMode>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const actionLock = useRef(false);
  const [acting, setActing] = useState(false);
  const isLoading = status === 'loading';
  const act = async (operation: () => Promise<void>, success: string) => {
    if (busy || actionLock.current) return;
    actionLock.current = true; setActing(true);
    setLocalError(null); setNotice(null);
    try { await operation(); setNotice(success); setConfirm(null); }
    catch { setLocalError('Thao tác thất bại. Vui lòng kiểm tra kết nối và thử lại.'); }
    finally { actionLock.current = false; setActing(false); }
  };
  const toggle = (value: boolean) => {
    if (busy || acting || isLoading || error) return;
    if (value) void act(() => choose(true), 'Đã bật cá nhân hóa gợi ý.');
    else setConfirm('disable');
  };
  const disable = (removeData: boolean) => {
    void act(async () => {
      await choose(false);
      if (removeData) await deleteData();
    }, removeData ? 'Đã tắt theo dõi và xóa dữ liệu hoạt động.' : 'Đã tắt theo dõi hoạt động.');
  };
  const date = updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : null;

  return <View style={styles.root}><ScreenHeader title="Quyền riêng tư" />
    <ScrollView contentContainerStyle={styles.content}>
      <SettingsSection title="Cá nhân hóa"><View style={styles.card}>
        <View style={styles.row}><View style={styles.text}>
          <Text style={styles.title}>Cá nhân hóa gợi ý dựa trên hoạt động của bạn</Text>
          <Text style={styles.description}>Dùng các khóa học bạn xem, tìm kiếm, lưu, thêm vào giỏ và tiến độ học để gợi ý khóa học phù hợp.</Text>
        </View><Switch value={status === 'granted'} onValueChange={toggle} disabled={busy || acting || isLoading || !!error}
          trackColor={{ true: uiColors.primary, false: uiColors.border }} thumbColor={uiColors.surface} accessibilityLabel="Cá nhân hóa gợi ý dựa trên hoạt động" /></View>
        <Text style={styles.meta}>{isLoading ? 'Đang tải quyền riêng tư...' : status === 'unset' ? 'Bạn chưa chọn. Hoạt động sẽ không được theo dõi.' : status === 'granted' ? 'Đang bật' : 'Đang tắt'}</Text>
        {date ? <Text style={styles.meta}>Cập nhật gần nhất: {date}</Text> : null}
        {error ? <View><Text style={styles.error}>{error}</Text><Pressable onPress={() => { void reload(); }} style={styles.retry}><Text style={styles.link}>Thử lại</Text></Pressable></View> : null}
        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {notice ? <Text style={styles.success}>{notice}</Text> : null}
      </View></SettingsSection>
      <SettingsSection title="Dữ liệu hoạt động"><View style={styles.card}>
        <Text style={styles.description}>Bạn có thể xóa dữ liệu theo dõi đã lưu. Việc này không xóa khóa học đã ghi danh, giỏ hàng hay tiến độ học.</Text>
        <Pressable style={styles.deleteButton} disabled={busy || acting || isLoading || !!error} onPress={() => setConfirm('delete')}><Text style={styles.deleteText}>{busy || acting ? 'Đang xử lý...' : 'Xóa dữ liệu hoạt động'}</Text></Pressable>
      </View></SettingsSection>
    </ScrollView><SafeAreaView edges={['bottom']} />
    <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => { if (!busy && !acting) setConfirm(null); }}>
      <View style={styles.overlay}><View style={styles.dialog}>
        <Text style={styles.dialogTitle}>{confirm === 'disable' ? 'Tắt theo dõi hoạt động?' : 'Xóa dữ liệu hoạt động?'}</Text>
        <Text style={styles.description}>{confirm === 'disable' ? 'Bạn muốn giữ hay xóa dữ liệu hoạt động đã thu thập?' : 'Dữ liệu hoạt động của bạn sẽ bị xóa và không thể khôi phục.'}</Text>
        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {confirm === 'disable' ? <>
          <Pressable style={styles.dialogAction} disabled={busy || acting} onPress={() => disable(false)}><Text style={styles.link}>Tắt và giữ dữ liệu</Text></Pressable>
          <Pressable style={styles.dialogAction} disabled={busy || acting} onPress={() => disable(true)}><Text style={styles.deleteText}>Tắt và xóa dữ liệu</Text></Pressable>
        </> : <Pressable style={styles.dialogAction} disabled={busy || acting} onPress={() => { void act(deleteData, 'Đã xóa dữ liệu hoạt động.'); }}><Text style={styles.deleteText}>Xác nhận xóa</Text></Pressable>}
        <Pressable style={styles.dialogAction} disabled={busy || acting} onPress={() => setConfirm(null)}><Text style={styles.link}>Hủy</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background }, content: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl },
  card: { padding: uiSpacing.md, gap: uiSpacing.sm }, row: { flexDirection: 'row', alignItems: 'center', gap: uiSpacing.md }, text: { flex: 1 },
  title: { color: uiColors.text, ...uiType.bodyLarge, fontWeight: '700' }, description: { color: uiColors.textMuted, ...uiType.bodyMedium },
  meta: { color: uiColors.textMuted, ...uiType.bodySmall }, error: { color: uiColors.danger, ...uiType.bodySmall },
  success: { color: uiColors.success, ...uiType.bodySmall }, retry: { minHeight: 44, justifyContent: 'center' }, link: { color: uiColors.primary, ...uiType.labelLarge },
  deleteButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: uiColors.danger, borderRadius: uiRadius.md },
  deleteText: { color: uiColors.danger, ...uiType.labelLarge },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(19,27,46,0.42)', padding: uiSpacing.gutter },
  dialog: { padding: uiSpacing.lg, gap: uiSpacing.md, backgroundColor: uiColors.surface, borderRadius: uiRadius.lg },
  dialogTitle: { color: uiColors.text, ...uiType.headlineSmall }, dialogAction: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
