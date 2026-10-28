import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BookmarkProvider } from '../context/BookmarkContext';
import { CartProvider } from '../context/CartContext';
import { Loading } from '../components/ScreenState';

// Auth flow: chưa đăng nhập -> (auth), đã đăng nhập -> (tabs)
function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    else if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, loading, segments, router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      {loading && (
        <View style={StyleSheet.absoluteFill}>
          <Loading />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarkProvider>
        <CartProvider>
          <AuthGate />
        </CartProvider>
      </BookmarkProvider>
    </AuthProvider>
  );
}
