import { useEffect, useMemo, useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
collection,
onSnapshot,
query,
where,
getDocs,
addDoc,
serverTimestamp,
doc,
updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

type Order = {
id: string;
product: string;
qty: number;
paymentMethod?: 'pay_now' | 'pay_later';
status?: string;
};

type BuyItem = {
product: string;
qty: number;
paymentMethod?: 'pay_now' | 'pay_later';
};

export default function BuyList() {
const [orders, setOrders] = useState<Order[]>([]);

useEffect(() => {
const q = query(
collection(db, 'orders'),
where('status', '==', 'In Buy List')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const data: Order[] = snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Order, 'id'>),
  }));
  setOrders(data);
});

return unsubscribe;

}, []);

const buyList: BuyItem[] = useMemo(() => {
const map = new Map<string, { qty: number; paymentMethod?: 'pay_now' | 'pay_later' }>();
orders.forEach((o) => {
const entry = map.get(o.product) || { qty: 0, paymentMethod: o.paymentMethod };
entry.qty += o.qty;
if (o.paymentMethod) {
  entry.paymentMethod = o.paymentMethod;
}
map.set(o.product, entry);
});
return Array.from(map.entries()).map(([product, entry]) => ({
product,
qty: entry.qty,
paymentMethod: entry.paymentMethod,
}));
}, [orders]);

const handleConfirmBought = async (product: string, qty: number) => {
try {
await addDoc(collection(db, 'inventory'), {
name: product,
stock: qty,
createdAt: serverTimestamp(),
});

  const q = query(
    collection(db, 'orders'),
    where('status', '==', 'In Buy List'),
    where('product', '==', product)
  );

  const snapshot = await getDocs(q);

  for (const orderDoc of snapshot.docs) {
    await updateDoc(doc(db, 'orders', orderDoc.id), {
      status: 'Ready to Pack',
    });
  }

  alert(
    `${product} confirmed as Bought.\\nInventory updated and related orders moved to Ready to Pack.`
  );
} catch (error) {
  console.error(error);
  alert('Failed to update inventory.');
}

};

return ( <SafeAreaView style={styles.container}> <ScrollView
     contentContainerStyle={styles.content}
     showsVerticalScrollIndicator={false}
   > <Text style={styles.title}>Buy List</Text> <Text style={styles.subtitle}>
Aggregated products to purchase for the active trip </Text>

    {buyList.length === 0 ? (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          No items in Buy List.
        </Text>
      </View>
    ) : (
      buyList.map((item) => (
        <View key={item.product} style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.product}>
                {item.product}
              </Text>
              <Text style={styles.qty}>
                Total required: {item.qty} units
              </Text>
              {item.paymentMethod && (
                <Text style={styles.paymentLabel}>
                  Payment: {item.paymentMethod === 'pay_now' ? 'Pay now' : 'Pay later'}
                </Text>
              )}
            </View>

            <Pressable
              style={styles.button}
              onPress={() =>
                handleConfirmBought(item.product, item.qty)
              }
            >
              <Text style={styles.buttonText}>
                Confirm Bought
              </Text>
            </Pressable>
          </View>
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
row: {
flexDirection: 'row',
alignItems: 'center',
},
product: {
color: '#181145',
fontSize: 20,
fontWeight: '900',
},
qty: {
color: '#6B6B8A',
marginTop: 6,
},
paymentLabel: {
color: '#5B2BD9',
fontSize: 12,
fontWeight: '700',
marginTop: 6,
},
button: {
backgroundColor: '#5B2BD9',
borderRadius: 14,
paddingHorizontal: 14,
paddingVertical: 12,
marginLeft: 16,
},
buttonText: {
color: '#FFFFFF',
fontWeight: '800',
},
emptyCard: {
backgroundColor: '#FFFFFF',
borderRadius: 22,
padding: 24,
alignItems: 'center',
},
emptyText: {
color: '#6B6B8A',
fontWeight: '700',
},
});
