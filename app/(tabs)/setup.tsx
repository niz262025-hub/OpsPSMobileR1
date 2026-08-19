import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, uploadProductImage } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type ToggleValue = 'enabled' | 'disabled';
type PaymentTiming = 'immediately' | 'before_shopping' | 'after_confirmation' | 'custom';
type LanguageCode = 'ms' | 'en' | 'zh' | 'ta';

type BusinessProfile = {
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  businessAddress: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  ssmNumber: string;
  businessDescription: string;
};

type PaymentMethodState = {
  bankTransferEnabled: ToggleValue;
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstructions: string;
  duitNowEnabled: ToggleValue;
  duitNowDisplayName: string;
  duitNowId: string;
  duitNowQrEnabled: ToggleValue;
  duitNowQrImage: string;
  cashEnabled: ToggleValue;
  onlinePaymentEnabled: ToggleValue;
  otherEnabled: ToggleValue;
};

type CustomerPaymentState = {
  timing: PaymentTiming;
  depositEnabled: boolean;
  depositPercentage: string;
  depositFixedAmount: string;
  balancePaymentEnabled: boolean;
  paymentInstructions: string;
};

type ReceiptSettingsState = {
  prefix: string;
  startingNumber: string;
  receiptTitle: string;
  businessLogoEnabled: boolean;
  showCustomerPhone: boolean;
  showCustomerEmail: boolean;
  showPaymentMethod: boolean;
  showSsmNumber: boolean;
  footerMessage: string;
  paymentInstructions: string;
  thankYouMessage: string;
};

type InvoiceSettingsState = {
  invoicePrefix: string;
  orderNumberPrefix: string;
  numberingSequence: string;
  documentFooter: string;
  paymentTerms: string;
  notes: string;
};

type CustomerDetailsState = {
  customerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  deliveryAddress: string;
  billingAddress: string;
  notes: string;
};

type OrderDefaultsState = {
  currency: string;
  country: string;
  defaultOrderStatus: string;
  defaultPaymentStatus: string;
  defaultShippingStatus: string;
  defaultTripStatus: string;
};

type ShippingSettingsState = {
  selfPickupEnabled: boolean;
  courierEnabled: boolean;
  localDeliveryEnabled: boolean;
  defaultDeliveryMethod: string;
  shippingNotes: string;
  defaultShippingFee: string;
};

type ChargesState = {
  serviceFeeEnabled: boolean;
  serviceFeeType: 'fixed' | 'percentage';
  serviceFeeValue: string;
  shoppingFeeEnabled: boolean;
  shoppingFeeType: 'fixed' | 'percentage';
  shoppingFeeValue: string;
  deliveryFeeEnabled: boolean;
  deliveryFeeType: 'fixed' | 'percentage';
  deliveryFeeValue: string;
  otherChargesEnabled: boolean;
  otherChargesValue: string;
};

type NotificationState = {
  orderUpdates: boolean;
  paymentReceived: boolean;
  pendingPayment: boolean;
  shippingUpdate: boolean;
  tripReminders: boolean;
};

type AccountSettingsState = {
  name: string;
  email: string;
  phone: string;
  accountStatus: string;
  subscriptionPlan: string;
};

type LanguageSettingsState = {
  language: LanguageCode;
  currency: string;
  country: string;
};

type SettingsState = {
  businessProfile: BusinessProfile;
  paymentMethods: PaymentMethodState;
  customerPayment: CustomerPaymentState;
  receiptSettings: ReceiptSettingsState;
  invoiceSettings: InvoiceSettingsState;
  customerDetails: CustomerDetailsState;
  orderDefaults: OrderDefaultsState;
  shippingSettings: ShippingSettingsState;
  charges: ChargesState;
  notifications: NotificationState;
  account: AccountSettingsState;
  languageSettings: LanguageSettingsState;
  logoUrl: string;
};

const defaultBusinessProfile: BusinessProfile = {
  businessName: 'OpsPS UAT Test',
  ownerName: '',
  phone: '',
  whatsapp: '',
  email: '',
  businessAddress: '',
  city: '',
  state: '',
  postcode: '',
  country: 'Malaysia',
  ssmNumber: '',
  businessDescription: '',
};

const defaultPaymentMethods: PaymentMethodState = {
  bankTransferEnabled: 'enabled',
  bankName: '',
  accountName: '',
  accountNumber: '',
  paymentInstructions: '',
  duitNowEnabled: 'enabled',
  duitNowDisplayName: '',
  duitNowId: '',
  duitNowQrEnabled: 'enabled',
  duitNowQrImage: '',
  cashEnabled: 'enabled',
  onlinePaymentEnabled: 'enabled',
  otherEnabled: 'disabled',
};

