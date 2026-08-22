import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
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
        <Stack.Screen name="order" />
        <Stack.Screen name="packing" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="register" />
      </Stack>
    </LanguageProvider>
  );
}