import { View } from 'react-native';
import { Placeholder } from '../components/Placeholder';
import { ScreenHeader } from '../components/ScreenHeader';

export default function CartScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="Giỏ hàng" />
      <Placeholder title="Giỏ hàng" note="TODO: useCart() - danh sách, xóa, tổng tiền; bước mở rộng: checkout()." />
    </View>
  );
}
