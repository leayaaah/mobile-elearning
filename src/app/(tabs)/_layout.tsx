import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, [IconName, IconName]> = {
  index: ['home-outline', 'home'],
  search: ['search-outline', 'search'],
  'my-courses': ['book-outline', 'book'],
  profile: ['person-outline', 'person'],
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: String(colors.primary),
        tabBarInactiveTintColor: String(colors.textMuted),
        tabBarIcon: ({ focused, color, size }) => {
          const [off, on] = TAB_ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
          return <Ionicons name={focused ? on : off} size={size} color={String(color)} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="search" options={{ title: 'Tìm kiếm' }} />
      <Tabs.Screen name="my-courses" options={{ title: 'Khóa học của tôi' }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ' }} />
    </Tabs>
  );
}
