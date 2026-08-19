import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

type Order = {
  id: string;
  customerName?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  courier?: string;
  trackingNumber?: string;
  orderStatus?: string;
};

export default function CompletedOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('orderStatus', '==', 'Completed')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Order, 'id'>),
        }));

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error('Completed orders error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#5B2BD9" />
          <Text style={styles.loadingText}>
            Loading completed orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/orders')}
        >
          <Text style={styles.backText}>← Orders</Text>
        </Pressable>

        <Text style={styles.title}>Completed Orders</Text>

        <Text style={styles.subtitle}>
          Orders successfully delivered to customers
        </Text>

        {orders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>✓</Text>

            <Text style={styles.emptyTitle}>
              No completed orders yet
            </Text>

            <Text style={styles.emptyText}>
              Delivered orders will appear here.
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.orderId}>
                  #{order.id}
                </Text>

                <Text style={styles.amount}>
                  RM {Number(order.totalAmount || 0).toFixed(2)}
                </Text>
              </View>

              <Text style={styles.customer}>
                {order.customerName || 'Customer'}
              </Text>

              <View style={styles.row}>
                <Text style={styles.label}>Product</Text>
                <Text style={styles.value}>
                  {order.productName || 'Product'} × {order.quantity || 0}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Courier</Text>
                <Text style={styles.value}>
                  {order.courier || '-'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Tracking</Text>
                <Text style={styles.tracking}>
                  {order.trackingNumber || '-'}
                </Text>
              </View>

              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>
                  ✓ Delivered
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FB',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B6B8A',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 18,
  },
  backText: {
    color: '#5B2BD9',
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#181145',
  },
  subtitle: {
    color: '#6B6B8A',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderId: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 12,
  },
  amount: {
    color: '#5B2BD9',
    fontWeight: '900',
  },
  customer: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  label: {
    color: '#6B6B8A',
    fontSize: 13,
  },
  value: {
    color: '#181145',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  tracking: {
    color: '#EC4C99',
    fontWeight: '900',
    flex: 1,
    textAlign: 'right',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    color: '#15803D',
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 42,
    color: '#16A34A',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6B6B8A',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
  },
});
