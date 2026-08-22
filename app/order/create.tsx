import React, { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { submitCustomerOrder, getProduct, getProductVariantByProduct, useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

export default function CustomerOrderScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const db = useMockDatabase();
  const product = productId ? getProduct(productId, db) : undefined;
  const variants = product ? getProductVariantByProduct(product.id, db) : [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  if (!product) return <SafeAreaView style={styles.safe}><Text style={styles.error}>Product not found.</Text></SafeAreaView>;
  const total = product.sellingPrice * Math.max(1, Number(quantity) || 1);
  const submit = () => {
    if (!variantId || !name.trim() || !phone.trim() || !address.trim()) { setError('Please complete your contact and delivery details.'); return; }
    const order = submitCustomerOrder({ productId: product.id, productVariantId: variantId, quantity: Number(quantity) || 1, customerName: name, customerPhone: phone, deliveryAddress: address });
    if (order) router.replace(`/order/${order.id}`);
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color={THEME.primary} /><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.title}>Your Order</Text><View style={styles.card}><Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" /><Text style={styles.productName}>{product.name}</Text><Text style={styles.price}>RM{product.sellingPrice.toFixed(2)}</Text><Text style={styles.label}>Size / Variant</Text><View style={styles.variantRow}>{variants.map((variant) => <Pressable key={variant.id} style={[styles.variant, variantId === variant.id && styles.variantActive]} onPress={() => setVariantId(variant.id)}><Text style={[styles.variantText, variantId === variant.id && styles.variantTextActive]}>{variant.size}</Text></Pressable>)}</View><Field label="Quantity" value={quantity} onChangeText={setQuantity} numeric placeholder="1" /></View><View style={styles.card}><Text style={styles.sectionTitle}>Customer Information</Text><Field label="Name" value={name} onChangeText={setName} placeholder="Full name" /><Field label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" numeric /><Field label="Delivery Address" value={address} onChangeText={setAddress} placeholder="Full delivery address" multiline /><Text style={styles.total}>Total RM{total.toFixed(2)}</Text>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>Submit Order</Text></Pressable></View></ScrollView></SafeAreaView>;
}
function Field({ label, value, onChangeText, placeholder, numeric = false, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; numeric?: boolean; multiline?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={THEME.text.light} keyboardType={numeric ? 'phone-pad' : 'default'} multiline={multiline} style={[styles.input, multiline && styles.multiline]} /></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 650, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] }, back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm }, backText: { color: THEME.primary, fontWeight: '700' }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginVertical: SPACING.lg }, card: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING['2xl'], marginBottom: SPACING.lg, borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small }, image: { width: '100%', height: 220, backgroundColor: '#F3F4F6', borderRadius: BORDER_RADIUS.md }, productName: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.md }, price: { color: THEME.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.xs }, label: { color: THEME.text.primary, fontSize: FONT_SIZES.sm, fontWeight: '700', marginBottom: SPACING.sm }, variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg }, variant: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }, variantActive: { backgroundColor: THEME.primary, borderColor: THEME.primary }, variantText: { color: THEME.text.secondary }, variantTextActive: { color: '#FFFFFF', fontWeight: '700' }, sectionTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.lg }, field: { marginBottom: SPACING.md }, input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary, backgroundColor: '#FCFCFD' }, multiline: { minHeight: 100, textAlignVertical: 'top' }, total: { color: THEME.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginVertical: SPACING.md }, primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, error: { color: THEME.status.error, paddingVertical: SPACING.md } });
