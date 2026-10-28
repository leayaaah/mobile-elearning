import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';
import { ScreenHeader } from '../../components/ScreenHeader';
export default function LearnScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Đang học" />
      <Placeholder title="Màn hình học" note="TODO: 3 tab Bài học / Dự án / Hỏi đáp; markLessonDone()." />
    </View>
  );
}
