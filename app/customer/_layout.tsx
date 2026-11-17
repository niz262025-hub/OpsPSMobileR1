import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import MyopsEntry from '../../components/MyopsEntry';

export default function CustomerLayout() {
  const { ready, currentUser } = useAuth();
  if (!ready) return null;
  if (currentUser?.role !== 'customer') return <MyopsEntry />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
