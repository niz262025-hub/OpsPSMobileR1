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
import { db } from '../firebase';

type Order = {
  id: string;
  customerName?: string;
  customerContact?: string;
  customerAddress?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  orderStatus?: string;
};

export default function PackOrder() {
  const [readyOrders, setReadyOrders] =
    useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('orderStatus', '==', 'Ready to Pack')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map(
          (d) => ({
            id: d.id,
            ...(d.data() as Omit<Order, 'id'>),
          })
        );

        setReadyOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Ready to Pack error:',
          error
        );
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handlePack = async (
    orderId: string
  ) => {
    try {
      await updateDoc(
        doc(db, 'orders', orderId),
        {
          orderStatus: 'Packed',
        }
      );

      alert(
        'Order packed successfully!'
      );
    } catch (error) {
      console.error(error);

      alert(
        'Failed to update order.'
      );
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
            Loading orders...
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
          Ready to Pack
        </Text>

        <Text style={styles.subtitle}>
          Orders waiting for packing
        </Text>

        {readyOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              No orders ready for packing
            </Text>

            <Text style={styles.emptyText}>
              Orders marked as Ready to Pack
              will appear here.
            </Text>
          </View>
        ) : (
          readyOrders.map((order) => (
            <View
              key={order.id}
              style={styles.card}
            >
              <Text style={styles.orderId}>
                #{order.id}
              </Text>

              <Text style={styles.customer}>
                {order.customerName ||
                  'Customer'}
              </Text>

              <View style={styles.itemRow}>
                <Text style={styles.item}>
                  {order.productName ||
                    'Product'}
                </Text>

                <Text style={styles.qty}>
                  × {order.quantity || 0}
                </Text>
              </View>

              <Text style={styles.address}>
                {order.customerAddress ||
                  'No delivery address'}
              </Text>

              <Text style={styles.amount}>
                RM{' '}
                {Number(
                  order.totalAmount || 0
                ).toFixed(2)}
              </Text>

              <Pressable
                style={styles.packButton}
                onPress={() =>
                  handlePack(order.id)
                }
              >
                <Text style={styles.packText}>
                  Confirm Packed
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          style={styles.nextButton}
          onPress={() =>
            router.push(
              '/shipping/generate'
            )
          }
        >
          <Text style={styles.nextText}>
            Generate EasyParcel Shipment
          </Text>
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
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  orderId: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 12,
  },

  customer: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },

  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  item: {
    color: '#181145',
    fontWeight: '800',
    flex: 1,
  },

  qty: {
    color: '#EC4C99',
    fontWeight: '900',
  },

  address: {
    color: '#6B6B8A',
    marginTop: 12,
    lineHeight: 22,
  },

  amount: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
  },

  packButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },

  packText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  nextButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  nextText: {
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
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#181145',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#6B6B8A',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },
});
