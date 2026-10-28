import { View } from 'react-native';
import { Placeholder } from '../../components/Placeholder';

export default function SearchScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Placeholder title="Tìm kiếm" note="TODO: searchCourses() + useDebounce + FlatList phân trang. Nhận params categoryId từ Trang chủ." />
    </View>
  );
}
