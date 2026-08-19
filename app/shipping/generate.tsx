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
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

type Order = {
  id: string;
  customerName?: string;
  customerContact?: string;
  customerAddress?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  orderStatus?: string;
  courier?: string;
  trackingNumber?: string;
};

const couriers = [
  'J&T Express',
  'Ninja Van',
  'PosLaju',
  'DHL eCommerce',
];

export default function GenerateShipment() {
  const [packedOrders, setPackedOrders] =
    useState<Order[]>([]);

  const [selectedOrder, setSelectedOrder] =
    useState('');

  const [courier, setCourier] =
    useState(couriers[0]);

  const [loading, setLoading] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where(
        'orderStatus',
        '==',
        'Packed'
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] =
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, 'id'>),
          }));

        setPackedOrders(data);

        if (
          !selectedOrder &&
          data.length > 0
        ) {
          setSelectedOrder(data[0].id);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          'Packed orders error:',
          error
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedOrder]);

  const handleGenerate = async () => {
    if (!selectedOrder) {
      alert(
        'Please select a packed order.'
      );
      return;
    }

    try {
      setGenerating(true);

      const tracking =
        `EP${Math.floor(
          100000000 +
          Math.random() * 900000000
        )}MY`;

      await updateDoc(
        doc(
          db,
          'orders',
          selectedOrder
        ),
        {
          orderStatus:
            'Pending to Ship',

          courier,

          trackingNumber:
            tracking,
        }
      );

      alert(
        `Shipment Generated!\n\n` +
        `Courier: ${courier}\n` +
        `Tracking: ${tracking}`
      );

      router.replace(
        '/pending-to-ship'
      );
    } catch (error) {
      console.error(
        'Generate shipment error:',
        error
      );

      alert(
        'Failed to generate shipment.'
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#5B2BD9"
          />

          <Text style={styles.loadingText}>
            Loading packed orders...
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
          onPress={() =>
            router.replace('/(tabs)/orders')
          }
        >
          <Text style={styles.backText}>
            ← Orders
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Generate Shipment
        </Text>

        <Text style={styles.subtitle}>
          Prepare packed orders for shipping
        </Text>

        {packedOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              No packed orders
            </Text>

            <Text style={styles.emptyText}>
              Orders marked as Packed will
              appear here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Select Packed Order
            </Text>

            {packedOrders.map((order) => (
              <Pressable
                key={order.id}
                style={[
                  styles.card,
                  selectedOrder ===
                    order.id &&
                    styles.cardActive,
                ]}
                onPress={() =>
                  setSelectedOrder(
                    order.id
                  )
                }
              >
                <View style={styles.row}>
                  <Text
                    style={styles.orderId}
                  >
                    #{order.id}
                  </Text>

                  <Text
                    style={styles.amount}
                  >
                    RM{' '}
                    {Number(
                      order.totalAmount ||
                        0
                    ).toFixed(2)}
                  </Text>
                </View>

                <Text
                  style={styles.customer}
                >
                  {order.customerName ||
                    'Customer'}
                </Text>

                <Text
                  style={styles.product}
                >
                  {order.productName ||
                    'Product'}{' '}
                  × {order.quantity || 0}
                </Text>

                <Text
                  style={styles.address}
                >
                  {order.customerAddress ||
                    'No delivery address'}
                </Text>

                {selectedOrder ===
                  order.id && (
                  <Text
                    style={styles.selectedText}
                  >
                    ✓ Selected
                  </Text>
                )}
              </Pressable>
            ))}

            <Text style={styles.sectionTitle}>
              Select Courier
            </Text>

            {couriers.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.courierButton,
                  courier === item &&
                    styles.courierButtonActive,
                ]}
                onPress={() =>
                  setCourier(item)
                }
              >
                <Text
                  style={[
                    styles.courierText,
                    courier === item &&
                      styles.courierTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.primaryButton,
                generating &&
                  styles.buttonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={styles.primaryText}
                >
                  Generate EasyParcel Shipment
                </Text>
              )}
            </Pressable>
          </>
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

  sectionTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  cardActive: {
    borderColor: '#5B2BD9',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },

  product: {
    color: '#6B6B8A',
    marginTop: 6,
    fontWeight: '700',
  },

  address: {
    color: '#6B6B8A',
    marginTop: 10,
    lineHeight: 20,
  },

  selectedText: {
    color: '#16A34A',
    fontWeight: '900',
    marginTop: 12,
  },

  courierButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  courierButtonActive: {
    backgroundColor: '#5B2BD9',
  },

  courierText: {
    color: '#181145',
    fontWeight: '800',
    textAlign: 'center',
  },

  courierTextActive: {
    color: '#FFFFFF',
  },

  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 42,
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
    lineHeight: 20,
  },
});
