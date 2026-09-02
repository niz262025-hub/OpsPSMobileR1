import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function FounderRegistrationScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', businessName: '', email: '', phone: '', address: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (Object.values(form).some((value) => !value.trim())) return setError('Please complete all Founder and business fields.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!await register({ ...form, role: 'founder' })) return setError('An account with this email already exists.');
    router.replace('/register/success?role=founder');
  };
  return (
    <RegistrationLayout title="Register Founder" onBack={() => router.back()}>
      <Field label="Founder Name" value={form.name} onChangeText={(value) => update('name', value)} />
      <Field label="Business Name" value={form.businessName} onChangeText={(value) => update('businessName', value)} />
      <Field label="Email / Username" value={form.email} onChangeText={(value) => update('email', value)} />
      <Field label="Phone" value={form.phone} onChangeText={(value) => update('phone', value)} />
      <Field label="Business Address" value={form.address} onChangeText={(value) => update('address', value)} />
      <Field label="Password" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry />
      <Field label="Confirm Password" value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} secureTextEntry />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>Register Founder</Text></Pressable>
    </RegistrationLayout>
  );
}

function RegistrationLayout({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 32 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          bounces={false}
        >
          <Pressable onPress={onBack} style={styles.back}><ArrowLeft size={18} color="#5B2BD9" /><Text style={styles.backText}>Back</Text></Pressable>
          <Text style={styles.brand}>Ops<Text style={styles.accent}>PS</Text></Text>
          <View style={styles.form}>
            <Text style={styles.title}>{title}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Field({ label, value, onChangeText, secureTextEntry = false }: { label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} autoCapitalize="none" style={styles.input} /></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8F6FC' }, flex: { flex: 1 }, scroll: { flex: 1 }, container: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, paddingBottom: 48 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }, backText: { color: '#5B2BD9', fontWeight: '700' }, brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginVertical: 18 }, accent: { color: '#EC4C99' }, form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#E8E3F1' }, title: { color: '#252039', fontSize: 26, fontWeight: '900', marginBottom: 20 }, field: { marginBottom: 12 }, label: { color: '#252039', fontWeight: '700', marginBottom: 6 }, input: { borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, padding: 13, color: '#252039' }, primary: { backgroundColor: '#5B2BD9', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 8 }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, error: { color: '#B42318', marginBottom: 8 } });