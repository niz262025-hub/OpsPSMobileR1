import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminSystem() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ users: 0, trips: 0, products: 0, orders: 0, inventory: 0, marketplace: 0 });

  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      try {
        const [userSnap, tripSnap, productSnap, orderSnap, inventorySnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'trips')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'inventory')),
        ]);

        setCounts({
          users: userSnap.size,
          trips: tripSnap.size,
          products: productSnap.size,
          orders: orderSnap.size,
          inventory: inventorySnap.size,
          marketplace: productSnap.docs.filter((d) => d.data().status === 'published').length,
        });
      } catch (error) {
        console.error('Admin system error:', error);
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
        <Text style={styles.title}>System Health</Text>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          <>
            <MetricRow label="Users" value={String(counts.users)} />
            <MetricRow label="Trips" value={String(counts.trips)} />
            <MetricRow label="Products" value={String(counts.products)} />
            <MetricRow label="Orders" value={String(counts.orders)} />
            <MetricRow label="Inventory" value={String(counts.inventory)} />
            <MetricRow label="Marketplace listings" value={String(counts.marketplace)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#181145' },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 12 },
  label: { color: '#6B6B8A' },
  value: { color: '#181145', fontWeight: '800' },
  loading: { paddingVertical: 40, alignItems: 'center' },
});
