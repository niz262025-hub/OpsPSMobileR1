import { Stack } from 'expo-router';

export default function TripLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="create" options={{ presentation: 'card' }} />
    </Stack>
  );
}
