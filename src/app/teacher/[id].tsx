import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';
import { ScreenHeader } from '../../components/ScreenHeader';
export default function TeacherScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Giảng viên" />
      <Placeholder title="Hồ sơ giảng viên" note="TODO: getTeacher, getTeacherCourses." />
    </View>
  );
}
