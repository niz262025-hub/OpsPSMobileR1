import React, { useEffect } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { isAdminRole } from '../services/adminFoundation';

export default function MyopsLaunchPage() {
  const { currentUser, ready } = useAuth();

  useEffect(() => {
    if (!ready || !currentUser) return;
    if (isAdminRole(currentUser.role)) {
      router.replace('/admin' as never);
    } else if (currentUser.role === 'customer') {
      router.replace('/customer' as never);
    } else {
      router.replace('/(tabs)/dashboard' as never);
    }
  }, [currentUser, ready]);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        {ready && !currentUser ? (
          <>
            <Text style={styles.title}>OpsPS tak dapat dibuka</Text>
            <Text style={styles.message}>Sesi MYOPS tiada atau akses pakej tidak aktif. Kembali ke MYOPS dan cuba buka OpsPS semula.</Text>
            <Pressable style={styles.button} onPress={() => { void Linking.openURL('https://www.myops.com.my/'); }}>
              <Text style={styles.buttonText}>Kembali ke MYOPS</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#5B2BD9" />
            <Text style={styles.message}>Sahkan akses MYOPS dan buka OpsPS…</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F8F6FC' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { color: '#252039', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  message: { color: '#77738D', fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 420 },
  button: { backgroundColor: '#5B2BD9', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 13 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
});
