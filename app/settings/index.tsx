import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft } from 'lucide-react-native';
import { updatePaymentSettings, useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

export default function PaymentSettingsScreen() {
  const db = useMockDatabase();
  const [settings, setSettings] = useState(db.paymentSettings);
  const set = (key: keyof typeof settings, value: string) => setSettings((current) => ({ ...current, [key]: value }));
  const pickQr = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled) setSettings((current) => ({ ...current, qrImageUri: result.assets[0].uri }));
  };
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Pressable style={styles.back} onPress={() => router.back()}><ArrowLeft size={18} color={THEME.primary} /><Text style={styles.backText}>Back</Text></Pressable>
    <Text style={styles.title}>Payment Settings</Text><Text style={styles.subtitle}>Direct customer payments to PS.</Text>
    {([['bankName', 'Bank Name'], ['accountName', 'Account Name'], ['accountNumber', 'Account Number'], ['paymentReference', 'Payment Reference / Instructions']] as const).map(([key, label]) => <View key={key} style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={settings[key]} onChangeText={(value) => set(key, value)} style={styles.input} placeholder={label} placeholderTextColor={THEME.text.light} /></View>)}
    <View style={styles.card}><Text style={styles.label}>QR Payment (optional)</Text><View style={styles.actions}><Pressable style={styles.secondary} onPress={pickQr}><Text style={styles.secondaryText}>{settings.qrImageUri ? 'Replace QR Image' : 'Upload QR Image'}</Text></Pressable>{settings.qrImageUri && <Pressable onPress={() => setSettings((current) => ({ ...current, qrImageUri: undefined }))}><Text style={styles.remove}>Remove</Text></Pressable>}</View></View>
    <Pressable style={styles.primary} onPress={() => { updatePaymentSettings(settings); router.back(); }}><Text style={styles.primaryText}>Save Payment Settings</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: THEME.background }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: SPACING['2xl'] }, back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm }, backText: { color: THEME.primary, fontWeight: '700' }, title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginVertical: SPACING.md }, subtitle: { color: THEME.text.secondary, marginBottom: SPACING.lg }, field: { marginBottom: SPACING.md }, label: { color: THEME.text.primary, fontWeight: '700', marginBottom: SPACING.xs }, input: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary }, card: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginTop: SPACING.sm }, actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md }, secondary: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md }, secondaryText: { color: THEME.primary, fontWeight: '800' }, remove: { color: THEME.status.error, fontWeight: '800' }, primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.lg }, primaryText: { color: '#FFFFFF', fontWeight: '800' } });
