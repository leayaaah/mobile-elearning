import { useThemedStyles } from '../../context/ThemeContext';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SettingsSection } from '../../components/SettingsSection';
import { ErrorView } from '../../components/ScreenState';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/accountService';
import { getProfile, updateProfile } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../../theme';

export default function AccountSettingsScreen() {
  const { styles } = useThemedStyles(createStyles);
  const { user } = useAuth();
  const [name, setName] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const profile = useAsync(async () => {
    if (!user) throw new Error('Vui lòng đăng nhập.');
    return getProfile(user.id);
  }, [user?.id]);

  const saveName = async () => {
    if (!user || savingName) return;
    const value = (name ?? profile.data?.full_name ?? '').trim();
    if (!value) { setNameError('Họ tên không được để trống.'); return; }
    setSavingName(true); setNameError(null); setNameSuccess(false);
    try { await updateProfile(user.id, { full_name: value }); setName(value); setNameSuccess(true); profile.reload(); }
    catch { setNameError('Không thể lưu họ tên. Vui lòng thử lại.'); }
    finally { setSavingName(false); }
  };
  const savePassword = async () => {
    if (!user?.email || savingPassword) return;
    setPasswordError(null); setPasswordSuccess(false);
    if (!current) { setPasswordError('Vui lòng nhập mật khẩu hiện tại.'); return; }
    if (next.length < 6) { setPasswordError('Mật khẩu mới cần ít nhất 6 ký tự.'); return; }
    if (next !== confirm) { setPasswordError('Mật khẩu nhập lại không khớp.'); return; }
    setSavingPassword(true);
    try { await changePassword(user.email, current, next); setCurrent(''); setNext(''); setConfirm(''); setPasswordSuccess(true); }
    catch (cause) { setPasswordError(cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu.'); }
    finally { setSavingPassword(false); }
  };

  return <View style={styles.root}><ScreenHeader title="Tài khoản" />
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {profile.loading && !profile.data ? <Text style={styles.note}>Đang tải tài khoản...</Text> : null}
        {profile.error && !profile.data ? <ErrorView message={profile.error} onRetry={profile.reload} /> : null}
        {profile.data ? <>
          <SettingsSection title="Thông tin cá nhân"><View style={styles.form}>
            <Text style={styles.label}>Email</Text><Text style={styles.readOnly}>{user?.email ?? ''}</Text>
            <Text style={styles.label}>Họ tên</Text><TextInput style={styles.input} value={name ?? profile.data.full_name} onChangeText={setName} maxLength={120} accessibilityLabel="Họ tên" />
            {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
            {nameSuccess ? <Text style={styles.success}>Đã lưu họ tên.</Text> : null}
            <Pressable style={styles.button} disabled={savingName} onPress={() => { void saveName(); }}><Text style={styles.buttonText}>{savingName ? 'Đang lưu...' : 'Lưu họ tên'}</Text></Pressable>
          </View></SettingsSection>
          <SettingsSection title="Đổi mật khẩu"><View style={styles.form}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text><TextInput style={styles.input} value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
            <Text style={styles.label}>Mật khẩu mới</Text><TextInput style={styles.input} value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
            <Text style={styles.label}>Nhập lại mật khẩu mới</Text><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            {passwordSuccess ? <Text style={styles.success}>Đổi mật khẩu thành công.</Text> : null}
            <Pressable style={styles.button} disabled={savingPassword} onPress={() => { void savePassword(); }}><Text style={styles.buttonText}>{savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</Text></Pressable>
          </View></SettingsSection>
        </> : null}
      </ScrollView>
    </KeyboardAvoidingView><SafeAreaView edges={['bottom']} />
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background }, fill: { flex: 1 }, content: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl },
  form: { padding: uiSpacing.md, gap: uiSpacing.sm }, label: { color: uiColors.text, ...uiType.labelLarge },
  input: { minHeight: 48, paddingHorizontal: uiSpacing.md, borderWidth: 1, borderColor: uiColors.border, borderRadius: uiRadius.md, color: uiColors.text, backgroundColor: uiColors.surface },
  readOnly: { paddingVertical: uiSpacing.sm, color: uiColors.textMuted, ...uiType.bodyLarge },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: uiSpacing.sm, borderRadius: uiRadius.md, backgroundColor: uiColors.primary },
  buttonText: { color: uiColors.onPrimary, ...uiType.labelLarge }, error: { color: uiColors.danger, ...uiType.bodySmall },
  success: { color: uiColors.success, ...uiType.bodySmall }, note: { color: uiColors.textMuted, ...uiType.bodyMedium },
});
