import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordScreen() {
  const { accounts } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Please enter your registered email.');
      setMessage('');
      return;
    }

    const exists = accounts.some(
      (account) => account.email.toLowerCase() === trimmedEmail.toLowerCase(),
    );

    if (!exists) {
      setError('No account found for this email.');
      setMessage('');
      return;
    }

    setError('');
    setMessage(
      'Password reset request sent. This app uses a local mock flow, so no real email is sent. Please use your registered account details to sign in again.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color="#5B2BD9" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.brandMark}><Text style={styles.brandHeart}>♥</Text></View>
        <Text style={styles.brand}>Ops<Text style={styles.brandAccent}>PS</Text></Text>

        <View style={styles.form}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your registered email to request a password reset.</Text>

          <View style={styles.inputWrap}>
            <Mail size={18} color="#8A83A4" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#A39DB8"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <Pressable style={styles.submitButton} onPress={submit}>
            <Text style={styles.submitText}>Send Request</Text>
          </Pressable>

          {!!error && <Text style={styles.error}>{error}</Text>}
          {!!message && <Text style={styles.success}>{message}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F6FC' },
  container: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 10 },
  backText: { color: '#5B2BD9', fontWeight: '700' },
  brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#5B2BD9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 18 },
  brandHeart: { color: '#FFFFFF', fontSize: 25 },
  brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  brandAccent: { color: '#EC4C99' },
  form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, marginTop: 28, borderWidth: 1, borderColor: '#E8E3F1' },
  title: { color: '#252039', fontSize: 28, fontWeight: '900', marginBottom: 8 },
  subtitle: { color: '#77738D', marginBottom: 18 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FCFBFE' },
  input: { flex: 1, color: '#252039', paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
  submitButton: { backgroundColor: '#5B2BD9', borderRadius: 11, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  error: { color: '#B42318', fontSize: 13, marginTop: 10 },
  success: { color: '#0F766E', fontSize: 13, marginTop: 10 },
});
