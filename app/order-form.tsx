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
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './context/AuthContext';

export default function OrderForm() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication', 'Please log in to place an order.');
      return;
    }

    if (!product.trim()) {
      Alert.alert('Validation', 'Please enter product name.');
      return;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        ownerId: user.uid,
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
        status: 'Ready to Pack',
        orderStatus: 'Ready to Pack',
        totalAmount: 0,
        amount: 0,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Order placed successfully!', 'Status: Ready to Pack');
      router.push('/(tabs)/orders');
    } catch (error: any) {
      Alert.alert('Order failed', error.message || 'Unable to place order');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.logo}>
          <Text style={{ color: '#181145' }}>Ops</Text>
          <Text style={{ color: '#EC4C99' }}>PS</Text>
        </Text>

        <Text style={styles.title}>Place Ready Stock Order</Text>
        <Text style={styles.subtitle}>
          This order will reserve inventory immediately and move directly to Ready to Pack.
        </Text>

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

        <Text style={styles.sectionTitle}>Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Product name"
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

        <Pressable style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryText}>Confirm Ready Stock Order</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Back to Marketplace</Text>
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
  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
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
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCardActive: {
    borderWidth: 2,
    borderColor: '#5B2BD9',
  },
  productName: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
  },
  productStock: {
    color: '#6B6B8A',
    marginTop: 4,
  },
  productPrice: {
    color: '#EC4C99',
    fontSize: 20,
    fontWeight: '900',
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
