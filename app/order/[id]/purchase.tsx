import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../../context/AuthContext';
import { getDataSource } from '../../../services/repository';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../../theme';

export default function PurchaseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile, membership, business, role } = useAuth();
  const [order, setOrder] = useState<null | { id: string; businessId?: string; productId?: string; total: number; customerName: string; customerPhone?: string | null; deliveryAddress?: string | null; paymentStatus?: string; requestStatus?: string; status?: string }>(null);
  const [product, setProduct] = useState<null | { id: string; name: string; costPrice: number; sellingPrice: number; image?: string; businessId?: string }>(null);
  const [variant, setVariant] = useState<null | { id: string; size: string; stock: number; productId: string }>(null);
  const [classification, setClassification] = useState<'customer_order' | 'extra_stock'>('customer_order');
  const [productCost, setProductCost] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [receipt, setReceipt] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('bank');
  const [transport, setTransport] = useState('0');
  const [parking, setParking] = useState('0');
  const [toll, setToll] = useState('0');
  const [other, setOther] = useState('0');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) {
        if (active) {
          setOrder(null);
          setProduct(null);
          setVariant(null);
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const businessId = membership?.business_id ?? business?.id ?? undefined;
        let nextOrder: typeof order | null = null;

        if (role === 'customer' || !businessId) {
          const candidateId = profile?.id ?? user?.id ?? undefined;
          nextOrder = candidateId ? await repo.orders.getForCustomer(candidateId, id) : null;
        } else if (businessId) {
          nextOrder = await repo.orders.getForBusiness(businessId, id);
        }

        if (!nextOrder || !active) {
          return;
        }

        setOrder(nextOrder);
        const items = nextOrder.businessId ? await repo.orders.listItemsForOrder(id, nextOrder.businessId) : [];
        const firstItem = items[0];
        const resolvedVariant = firstItem && nextOrder.businessId ? await repo.products.getProductVariant(firstItem.productVariantId, nextOrder.businessId) : null;
        const resolvedProduct = resolvedVariant && nextOrder.businessId ? await repo.products.getProduct(resolvedVariant.productId, nextOrder.businessId) : null;

        if (!active) {
          return;
        }

        setProduct(resolvedProduct ?? null);
        setVariant(resolvedVariant ?? null);
        setProductCost(String(resolvedProduct?.costPrice ?? Number(nextOrder.total ?? 0)));
      } catch {
        if (active) {
          setOrder(null);
          setProduct(null);
          setVariant(null);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [business?.id, id, membership?.business_id, profile?.id, role, user?.id]);

  if (!order || !product || !variant) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.error}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const total = [productCost, transport, parking, toll, other].reduce((sum, value) => sum + (Number(value) || 0), 0);

  const pickReceipt = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = camera ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 }) : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setReceipt(result.assets[0].uri);
    }
  };

  const createPayment = async () => {
    if (!order.businessId) {
      Alert.alert('Payment unavailable', 'This order is not associated with a valid business.');
      return;
    }

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: order.businessId,
      orderId: order.id,
      amount: Number(order.total ?? total ?? 0),
      currency: 'MYR',
      provider: 'mock',
      paymentMethod,
      customerId: user?.id ?? profile?.id ?? undefined,
      receiptUri: receipt || undefined,
    });

    if (!created) {
      Alert.alert('Payment Required', 'Verify the order and payment details before creating a payment record.');
      return;
    }

    const verified = await repo.payments.transition(created.id, order.businessId, 'paid', {
      verified: true,
      receiptUri: receipt || created.receipt_uri || undefined,
    });

    if (!verified) {
      Alert.alert('Payment verification failed', 'The payment record could not be verified for this order.');
      return;
    }

    router.replace(`/order/${order.id}`);
  };

  const saveExtra = async () => {
    if (!order.businessId) {
      Alert.alert('Payment unavailable', 'This order is not associated with a valid business.');
      return;
    }

    const repo = getDataSource('production');
    const created = await repo.payments.create({
      businessId: order.businessId,
      orderId: order.id,
      amount: Number(order.total ?? total ?? 0),
      currency: 'MYR',
      provider: 'mock',
      paymentMethod,
      customerId: user?.id ?? profile?.id ?? undefined,
      receiptUri: receipt || undefined,
    });

    if (!created) {
      Alert.alert('Payment Required', 'Verify the order and payment details before creating a payment record.');
      return;
    }

    await repo.payments.transition(created.id, order.businessId, 'paid', {
      verified: true,
      receiptUri: receipt || created.receipt_uri || undefined,
    });

    Alert.alert('Payment Saved', 'The payment record was persisted for this order.');
    router.replace(`/order/${order.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Confirm Purchase</Text>
        <Text style={styles.meta}>{product.name} · Size {variant.size}</Text>

        <View style={styles.card}>
          <Text style={styles.section}>Classification</Text>
          <View style={styles.actions}>
            {(['customer_order', 'extra_stock'] as const).map((value) => (
              <Pressable key={value} style={[styles.option, classification === value && styles.selected]} onPress={() => setClassification(value)}>
                <Text style={styles.optionText}>{value === 'customer_order' ? 'Customer Order' : 'Extra Stock'}</Text>
              </Pressable>
            ))}
          </View>
          {classification === 'extra_stock' && <Field label="Quantity" value={quantity} onChangeText={setQuantity} />}
        </View>

        <View style={styles.card}>
          {[['Product Cost', productCost, setProductCost], ['Transport', transport, setTransport], ['Parking', parking, setParking], ['Toll', toll, setToll], ['Other Expenses', other, setOther]].map(([label, value, setter]) => (
            <Field key={label as string} label={label as string} value={value as string} onChangeText={setter as (value: string) => void} />
          ))}
          <Text style={styles.total}>Total: RM{total.toFixed(2)}</Text>
          <Text style={styles.label}>Paid From</Text>
          <View style={styles.actions}>
            {(['cash', 'bank'] as const).map((value) => (
              <Pressable key={value} style={[styles.option, paymentMethod === value && styles.selected]} onPress={() => setPaymentMethod(value)}>
                <Text style={styles.optionText}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Purchase Receipt</Text>
          {receipt ? (
            <View>
              <Image source={{ uri: receipt }} style={styles.receipt} />
              <View style={styles.actions}>
                <Pressable onPress={() => pickReceipt(false)}>
                  <Text style={styles.link}>Replace</Text>
                </Pressable>
                <Pressable onPress={() => setReceipt('')}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actions}>
              <Pressable style={styles.option} onPress={() => pickReceipt(false)}>
                <Text style={styles.optionText}>Photo Library</Text>
              </Pressable>
              <Pressable style={styles.option} onPress={() => pickReceipt(true)}>
                <Text style={styles.optionText}>Camera</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable disabled={!receipt} style={[styles.primary, !receipt && styles.disabled]} onPress={classification === 'extra_stock' ? () => { void saveExtra(); } : () => { void createPayment(); }}>
          <Text style={styles.primaryText}>{classification === 'extra_stock' ? 'Save Extra Stock' : 'Confirm Customer Order Purchase'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800' },
  meta: { color: THEME.text.secondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: THEME.border },
  section: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  label: { color: THEME.text.primary, fontWeight: '700' },
  input: { width: 120, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, textAlign: 'right', color: THEME.text.primary },
  actions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  option: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
  selected: { borderWidth: 2, borderColor: THEME.primary },
  optionText: { color: THEME.primary, fontWeight: '800' },
  total: { color: THEME.primary, fontWeight: '900', fontSize: FONT_SIZES.lg, marginBottom: SPACING.md },
  receipt: { width: '100%', height: 220, marginVertical: SPACING.md },
  link: { color: THEME.primary, fontWeight: '800' },
  remove: { color: THEME.status.error, fontWeight: '800' },
  primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
  error: { padding: SPACING['2xl'], color: THEME.status.error },
});
