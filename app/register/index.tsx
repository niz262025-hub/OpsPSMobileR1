import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, User } from 'lucide-react-native';

import { UserRole, useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const ROLES: { label: string; value: UserRole; emoji: string; description: string }[] = [
  {
    label: 'Personal Shopper',
    value: 'ps',
    emoji: '🛍️',
    description: 'Manage trips, orders, inventory & finance',
  },
  {
    label: 'Customer',
    value: 'customer',
    emoji: '🛒',
    description: 'Browse products, place orders & track delivery',
  },
];

export default function RegisterScreen() {
  const { t } = useLanguage();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ps');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    await register(name.trim(), email.trim(), password, role);
    setLoading(false);

    if (role === 'customer') {
      router.replace('/(customer)/browse');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ArrowLeft size={18} color="#5B2BD9" />
            <Text style={styles.backText}>{t.common.back}</Text>
          </Pressable>

          <View style={styles.brandMark}><Text style={styles.brandHeart}>♥</Text></View>
          <Text style={styles.brand}>Ops<Text style={styles.brandAccent}>PS</Text></Text>
          <Text style={styles.subtitle}>{t.common.appSubtitle}</Text>

          <View style={styles.form}>
            <Text style={styles.welcome}>GET STARTED</Text>
            <Text style={styles.title}>{t.auth.registerTitle}</Text>

            {/* Role selection */}
            <Text style={styles.roleLabel}>I am joining as…</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                  onPress={() => setRole(r.value)}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text style={[styles.roleTitle, role === r.value && styles.roleTitleActive]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.description}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.inputWrap}>
              <User size={18} color="#8A83A4" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#A39DB8"
                autoCapitalize="words"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <Mail size={18} color="#8A83A4" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.email}
                placeholderTextColor="#A39DB8"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <LockKeyhole size={18} color="#8A83A4" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.password}
                placeholderTextColor="#A39DB8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <LockKeyhole size={18} color="#8A83A4" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t.auth.confirmPassword}
                placeholderTextColor="#A39DB8"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <Pressable
              onPress={submit}
              style={[styles.submitButton, loading && styles.submitDisabled]}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? 'Creating account…' : t.auth.registerButton}</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </Pressable>

            <Pressable onPress={() => router.replace('/login')} style={styles.switchButton}>
              <Text style={styles.switchText}>{t.auth.haveAccount}</Text>
              <Text style={styles.switchAction}>{t.auth.loginButton}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F6FC' },
  scroll: { flexGrow: 1 },
  container: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 10 },
  backText: { color: '#5B2BD9', fontWeight: '700' },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#5B2BD9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
  brandHeart: { color: '#FFFFFF', fontSize: 25 },
  brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  brandAccent: { color: '#EC4C99' },
  subtitle: { color: '#77738D', textAlign: 'center', marginTop: 4 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, marginTop: 24, marginBottom: 24, borderWidth: 1, borderColor: '#E8E3F1', shadowColor: '#35245E', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  welcome: { color: '#EC4C99', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#252039', fontSize: 28, fontWeight: '900', marginTop: 7, marginBottom: 16 },
  roleLabel: { color: '#77738D', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleCard: { flex: 1, borderWidth: 1.5, borderColor: '#E3DEEC', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#FCFBFE' },
  roleCardActive: { borderColor: '#5B2BD9', backgroundColor: '#F5F0FF' },
  roleEmoji: { fontSize: 22, marginBottom: 6 },
  roleTitle: { color: '#77738D', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  roleTitleActive: { color: '#5B2BD9' },
  roleDesc: { color: '#A39DB8', fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FCFBFE' },
  input: { flex: 1, color: '#252039', paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
  error: { color: '#EF4444', fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#5B2BD9', borderRadius: 11, paddingVertical: 15, marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  switchButton: { alignItems: 'center', marginTop: 16 },
  switchText: { color: '#77738D', fontSize: 13 },
  switchAction: { color: '#EC4C99', fontSize: 14, fontWeight: '800', marginTop: 4 },
});
