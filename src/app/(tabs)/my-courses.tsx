import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';

export default function MyCoursesScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Placeholder title="Khóa học của tôi" note="TODO: getMyCourses() - tab Tất cả / Đang học / Hoàn thành, thanh tiến độ." />
    </View>
  );
}
