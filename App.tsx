import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { BookmarkProvider } from './src/context/BookmarkContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <BookmarkProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ title: 'Trang chủ' }} />
            <Stack.Screen name="(auth)" options={{ title: 'Xác thực' }} />
            <Stack.Screen name="cart" options={{ title: 'Giỏ hàng' }} />
            <Stack.Screen name="course/[id]" options={{ title: 'Chi tiết khóa học' }} />
            <Stack.Screen name="learn/[id]" options={{ title: 'Học tập' }} />
            <Stack.Screen name="teacher/[id]" options={{ title: 'Thông tin giảng viên' }} />
          </Stack>
        </BookmarkProvider>
      </CartProvider>
    </AuthProvider>
  );
}