import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { currency } from '../currency';

const readyStock = [
  { id: 'RS-001', name: 'Kebaya White', price: 128, stock: 4 },
  { id: 'RS-002', name: 'IKEA Storage Box', price: 35, stock: 12 },
];

const liveTrips = [
  {
    id: 'TRIP-101',
    name: 'Mid Valley Mega Sale',
    location: 'Mid Valley Megamall',
    ends: 'Today 8:00 PM',
  },
];

export default function PublicMarketplace() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>
          <Text style={{ color: '#181145' }}>Ops</Text>
          <Text style={{ color: '#EC4C99' }}>PS</Text>
        </Text>

        <Text style={styles.title}>Shop with Your Personal Shopper</Text>
        <Text style={styles.subtitle}>
          Browse ready stock or reserve products from live shopping trips.
        </Text>

        <Text style={styles.sectionTitle}>Ready Stock</Text>

        {readyStock.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imageText}>IMG</Text>
            </View>

            <Text style={styles.name}>{item.name}</Text>

            <View style={styles.row}>
              <Text style={styles.price}>{currency.format(item.price)}</Text>
              <Text style={styles.stock}>{item.stock} available</Text>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/order-form')}
            >
              <Text style={styles.primaryText}>Order Now</Text>
            </Pressable>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Live Shopping Trips</Text>

        {liveTrips.map((trip) => (
          <View key={trip.id} style={styles.card}>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.tripLocation}>{trip.location}</Text>
            <Text style={styles.tripEnds}>Trip ends: {trip.ends}</Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/marketplace')}
            >
              <Text style={styles.secondaryText}>View Trip Products</Text>
            </Pressable>
          </View>
        ))}
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
  logo: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#181145',
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    color: '#6B6B8A',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 160,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    color: '#5B2BD9',
    fontWeight: '900',
    fontSize: 18,
  },
  name: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    color: '#EC4C99',
    fontSize: 24,
    fontWeight: '900',
  },
  stock: {
    color: '#6B6B8A',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  tripName: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
  },
  tripLocation: {
    color: '#6B6B8A',
    marginTop: 8,
  },
  tripEnds: {
    color: '#EC4C99',
    fontWeight: '800',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  secondaryText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 16,
  },
});
