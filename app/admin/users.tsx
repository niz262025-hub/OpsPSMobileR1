import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type UserRecord = {
  uid: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  accountStatus?: string;
  createdAt?: any;
};

export default function AdminUsers() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    if (!user || !isAdmin) {
      router.replace('/(tabs)/dashboard');
      return;
    }

    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const rows: UserRecord[] = snap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as any) }))
          .filter((entry) => entry.role !== 'admin');
        setUsers(rows);
      } catch (error) {
        console.error('Admin users error:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, isAdmin]);

  const filtered = users.filter((entry) => {
    const text = `${entry.fullName || ''} ${entry.email || ''} ${entry.phone || ''}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Users</Text>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Search users"
          value={query}
          onChangeText={setQuery}
        />

        {loading ? (
          <View style={styles.loading}><ActivityIndicator size="large" color="#5B2BD9" /></View>
        ) : (
          filtered.map((entry) => (
            <Pressable key={entry.uid} style={styles.card} onPress={() => router.push({ pathname: '/admin/user-detail', params: { userId: entry.uid } })}>
              <Text style={styles.name}>{entry.fullName || 'Unnamed User'}</Text>
              <Text style={styles.email}>{entry.email || 'No email'}</Text>
              <Text style={styles.meta}>Phone: {entry.phone || 'N/A'}</Text>
              <Text style={styles.meta}>Plan: {entry.subscriptionPlan || 'FREE'} • Status: {entry.subscriptionStatus || 'trial'}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F5FB' },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { color: '#5B2BD9', fontWeight: '700', marginRight: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#181145' },
  search: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  loading: { paddingVertical: 40, alignItems: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12 },
  name: { color: '#181145', fontSize: 18, fontWeight: '800' },
  email: { color: '#5B2BD9', marginTop: 4 },
  meta: { color: '#6B6B8A', marginTop: 6 },
});
