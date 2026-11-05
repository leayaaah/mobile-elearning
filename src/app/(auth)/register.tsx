import { useThemedStyles } from '../../context/ThemeContext';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { type UiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';
import { getErrorMessage } from '../../utils/format';

export default function RegisterScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }
    setSubmitting(true);
    try {
      const hasSession = await signUp(fullName, email, password);
      if (!hasSession) setInfo('Đăng ký thành công. Hãy kiểm tra email để xác nhận tài khoản rồi đăng nhập.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Bắt đầu hành trình học tập của bạn</Text>

        <TextInput style={styles.input} placeholder="Họ và tên" placeholderTextColor={uiColors.outline} value={fullName} onChangeText={setFullName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={uiColors.outline} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor={uiColors.outline} secureTextEntry value={password} onChangeText={setPassword} />
        <TextInput style={styles.input} placeholder="Nhập lại mật khẩu" placeholderTextColor={uiColors.outline} secureTextEntry value={confirm} onChangeText={setConfirm} />
        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <Pressable style={[styles.button, submitting && styles.disabledButton]} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={uiColors.onPrimary} /> : <Text style={styles.buttonText}>Đăng ký</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <Link href="/(auth)/login" style={styles.link}>Đăng nhập</Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: uiColors.background },
  container: { flex: 1, justifyContent: 'center', padding: uiSpacing.gutter },
  title: { ...uiType.displayMobile, color: uiColors.text },
  subtitle: { ...uiType.bodyLarge, color: uiColors.textMuted, marginTop: uiSpacing.xs, marginBottom: uiSpacing.lg },
  input: { minHeight: 48, borderWidth: 1, borderColor: uiColors.border, backgroundColor: uiColors.surface, borderRadius: uiRadius.md, paddingHorizontal: uiSpacing.md, paddingVertical: uiSpacing.sm, ...uiType.bodyMedium, color: uiColors.text, marginBottom: uiSpacing.md, ...uiShadow.small },
  error: { ...uiType.bodySmall, color: uiColors.danger, marginBottom: uiSpacing.md },
  info: { ...uiType.bodySmall, color: uiColors.success, marginBottom: uiSpacing.md },
  button: { minHeight: 48, backgroundColor: uiColors.primary, borderRadius: uiRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: uiSpacing.sm },
  disabledButton: { opacity: 0.6 },
  buttonText: { ...uiType.labelLarge, color: uiColors.onPrimary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: uiSpacing.lg },
  footerText: { ...uiType.bodyMedium, color: uiColors.textMuted },
  link: { ...uiType.labelLarge, color: uiColors.primary },
});
