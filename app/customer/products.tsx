import React, { useCallback, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listCustomerCatalog, type CustomerCatalogProduct } from '../../services/customerCatalog';
import { THEME } from '../../theme';

export default function CustomerProductsScreen() {
  const [products, setProducts] = useState<CustomerCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    void listCustomerCatalog().then(rows => { if (active) setProducts(rows); })
      .catch(() => { if (active) { setProducts([]); setError('Products could not be loaded. Please try again.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]));
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/customer')}><Text style={styles.link}>Back to customer dashboard</Text></Pressable>
    <Text accessibilityRole="header" style={styles.title}>Browse Products</Text>
    {loading ? <Text accessibilityRole="progressbar">Loading products…</Text> : null}
    {error ? <View><Text accessibilityRole="alert">{error}</Text><Pressable accessibilityRole="button" onPress={() => setRevision(value => value + 1)}><Text style={styles.link}>Try again</Text></Pressable></View> : null}
    {!loading && !error && !products.length ? <Text>No published products available yet.</Text> : null}
    {products.map(product => <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`View ${product.name}`} style={styles.card}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id, businessId: product.business_id } })}>
      {product.image_url ? <Image accessibilityLabel={product.name} source={{ uri: product.image_url }} style={styles.image} /> : null}
      <Text style={styles.name}>{product.name}</Text><Text>RM{Number(product.selling_price ?? 0).toFixed(2)}</Text>
      <Text style={styles.link}>View product</Text>
    </Pressable>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '800', color: THEME.text.primary },
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, gap: 10 },
  name: { fontSize: 18, fontWeight: '700', color: THEME.text.primary },
  image: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'contain' },
  link: { color: THEME.primary, paddingVertical: 10, fontWeight: '600' },
});
