import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDoc, getDocs, doc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type UserRecord = {
  uid?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt?: any;
  lastLogin?: any;
  freeTripsTotal?: number;
  freeTripAllowance?: number;
  trialTripsUsed?: number;
};

export default function AdminUserDetail() {
  const { user, isAdmin } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserRecord | null>(null);
  const [stats, setStats] = useState({ trips: 0, products: 0, orders: 0, inventory: 0 });

  useEffect(() => {
    if (!user || !isAdmin || !userId) return;

    const load = async () => {
      try {
        const prof = await getDoc(doc(db, 'users', userId));
        const profileData = prof.exists() ? ({ uid: prof.id, ...(prof.data() as any) }) : null;
        setProfile(profileData);

        const [tripSnap, productSnap, orderSnap, inventorySnap] = await Promise.all([
          getDocs(query(collection(db, 'trips'), where('ownerId', '==', userId))),
          getDocs(query(collection(db, 'products'), where('ownerId', '==', userId))),
          getDocs(query(collection(db, 'orders'), where('ownerId', '==', userId))),
          getDocs(query(collection(db, 'inventory'), where('ownerId', '==', userId))),
        ]);

        setStats({
          trips: tripSnap.size,
          products: productSnap.size,
          orders: orderSnap.size,
          inventory: inventorySnap.size,
        });
      } catch (error) {
        console.error('Admin user detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin, userId]);

  if (!user || !isAdmin) return null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>User Detail</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile?.fullName || 'N/A'}</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profile?.email || 'N/A'}</Text>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{profile?.phone || 'N/A'}</Text>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{profile?.createdAt ? 'Available' : 'N/A'}</Text>
          <Text style={styles.label}>Last Login</Text>
          <Text style={styles.value}>{profile?.lastLogin ? 'Recorded' : 'Login activity not currently recorded.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{profile?.subscriptionPlan || 'FREE'}</Text>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{profile?.subscriptionStatus || 'trial'}</Text>
          <Text style={styles.label}>Trial trips used</Text>
          <Text style={styles.value}>{profile?.trialTripsUsed ?? 0}</Text>
          <Text style={styles.label}>Trial trips remaining</Text>
          <Text style={styles.value}>{Math.max((profile?.freeTripAllowance ?? 2) - (profile?.trialTripsUsed ?? 0), 0)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Business Activity</Text>
          <Text style={styles.meta}>Trips: {stats.trips}</Text>
          <Text style={styles.meta}>Products: {stats.products}</Text>
          <Text style={styles.meta}>Orders: {stats.orders}</Text>
          <Text style={styles.meta}>Inventory: {stats.inventory}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#181145' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#181145', marginBottom: 8 },
  label: { color: '#6B6B8A', fontSize: 12, marginTop: 10 },
  value: { color: '#181145', fontSize: 17, fontWeight: '700', marginTop: 4 },
  meta: { color: '#181145', fontSize: 15, marginTop: 8 },
});
