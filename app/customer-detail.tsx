import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

type ShoppingMode =
  | 'customer_request'
  | 'share_buy_on_demand'
  | 'buy_stock_sell';

const SHOPPING_MODE_LABELS: Record<ShoppingMode, string> = {
  customer_request: 'Customer Request',
  share_buy_on_demand: 'Share & Buy on Demand',
  buy_stock_sell: 'Buy Stock & Sell',
};

export default function TripDetail() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }

    const loadTrip = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'trips', tripId));

        if (snapshot.exists()) {
          setTrip({
            id: snapshot.id,
            ...snapshot.data(),
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
    if (!tripId) return;

    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'closed',
      });

      Alert.alert(
        'Trip closed',
        'The trip has been closed successfully.'
      );

      router.push('/(tabs)/inventory');
    } catch (error) {
      console.error('Close trip error:', error);

      Alert.alert(
        'Error',
        'Unable to close this trip.'
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color="#5B2BD9"
          />

          <Text style={styles.loadingText}>
            Loading trip...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>
            Trip not found
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace('/(tabs)/trips')
            }
          >
            <Text style={styles.primaryText}>
              Back to Trips
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const shoppingModes: ShoppingMode[] = Array.isArray(
    trip.shoppingModes
  )
    ? trip.shoppingModes
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Trip Detail
        </Text>

        <Text style={styles.subtitle}>
          Shopping trip management and inventory transfer
        </Text>

        <View style={styles.card}>
          <Text style={styles.tripName}>
            {trip.tripName ||
              trip.name ||
              'Untitled Trip'}
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>
              Trip ID
            </Text>

            <Text style={styles.value}>
              {trip.id}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Location
            </Text>

            <Text style={styles.value}>
              {trip.location || 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Date
            </Text>

            <Text style={styles.value}>
              {trip.date || 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Status
            </Text>

            <Text style={styles.status}>
              {trip.status || 'open'}
            </Text>
          </View>
        </View>

        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>
            Shopping Mode
          </Text>

          {shoppingModes.length === 0 ? (
            <Text style={styles.noModeText}>
              No shopping mode selected.
            </Text>
          ) : (
            shoppingModes.map((mode) => (
              <View
                key={mode}
                style={styles.modeItem}
              >
                <View style={styles.modeCheck}>
                  <Text style={styles.modeCheckText}>
                    ✓
                  </Text>
                </View>

                <Text style={styles.modeText}>
                  {SHOPPING_MODE_LABELS[mode] ||
                    mode}
                </Text>
              </View>
            ))
          )}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/upload-product',
              params: {
                tripId: trip.id,
              },
            })
          }
        >
          <Text style={styles.primaryText}>
            Upload Product
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Trip Workflow
          </Text>

          <Text style={styles.infoText}>
            Open Trip → Upload Products →
            Marketplace → Customer Orders →
            Close Trip → Transfer to Inventory →
            Orders become Ready to Pack.
          </Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={handleCloseTrip}
        >
          <Text style={styles.closeText}>
            Close Trip & Transfer to Inventory
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          After closing the trip, Ready Stock
          inventory will be updated and customers
          waiting for this trip can be packed
          immediately.
        </Text>
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

  modeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },

  modeTitle: {
    color: '#181145',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },

  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F1FF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },

  modeCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6C3FE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  modeCheckText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  modeText: {
    flex: 1,
    color: '#181145',
    fontSize: 14,
    fontWeight: '800',
  },

  noModeText: {
    color: '#6B6B8A',
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
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