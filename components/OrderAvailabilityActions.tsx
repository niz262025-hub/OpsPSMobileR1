import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getSupabaseClient } from '../services/supabaseClient';
import { confirmOrderAvailability, type AvailabilityDecision } from '../services/orderAvailability';
export function OrderAvailabilityActions({ businessId, orderId, canManage, pending, onChanged }: { businessId: string; orderId: string; canManage: boolean; pending: boolean; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!canManage || !pending) return null;
  const confirm = async (decision: AvailabilityDecision) => {
    if (busy) return;
    const client = getSupabaseClient();
    if (!client) { setError('MYOPS session required.'); return; }
    setBusy(true); setError('');
    try { await confirmOrderAvailability(client, businessId, orderId, decision); onChanged(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Availability could not be confirmed.'); }
    finally { setBusy(false); }
  };
  return <View style={{ padding: 16, gap: 12 }}>
    <Text accessibilityRole="header">Confirm availability</Text>
    <Text>Confirm the product is available before offering payment to the customer.</Text>
    {([['Confirm available · Pay Now', 'PAY_NOW'], ['Confirm available · Pay Later', 'PAY_LATER'], ['Not available', 'NOT_AVAILABLE']] as const).map(([label, decision]) => <Pressable key={decision} accessibilityRole="button" disabled={busy} onPress={() => void confirm(decision)}><Text>{label}</Text></Pressable>)}
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
  </View>;
}
