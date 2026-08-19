import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="user-detail" />
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="system" />
    </Stack>
  );
}
