import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

function AuthGuard() {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';
    const inCustomerGroup = segments[0] === '(customer)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      if (user.role === 'customer') {
        router.replace('/(customer)/browse');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    } else if (user && !inAuthGroup && !inCustomerGroup && user.role === 'customer') {
      // Customer accidentally landed on PS tabs — redirect
      router.replace('/(customer)/browse');
    }
  }, [user, ready, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <StatusBar style="dark" />
        <AuthGuard />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="trip" />
          <Stack.Screen name="shipping" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="order" />
          <Stack.Screen name="packing" />
          <Stack.Screen name="settings" />
        </Stack>
      </LanguageProvider>
    </AuthProvider>
  );
}