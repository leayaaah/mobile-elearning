import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SettingsRow } from '../../components/SettingsRow';
import { SettingsSection } from '../../components/SettingsSection';
import { uiColors, uiSpacing, uiType } from '../../theme';

export default function SettingsScreen() {
  const router = useRouter();
  return <View style={styles.root}>
    <ScreenHeader title="Cài đặt" />
    <ScrollView contentContainerStyle={styles.content}>
      <SettingsSection title="Tài khoản"><SettingsRow title="Thông tin tài khoản" detail="Họ tên, email và mật khẩu" onPress={() => router.push('/settings/account')} /></SettingsSection>
      <SettingsSection title="Giao diện"><SettingsRow title="Tùy chỉnh giao diện" disabled /></SettingsSection>
      <SettingsSection title="Quyền riêng tư"><SettingsRow title="Theo dõi hoạt động" detail="Cá nhân hóa gợi ý và xóa dữ liệu" onPress={() => router.push('/settings/privacy')} /></SettingsSection>
      <SettingsSection title="Pháp lý"><SettingsRow title="Điều khoản sử dụng" disabled /><SettingsRow title="Chính sách quyền riêng tư" disabled /></SettingsSection>
      <SettingsSection title="Về ứng dụng"><View style={styles.version}><Text style={styles.versionText}>Phiên bản {Constants.expoConfig?.version ?? '1.0.0'}</Text></View></SettingsSection>
    </ScrollView>
    <SafeAreaView edges={['bottom']} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: uiColors.background },
  content: { padding: uiSpacing.gutter, paddingBottom: uiSpacing.xl },
  version: { padding: uiSpacing.md }, versionText: { color: uiColors.textMuted, ...uiType.bodyMedium },
});
