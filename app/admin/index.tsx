import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type UserRecord = {
  uid: string;
  fullName?: string;
  email?: string;
  role?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt?: any;
};

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    activeUsers: 0,
    trialUsers: 0,
    founderUsers: 0,
    standardUsers: 0,
    activeSubscribers: 0,
    expired: 0,
    cancelled: 0,
    trips: 0,
    products: 0,
    orders: 0,
    marketplace: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    const load = async () => {
      try {
        const userSnap = await getDocs(collection(db, 'users'));
        const tripSnap = await getDocs(collection(db, 'trips'));
        const productSnap = await getDocs(collection(db, 'products'));
        const orderSnap = await getDocs(collection(db, 'orders'));

        const userList = userSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
        setUsers(userList);

        const activeUsers = userList.filter((entry) => (entry.accountStatus || entry.subscriptionStatus || 'trial') !== 'inactive' && entry.role !== 'admin').length;
        const trialUsers = userList.filter((entry) => (entry.subscriptionPlan || 'FREE') === 'FREE' || (entry.subscriptionStatus || 'trial') === 'trial').length;
        const founderUsers = userList.filter((entry) => (entry.subscriptionPlan || '').toLowerCase() === 'founder').length;
        const standardUsers = userList.filter((entry) => (entry.subscriptionPlan || '').toLowerCase() === 'standard').length;
        const activeSubscribers = userList.filter((entry) => (entry.subscriptionStatus || '').toLowerCase() === 'active').length;
        const expired = userList.filter((entry) => (entry.subscriptionStatus || '').toLowerCase() === 'expired').length;
        const cancelled = userList.filter((entry) => (entry.subscriptionStatus || '').toLowerCase() === 'cancelled').length;

        const monthlyRevenue = userList
          .filter((entry) => (entry.subscriptionStatus || '').toLowerCase() === 'active')
          .reduce((sum, entry) => {
            const plan = (entry.subscriptionPlan || '').toLowerCase();
            if (plan === 'founder') return sum + 39;
            if (plan === 'standard') return sum + 49;
            return sum;
          }, 0);

        const totalRevenue = userList.reduce((sum, entry) => {
          const plan = (entry.subscriptionPlan || '').toLowerCase();
          if (plan === 'founder') return sum + 39;
          if (plan === 'standard') return sum + 49;
          return sum;
        }, 0);

        setTotals({
          totalUsers: userList.filter((entry) => entry.role !== 'admin').length,
          activeUsers,
          trialUsers,
          founderUsers,
          standardUsers,
          activeSubscribers,
          expired,
          cancelled,
          trips: tripSnap.size,
          products: productSnap.size,
          orders: orderSnap.size,
          marketplace: productSnap.docs.filter((d) => d.data().status === 'published').length,
          monthlyRevenue,
          totalRevenue,
        });
      } catch (error) {
        console.error('Admin dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Admin Console</Text>
        <Text style={styles.subtitle}>Platform overview</Text>

        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          <>
            <View style={styles.grid}>
              <MetricCard label="Users" value={String(totals.totalUsers)} />
              <MetricCard label="Active Users" value={String(totals.activeUsers)} />
              <MetricCard label="Trial Users" value={String(totals.trialUsers)} />
              <MetricCard label="Founder" value={String(totals.founderUsers)} />
              <MetricCard label="Standard" value={String(totals.standardUsers)} />
              <MetricCard label="Active Subscribers" value={String(totals.activeSubscribers)} />
              <MetricCard label="Expired" value={String(totals.expired)} />
              <MetricCard label="Cancelled" value={String(totals.cancelled)} />
              <MetricCard label="Trips" value={String(totals.trips)} />
              <MetricCard label="Products" value={String(totals.products)} />
              <MetricCard label="Orders" value={String(totals.orders)} />
              <MetricCard label="Marketplace Listings" value={String(totals.marketplace)} />
              <MetricCard label="Monthly Rev" value={`RM${totals.monthlyRevenue}`} />
              <MetricCard label="Total Rev" value={`RM${totals.totalRevenue}`} />
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.button} onPress={() => router.push('/admin/users')}>
                <Text style={styles.buttonText}>Users</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => router.push('/admin/subscriptions')}>
                <Text style={styles.buttonText}>Subscriptions</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => router.push('/admin/payments')}>
                <Text style={styles.buttonText}>Payments</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => router.push('/admin/activity')}>
                <Text style={styles.buttonText}>Activity</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => router.push('/admin/system')}>
                <Text style={styles.buttonText}>System</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: '#181145' },
  subtitle: { marginTop: 6, color: '#6B6B8A', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EDE7FF' },
  metricLabel: { color: '#6B6B8A', fontSize: 12 },
  metricValue: { marginTop: 8, color: '#181145', fontSize: 22, fontWeight: '900' },
  actions: { marginTop: 10 },
  button: { backgroundColor: '#5B2BD9', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
});
