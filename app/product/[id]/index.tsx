import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';

import { useAuth } from '../../../context/AuthContext';
import { getDataSource } from '../../../services/repository';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  SPACING,
  THEME,
} from '../../../theme';

const isReasonableMalaysianPhone = (value: string) => {
  const cleaned = value.replace(/\s+/g, '').replace(/-/g, '');
  const normalized = cleaned.startsWith('+60') ? `0${cleaned.slice(3)}` : cleaned;
  return /^0\d{9,10}$/.test(normalized);
};

export default function ProductDetailScreen() {
  const { id, businessId } = useLocalSearchParams<{ id?: string; businessId?: string }>();
  const { membership, business, profile, user } = useAuth();
  const routeBusinessId = typeof businessId === 'string' && businessId.trim() ? businessId.trim() : undefined;
  const resolvedBusinessId = routeBusinessId ?? membership?.business_id ?? business?.id ?? undefined;

  const [product, setProduct] = useState<{ id: string; name: string; image: string; sellingPrice: number; businessId?: string; tripId?: string; description?: string } | null>(null);
  const [variants, setVariants] = useState<Array<{ id: string; productId: string; size: string; stock: number }>>([]);
  const [quantity, setQuantity] = useState('1');
  const [selectedSize, setSelectedSize] = useState('');
  const [fullName, setFullName] = useState(profile?.full_name ?? user?.user_metadata?.full_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(profile?.address ?? '');
  const [formError, setFormError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [requestStatus, setRequestStatus] = useState<string>('PENDING_AVAILABILITY');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id || !resolvedBusinessId) {
        if (active) {
          setProduct(null);
          setVariants([]);
          setSelectedSize('');
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const [nextProduct, nextVariants] = await Promise.all([
          repo.products.getProduct(id, resolvedBusinessId),
          repo.products.listVariantsForProduct(id, resolvedBusinessId),
        ]);

        if (!active) {
          return;
        }

        setProduct(nextProduct ?? null);
        setVariants(nextVariants ?? []);
        setSelectedSize(nextVariants[0]?.size ?? '');
      } catch {
        if (active) {
          setProduct(null);
          setVariants([]);
          setSelectedSize('');
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id, resolvedBusinessId]);

  const activeVariant = useMemo(
    () => variants.find((variant) => variant.size === selectedSize) ?? variants[0] ?? null,
    [selectedSize, variants]
  );

  const quantityNumber = Math.max(1, Number(quantity) || 1);
  const total = product ? product.sellingPrice * quantityNumber : 0;

  const submitCustomerRequest = async () => {
    if (!product || !resolvedBusinessId || !activeVariant) {
      return;
    }

    const name = fullName.trim();
    const phone = phoneNumber.trim();
    const address = deliveryAddress.trim();

    if (!name) {
      setFormError('Full Name is required.');
      return;
    }

    if (!phone) {
      setFormError('Phone Number is required.');
      return;
    }

    if (!isReasonableMalaysianPhone(phone)) {
      setFormError('Please enter a valid Malaysian phone number.');
      return;
    }

    if (!address) {
      setFormError('Delivery Address is required.');
      return;
    }

    const repo = getDataSource('production');
    const order = await repo.orders.create({
      businessId: product.businessId ?? resolvedBusinessId,
      tripId: product.tripId ?? '',
      productId: product.id,
      productVariantId: activeVariant.id,
      quantity: quantityNumber,
      customerName: name,
      customerPhone: phone,
      deliveryAddress: address,
      paymentMethod: 'bank',
    });

    if (!order) {
      setFormError('Unable to create the customer order. Please try again.');
      return;
    }

    setOrderId(order.id);
    setRequestStatus(order.requestStatus ?? 'PENDING_AVAILABILITY');
    setFormError('');
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Product Not Found</Text>
          <Text style={styles.emptyText}>This product is no longer available.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sizes = variants.map((variant) => variant.size);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Product</Text>

        <View style={styles.card}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.price}>RM{product.sellingPrice.toFixed(2)}</Text>
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          <View style={styles.metaRow}>
            <ShoppingBag size={16} color={THEME.primary} />
            <Text style={styles.metaText}>{sizes.length > 0 ? `${sizes.length} size option${sizes.length > 1 ? 's' : ''}` : 'No size options'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          {!!variants.length && (
            <>
              <Text style={styles.label}>Size / Variant</Text>
              <View style={styles.variantRow}>
                {variants.map((variant) => (
                  <Pressable
                    key={variant.id}
                    style={[styles.variant, selectedSize === variant.size && styles.variantActive]}
                    onPress={() => setSelectedSize(variant.size)}
                  >
                    <Text style={[styles.variantText, selectedSize === variant.size && styles.variantTextActive]}>{variant.size}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.total}>Total RM{total.toFixed(2)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Full name" style={styles.input} />
          <TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone number" keyboardType="phone-pad" style={styles.input} />
          <TextInput value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Delivery address" multiline style={[styles.input, styles.multiline]} />

          {!!formError && <Text style={styles.error}>{formError}</Text>}

          {orderId ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Order submitted</Text>
              <Text style={styles.successText}>Request status: {requestStatus}</Text>
              <Pressable style={styles.primaryButton} onPress={() => router.push(`/order/${orderId}`)}>
                <Text style={styles.primaryButtonText}>View Order</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={() => void submitCustomerRequest()}>
              <Text style={styles.primaryButtonText}>Submit Order</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  backText: { color: THEME.primary, fontWeight: '700' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginVertical: SPACING.lg },
  card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING['2xl'], marginBottom: SPACING.lg, borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small },
  image: { width: '100%', height: 220, backgroundColor: '#F3F4F6', borderRadius: BORDER_RADIUS.md },
  productName: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.md },
  price: { color: THEME.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.xs },
  description: { color: THEME.text.secondary, marginTop: SPACING.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  metaText: { color: THEME.text.secondary },
  sectionTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.lg },
  label: { color: THEME.text.primary, fontWeight: '700', marginBottom: SPACING.sm },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  variant: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  variantActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  variantText: { color: THEME.text.secondary },
  variantTextActive: { color: '#FFFFFF', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary, backgroundColor: '#FCFCFD', marginBottom: SPACING.md },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  total: { color: THEME.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginVertical: SPACING.sm },
  primaryButton: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  error: { color: THEME.status.error, fontWeight: '700', marginBottom: SPACING.md },
  successBox: { marginTop: SPACING.md },
  successTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.xs },
  successText: { color: THEME.text.secondary, marginBottom: SPACING.md },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING['2xl'] },
  emptyTitle: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginBottom: SPACING.sm },
  emptyText: { color: THEME.text.secondary, textAlign: 'center', marginBottom: SPACING.md },
});