const defaultCustomerPayment: CustomerPaymentState = {
  timing: 'after_confirmation',
  depositEnabled: false,
  depositPercentage: '0',
  depositFixedAmount: '0',
  balancePaymentEnabled: true,
  paymentInstructions: '',
};

const defaultReceiptSettings: ReceiptSettingsState = {
  prefix: 'OPS',
  startingNumber: '1',
  receiptTitle: 'Receipt',
  businessLogoEnabled: true,
  showCustomerPhone: true,
  showCustomerEmail: false,
  showPaymentMethod: true,
  showSsmNumber: false,
  footerMessage: 'Thank you for shopping with us.',
  paymentInstructions: '',
  thankYouMessage: 'Thank you for your order.',
};

const defaultInvoiceSettings: InvoiceSettingsState = {
  invoicePrefix: 'INV',
  orderNumberPrefix: 'ORD',
  numberingSequence: '1',
  documentFooter: 'Thank you for your business.',
  paymentTerms: 'Payment due within 7 days.',
  notes: '',
};

const defaultCustomerDetails: CustomerDetailsState = {
  customerName: '',
  phone: '',
  whatsapp: '',
  email: '',
  deliveryAddress: '',
  billingAddress: '',
  notes: '',
};

const defaultOrderDefaults: OrderDefaultsState = {
  currency: 'MYR',
  country: 'Malaysia',
  defaultOrderStatus: 'New',
  defaultPaymentStatus: 'Pending',
  defaultShippingStatus: 'Pending',
  defaultTripStatus: 'Active',
};

const defaultShippingSettings: ShippingSettingsState = {
  selfPickupEnabled: true,
  courierEnabled: true,
  localDeliveryEnabled: true,
  defaultDeliveryMethod: 'Self Pickup',
  shippingNotes: '',
  defaultShippingFee: '0',
};

const defaultCharges: ChargesState = {
  serviceFeeEnabled: false,
  serviceFeeType: 'fixed',
  serviceFeeValue: '0',
  shoppingFeeEnabled: false,
  shoppingFeeType: 'fixed',
  shoppingFeeValue: '0',
  deliveryFeeEnabled: false,
  deliveryFeeType: 'fixed',
  deliveryFeeValue: '0',
  otherChargesEnabled: false,
  otherChargesValue: '0',
};

const defaultNotifications: NotificationState = {
  orderUpdates: true,
  paymentReceived: true,
  pendingPayment: true,
  shippingUpdate: true,
  tripReminders: true,
};

const defaultAccountSettings: AccountSettingsState = {
  name: '',
  email: '',
  phone: '',
  accountStatus: 'active',
  subscriptionPlan: 'FREE',
};

const defaultLanguageSettings: LanguageSettingsState = {
  language: 'ms',
  currency: 'MYR',
  country: 'Malaysia',
};

const defaultSettings: SettingsState = {
  businessProfile: defaultBusinessProfile,
  paymentMethods: defaultPaymentMethods,
  customerPayment: defaultCustomerPayment,
  receiptSettings: defaultReceiptSettings,
  invoiceSettings: defaultInvoiceSettings,
  customerDetails: defaultCustomerDetails,
  orderDefaults: defaultOrderDefaults,
  shippingSettings: defaultShippingSettings,
  charges: defaultCharges,
  notifications: defaultNotifications,
  account: defaultAccountSettings,
  languageSettings: defaultLanguageSettings,
  logoUrl: '',
};

const sectionColors = {
  business: '#5B2BD9',
  payments: '#EC4C99',
  documents: '#14B8A6',
  orders: '#F59E0B',
  finance: '#22C55E',
  notifications: '#7C3AED',
  account: '#64748B',
};

function safeNumber(value: unknown) {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}

