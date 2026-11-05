import { useThemedStyles } from '../../context/ThemeContext';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SettingsRow } from '../../components/SettingsRow';
import { SettingsSection } from '../../components/SettingsSection';
import { useAuth } from '../../context/AuthContext';
import { type UiColors, uiRadius, uiSpacing, uiType } from '../../theme';

export default function SettingsScreen() {
  const { colors: uiColors, styles } = useThemedStyles(createStyles);
  const router = useRouter();
  const { signOut } = useAuth();
  const signingOutRef = useRef(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const logout = async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setSigningOut(true);
    setSignOutError(null);
    try { await signOut(); }
    catch { setSignOutError('Đăng xuất thất bại. Vui lòng kiểm tra kết nối và thử lại.'); }
    finally { signingOutRef.current = false; setSigningOut(false); }
  };

  return <View style={styles.root}>
    <ScreenHeader title="Cài đặt" />
    <ScrollView contentContainerStyle={styles.content}>
      <SettingsSection title="Tài khoản"><SettingsRow title="Thông tin tài khoản" detail="Họ tên, email và mật khẩu" onPress={() => router.push('/settings/account')} /></SettingsSection>
      <SettingsSection title="Giao diện"><SettingsRow title="Tùy chỉnh giao diện" detail="Theo thiết bị, sáng hoặc tối" onPress={() => router.push('/settings/appearance')} /></SettingsSection>
      <SettingsSection title="Quyền riêng tư"><SettingsRow title="Theo dõi hoạt động" detail="Cá nhân hóa gợi ý và xóa dữ liệu" onPress={() => router.push('/settings/privacy')} /></SettingsSection>
      <SettingsSection title="Pháp lý"><SettingsRow title="Điều khoản sử dụng" detail="Chờ nội dung được phê duyệt" onPress={() => router.push('/settings/terms')} /><SettingsRow title="Chính sách quyền riêng tư" detail="Chờ nội dung được phê duyệt" onPress={() => router.push('/settings/privacy-policy')} /></SettingsSection>
      <SettingsSection title="Về ứng dụng"><View style={styles.version}><Text style={styles.versionText}>Phiên bản {Constants.expoConfig?.version ?? '1.0.0'}</Text></View></SettingsSection>
      <Pressable style={styles.logout} disabled={signingOut} onPress={() => { void logout(); }} accessibilityRole="button" accessibilityState={{ disabled: signingOut }}>
        <Text style={styles.logoutText}>{signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
      </Pressable>
      {signOutError ? <Text style={styles.error}>{signOutError}</Text> : null}
    </ScrollView>
    <SafeAreaView edges={['bottom']} />
  </View>;
}

const createStyles = (uiColors: UiColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  content: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl },
  version: { padding: uiSpacing.md }, versionText: { color: uiColors.textMuted, ...uiType.bodyMedium },
  logout: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: uiRadius.md, borderWidth: 1, borderColor: uiColors.danger, backgroundColor: uiColors.dangerSoft },
  logoutText: { color: uiColors.danger, ...uiType.labelLarge },
  error: { color: uiColors.danger, ...uiType.bodySmall, textAlign: 'center', marginTop: uiSpacing.sm },
});
