import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function CustomerRegistrationScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (Object.values(form).some((value) => !value.trim())) return setError('Please complete all customer fields.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!await register({ ...form, role: 'customer' })) return setError('An account with this email already exists.');
    router.replace('/register/success?role=customer');
  };
  return <SafeAreaView style={styles.safe}><View style={styles.container}><Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft size={18} color="#5B2BD9" /><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.brand}>Ops<Text style={styles.accent}>PS</Text></Text><View style={styles.form}><Text style={styles.title}>Register Customer</Text>{[['name', 'Full Name'], ['email', 'Email / Username'], ['phone', 'Phone'], ['address', 'Address'], ['password', 'Password'], ['confirmPassword', 'Confirm Password']].map(([key, label]) => <View style={styles.field} key={key}><Text style={styles.label}>{label}</Text><TextInput value={form[key as keyof typeof form]} onChangeText={(value) => update(key as keyof typeof form, value)} secureTextEntry={key.includes('password')} autoCapitalize="none" style={styles.input} /></View>)}{!!error && <Text style={styles.error}>{error}</Text>}<Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>Register Customer</Text></Pressable></View></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#F8F6FC' }, container: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 }, backText: { color: '#5B2BD9', fontWeight: '700' }, brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginVertical: 18 }, accent: { color: '#EC4C99' }, form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, borderWidth: 1, borderColor: '#E8E3F1' }, title: { color: '#252039', fontSize: 26, fontWeight: '900', marginBottom: 20 }, field: { marginBottom: 12 }, label: { color: '#252039', fontWeight: '700', marginBottom: 6 }, input: { borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, padding: 13, color: '#252039' }, primary: { backgroundColor: '#5B2BD9', borderRadius: 11, padding: 15, alignItems: 'center', marginTop: 8 }, primaryText: { color: '#FFFFFF', fontWeight: '800' }, error: { color: '#B42318', marginBottom: 8 } });