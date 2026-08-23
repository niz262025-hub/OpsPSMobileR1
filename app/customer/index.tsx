import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function CustomerHomeScreen() {
  const { currentUser, logout } = useAuth();
  return <SafeAreaView style={styles.safe}><View style={styles.container}><Text style={styles.title}>Welcome, {currentUser?.name ?? 'Customer'}</Text><Text style={styles.text}>Customer experience</Text><Pressable style={styles.primary} onPress={async () => { await logout(); router.replace('/'); }}><Text style={styles.primaryText}>Log Out</Text></Pressable></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8F6FC' }, container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, title: { color: '#252039', fontSize: 26, fontWeight: '900' }, text: { color: '#77738D', marginVertical: 10 }, primary: { backgroundColor: '#5B2BD9', borderRadius: 11, padding: 15 }, primaryText: { color: '#FFFFFF', fontWeight: '800' } });