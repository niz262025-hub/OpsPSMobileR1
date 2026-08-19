import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminSubscriptions() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setRows(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
      } catch (error) {
        console.error('Admin subscriptions error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin]);

  const grouped = {
    trial: rows.filter((row) => (row.subscriptionStatus || '').toLowerCase() === 'trial' || (row.subscriptionPlan || '').toLowerCase() === 'free'),
    founder: rows.filter((row) => (row.subscriptionPlan || '').toLowerCase() === 'founder'),
    standard: rows.filter((row) => (row.subscriptionPlan || '').toLowerCase() === 'standard'),
    expired: rows.filter((row) => (row.subscriptionStatus || '').toLowerCase() === 'expired'),
    cancelled: rows.filter((row) => (row.subscriptionStatus || '').toLowerCase() === 'cancelled'),
  };

  if (!user || !isAdmin) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Subscriptions</Text>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          <>
            <StatBox label="Trial" value={String(grouped.trial.length)} />
            <StatBox label="Founder (RM39)" value={String(grouped.founder.length)} />
            <StatBox label="Standard (RM49)" value={String(grouped.standard.length)} />
            <StatBox label="Expired" value={String(grouped.expired.length)} />
            <StatBox label="Cancelled" value={String(grouped.cancelled.length)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#181145' },
  box: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, marginTop: 14 },
  label: { color: '#6B6B8A' },
  value: { color: '#181145', fontSize: 26, fontWeight: '900', marginTop: 8 },
  loading: { paddingVertical: 40, alignItems: 'center' },
});
