import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Product } from '../services/mockDatabase';
import { getDataSource } from '../services/repository';

export function ProductEditor({ product, businessId, editable, onSaved }: { product: Product; businessId: string; editable: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: product.name, description: product.description ?? '', cost: String(product.costPrice), price: String(product.sellingPrice), status: product.status });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!editable || product.businessId !== businessId) return null;
  const save = async (publish?: boolean) => {
    if (busy) return;
    setError('');
    const values = publish === undefined ? { name: draft.name.trim(), description: draft.description.trim(), costPrice: Number(draft.cost), sellingPrice: Number(draft.price), status: draft.status } : { isPublished: publish };
    if (publish === undefined && (!draft.name.trim() || draft.name.trim().length > 200 || ![draft.cost, draft.price].every(value => /^\d+(\.\d{1,2})?$/.test(value) && Number(value) <= 999999999999.99))) {
      setError('Enter a product name and non-negative prices with up to two decimal places.'); return;
    }
    setBusy(true);
    try {
      const saved = await getDataSource('production').products.update({ productId: product.id, businessId, ...values });
      if (!saved) throw new Error('Product was not saved. Check your session and retry.');
      setEditing(false); onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Product could not be saved.'); }
    finally { setBusy(false); }
  };
  return <View style={{ padding: 16, gap: 12 }}>
    <Text accessibilityRole="header">Manage product</Text>
    <Text>Visibility: {product.isPublished ? 'Published' : 'Draft'}</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setDraft({ name: product.name, description: product.description ?? '', cost: String(product.costPrice), price: String(product.sellingPrice), status: product.status }); setEditing(true); }}><Text>Edit Product</Text></Pressable>
    {editing && <>
      {([['Product name', 'name'], ['Description', 'description'], ['Cost price (RM)', 'cost'], ['Selling price (RM)', 'price']] as const).map(([label, key]) => <View key={key}><Text>{label}</Text><TextInput accessibilityLabel={label} editable={!busy} value={draft[key]} onChangeText={value => setDraft(current => ({ ...current, [key]: value }))} style={{ borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 8 }} /></View>)}
      <Text>Stock type: {draft.status === 'preorder' ? 'Pre-Order' : 'Ready Stock'}</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDraft(current => ({ ...current, status: 'ready' }))}><Text>Ready Stock</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDraft(current => ({ ...current, status: 'preorder' }))}><Text>Pre-Order</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save()}><Text>{busy ? 'Saving…' : 'Save product'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setEditing(false)}><Text>Cancel edit</Text></Pressable>
    </>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(!product.isPublished)}><Text>{product.isPublished ? 'Unpublish Product' : 'Publish Product'}</Text></Pressable>
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
  </View>;
}
