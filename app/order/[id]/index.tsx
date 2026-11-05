import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { useAuth } from '../../../context/AuthContext';
import { getDataSource } from '../../../services/repository';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../../theme';
import OrderPaymentPanel from '../../../components/OrderPaymentPanel';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile, membership, business, role, ready } = useAuth();
  const [detailLoading, setDetailLoading] = useState(true);
  const [order, setOrder] = useState<null | { id: string; customerName: string; total: number; requestStatus?: string; status?: string; paymentStatus?: string; orderStatus?: string; availabilityStatus?: string; customerPhone?: string | null; deliveryAddress?: string | null; productId?: string; tripId?: string; businessId?: string }>(null);
  const [items, setItems] = useState<Array<{ id: string; quantity: number; productVariantId: string }>>([]);
  const [productName, setProductName] = useState('Product');
  const [revision,setRevision]=useState(0);
  const [packingBusy,setPackingBusy]=useState(false),[actionError,setActionError]=useState('');

  useEffect(() => {
    if (!ready) return;
    let active = true;
    setDetailLoading(true);
    setOrder(null);

    const load = async () => {
      if (!id) {
        if (active) {
          setOrder(null);
          setItems([]);
          setProductName('Product');
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const profileId = profile?.id ?? user?.id ?? undefined;
        const businessId = membership?.business_id ?? business?.id ?? undefined;

        let nextOrder: typeof order | null = null;
        if (role === 'customer' || !businessId) {
          nextOrder = profileId ? await repo.orders.getForCustomer(profileId, id) : null;
        } else if (businessId) {
          nextOrder = await repo.orders.getForBusiness(businessId, id);
        }

        if (!nextOrder || !active) {
          return;
        }

        const stockCheck = nextOrder.businessId && nextOrder.orderStatus === 'pending' ? await repo.orders.checkStockAvailability(nextOrder.businessId, nextOrder.id) : null;
        if (stockCheck && active) {
          nextOrder = {
            ...nextOrder,
            requestStatus: stockCheck.requestStatus,
            availabilityStatus: stockCheck.availabilityStatus,
          };
        }

        setOrder(nextOrder);
        const nextItems = await repo.orders.listItemsForOrder(id, nextOrder.businessId ?? businessId ?? '');
        setItems(nextItems ?? []);

        if (nextOrder.productId && nextOrder.businessId) {
          const product = await repo.products.getProduct(nextOrder.productId, nextOrder.businessId);
          if (product) {
            setProductName(product.name);
          }
        }
      } catch {
        if (active) {
          setOrder(null);
          setItems([]);
          setProductName('Product');
        }
      }
    };

    void load().finally(() => { if (active) setDetailLoading(false); });
    return () => {
      active = false;
    };
  }, [business?.id, id, membership?.business_id, profile?.id, role, user?.id, revision, ready]);

  if (!ready || detailLoading) {
    return <SafeAreaView><View accessibilityRole="progressbar"><Text>Loading order…</Text></View></SafeAreaView>;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Order not found.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel = order.requestStatus ?? order.orderStatus ?? order.status ?? order.paymentStatus ?? 'PENDING_AVAILABILITY';
  const startPacking = async () => {
    if (packingBusy || !order.businessId || role !== 'founder') return;
    setPackingBusy(true); setActionError('');
    try {
      const updated=await getDataSource('production').orders.startPacking(order.businessId,order.id);
      if (!updated) throw new Error('Packing could not be started.');
      router.push(`/packing/${order.id}`);
    } catch(error) { setActionError(error instanceof Error?error.message:'Packing could not be started.'); }
    finally { setPackingBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Order {order.id}</Text>
        <Text style={styles.subtitle}>{productName}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{order.customerName}</Text>
          <Text style={styles.meta}>{order.customerPhone ?? 'No phone provided'}</Text>
          <Text style={styles.meta}>{order.deliveryAddress ?? 'No delivery address provided'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{statusLabel}</Text>
          <Text style={styles.meta}>Total: RM{Number(order.total ?? 0).toFixed(2)}</Text>
          <Text style={styles.meta}>Items: {items.length}</Text>
          {items.map((item) => (
            <Text key={item.id} style={styles.meta}>Variant {item.productVariantId} × {item.quantity}</Text>
          ))}
        </View>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={()=>setRevision(value=>value+1)}><Text style={styles.backText}>Refresh order</Text></Pressable>
        {role==='founder' && ['paid','success'].includes(order.paymentStatus??'') && order.orderStatus==='payment_received' ? <Pressable accessibilityRole="button" disabled={packingBusy} style={styles.primaryButton} onPress={()=>void startPacking()}><Text style={styles.primaryButtonText}>{packingBusy?'Starting…':'Start packing'}</Text></Pressable> : null}
        {role==='founder' && order.orderStatus==='packing' ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={()=>router.push(`/packing/${order.id}`)}><Text style={styles.primaryButtonText}>Continue packing</Text></Pressable>:null}
        {role==='founder' && order.orderStatus==='ready' ? <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={()=>router.push({pathname:'/shipping/generate',params:{orderId:order.id,businessId:order.businessId??''}})}><Text style={styles.primaryButtonText}>Create shipment</Text></Pressable>:null}
        {actionError?<Text accessibilityRole="alert">{actionError}</Text>:null}
        {order.businessId ? <OrderPaymentPanel businessId={order.businessId} orderId={order.id} total={Number(order.total)} onChanged={()=>setRevision(value=>value+1)}/> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  backText: { color: THEME.primary, fontWeight: '700' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800' },
  subtitle: { color: THEME.text.secondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  label: { color: THEME.text.primary, fontWeight: '700', marginBottom: SPACING.xs },
  value: { color: THEME.text.primary, fontSize: FONT_SIZES.base, fontWeight: '700' },
  meta: { color: THEME.text.secondary, marginTop: SPACING.xs },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING['2xl'] },
  emptyTitle: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginBottom: SPACING.md },
  primaryButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
