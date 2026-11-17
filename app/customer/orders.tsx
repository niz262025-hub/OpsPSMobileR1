import React, { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { getDataSource, type OrderRecord } from '../../services/repository';
import { THEME } from '../../theme';

export default function CustomerOrdersScreen() {
  const { profile, currentUser } = useAuth();
  const { payments } = useLocalSearchParams<{ payments?: string }>();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (currentUser?.role !== 'customer' || !profile?.id) {
      setOrders([]); setLoading(false); setError('Reopen OpsPS from MYOPS to load your customer identity.');
      return () => { active = false; };
    }
    void getDataSource('production').orders.listForCustomer(profile.id)
      .then(rows => { if (active) setOrders(rows); })
      .catch(() => { if (active) { setOrders([]); setError('Orders could not be loaded. Please try again.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentUser?.role, profile?.id, revision]));
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/customer')}><Text style={styles.link}>Back to customer dashboard</Text></Pressable>
    <Text accessibilityRole="header" style={styles.title}>{payments === '1' ? 'Payments' : 'Track Orders'}</Text>
    {loading ? <Text accessibilityRole="progressbar">Loading orders…</Text> : null}
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    {error ? <Pressable accessibilityRole="button" onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Try again</Text></Pressable> : null}
    {!loading && !error && !orders.length ? <Text>No orders yet.</Text> : null}
    {orders.map(order => <Pressable key={order.id} accessibilityRole="button" accessibilityLabel={`View order ${order.id}`} style={styles.card}
      onPress={() => router.push({ pathname: '/customer/order/[id]', params: { id: order.id } })}>
      <Text style={styles.name}>Order {order.id}</Text>
      <Text>{String(order.requestStatus ?? order.orderStatus ?? 'PENDING_AVAILABILITY').replaceAll('_', ' ')}</Text>
      <Text>RM{Number(order.total ?? 0).toFixed(2)}</Text>
      <Text>Payment: {order.paymentStatus ?? 'pending'}</Text>
      <Text style={styles.link}>View order and payment details</Text>
    </Pressable>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: THEME.text.primary },
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, gap: 10 },
  name: { fontWeight: '700', color: THEME.text.primary },
  link: { color: THEME.primary, paddingVertical: 10, fontWeight: '600' },
});
