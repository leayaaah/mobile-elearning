import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Placeholder title="Hồ sơ" note="TODO: getProfile(), getSavedCourses(), nút Đăng xuất (useAuth().signOut)." />
    </View>
  );
}
