import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { currency } from '../currency';

const cartItems = [
{
id: 'CART-001',
name: 'Coach Wallet',
qty: 2,
price: 220,
},
{
id: 'CART-002',
name: 'Zara Blazer',
qty: 1,
price: 180,
},
];

export default function Cart() {
const total = cartItems.reduce(
(sum, item) => sum + item.price * item.qty,
0
);

const handleCheckout = async () => {
try {
for (const item of cartItems) {
await addDoc(collection(db, 'orders'), {
customer: 'Aina',
phone: '+60123456789',
address: 'Bukit Indah, Johor Bahru',
product: item.name,
qty: item.qty,
amount: item.price * item.qty,
status: 'In Buy List',
createdAt: serverTimestamp(),
});
}

  alert(
    'Payment Successful!\\n\\nOrders have been saved to Firebase and added to the Buy List queue.'
  );

  router.push('/buy-list');
} catch (error) {
  console.error(error);
  alert('Checkout failed.');
}

};

return ( <SafeAreaView style={styles.container}> <ScrollView
     contentContainerStyle={styles.content}
     showsVerticalScrollIndicator={false}
   > <Text style={styles.title}>Cart</Text> <Text style={styles.subtitle}>
Review your items before checkout </Text>

    {cartItems.map((item) => (
      <View key={item.id} style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>

        <View style={styles.row}>
          <Text style={styles.qty}>
            Qty: {item.qty}
          </Text>

          <Text style={styles.price}>
            {currency.format(item.price * item.qty)}
          </Text>
        </View>
      </View>
    ))}

    <View style={styles.summaryCard}>
      <View style={styles.row}>
        <Text style={styles.summaryLabel}>
          Subtotal
        </Text>
        <Text style={styles.summaryValue}>
          {currency.format(total)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.summaryLabel}>
          Service Fee
        </Text>
        <Text style={styles.summaryValue}>
          {currency.format(0)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>
          {currency.format(total)}
        </Text>
      </View>
    </View>

    <Pressable
      style={styles.primaryButton}
      onPress={handleCheckout}
    >
      <Text style={styles.primaryText}>
        Checkout & Pay
      </Text>
    </Pressable>

    <Text style={styles.note}>
      After payment, orders are saved to Firebase and will appear in the Buy
      List for the active trip.
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
marginBottom: 14,
},
name: {
color: '#181145',
fontSize: 20,
fontWeight: '900',
},
row: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginTop: 12,
},
qty: {
color: '#6B6B8A',
},
price: {
color: '#EC4C99',
fontWeight: '900',
fontSize: 18,
},
summaryCard: {
backgroundColor: '#FFFFFF',
borderRadius: 22,
padding: 20,
marginTop: 8,
marginBottom: 24,
},
summaryLabel: {
color: '#6B6B8A',
},
summaryValue: {
color: '#181145',
fontWeight: '700',
},
divider: {
height: 1,
backgroundColor: '#E5E7EB',
marginVertical: 16,
},
totalLabel: {
color: '#181145',
fontSize: 18,
fontWeight: '900',
},
totalValue: {
color: '#EC4C99',
fontSize: 24,
fontWeight: '900',
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
note: {
color: '#6B6B8A',
textAlign: 'center',
marginTop: 16,
lineHeight: 22,
},
});
