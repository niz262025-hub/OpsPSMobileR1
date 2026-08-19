import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminPayments() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'payments'));
        setAvailable(snap.docs.length > 0);
      } catch (error) {
        setAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin]);

  if (!user || !isAdmin) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Payments</Text>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.message}>{available ? 'Payment records available.' : 'Payment integration not configured'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#181145' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 16 },
  message: { color: '#181145', fontSize: 16, fontWeight: '700' },
  loading: { paddingVertical: 40, alignItems: 'center' },
});
