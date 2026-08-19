import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './context/AuthContext';

export default function TripOrder() {
  const { tripId, tripName } = useLocalSearchParams<{ tripId?: string; tripName?: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleReserve = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication', 'Please log in to reserve an item.');
      return;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        ownerId: user.uid,
        tripId: tripId || null,
        tripName: tripName || 'Trip Order',
        customer: customer.trim(),
        customerName: customer.trim(),
        phone: phone.trim(),
        customerContact: phone.trim(),
        product: product.trim(),
        productName: product.trim(),
        qty: Number(qty || '1'),
        quantity: Number(qty || '1'),
        address: address.trim(),
        customerAddress: address.trim(),
        notes: notes.trim(),
        status: 'Awaiting Trip Return',
        orderStatus: 'Awaiting Trip Return',
        amount: 0,
        totalAmount: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Reservation submitted!', 'Status: Awaiting Trip Return');
      router.push('/(tabs)/orders');
    } catch (error: any) {
      Alert.alert('Reservation failed', error.message || 'Unable to reserve item');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>
          <Text style={{ color: '#181145' }}>Ops</Text>
          <Text style={{ color: '#EC4C99' }}>PS</Text>
        </Text>

        <Text style={styles.title}>Reserve from Live Trip</Text>
        <Text style={styles.subtitle}>
          Reserve an item while the personal shopper is still shopping.
        </Text>

        <View style={styles.tripCard}>
          <Text style={styles.tripName}>Mid Valley Mega Sale</Text>
          <Text style={styles.tripInfo}>Location: Mid Valley Megamall</Text>
          <Text style={styles.tripInfo}>Status: Open</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#9CA3AF"
          value={customer}
          onChangeText={setCustomer}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholder="Product"
          placeholderTextColor="#9CA3AF"
          value={product}
          onChangeText={setProduct}
        />

        <TextInput
          style={styles.input}
          placeholder="Quantity"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={qty}
          onChangeText={setQty}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Delivery Address"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <Pressable style={styles.primaryButton} onPress={handleReserve}>
          <Text style={styles.primaryText}>Reserve Item</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Back</Text>
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
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  tripName: {
    color: '#181145',
    fontSize: 22,
    fontWeight: '900',
  },
  tripInfo: {
    color: '#6B6B8A',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    color: '#181145',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#5B2BD9',
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
  secondaryButton: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 16,
  },
});
