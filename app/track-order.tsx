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
import { router, useLocalSearchParams } from 'expo-router';
import {
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

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
  courier?: string;
  trackingNumber?: string;
  orderStatus?: OrderStatus;
};

export default function TrackOrder() {
  const { orderId } =
    useLocalSearchParams<{
      orderId: string;
    }>();

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder(
            snapshot.data() as Order
          );
        } else {
          setOrder(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          'Tracking error:',
          error
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#5B2BD9"
          />

          <Text style={styles.loadingText}>
            Loading tracking...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            Order not found
          </Text>

          <Text style={styles.emptyText}>
            This tracking link is no longer
            available.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const status =
    order.orderStatus || 'Shipped';

  const timeline = [
    {
      title: 'Shipment Created',
      desc:
        'Shipping label generated',
      done: true,
    },
    {
      title: 'Courier Picked Up',
      desc:
        'Parcel collected from Personal Shopper',
      done:
        status === 'Shipped' ||
        status === 'Completed',
    },
    {
      title: 'In Transit',
      desc:
        'Parcel is moving through the courier network',
      done:
        status === 'Shipped' ||
        status === 'Completed',
    },
    {
      title: 'Out for Delivery',
      desc:
        'Courier is delivering the parcel',
      done: false,
    },
    {
      title: 'Delivered',
      desc:
        'Parcel delivered successfully',
      done:
        status === 'Completed',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </Pressable>

        <Text style={styles.title}>
          Track Order
        </Text>

        <Text style={styles.subtitle}>
          Shipment tracking
        </Text>

        <View style={styles.card}>
          <Text style={styles.orderId}>
            #{orderId}
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
              Tracking Number
            </Text>

            <Text style={styles.tracking}>
              {order.trackingNumber ||
                'Not available'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Current Status
            </Text>

            <Text style={styles.status}>
              {status}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Shipment Timeline
        </Text>

        {timeline.map(
          (step, index) => (
            <View
              key={index}
              style={styles.timelineRow}
            >
              <View
                style={[
                  styles.dot,
                  step.done &&
                    styles.dotActive,
                ]}
              />

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={[
                    styles.timelineTitle,
                    step.done &&
                      styles.timelineTitleActive,
                  ]}
                >
                  {step.title}
                </Text>

                <Text
                  style={
                    styles.timelineDesc
                  }
                >
                  {step.desc}
                </Text>
              </View>
            </View>
          )
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
    marginBottom: 24,
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

  status: {
    color: '#16A34A',
    fontWeight: '900',
  },

  sectionTitle: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },

  timelineRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },

  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginTop: 4,
  },

  dotActive: {
    backgroundColor: '#16A34A',
  },

  timelineContent: {
    marginLeft: 16,
    flex: 1,
  },

  timelineTitle: {
    color: '#6B6B8A',
    fontWeight: '800',
  },

  timelineTitleActive: {
    color: '#181145',
  },

  timelineDesc: {
    color: '#6B6B8A',
    marginTop: 4,
    lineHeight: 20,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyTitle: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
  },

  emptyText: {
    color: '#6B6B8A',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
});
