import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

function asNumber(value: any) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export default function TripDetail() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ productCount: 0, orderCount: 0, buyListCount: 0, unallocatedStock: 0 });

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    const loadTrip = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'trips', tripId));
        if (snapshot.exists()) {
          const tripData = { id: snapshot.id, ...snapshot.data() } as Record<string, any>;
          const ownerId = tripData.ownerId as string | undefined;
          setTrip(tripData);

          if (!ownerId) {
            setMetrics({ productCount: 0, orderCount: 0, buyListCount: 0, unallocatedStock: 0 });
            return;
          }

          const [productsSnap, ordersSnap, inventorySnap, buyListSnap] = await Promise.all([
            getDocs(query(collection(db, 'products'), where('ownerId', '==', ownerId), where('tripId', '==', tripId))),
            getDocs(query(collection(db, 'orders'), where('ownerId', '==', ownerId), where('tripId', '==', tripId))),
            getDocs(query(collection(db, 'inventory'), where('ownerId', '==', ownerId), where('tripId', '==', tripId))),
            getDocs(query(collection(db, 'buyList'), where('ownerId', '==', ownerId), where('tripId', '==', tripId))),
          ]);

          setMetrics({
            productCount: productsSnap.size,
            orderCount: ordersSnap.size,
            buyListCount: buyListSnap.size,
            unallocatedStock: inventorySnap.docs.reduce((sum, docSnap) => sum + asNumber(docSnap.data().quantity), 0),
          });
        }
      } catch (error) {
        console.error('Trip detail load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);

  const handleCloseTrip = async () => {
    if (!tripId || !trip?.ownerId) return;

    try {
      const [productsSnap, ordersSnap, inventorySnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), where('ownerId', '==', trip.ownerId), where('tripId', '==', tripId))),
        getDocs(query(collection(db, 'orders'), where('ownerId', '==', trip.ownerId), where('tripId', '==', tripId))),
        getDocs(query(collection(db, 'inventory'), where('ownerId', '==', trip.ownerId), where('tripId', '==', tripId))),
      ]);

      await Promise.all(
        ordersSnap.docs.map((orderDoc) =>
          updateDoc(doc(db, 'orders', orderDoc.id), {
            status: 'Completed',
            tripStatus: 'closed',
            closedAt: new Date().toISOString(),
          })
        )
      );

      await Promise.all(
        inventorySnap.docs.map((inventoryDoc) =>
          updateDoc(doc(db, 'inventory', inventoryDoc.id), {
            status: 'ready_stock',
            tripStatus: 'closed',
            available: asNumber(inventoryDoc.data().quantity),
          })
        )
      );

      await Promise.all(
        productsSnap.docs.map((productDoc) =>
          updateDoc(doc(db, 'products', productDoc.id), {
            status: 'closed',
            tripStatus: 'closed',
          })
        )
      );

      await updateDoc(doc(db, 'trips', tripId), {
        status: 'closed',
        closedAt: new Date().toISOString(),
        transitionedAt: new Date().toISOString(),
      });

      Alert.alert(
        'Trip closed',
        'Customer allocations remained on orders and unallocated stock was transferred to Ready Stock Inventory.'
      );

      router.push('/(tabs)/inventory');
    } catch (error) {
      console.error('Close trip error:', error);
      Alert.alert('Error', 'Unable to close this trip safely. Please try again.');
    }
  };

  const shoppingModeLabels: Record<string, string> = {
    customer_request: 'Customer Request',
    share_buy_on_demand: 'Share & Buy on Demand',
    buy_stock_sell: 'Buy Stock & Sell',
  };

  const shoppingModes = Array.isArray(trip?.shoppingModes) ? trip.shoppingModes : [];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#5B2BD9" />
          <Text style={styles.loadingText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Trip not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/trips')}>
            <Text style={styles.primaryText}>Back to Trips</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Trip Detail</Text>
        <Text style={styles.subtitle}>Shopping trip management and inventory transfer</Text>

        <View style={styles.card}>
          <Text style={styles.tripName}>{trip.tripName || trip.name || 'Untitled Trip'}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Trip ID</Text>
            <Text style={styles.value}>{trip.id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{trip.location || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{trip.date || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.status}>{trip.status || 'open'}</Text>
          </View>

          {shoppingModes.length > 0 && (
            <View style={styles.modeSection}>
              <Text style={styles.label}>Shopping Modes</Text>
              <View style={styles.modeList}>
                {shoppingModes.map((mode: string) => (
                  <View key={mode} style={styles.modePill}>
                    <Text style={styles.modePillText}>{shoppingModeLabels[mode] || mode}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{metrics.productCount}</Text>
            <Text style={styles.summaryLabel}>Products</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{metrics.orderCount}</Text>
            <Text style={styles.summaryLabel}>Orders</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{metrics.buyListCount}</Text>
            <Text style={styles.summaryLabel}>Buy List</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <Pressable style={styles.primaryButton} onPress={() => router.push({ pathname: '/product/upload', params: { tripId: trip.id } })}>
            <Text style={styles.primaryText}>Upload Product</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/marketplace')}>
            <Text style={styles.primaryText}>Marketplace</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/orders')}>
            <Text style={styles.primaryText}>Orders</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/buy-list')}>
            <Text style={styles.primaryText}>Buy List</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Trip lifecycle</Text>
          <Text style={styles.infoText}>Customer allocations remain attached to orders, while unallocated stock stays in Ready Stock Inventory after closure.</Text>
        </View>

        <Pressable style={styles.closeButton} onPress={handleCloseTrip}>
          <Text style={styles.closeText}>Close Trip & Transfer Inventory</Text>
        </Pressable>

        <Text style={styles.footer}>After closing the trip, Ready Stock inventory will be updated and customers waiting for this trip can be packed immediately.</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B6B8A',
    fontSize: 14,
    fontWeight: '700',
  },
  notFound: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181145',
    marginBottom: 16,
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
    marginBottom: 20,
  },
  tripName: {
    color: '#181145',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  status: {
    color: '#16A34A',
    fontWeight: '900',
  },
  modeSection: {
    marginTop: 10,
  },
  modeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  modePill: {
    backgroundColor: '#F3EEFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  modePillText: {
    color: '#5B2BD9',
    fontSize: 12,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6B6B8A',
    fontSize: 12,
    marginTop: 4,
  },
  actionGrid: {
    gap: 10,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  infoText: {
    color: '#6B6B8A',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    color: '#6B6B8A',
    marginTop: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
});
