import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { getDataSource } from '../../../services/repository';
import { validateTripEdit } from '../../../services/tripEdit';

export default function EditTrip() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { membership, ready } = useAuth();
  const businessId = membership?.business_id;
  const allowed = membership && ['founder', 'admin'].includes(membership.role ?? '');
  const [draft, setDraft] = useState({ name: '', destination: '', tripDate: '', budget: '0', status: 'planning' });
  const [loaded, setLoaded] = useState(false);
  const [originalStatus, setOriginalStatus] = useState('planning');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!ready || !allowed || !businessId || !id) return;
    void getDataSource('production').trips.getForBusiness(businessId, id).then(trip => {
      if (!active) return;
      if (!trip) { setError('Trip unavailable or access denied.'); return; }
      setDraft({ name: trip.name, destination: trip.destination, tripDate: trip.tripDate, budget: String(trip.budget ?? 0), status: trip.status });
      setOriginalStatus(trip.status); setLoaded(true);
    }).catch(() => { if (active) setError('Unable to load trip. Please reload.'); });
    return () => { active = false; };
  }, [ready, allowed, businessId, id]);
  const save = async () => {
    if (busy || !loaded || !allowed || !businessId) return;
    setError(''); setBusy(true);
    try {
      const values = validateTripEdit(draft);
      if (originalStatus === 'closed' && values.status !== 'closed') throw new Error('Completed trips cannot be reopened here.');
      const saved = await getDataSource('production').trips.update({ ...values, tripId: id, businessId });
      if (!saved) throw new Error('Trip was not saved. Check your session and retry.');
      router.replace(`/trip/${id}` as never);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Trip could not be saved.'); }
    finally { setBusy(false); }
  };
  const field = (label: string, key: 'name' | 'destination' | 'budget') => <><Text>{label}</Text><TextInput accessibilityLabel={label} value={draft[key]} editable={!busy} onChangeText={value => setDraft(current => ({ ...current, [key]: value }))} style={{ borderWidth: 1, padding: 12, marginBottom: 12 }} /></>;
  if (ready && !allowed) return <Text accessibilityRole="alert">Only an authorized business manager can edit this trip.</Text>;
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
    <Text accessibilityRole="header">Edit trip</Text>
    {field('Trip name', 'name')}{field('Destination', 'destination')}
    <Text>Trip date</Text>
    {Platform.OS === 'web' ? <input aria-label="Trip date" type="date" disabled={busy} value={draft.tripDate} onChange={event => setDraft(current => ({ ...current, tripDate: event.target.value }))} onInput={event => { const value = event.currentTarget.value; setDraft(current => ({ ...current, tripDate: value })); }} /> : <TextInput accessibilityLabel="Trip date YYYY-MM-DD" value={draft.tripDate} onChangeText={tripDate => setDraft(current => ({ ...current, tripDate }))} />}
    <Text>Status: {draft.status === 'closed' ? 'Completed' : draft.status === 'open' ? 'Active' : 'Planning'}</Text>
    {originalStatus !== 'closed' && <>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDraft(current => ({ ...current, status: 'open' }))}><Text>Set Active</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => setDraft(current => ({ ...current, status: 'closed' }))}><Text>Set Completed</Text></Pressable>
    </>}
    {!!error && <Text accessibilityRole="alert">{error}</Text>}
    <Pressable accessibilityRole="button" disabled={busy || !loaded} onPress={() => void save()}><Text>{busy ? 'Saving…' : 'Save trip'}</Text></Pressable>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.back()}><Text>Cancel</Text></Pressable>
  </ScrollView>;
}
