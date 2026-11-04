import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConsentProvider, useConsent } from '../context/ConsentContext';
import { BookmarkProvider } from '../context/BookmarkContext';
import { CartProvider } from '../context/CartContext';
import { ChatSessionProvider } from '../context/ChatSessionContext';
import { Loading } from '../components/ScreenState';

// Auth flow: chưa đăng nhập -> (auth), đã đăng nhập -> (tabs)
function AuthGate() {
  const { session, loading } = useAuth();
  const { status: consentStatus, error: consentError } = useConsent();
  const segments = useSegments();
  const router = useRouter();
  const promptedUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    else if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, loading, segments, router]);

  useEffect(() => {
    if (!session) { promptedUser.current = null; return; }
    if (loading || consentStatus !== 'unset' || consentError || segments[0] === '(auth)' || segments[0] === 'consent') return;
    if (promptedUser.current === session.user.id) return;
    promptedUser.current = session.user.id;
    router.push('/consent');
  }, [session, loading, consentStatus, consentError, segments, router]);

  return (
    <>
      <StatusBar style="dark" />
      <ChatSessionProvider key={session?.user.id ?? 'guest'}>
        <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="consent" options={{ presentation: 'modal' }} /></Stack>
      </ChatSessionProvider>
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
      <ConsentProvider>
        <BookmarkProvider>
          <CartProvider>
            <AuthGate />
          </CartProvider>
        </BookmarkProvider>
      </ConsentProvider>
    </AuthProvider>
  );
}
