import React, { useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { PRODUCT_SIZE_OPTIONS, updatePaymentSettings, updateSettings, useMockDatabase } from '../../services/mockDatabase';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

const paymentMethodOptions = ['Bank Transfer', 'QR Payment', 'DuitNow', 'Touch & Go', 'Atome', 'Buy Now Pay Later'];

export default function SettingsScreen() {
  const db = useMockDatabase();
  const { logout } = useAuth();
  const [business, setBusiness] = useState(db.businessSettings);
  const [payment, setPayment] = useState(db.paymentSettings);
  const [marketplace, setMarketplace] = useState(db.marketplaceSettings);
  const [trip, setTrip] = useState(db.tripSettings);
  const [shipping, setShipping] = useState(db.shippingSettings);
  const [notifications, setNotifications] = useState(db.notificationSettings);
  const [user, setUser] = useState(db.userSettings);

  const field = (value: string, onChangeText: (value: string) => void, placeholder: string) => (
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={THEME.text.light} style={styles.input} />
  );

  const pickImage = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  const saveAll = () => {
    updateSettings('businessSettings', business);
    updatePaymentSettings(payment);
    updateSettings('marketplaceSettings', marketplace);
    updateSettings('tripSettings', trip);
    updateSettings('shippingSettings', shipping);
    updateSettings('notificationSettings', notifications);
    updateSettings('userSettings', user);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Operational preferences for your OpsPS workspace.</Text>

        <Section title="Business Profile">
          {field(business.businessName, (value) => setBusiness({ ...business, businessName: value }), 'Business Name')}
          {field(business.phone, (value) => setBusiness({ ...business, phone: value }), 'Phone')}
          {field(business.email, (value) => setBusiness({ ...business, email: value }), 'Email')}
          {field(business.address, (value) => setBusiness({ ...business, address: value }), 'Business Address')}
          {field(business.registrationNumber ?? '', (value) => setBusiness({ ...business, registrationNumber: value }), 'Registration Number')}
          <ImageControl uri={business.logoUri} onPick={(uri) => setBusiness({ ...business, logoUri: uri })} onRemove={() => setBusiness({ ...business, logoUri: undefined })} label="Logo" />
        </Section>

        <Section title="Payment Settings">
          {field(payment.bankName, (value) => setPayment({ ...payment, bankName: value }), 'Bank Name')}
          {field(payment.accountName, (value) => setPayment({ ...payment, accountName: value }), 'Account Name')}
          {field(payment.accountNumber, (value) => setPayment({ ...payment, accountNumber: value }), 'Account Number')}
          {field(payment.paymentReference, (value) => setPayment({ ...payment, paymentReference: value }), 'Payment Reference / Instructions')}
          <ImageControl uri={payment.qrImageUri} onPick={(uri) => setPayment({ ...payment, qrImageUri: uri })} onRemove={() => setPayment({ ...payment, qrImageUri: undefined })} label="QR Payment" />
        </Section>

        <Section title="Payment Methods">
          <Text style={styles.note}>Enable only the methods you want the PS to offer.</Text>
          {paymentMethodOptions.map((option) => (
            <Toggle
              key={option}
              label={option}
              value={payment.enabledPaymentMethods.includes(option)}
              onChange={(value) => {
                const next = value
                  ? [...new Set([...payment.enabledPaymentMethods, option])]
                  : payment.enabledPaymentMethods.filter((item) => item !== option);
                setPayment({ ...payment, enabledPaymentMethods: next });
              }}
            />
          ))}
          <Toggle label="Enable Buy Now Pay Later" value={payment.bnplEnabled} onChange={(value) => setPayment({ ...payment, bnplEnabled: value })} />
        </Section>

        <Section title="Marketplace Defaults">
          {field(marketplace.currency, (value) => setMarketplace({ ...marketplace, currency: value }), 'Currency')}
          {field(String(marketplace.defaultMarkup), (value) => setMarketplace({ ...marketplace, defaultMarkup: Number(value) || 0 }), 'Default Markup / Margin')}
          <Choice label="Default Product Status" options={['ready', 'preorder']} value={marketplace.defaultProductStatus} onChange={(value) => setMarketplace({ ...marketplace, defaultProductStatus: value as 'ready' | 'preorder' })} />
        </Section>

        <Section title="Trip Defaults">
          <Text style={styles.note}>Default date: {trip.defaultTripDate}</Text>
          <Choice label="Destination Type" options={['Shopping Mall', 'Event', 'Other']} value={trip.destinationType} onChange={(value) => setTrip({ ...trip, destinationType: value as typeof trip.destinationType })} />
          <Text style={styles.note}>Clothing sizes: {PRODUCT_SIZE_OPTIONS.Clothing.join(', ')}</Text>
          <Text style={styles.note}>Shoe sizes: 22 to 46</Text>
        </Section>

        <Section title="Shipping Settings">
          {field(shipping.defaultCourier, (value) => setShipping({ ...shipping, defaultCourier: value }), 'Default Courier')}
          {field(shipping.senderName, (value) => setShipping({ ...shipping, senderName: value }), 'Sender Name')}
          {field(shipping.senderPhone, (value) => setShipping({ ...shipping, senderPhone: value }), 'Sender Phone')}
          {field(shipping.senderAddress, (value) => setShipping({ ...shipping, senderAddress: value }), 'Sender Address')}
          <Text style={styles.note}>EasyParcel: {shipping.integrationStatus}</Text>
        </Section>

        <Section title="Notifications">
          <Toggle label="Payment confirmation" value={notifications.paymentConfirmation} onChange={(value) => setNotifications({ ...notifications, paymentConfirmation: value })} />
          <Toggle label="Order availability notification" value={notifications.orderAvailability} onChange={(value) => setNotifications({ ...notifications, orderAvailability: value })} />
          <Toggle label="Shipping notification" value={notifications.shipping} onChange={(value) => setNotifications({ ...notifications, shipping: value })} />
        </Section>

        <Section title="Account">
          {field(user.name, (value) => setUser({ ...user, name: value }), 'Name')}
          {field(user.email, (value) => setUser({ ...user, email: value }), 'Email')}
          <Pressable style={styles.secondary} onPress={async () => { await logout(); router.replace('/login'); }}>
            <Text style={styles.secondaryText}>Logout</Text>
          </Pressable>
        </Section>

        <Pressable style={styles.primary} onPress={saveAll}>
          <Text style={styles.primaryText}>Save Settings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Choice({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <View><Text style={styles.label}>{label}</Text><View style={styles.actions}>{options.map((option) => <Pressable key={option} style={[styles.option, value === option && styles.selected]} onPress={() => onChange(option)}><Text style={styles.optionText}>{option}</Text></Pressable>)}</View></View>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.toggle}><Text style={styles.label}>{label}</Text><Switch value={value} onValueChange={onChange} /></View>;
}

function ImageControl({ uri, onPick, onRemove, label }: { uri?: string; onPick: (uri: string) => void; onRemove: () => void; label: string }) {
  return <View><Text style={styles.label}>{label}</Text>{uri && <Image source={{ uri }} style={styles.preview} />}<View style={styles.actions}><Pressable style={styles.option} onPress={async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return; const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 }); if (!result.canceled) onPick(result.assets[0].uri); }}><Text style={styles.optionText}>{uri ? 'Replace' : 'Upload'}</Text></Pressable>{uri && <Pressable onPress={onRemove}><Text style={styles.remove}>Remove</Text></Pressable>}</View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  backText: { color: THEME.primary, fontWeight: '700' },
  title: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginTop: SPACING.lg },
  subtitle: { color: THEME.text.secondary, marginVertical: SPACING.lg },
  section: { backgroundColor: THEME.surface, borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginBottom: SPACING.md },
  input: { borderWidth: 1, borderColor: THEME.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, color: THEME.text.primary, marginBottom: SPACING.sm },
  label: { color: THEME.text.primary, fontWeight: '700', marginBottom: SPACING.xs },
  note: { color: THEME.text.secondary, marginVertical: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.sm },
  option: { backgroundColor: '#F5F3FF', borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
  selected: { borderWidth: 2, borderColor: THEME.primary },
  optionText: { color: THEME.primary, fontWeight: '800' },
  preview: { width: 120, height: 120, marginVertical: SPACING.sm },
  remove: { color: THEME.status.error, fontWeight: '800', padding: SPACING.md },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm },
  secondary: { borderWidth: 1, borderColor: THEME.status.error, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  secondaryText: { color: THEME.status.error, fontWeight: '800' },
  primary: { backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  primaryText: { color: '#FFFFFF', fontWeight: '800' },
});
