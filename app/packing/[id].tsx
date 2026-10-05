import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getDataSource } from '../../services/repository';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

type PackingItem = {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  packedQuantity: number;
  businessId?: string;
};

export default function PackingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { membership, business } = useAuth();
  const businessId = membership?.business_id ?? business?.id ?? undefined;
  const [order, setOrder] = useState<{ id: string; businessId?: string; tripId?: string; customerName: string; customerPhone?: string | null; deliveryAddress?: string | null; orderStatus: string; requestStatus?: string; } | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id || !businessId) {
        if (active) {
          setOrder(null);
          setItems([]);
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const nextOrder = await repo.orders.getForBusiness(businessId, String(id));
        if (!active) {
          return;
        }

        setOrder(nextOrder ? {
          id: nextOrder.id,
          businessId: nextOrder.businessId,
          tripId: nextOrder.tripId,
          customerName: nextOrder.customerName,
          customerPhone: nextOrder.customerPhone,
          deliveryAddress: nextOrder.deliveryAddress,
          orderStatus: nextOrder.orderStatus,
          requestStatus: nextOrder.requestStatus,
        } : null);

        if (nextOrder) {
          const nextItems = await repo.orders.listItemsForOrder(nextOrder.id, businessId);
          if (active) {
            setItems(nextItems.map((item) => ({
              id: item.id,
              orderId: item.orderId,
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              packedQuantity: item.packedQuantity,
              businessId: item.businessId,
            })));
          }
        } else if (active) {
          setItems([]);
        }
      } catch {
        if (active) {
          setOrder(null);
          setItems([]);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [businessId, id]);

  const packed = useMemo(() => items.reduce((sum, item) => sum + Math.min(item.quantity, item.packedQuantity ?? 0), 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const ready = packed === total && total > 0;

  const reload = async () => {
    if (!id || !businessId) {
      return;
    }

    const repo = getDataSource('production');
    const nextOrder = await repo.orders.getForBusiness(businessId, String(id));
    setOrder(nextOrder ? {
      id: nextOrder.id,
      businessId: nextOrder.businessId,
      tripId: nextOrder.tripId,
      customerName: nextOrder.customerName,
      customerPhone: nextOrder.customerPhone,
      deliveryAddress: nextOrder.deliveryAddress,
      orderStatus: nextOrder.orderStatus,
      requestStatus: nextOrder.requestStatus,
    } : null);

    if (nextOrder) {
      const nextItems = await repo.orders.listItemsForOrder(nextOrder.id, businessId);
      setItems(nextItems.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        packedQuantity: item.packedQuantity,
        businessId: item.businessId,
      })));
    }
  };

  const togglePacked = async (item: PackingItem) => {
    if (!businessId || !order) {
      return;
    }

    setLoading(true);
    try {
      const repo = getDataSource('production');
      await repo.orders.setItemPacked(businessId, order.id, item.id, (item.packedQuantity ?? 0) < item.quantity);
      await reload();
    } catch {
      Alert.alert('Packing update failed', 'This item could not be updated.');
    } finally {
      setLoading(false);
    }
  };

  const markReady = async () => {
    if (!businessId || !order) {
      return;
    }

    setLoading(true);
    try {
      const repo = getDataSource('production');
      const updated = await repo.orders.markOrderPacked(businessId, order.id);
      if (!updated) {
        Alert.alert('Packing incomplete', 'All items must be packed before marking this order ready.');
        return;
      }
      await reload();
      Alert.alert('Ready to Ship', 'All items are packed.');
    } catch {
      Alert.alert('Packing update failed', 'The order could not be marked ready.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return <SafeAreaView style={styles.safe}><Text style={styles.error}>Order not found.</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable style={styles.back} onPress={() => router.back()}><ArrowLeft size={18} color={THEME.primary} /><Text style={styles.backText}>Order</Text></Pressable>
    <Text style={styles.title}>Packing List</Text><Text style={styles.order}>{order.id}</Text>
    <View style={styles.card}><Text style={styles.customer}>{order.customerName}</Text><Text style={styles.meta}>{order.customerPhone ?? 'Phone not provided'}</Text><Text style={styles.meta}>{order.deliveryAddress ?? 'Address not provided'}</Text><Text style={styles.meta}>Status: {order.orderStatus}</Text></View>
    {items.map((item) => {
      const isPacked = (item.packedQuantity ?? 0) >= item.quantity;
      return <Pressable key={item.id} disabled={loading} style={styles.item} onPress={() => void togglePacked(item)}>
        <View style={styles.itemInfo}><Text style={styles.product}>{item.productVariantId}</Text><Text style={styles.meta}>Qty {item.quantity}</Text><Text style={[styles.packed, isPacked && styles.done]}>{isPacked ? '[x] Packed' : '[ ] Packed'}</Text></View>
      </Pressable>;
    })}
    <Text style={styles.progress}>{packed} / {total} Packed</Text>
    <Pressable disabled={!ready || order.orderStatus !== 'packing' || loading} style={[styles.primary, (!ready || order.orderStatus !== 'packing' || loading) && styles.disabled]} onPress={() => void markReady()}><Text style={styles.primaryText}>Mark Ready to Ship</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] }, back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, backText: { color: THEME.primary, fontWeight: '700' }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: SPACING.lg }, order: { color: THEME.primary, fontWeight: '800', marginTop: SPACING.xs }, card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginVertical: SPACING.lg }, customer: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800' }, meta: { color: THEME.text.secondary, marginTop: SPACING.xs }, item: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' }, itemInfo: { flex: 1 }, product: { color: THEME.text.primary, fontWeight: '800' }, packed: { color: THEME.text.secondary, fontWeight: '800', marginTop: SPACING.sm }, done: { color: THEME.status.success }, progress: { color: THEME.text.primary, fontWeight: '800', marginTop: SPACING.md }, primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg }, disabled: { opacity: 0.4 }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, error: { padding: SPACING['2xl'], color: THEME.status.error } });
