import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function RegistrationSuccessScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  return <SafeAreaView style={styles.safe}><View style={styles.container}><View style={styles.card}><Text style={styles.title}>Registration successful</Text><Text style={styles.text}>{role === 'customer' ? 'Your customer account is ready.' : 'Your Founder account is ready.'} Log in to continue.</Text><Pressable style={styles.primary} onPress={() => router.replace({ pathname: '/login', params: { role: role === 'customer' ? 'customer' : 'founder' } })}><Text style={styles.primaryText}>Proceed to Login</Text></Pressable></View></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8F6FC' }, container: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24 }, card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#E8E3F1' }, title: { color: '#16803C', fontSize: 25, fontWeight: '900' }, text: { color: '#77738D', lineHeight: 21, marginVertical: 14 }, primary: { backgroundColor: '#5B2BD9', borderRadius: 11, padding: 15, alignItems: 'center' }, primaryText: { color: '#FFFFFF', fontWeight: '800' } });