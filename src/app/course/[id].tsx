import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';
import { ScreenHeader } from '../../components/ScreenHeader';
export default function CourseDetailScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Chi tiết khóa học" />
      <Placeholder title="Chi tiết khóa học" note="TODO: getCourseById, getCurriculum, getReviews - 3 tab Tổng quan / Bài học / Đánh giá, nút Thêm vào giỏ." />
    </View>
  );
}
