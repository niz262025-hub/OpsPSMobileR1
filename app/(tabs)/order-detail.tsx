import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

type OrderStatus =
  | 'New'
  | 'Pending Payment'
  | 'Ready to Pack'
  | 'Packed'
  | 'Pending to Ship'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

type Order = {
  customerName?: string;
  customerContact?: string;
  customerAddress?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  orderStatus?: OrderStatus;
  trackingNumber?: string;
  tracking?: string;
  courier?: string;
};

const statuses: OrderStatus[] = [
  'New',
  'Pending Payment',
  'Ready to Pack',
  'Packed',
  'Pending to Ship',
  'Shipped',
  'Completed',
  'Cancelled',
];

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatus>('New');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(db, 'orders', orderId)
        );

        if (snapshot.exists()) {
          const data = snapshot.data() as Order;
          setOrder(data);
          setSelectedStatus(data.orderStatus || 'New');
        }
      } catch (error) {
        console.error('Order detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const goBack = () => {
    router.replace('/(tabs)/orders');
  };

  const handleSave = async () => {
    if (!orderId || !order) return;

    try {
      setSaving(true);

      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: selectedStatus,
      });

      setOrder({
        ...order,
        orderStatus: selectedStatus,
      });

      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Update status error:', error);
      alert('Unable to update order status.');
    } finally {
      setSaving(false);
    }
  };

  const handleShipOrder = async () => {
    if (!orderId) return;

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: 'Pending to Ship',
      });

      router.push({
        pathname: '/shipping/generate',
        params: { orderId },
      });
    } catch (error) {
      console.error('Prepare shipment error:', error);
      alert('Unable to prepare shipment.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B2BD9" />
          <Text style={styles.loadingText}>
            Loading order...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Pressable
            style={styles.backButton}
            onPress={goBack}
          >
            <Text style={styles.backText}>
              ← Orders
            </Text>
          </Pressable>

          <Text style={styles.notFoundTitle}>
            Order not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = Number(order.totalAmount || 0);
  const tracking =
    order.trackingNumber ||
    order.tracking ||
    'Not generated';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={goBack}
        >
          <Text style={styles.backText}>
            ← Orders
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Order Detail
        </Text>

        <Text style={styles.subtitle}>
          Review and update customer order
        </Text>

        <View style={styles.card}>
          <Text style={styles.orderId}>
            #{orderId}
          </Text>

          <Text style={styles.customer}>
            {order.customerName || 'Customer'}
          </Text>

          <InfoRow
            label="Contact"
            value={order.customerContact || '-'}
          />

          <InfoRow
            label="Product"
            value={order.productName || '-'}
          />

          <InfoRow
            label="Quantity"
            value={String(order.quantity || 0)}
          />

          <InfoRow
            label="Unit Price"
            value={`RM ${Number(
              order.unitPrice || 0
            ).toFixed(2)}`}
          />

          <InfoRow
            label="Total"
            value={`RM ${total.toFixed(2)}`}
            highlight
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Delivery Information
          </Text>

          <Text style={styles.infoLabel}>
            Delivery Address
          </Text>

          <Text style={styles.address}>
            {order.customerAddress ||
              'No delivery address'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Shipping
          </Text>

          <InfoRow
            label="Courier"
            value={order.courier || '-'}
          />

          <InfoRow
            label="Tracking"
            value={tracking}
          />
        </View>

        <Text style={styles.section}>
          Update Status
        </Text>

        {statuses.map((status) => (
          <Pressable
            key={status}
            style={[
              styles.statusButton,
              status === selectedStatus &&
                styles.statusButtonActive,
            ]}
            onPress={() =>
              setSelectedStatus(status)
            }
          >
            <Text
              style={[
                styles.statusText,
                status === selectedStatus &&
                  styles.statusTextActive,
              ]}
            >
              {status}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={[
            styles.primaryButton,
            saving && styles.disabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>
              Save Status
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.shipButton}
          onPress={handleShipOrder}
        >
          <Text style={styles.shipText}>
            Generate Shipment (EasyParcel)
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>
        {label}
      </Text>

      <Text
        style={[
          styles.value,
          highlight && styles.total,
        ]}
      >
        {value}
      </Text>
    </View>
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
    fontSize: 14,
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
    marginBottom: 16,
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
    marginBottom: 18,
  },

  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 14,
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
    fontSize: 13,
  },

  total: {
    color: '#EC4C99',
    fontSize: 18,
    fontWeight: '900',
  },

  infoLabel: {
    color: '#6B6B8A',
    fontSize: 13,
    marginBottom: 8,
  },

  address: {
    color: '#181145',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },

  section: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },

  statusButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
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

  disabled: {
    opacity: 0.6,
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

  notFoundTitle: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
  },
});
