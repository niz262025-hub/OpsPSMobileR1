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

type Shipment = {
  id: string;
  customerName?: string;
  customerContact?: string;
  customerAddress?: string;
  productName?: string;
  quantity?: number;
  courier?: string;
  trackingNumber?: string;
};

export default function PendingToShip() {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [shippingId, setShippingId] =
    useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where(
        'orderStatus',
        '==',
        'Pending to Ship'
      )
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Shipment[] =
          snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<
              Shipment,
              'id'
            >),
          }));

        setShipments(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Pending shipment error:',
          error
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleHandedToCourier = async (
    orderId: string
  ) => {
    try {
      setShippingId(orderId);

      await updateDoc(
        doc(db, 'orders', orderId),
        {
          orderStatus: 'Shipped',
        }
      );

      alert(
        'Parcel handed to courier successfully!\n\n' +
        'Order status changed to Shipped.'
      );

      router.replace(
        '/shipped-orders'
      );
    } catch (error) {
      console.error(error);

      alert(
        'Failed to update shipment status.'
      );
    } finally {
      setShippingId('');
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
            Loading shipments...
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
          Pending to Ship
        </Text>

        <Text style={styles.subtitle}>
          Orders waiting for courier pickup
        </Text>

        {shipments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              🚚
            </Text>

            <Text style={styles.emptyTitle}>
              No parcels waiting
            </Text>

            <Text style={styles.emptyText}>
              Shipments waiting for courier
              pickup will appear here.
            </Text>
          </View>
        ) : (
          shipments.map((order) => (
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

              <View style={styles.row}>
                <Text style={styles.label}>
                  Courier
                </Text>

                <Text style={styles.value}>
                  {order.courier || '-'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Tracking
                </Text>

                <Text style={styles.tracking}>
                  {order.trackingNumber ||
                    'Not generated'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>
                  Items
                </Text>

                <Text style={styles.value}>
                  {order.productName ||
                    'Product'}{' '}
                  × {order.quantity || 0}
                </Text>
              </View>

              <View style={styles.addressBox}>
                <Text style={styles.label}>
                  Destination
                </Text>

                <Text style={styles.address}>
                  {order.customerAddress ||
                    'No delivery address'}
                </Text>
              </View>

              <Pressable
                style={[
                  styles.shipButton,
                  shippingId === order.id &&
                    styles.buttonDisabled,
                ]}
                disabled={
                  shippingId === order.id
                }
                onPress={() =>
                  handleHandedToCourier(
                    order.id
                  )
                }
              >
                {shippingId === order.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.shipText}>
                    Parcel Handed to Courier
                  </Text>
                )}
              </Pressable>
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

  addressBox: {
    marginTop: 4,
    marginBottom: 4,
  },

  address: {
    color: '#181145',
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 6,
  },

  shipButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  shipText: {
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