export default function Setup() {
  const { user, profile, logoutUser } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    business: true,
    payments: true,
    documents: true,
    orders: false,
    finance: false,
    notifications: false,
    account: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.data() || {};
        const savedSettings = data.settings || {};

        setSettings({
          ...defaultSettings,
          ...savedSettings,
          businessProfile: {
            ...defaultBusinessProfile,
            businessName: profile?.businessName || data.businessName || savedSettings?.businessProfile?.businessName || defaultBusinessProfile.businessName,
            ownerName: profile?.fullName || data.fullName || savedSettings?.businessProfile?.ownerName || '',
            phone: profile?.phone || data.phone || savedSettings?.businessProfile?.phone || '',
            email: profile?.email || user?.email || savedSettings?.businessProfile?.email || '',
            ...savedSettings?.businessProfile,
          },
          paymentMethods: {
            ...defaultPaymentMethods,
            ...savedSettings?.paymentMethods,
          },
          customerPayment: {
            ...defaultCustomerPayment,
            ...savedSettings?.customerPayment,
          },
          receiptSettings: {
            ...defaultReceiptSettings,
            ...savedSettings?.receiptSettings,
          },
          invoiceSettings: {
            ...defaultInvoiceSettings,
            ...savedSettings?.invoiceSettings,
          },
          customerDetails: {
            ...defaultCustomerDetails,
            ...savedSettings?.customerDetails,
          },
          orderDefaults: {
            ...defaultOrderDefaults,
            ...savedSettings?.orderDefaults,
          },
          shippingSettings: {
            ...defaultShippingSettings,
            ...savedSettings?.shippingSettings,
          },
          charges: {
            ...defaultCharges,
            ...savedSettings?.charges,
          },
          notifications: {
            ...defaultNotifications,
            ...savedSettings?.notifications,
          },
          account: {
            ...defaultAccountSettings,
            name: profile?.fullName || data.fullName || savedSettings?.account?.name || '',
            email: profile?.email || user?.email || savedSettings?.account?.email || '',
            phone: profile?.phone || data.phone || savedSettings?.account?.phone || '',
            accountStatus: profile?.accountStatus || data.accountStatus || 'active',
            subscriptionPlan: profile?.subscriptionPlan || data.subscriptionPlan || 'FREE',
            ...savedSettings?.account,
          },
          languageSettings: {
            ...defaultLanguageSettings,
            ...savedSettings?.languageSettings,
          },
          logoUrl: savedSettings?.logoUrl || data.logoUrl || '',
        });
      } catch (error) {
        console.error('Settings load error:', error);
        Alert.alert('Settings unavailable', 'Unable to load saved settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.uid, profile?.businessName, profile?.fullName, profile?.phone, profile?.email, profile?.accountStatus, profile?.subscriptionPlan, user?.email]);

  const setSectionValue = <T extends keyof SettingsState>(section: T, value: SettingsState[T]) => {
    setSettings((current) => ({
      ...current,
      [section]: value,
    }));
  };

  const saveSection = async (section: keyof SettingsState, label: string) => {
    if (!user?.uid) {
      Alert.alert('Authentication required', 'Please sign in to save settings.');
      return;
    }

    setSaving(section as string);

    try {
      const userDoc = doc(db, 'users', user.uid);
      const current = (await getDoc(userDoc)).data() || {};
      await setDoc(
        userDoc,
        {
          settings: {
            ...(current.settings || {}),
            [section]: settings[section],
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert('Saved', `${label} settings have been saved.`);
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save settings.');
    } finally {
      setSaving(null);
    }
  };

  const saveBusinessProfile = async () => {
    const profileForm = settings.businessProfile;
    if (!profileForm.businessName.trim() || !profileForm.ownerName.trim() || !profileForm.email.trim()) {
      Alert.alert('Validation', 'Business name, owner name, and email are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }

    await saveSection('businessProfile', 'Business profile');
  };

  const savePaymentSettings = async () => {
    await saveSection('paymentMethods', 'Payment methods');
  };

  const saveCustomerPayment = async () => {
    await saveSection('customerPayment', 'Customer payment');
  };

  const saveReceiptSettings = async () => {
    if (!settings.receiptSettings.prefix.trim()) {
      Alert.alert('Validation', 'Receipt prefix is required.');
      return;
    }

    await saveSection('receiptSettings', 'Receipt settings');
  };

  const saveInvoiceSettings = async () => {
    await saveSection('invoiceSettings', 'Invoice settings');
  };

  const saveCustomerDetails = async () => {
    await saveSection('customerDetails', 'Customer details');
  };

  const saveOrderDefaults = async () => {
    await saveSection('orderDefaults', 'Order defaults');
  };

  const saveShippingSettings = async () => {
    await saveSection('shippingSettings', 'Shipping settings');
  };

  const saveCharges = async () => {
    await saveSection('charges', 'Charges');
  };

  const saveNotifications = async () => {
    await saveSection('notifications', 'Notifications');
  };

  const saveAccountSettings = async () => {
    if (!settings.account.name.trim() || !settings.account.email.trim()) {
      Alert.alert('Validation', 'Name and email are required in account settings.');
      return;
    }

    await saveSection('account', 'Account');
  };

  const saveLanguageSettings = async () => {
    await saveSection('languageSettings', 'Language');
  };

  const handleLogoUpload = async () => {
    if (!user?.uid) {
      Alert.alert('Authentication required', 'Please sign in to upload a logo.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload a logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const uri = result.assets[0].uri;
      const uploadedUrl = await uploadProductImage(uri, user.uid, settings.businessProfile.businessName || 'business-logo', 0);
      setSettings((current) => ({ ...current, logoUrl: uploadedUrl }));

      const userDoc = doc(db, 'users', user.uid);
      const current = (await getDoc(userDoc)).data() || {};
      await setDoc(userDoc, {
        settings: {
          ...(current.settings || {}),
          logoUrl: uploadedUrl,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Logo uploaded', 'Your business logo has been saved.');
    } catch (error) {
      console.error('Logo upload error:', error);
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unable to upload logo.');
    }
  };

  const handleLogoRemove = async () => {
    if (!user?.uid) return;
    setSettings((current) => ({ ...current, logoUrl: '' }));
    const userDoc = doc(db, 'users', user.uid);
    const current = (await getDoc(userDoc)).data() || {};
    await setDoc(userDoc, {
      settings: {
        ...(current.settings || {}),
        logoUrl: '',
      },
      updatedAt: serverTimestamp(),
    }, { merge: true });

    Alert.alert('Logo removed', 'The business logo has been removed.');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      Alert.alert('Signed out', 'You have been logged out.');
    } catch (error) {
      Alert.alert('Logout failed', error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  const renderToggle = (label: string, enabled: boolean, onToggle: () => void) => (
    <Pressable style={styles.toggleRow} onPress={onToggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggle, enabled && styles.toggleOn]}>
        <View style={[styles.toggleThumb, enabled && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );

  const renderSection = (id: string, title: string, color: string, children: React.ReactNode, onSave?: () => Promise<void>) => (
    <View key={id} style={styles.sectionCard}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpenSections((current) => ({ ...current, [id]: !current[id] }))}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionChevron}>{openSections[id] ? '−' : '+'}</Text>
      </Pressable>

      {openSections[id] && (
        <>
          {children}
          {onSave && (
            <Pressable style={[styles.primaryButton, saving === id && styles.primaryButtonDisabled]} onPress={onSave}>
              <Text style={styles.primaryButtonText}>{saving === id ? 'Saving...' : 'Save'}</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#5B2BD9" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.eyebrow}>OpsPS</Text>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Business settings and preferences</Text>

      <View style={styles.logoCard}>
        <Text style={styles.sectionTitle}>Business Logo</Text>
        <View style={styles.logoRow}>
          {settings.logoUrl ? (
            <Image source={{ uri: settings.logoUrl }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>Logo</Text>
            </View>
          )}
          <View style={styles.logoActions}>
            <Pressable style={styles.primaryButton} onPress={handleLogoUpload}>
              <Text style={styles.primaryButtonText}>{settings.logoUrl ? 'Replace Logo' : 'Upload Logo'}</Text>
            </Pressable>
            {settings.logoUrl ? (
              <Pressable style={styles.secondaryButton} onPress={handleLogoRemove}>
                <Text style={styles.secondaryButtonText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {renderSection(
        'business',
        'Business Profile',
        sectionColors.business,
        <>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput value={settings.businessProfile.businessName} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, businessName: value })} style={styles.input} placeholder="OpsPS UAT Test" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Owner Name</Text>
            <TextInput value={settings.businessProfile.ownerName} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, ownerName: value })} style={styles.input} placeholder="Owner name" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Phone</Text>
            <TextInput value={settings.businessProfile.phone} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, phone: value })} style={styles.input} keyboardType="phone-pad" placeholder="0123456789" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>WhatsApp</Text>
            <TextInput value={settings.businessProfile.whatsapp} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, whatsapp: value })} style={styles.input} keyboardType="phone-pad" placeholder="WhatsApp number" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={settings.businessProfile.email} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, email: value })} style={styles.input} keyboardType="email-address" placeholder="name@example.com" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Business Address</Text>
            <TextInput value={settings.businessProfile.businessAddress} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, businessAddress: value })} style={[styles.input, styles.textarea]} multiline placeholder="Street address" />
          </View>
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.label}>City</Text>
              <TextInput value={settings.businessProfile.city} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, city: value })} style={styles.input} />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.label}>State</Text>
              <TextInput value={settings.businessProfile.state} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, state: value })} style={styles.input} />
            </View>
          </View>
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.label}>Postcode</Text>
              <TextInput value={settings.businessProfile.postcode} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, postcode: value })} style={styles.input} />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.label}>Country</Text>
              <TextInput value={settings.businessProfile.country} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, country: value })} style={styles.input} />
            </View>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>SSM / Business Reg No.</Text>
            <TextInput value={settings.businessProfile.ssmNumber} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, ssmNumber: value })} style={styles.input} placeholder="SSM number" />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Business Description</Text>
            <TextInput value={settings.businessProfile.businessDescription} onChangeText={(value) => setSectionValue('businessProfile', { ...settings.businessProfile, businessDescription: value })} style={[styles.input, styles.textarea]} multiline placeholder="Short description" />
          </View>
        </>,
        saveBusinessProfile
      )}

      {renderSection(
        'payments',
        'Payment Methods',
        sectionColors.payments,
        <>
          <Text style={styles.subSectionTitle}>Bank Transfer</Text>
          {renderToggle('Enabled', settings.paymentMethods.bankTransferEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, bankTransferEnabled: settings.paymentMethods.bankTransferEnabled === 'enabled' ? 'disabled' : 'enabled' }))}
          <TextInput value={settings.paymentMethods.bankName} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, bankName: value })} style={styles.input} placeholder="Bank Name" />
          <TextInput value={settings.paymentMethods.accountName} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, accountName: value })} style={styles.input} placeholder="Account Name" />
          <TextInput value={settings.paymentMethods.accountNumber} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, accountNumber: value })} style={styles.input} placeholder="Account Number" />
          <TextInput value={settings.paymentMethods.paymentInstructions} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, paymentInstructions: value })} style={[styles.input, styles.textarea]} multiline placeholder="Payment instructions" />

          <Text style={styles.subSectionTitle}>DuitNow</Text>
          {renderToggle('Enabled', settings.paymentMethods.duitNowEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, duitNowEnabled: settings.paymentMethods.duitNowEnabled === 'enabled' ? 'disabled' : 'enabled' }))}
          <TextInput value={settings.paymentMethods.duitNowDisplayName} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, duitNowDisplayName: value })} style={styles.input} placeholder="Display Name" />
          <TextInput value={settings.paymentMethods.duitNowId} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, duitNowId: value })} style={styles.input} placeholder="DuitNow ID" />

          <Text style={styles.subSectionTitle}>DuitNow QR</Text>
          {renderToggle('Enabled', settings.paymentMethods.duitNowQrEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, duitNowQrEnabled: settings.paymentMethods.duitNowQrEnabled === 'enabled' ? 'disabled' : 'enabled' }))}
          <TextInput value={settings.paymentMethods.duitNowQrImage} onChangeText={(value) => setSectionValue('paymentMethods', { ...settings.paymentMethods, duitNowQrImage: value })} style={styles.input} placeholder="QR image URL (optional)" />

          <Text style={styles.subSectionTitle}>Cash</Text>
          {renderToggle('Enabled', settings.paymentMethods.cashEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, cashEnabled: settings.paymentMethods.cashEnabled === 'enabled' ? 'disabled' : 'enabled' }))}

          <Text style={styles.subSectionTitle}>Online Payment</Text>
          {renderToggle('Enabled', settings.paymentMethods.onlinePaymentEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, onlinePaymentEnabled: settings.paymentMethods.onlinePaymentEnabled === 'enabled' ? 'disabled' : 'enabled' }))}

          <Text style={styles.subSectionTitle}>Other</Text>
          {renderToggle('Enabled', settings.paymentMethods.otherEnabled === 'enabled', () => setSectionValue('paymentMethods', { ...settings.paymentMethods, otherEnabled: settings.paymentMethods.otherEnabled === 'enabled' ? 'disabled' : 'enabled' }))}
        </>,
        savePaymentSettings
      )}

      {renderSection(
        'documents',
        'Documents',
        sectionColors.documents,
        <>
          <Text style={styles.subSectionTitle}>Receipt Settings</Text>
          <TextInput value={settings.receiptSettings.prefix} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, prefix: value })} style={styles.input} placeholder="Receipt prefix" />
          <TextInput value={settings.receiptSettings.startingNumber} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, startingNumber: value })} style={styles.input} keyboardType="numeric" placeholder="Starting number" />
          <TextInput value={settings.receiptSettings.receiptTitle} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, receiptTitle: value })} style={styles.input} placeholder="Receipt title" />
          <TextInput value={settings.receiptSettings.footerMessage} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, footerMessage: value })} style={[styles.input, styles.textarea]} multiline placeholder="Footer message" />
          <TextInput value={settings.receiptSettings.paymentInstructions} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, paymentInstructions: value })} style={[styles.input, styles.textarea]} multiline placeholder="Payment instructions" />
          <TextInput value={settings.receiptSettings.thankYouMessage} onChangeText={(value) => setSectionValue('receiptSettings', { ...settings.receiptSettings, thankYouMessage: value })} style={[styles.input, styles.textarea]} multiline placeholder="Thank you message" />
          {renderToggle('Show customer phone', settings.receiptSettings.showCustomerPhone, () => setSectionValue('receiptSettings', { ...settings.receiptSettings, showCustomerPhone: !settings.receiptSettings.showCustomerPhone }))}
          {renderToggle('Show customer email', settings.receiptSettings.showCustomerEmail, () => setSectionValue('receiptSettings', { ...settings.receiptSettings, showCustomerEmail: !settings.receiptSettings.showCustomerEmail }))}
          {renderToggle('Show payment method', settings.receiptSettings.showPaymentMethod, () => setSectionValue('receiptSettings', { ...settings.receiptSettings, showPaymentMethod: !settings.receiptSettings.showPaymentMethod }))}
          {renderToggle('Show SSM / reg no.', settings.receiptSettings.showSsmNumber, () => setSectionValue('receiptSettings', { ...settings.receiptSettings, showSsmNumber: !settings.receiptSettings.showSsmNumber }))}

          <Text style={styles.subSectionTitle}>Invoice / Order Document</Text>
          <TextInput value={settings.invoiceSettings.invoicePrefix} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, invoicePrefix: value })} style={styles.input} placeholder="Invoice prefix" />
          <TextInput value={settings.invoiceSettings.orderNumberPrefix} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, orderNumberPrefix: value })} style={styles.input} placeholder="Order prefix" />
          <TextInput value={settings.invoiceSettings.numberingSequence} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, numberingSequence: value })} style={styles.input} keyboardType="numeric" placeholder="Starting sequence" />
          <TextInput value={settings.invoiceSettings.documentFooter} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, documentFooter: value })} style={[styles.input, styles.textarea]} multiline placeholder="Document footer" />
          <TextInput value={settings.invoiceSettings.paymentTerms} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, paymentTerms: value })} style={[styles.input, styles.textarea]} multiline placeholder="Payment terms" />
          <TextInput value={settings.invoiceSettings.notes} onChangeText={(value) => setSectionValue('invoiceSettings', { ...settings.invoiceSettings, notes: value })} style={[styles.input, styles.textarea]} multiline placeholder="Notes" />
        </>,
        async () => {
          await saveReceiptSettings();
          await saveInvoiceSettings();
        }
      )}

      {renderSection(
        'orders',
        'Orders',
        sectionColors.orders,
        <>
          <Text style={styles.subSectionTitle}>Customer Details</Text>
          <TextInput value={settings.customerDetails.customerName} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, customerName: value })} style={styles.input} placeholder="Customer name" />
          <TextInput value={settings.customerDetails.phone} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, phone: value })} style={styles.input} placeholder="Customer phone" />
          <TextInput value={settings.customerDetails.whatsapp} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, whatsapp: value })} style={styles.input} placeholder="Customer WhatsApp" />
          <TextInput value={settings.customerDetails.email} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, email: value })} style={styles.input} placeholder="Customer email" />
          <TextInput value={settings.customerDetails.deliveryAddress} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, deliveryAddress: value })} style={[styles.input, styles.textarea]} multiline placeholder="Delivery address" />
          <TextInput value={settings.customerDetails.billingAddress} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, billingAddress: value })} style={[styles.input, styles.textarea]} multiline placeholder="Billing address" />
          <TextInput value={settings.customerDetails.notes} onChangeText={(value) => setSectionValue('customerDetails', { ...settings.customerDetails, notes: value })} style={[styles.input, styles.textarea]} multiline placeholder="Customer notes" />

          <Text style={styles.subSectionTitle}>Order Defaults</Text>
          <TextInput value={settings.orderDefaults.currency} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, currency: value })} style={styles.input} placeholder="MYR" />
          <TextInput value={settings.orderDefaults.country} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, country: value })} style={styles.input} placeholder="Malaysia" />
          <TextInput value={settings.orderDefaults.defaultOrderStatus} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, defaultOrderStatus: value })} style={styles.input} placeholder="New" />
          <TextInput value={settings.orderDefaults.defaultPaymentStatus} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, defaultPaymentStatus: value })} style={styles.input} placeholder="Pending" />
          <TextInput value={settings.orderDefaults.defaultShippingStatus} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, defaultShippingStatus: value })} style={styles.input} placeholder="Pending" />
          <TextInput value={settings.orderDefaults.defaultTripStatus} onChangeText={(value) => setSectionValue('orderDefaults', { ...settings.orderDefaults, defaultTripStatus: value })} style={styles.input} placeholder="Active" />

          <Text style={styles.subSectionTitle}>Shipping / Delivery</Text>
          {renderToggle('Self Pickup', settings.shippingSettings.selfPickupEnabled, () => setSectionValue('shippingSettings', { ...settings.shippingSettings, selfPickupEnabled: !settings.shippingSettings.selfPickupEnabled }))}
          {renderToggle('Courier', settings.shippingSettings.courierEnabled, () => setSectionValue('shippingSettings', { ...settings.shippingSettings, courierEnabled: !settings.shippingSettings.courierEnabled }))}
          {renderToggle('Local Delivery', settings.shippingSettings.localDeliveryEnabled, () => setSectionValue('shippingSettings', { ...settings.shippingSettings, localDeliveryEnabled: !settings.shippingSettings.localDeliveryEnabled }))}
          <TextInput value={settings.shippingSettings.defaultDeliveryMethod} onChangeText={(value) => setSectionValue('shippingSettings', { ...settings.shippingSettings, defaultDeliveryMethod: value })} style={styles.input} placeholder="Default delivery method" />
          <TextInput value={settings.shippingSettings.shippingNotes} onChangeText={(value) => setSectionValue('shippingSettings', { ...settings.shippingSettings, shippingNotes: value })} style={[styles.input, styles.textarea]} multiline placeholder="Shipping notes" />
          <TextInput value={settings.shippingSettings.defaultShippingFee} onChangeText={(value) => setSectionValue('shippingSettings', { ...settings.shippingSettings, defaultShippingFee: value })} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" />
        </>,
        async () => {
          await saveCustomerDetails();
          await saveOrderDefaults();
          await saveShippingSettings();
        }
      )}

      {renderSection(
        'finance',
        'Finance',
        sectionColors.finance,
        <>
          <Text style={styles.subSectionTitle}>Customer Payment</Text>
          <TextInput value={settings.customerPayment.timing} onChangeText={(value) => setSectionValue('customerPayment', { ...settings.customerPayment, timing: value as PaymentTiming })} style={styles.input} placeholder="immediately / before_shopping / after_confirmation / custom" />
          {renderToggle('Deposit enabled', settings.customerPayment.depositEnabled, () => setSectionValue('customerPayment', { ...settings.customerPayment, depositEnabled: !settings.customerPayment.depositEnabled }))}
          <TextInput value={settings.customerPayment.depositPercentage} onChangeText={(value) => setSectionValue('customerPayment', { ...settings.customerPayment, depositPercentage: value })} style={styles.input} keyboardType="decimal-pad" placeholder="Deposit percentage" />
          <TextInput value={settings.customerPayment.depositFixedAmount} onChangeText={(value) => setSectionValue('customerPayment', { ...settings.customerPayment, depositFixedAmount: value })} style={styles.input} keyboardType="decimal-pad" placeholder="Deposit fixed amount" />
          {renderToggle('Balance payment enabled', settings.customerPayment.balancePaymentEnabled, () => setSectionValue('customerPayment', { ...settings.customerPayment, balancePaymentEnabled: !settings.customerPayment.balancePaymentEnabled }))}
          <TextInput value={settings.customerPayment.paymentInstructions} onChangeText={(value) => setSectionValue('customerPayment', { ...settings.customerPayment, paymentInstructions: value })} style={[styles.input, styles.textarea]} multiline placeholder="Payment instructions / notes" />

          <Text style={styles.subSectionTitle}>Charges</Text>
          {renderToggle('Service fee enabled', settings.charges.serviceFeeEnabled, () => setSectionValue('charges', { ...settings.charges, serviceFeeEnabled: !settings.charges.serviceFeeEnabled }))}
          <TextInput value={settings.charges.serviceFeeType} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, serviceFeeType: value === 'percentage' ? 'percentage' : 'fixed' })} style={styles.input} placeholder="fixed / percentage" />
          <TextInput value={settings.charges.serviceFeeValue} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, serviceFeeValue: value })} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" />

          {renderToggle('Shopping fee enabled', settings.charges.shoppingFeeEnabled, () => setSectionValue('charges', { ...settings.charges, shoppingFeeEnabled: !settings.charges.shoppingFeeEnabled }))}
          <TextInput value={settings.charges.shoppingFeeType} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, shoppingFeeType: value === 'percentage' ? 'percentage' : 'fixed' })} style={styles.input} placeholder="fixed / percentage" />
          <TextInput value={settings.charges.shoppingFeeValue} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, shoppingFeeValue: value })} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" />

          {renderToggle('Delivery fee enabled', settings.charges.deliveryFeeEnabled, () => setSectionValue('charges', { ...settings.charges, deliveryFeeEnabled: !settings.charges.deliveryFeeEnabled }))}
          <TextInput value={settings.charges.deliveryFeeType} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, deliveryFeeType: value === 'percentage' ? 'percentage' : 'fixed' })} style={styles.input} placeholder="fixed / percentage" />
          <TextInput value={settings.charges.deliveryFeeValue} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, deliveryFeeValue: value })} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" />

          {renderToggle('Other charges enabled', settings.charges.otherChargesEnabled, () => setSectionValue('charges', { ...settings.charges, otherChargesEnabled: !settings.charges.otherChargesEnabled }))}
          <TextInput value={settings.charges.otherChargesValue} onChangeText={(value) => setSectionValue('charges', { ...settings.charges, otherChargesValue: value })} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" />
        </>,
        async () => {
          await saveCustomerPayment();
          await saveCharges();
        }
      )}

      {renderSection(
        'notifications',
        'Notifications',
        sectionColors.notifications,
        <>
          {renderToggle('Order updates', settings.notifications.orderUpdates, () => setSectionValue('notifications', { ...settings.notifications, orderUpdates: !settings.notifications.orderUpdates }))}
          {renderToggle('Payment received', settings.notifications.paymentReceived, () => setSectionValue('notifications', { ...settings.notifications, paymentReceived: !settings.notifications.paymentReceived }))}
          {renderToggle('Pending payment', settings.notifications.pendingPayment, () => setSectionValue('notifications', { ...settings.notifications, pendingPayment: !settings.notifications.pendingPayment }))}
          {renderToggle('Shipping update', settings.notifications.shippingUpdate, () => setSectionValue('notifications', { ...settings.notifications, shippingUpdate: !settings.notifications.shippingUpdate }))}
          {renderToggle('Trip reminders', settings.notifications.tripReminders, () => setSectionValue('notifications', { ...settings.notifications, tripReminders: !settings.notifications.tripReminders }))}
        </>,
        saveNotifications
      )}

      {renderSection(
        'account',
        'Account',
        sectionColors.account,
        <>
          <Text style={styles.subSectionTitle}>Profile</Text>
          <TextInput value={settings.account.name} onChangeText={(value) => setSectionValue('account', { ...settings.account, name: value })} style={styles.input} placeholder="Name" />
          <TextInput value={settings.account.email} onChangeText={(value) => setSectionValue('account', { ...settings.account, email: value })} style={styles.input} keyboardType="email-address" placeholder="Email" />
          <TextInput value={settings.account.phone} onChangeText={(value) => setSectionValue('account', { ...settings.account, phone: value })} style={styles.input} keyboardType="phone-pad" placeholder="Phone" />
          <TextInput value={settings.account.accountStatus} onChangeText={(value) => setSectionValue('account', { ...settings.account, accountStatus: value })} style={styles.input} placeholder="active / trial / suspended" />
          <TextInput value={settings.account.subscriptionPlan} onChangeText={(value) => setSectionValue('account', { ...settings.account, subscriptionPlan: value })} style={styles.input} placeholder="FREE / PREMIUM / Founder" />

          <Text style={styles.subSectionTitle}>Language / Region</Text>
          <TextInput value={settings.languageSettings.language} onChangeText={(value) => setSectionValue('languageSettings', { ...settings.languageSettings, language: value as LanguageCode })} style={styles.input} placeholder="ms / en / zh / ta" />
          <TextInput value={settings.languageSettings.currency} onChangeText={(value) => setSectionValue('languageSettings', { ...settings.languageSettings, currency: value })} style={styles.input} placeholder="MYR" />
          <TextInput value={settings.languageSettings.country} onChangeText={(value) => setSectionValue('languageSettings', { ...settings.languageSettings, country: value })} style={styles.input} placeholder="Malaysia" />

          <Pressable style={styles.secondaryButton} onPress={() => Alert.alert('Change password', 'Use the app authentication flow or Firebase console to change password.')}>
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleLogout}>
            <Text style={styles.primaryButtonText}>Logout</Text>
          </Pressable>
        </>,
        async () => {
          await saveAccountSettings();
          await saveLanguageSettings();
        }
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F7F5FB',
  },
  eyebrow: {
    color: '#5B2BD9',
    fontWeight: '800',
    letterSpacing: 0.7,
    fontSize: 12,
  },
  title: {
    color: '#181145',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: '#6B6B8A',
    marginTop: 6,
    marginBottom: 18,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
  },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderText: {
    color: '#5B2BD9',
    fontWeight: '900',
    fontSize: 18,
  },
  logoActions: {
    flex: 1,
    gap: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E5F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  sectionTitle: {
    flex: 1,
    color: '#181145',
    fontWeight: '800',
    fontSize: 16,
  },
  sectionChevron: {
    color: '#6B6B8A',
    fontWeight: '900',
    fontSize: 20,
  },
  subSectionTitle: {
    color: '#181145',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '800',
    fontSize: 14,
  },
  fieldRow: {
    marginTop: 12,
  },
  label: {
    color: '#6B6B8A',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 12,
  },
  input: {
    backgroundColor: '#F7F5FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#181145',
    marginBottom: 10,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleLabel: {
    color: '#181145',
    fontWeight: '700',
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: '#5B2BD9',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginLeft: 0,
  },
  toggleThumbOn: {
    marginLeft: 18,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: '#5B2BD9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#F3F0FF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#5B2BD9',
    fontWeight: '800',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B6B8A',
    fontWeight: '700',
  },
});
