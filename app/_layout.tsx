import React, { useEffect } from 'react';
import { Stack, usePathname, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { isAdminRole } from '../services/adminFoundation';

export function AuthRouteGuard() {
  const pathname = usePathname();
  const { currentUser, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/legal', '/product'];
    if (publicRoutes.includes(pathname) || publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return;
    }

    const protectedAdminRoutes = ['/admin'];
    const protectedFounderRoutes = [
      '/(tabs)',
      '/settings',
      '/trip',
      '/shipping',
      '/packing',
      '/order',
    ];

    const isProtectedAdminRoute = protectedAdminRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`),
    );

    const isProtectedFounderRoute = protectedFounderRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`),
    );

    if (isProtectedAdminRoute && (!currentUser || !isAdminRole(currentUser.role))) {
      router.replace('/login');
      return;
    }

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
          <Stack.Screen name="admin" />
        </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}