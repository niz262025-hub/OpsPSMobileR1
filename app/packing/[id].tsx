import React from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { getOrder, getProduct, getProductVariant, markOrderPacked, setOrderItemPacked, useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

export default function PackingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useMockDatabase();
  const order = id ? getOrder(id, db) : undefined;
  if (!order) return <SafeAreaView style={styles.safe}><Text style={styles.error}>Order not found.</Text></SafeAreaView>;
  const items = db.orderItems.filter((item) => item.orderId === order.id);
  const packed = items.reduce((sum, item) => sum + Math.min(item.quantity, item.packedQuantity ?? 0), 0);
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  const ready = packed === total && total > 0;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable style={styles.back} onPress={() => router.back()}><ArrowLeft size={18} color={THEME.primary} /><Text style={styles.backText}>Order</Text></Pressable>
    <Text style={styles.title}>Packing List</Text><Text style={styles.order}>{order.id}</Text>
    <View style={styles.card}><Text style={styles.customer}>{order.customerName}</Text><Text style={styles.meta}>{order.customerPhone ?? 'Phone not provided'}</Text><Text style={styles.meta}>{order.deliveryAddress ?? 'Address not provided'}</Text><Text style={styles.meta}>Trip: {db.trips.find((trip) => trip.id === order.tripId)?.name ?? order.tripId}</Text><Text style={styles.meta}>Status: {order.status}</Text></View>
    {items.map((item) => { const variant = getProductVariant(item.productVariantId, db); const product = variant ? getProduct(variant.productId, db) : undefined; const isPacked = (item.packedQuantity ?? 0) >= item.quantity; return <Pressable key={item.id} style={styles.item} onPress={() => setOrderItemPacked(item.id, !isPacked)}><Image source={{ uri: product?.image }} style={styles.image} /><View style={styles.itemInfo}><Text style={styles.product}>{product?.name ?? 'Product'}</Text><Text style={styles.meta}>Size {variant?.size ?? 'Standard'} · Qty {item.quantity}</Text><Text style={[styles.packed, isPacked && styles.done]}>{isPacked ? '[x] Packed' : '[ ] Packed'}</Text></View></Pressable>; })}
    <Text style={styles.progress}>{packed} / {total} Packed</Text>
    <Pressable disabled={!ready || order.status !== 'packing'} style={[styles.primary, (!ready || order.status !== 'packing') && styles.disabled]} onPress={() => { if (markOrderPacked(order.id)) Alert.alert('Ready to Ship', 'All items are packed.'); }}><Text style={styles.primaryText}>Mark Ready to Ship</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] }, back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, backText: { color: THEME.primary, fontWeight: '700' }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: SPACING.lg }, order: { color: THEME.primary, fontWeight: '800', marginTop: SPACING.xs }, card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginVertical: SPACING.lg }, customer: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800' }, meta: { color: THEME.text.secondary, marginTop: SPACING.xs }, item: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }, image: { width: 64, height: 64, borderRadius: BORDER_RADIUS.sm, backgroundColor: '#F3F4F6' }, itemInfo: { flex: 1, marginLeft: SPACING.md }, product: { color: THEME.text.primary, fontWeight: '800' }, packed: { color: THEME.text.secondary, fontWeight: '800', marginTop: SPACING.sm }, done: { color: THEME.status.success }, progress: { color: THEME.text.primary, fontWeight: '800', marginTop: SPACING.md }, primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg }, disabled: { opacity: 0.4 }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, error: { padding: SPACING['2xl'], color: THEME.status.error } });
