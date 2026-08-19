import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

export default function AccountScreen() {
  const { user, profile, logoutUser, loading, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout failed', error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  if (loading) {
    return (
      <View style={styles.containerCentered}>
        <ActivityIndicator size="large" color="#5B3DF5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Business profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile?.fullName || user?.displayName || 'Not available'}</Text>

        <Text style={styles.label}>Business</Text>
        <Text style={styles.value}>{profile?.businessName || 'OpsPS UAT Test'}</Text>

        <Text style={styles.label}>Phone</Text>
        <Text style={styles.value}>{profile?.phone || 'Not available'}</Text>

        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>{profile?.subscriptionPlan || 'FREE'}</Text>

        <Text style={styles.label}>Free trips remaining</Text>
        <Text style={styles.value}>{Math.max((profile?.freeTripAllowance || 2) - (profile?.trialTripsUsed || 0), 0)}</Text>
      </View>

      {isAdmin ? (
        <Pressable
          style={[styles.button, styles.adminButton]}
          onPress={() => router.push('/admin')}
        >
          <Text style={styles.buttonText}>Admin Console</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB', padding: 20 },
  containerCentered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5FB' },
  title: { fontSize: 30, fontWeight: '900', color: '#181145' },
  subtitle: { color: '#6B6B8A', marginTop: 6, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18 },
  label: { color: '#6B6B8A', fontSize: 12, marginTop: 12 },
  value: { color: '#181145', fontSize: 17, fontWeight: '700', marginTop: 4 },
  button: { marginTop: 20, backgroundColor: '#5B3DF5', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  adminButton: { backgroundColor: '#EC4C99' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});