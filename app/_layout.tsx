import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthRouteGuard() {
  const pathname = usePathname();
  const { currentUser, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/legal', '/product'];
    if (publicRoutes.includes(pathname) || publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return;
    }

    const protectedFounderRoutes = [
      '/(tabs)',
      '/settings',
      '/trip',
      '/shipping',
      '/packing',
      '/order',
    ];

    const isProtectedFounderRoute = protectedFounderRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isProtectedFounderRoute && (!currentUser || currentUser.role !== 'founder')) {
      router.replace('/login');
    }
  }, [pathname, currentUser, ready]);

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthRouteGuard />
        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
          initialRouteName="index"
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="trip" />
          <Stack.Screen name="shipping" />
          <Stack.Screen name="login" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="order" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="legal" />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}