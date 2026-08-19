import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminActivity() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ registrations: 0, trips: 0, products: 0, orders: 0, completedOrders: 0, marketplace: 0 });

  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      try {
        const [userSnap, tripSnap, productSnap, orderSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'trips')),
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'orders')),
        ]);

        setData({
          registrations: userSnap.size,
          trips: tripSnap.size,
          products: productSnap.size,
          orders: orderSnap.size,
          completedOrders: orderSnap.docs.filter((d) => (d.data().orderStatus || d.data().status || '').toLowerCase() === 'completed').length,
          marketplace: productSnap.docs.filter((d) => d.data().status === 'published').length,
        });
      } catch (error) {
        console.error('Admin activity error:', error);
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
        <Text style={styles.title}>Platform Activity</Text>
        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          <>
            <StatRow label="New registrations" value={String(data.registrations)} />
            <StatRow label="Trips created" value={String(data.trips)} />
            <StatRow label="Products created" value={String(data.products)} />
            <StatRow label="Orders created" value={String(data.orders)} />
            <StatRow label="Orders completed" value={String(data.completedOrders)} />
            <StatRow label="Marketplace listings" value={String(data.marketplace)} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
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
  row: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#6B6B8A' },
  value: { color: '#181145', fontWeight: '800' },
  loading: { paddingVertical: 40, alignItems: 'center' },
});
