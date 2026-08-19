import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { currency } from '../currency';

type OrderStatus =
  | 'New'
  | 'Pending Payment'
  | 'Ready to Pack'
  | 'Pending to Ship'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

type OrderRecord = {
  id: string;
  customer?: string;
  customerName?: string;
  phone?: string;
  customerContact?: string;
  product?: string;
  productName?: string;
  qty?: number;
  quantity?: number;
  address?: string;
  customerAddress?: string;
  tracking?: string;
  trackingNumber?: string;
  courier?: string;
  amount?: number;
  totalAmount?: number;
  status?: OrderStatus;
  orderStatus?: OrderStatus;
};

const statuses: OrderStatus[] = [
  'New',
  'Pending Payment',
  'Ready to Pack',
  'Pending to Ship',
  'Shipped',
  'Completed',
  'Cancelled',
];

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('New');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, 'orders', orderId));
        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, any>;
          const normalized: OrderRecord = {
            id: snapshot.id,
            customer: data.customer,
            customerName: data.customerName,
            phone: data.phone,
            customerContact: data.customerContact,
            product: data.product,
            productName: data.productName,
            qty: data.qty ?? data.quantity,
            quantity: data.quantity ?? data.qty,
            address: data.address,
            customerAddress: data.customerAddress,
            tracking: data.tracking,
            trackingNumber: data.trackingNumber,
            courier: data.courier,
            amount: data.amount,
            totalAmount: data.totalAmount,
            status: data.status ?? data.orderStatus ?? 'New',
            orderStatus: data.orderStatus ?? data.status ?? 'New',
          };
          setOrder(normalized);
          setSelectedStatus(normalized.orderStatus ?? normalized.status ?? 'New');
        }
      } catch (error) {
        console.error('Order detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSave = async () => {
    if (!orderId) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: selectedStatus, status: selectedStatus });
      Alert.alert('Order status updated successfully!');
    } catch (error) {
      console.error('Update order status error:', error);
      Alert.alert('Error', 'Unable to update order status.');
    }
  };

  const handleShipOrder = async () => {
    if (!orderId) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), { orderStatus: 'Pending to Ship', status: 'Pending to Ship' });
      router.push('/shipping/generate');
    } catch (error) {
      console.error('Ship order error:', error);
      Alert.alert('Error', 'Unable to prepare shipment.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#5B2BD9" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Order not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={styles.primaryText}>Back to Orders</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Order Detail</Text>
        <Text style={styles.subtitle}>Review and update order status</Text>

        <View style={styles.card}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.customer}>{order.customer || order.customerName || 'Customer'}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{order.phone || order.customerContact || '-'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Product</Text>
            <Text style={styles.value}>{order.product || order.productName || '-'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>{String(order.qty ?? order.quantity ?? 0)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{order.address || order.customerAddress || '-'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tracking</Text>
            <Text style={styles.value}>{order.tracking ?? order.trackingNumber ?? 'Not generated'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Courier</Text>
            <Text style={styles.value}>{order.courier ?? '-'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.total}>{currency.format(Number(order.amount ?? order.totalAmount ?? 0))}</Text>
          </View>
        </View>

        <Text style={styles.section}>Update Status</Text>

        {statuses.map((status) => (
          <Pressable
            key={status}
            style={[
              styles.statusButton,
              status === selectedStatus && styles.statusButtonActive,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.statusText,
                status === selectedStatus && styles.statusTextActive,
              ]}
            >
              {status}
            </Text>
          </Pressable>
        ))}

        <Pressable style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryText}>Save Status</Text>
        </Pressable>

        <Pressable style={styles.shipButton} onPress={handleShipOrder}>
          <Text style={styles.shipText}>Generate Shipment (EasyParcel)</Text>
        </Pressable>
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
    paddingBottom: 32,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  orderId: {
    color: '#5B2BD9',
    fontWeight: '800',
  },
  customer: {
    color: '#181145',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    color: '#6B6B8A',
  },
  value: {
    color: '#181145',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  total: {
    color: '#EC4C99',
    fontWeight: '900',
    fontSize: 20,
  },
  section: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#6B6B8A',
    marginTop: 12,
    fontWeight: '700',
  },
  emptyTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 18,
  },
  statusButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusButtonActive: {
    backgroundColor: '#5B2BD9',
  },
  statusText: {
    color: '#181145',
    fontWeight: '800',
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#EC4C99',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  shipButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  shipText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
