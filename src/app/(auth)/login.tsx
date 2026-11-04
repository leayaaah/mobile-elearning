import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { uiColors, uiRadius, uiShadow, uiSpacing, uiType } from '../../theme';
import { getErrorMessage } from '../../utils/format';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      // AuthGate sẽ tự chuyển sang (tabs)
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn quay lại học tập</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={uiColors.outline}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor={uiColors.outline}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, submitting && styles.disabledButton]} onPress={onSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={uiColors.onPrimary} /> : <Text style={styles.buttonText}>Đăng nhập</Text>}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <Link href="/(auth)/register" style={styles.link}>Đăng ký</Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: uiColors.background },
  container: { flex: 1, justifyContent: 'center', padding: uiSpacing.gutter },
  title: { ...uiType.displayMobile, color: uiColors.text },
  subtitle: { ...uiType.bodyLarge, color: uiColors.textMuted, marginTop: uiSpacing.xs, marginBottom: uiSpacing.lg },
  input: { minHeight: 48, borderWidth: 1, borderColor: uiColors.border, backgroundColor: uiColors.surface, borderRadius: uiRadius.md, paddingHorizontal: uiSpacing.md, paddingVertical: uiSpacing.sm, ...uiType.bodyMedium, color: uiColors.text, marginBottom: uiSpacing.md, ...uiShadow.small },
  error: { ...uiType.bodySmall, color: uiColors.danger, marginBottom: uiSpacing.md },
  button: { minHeight: 48, backgroundColor: uiColors.primary, borderRadius: uiRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: uiSpacing.sm },
  disabledButton: { opacity: 0.6 },
  buttonText: { ...uiType.labelLarge, color: uiColors.onPrimary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: uiSpacing.lg },
  footerText: { ...uiType.bodyMedium, color: uiColors.textMuted },
  link: { ...uiType.labelLarge, color: uiColors.primary },
});
