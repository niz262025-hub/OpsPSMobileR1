import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

const languages = ['BM', 'EN', '中文', 'தமிழ்'];

export default function LoginScreen() {
  const router = useRouter();
  const { loginUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation', 'Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await loginUser(email, password);
      router.replace('/(tabs)/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log in.';
      Alert.alert('Login failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>
          <Text style={styles.brandOps}>Ops</Text>
          <Text style={styles.brandPs}>PS</Text>
        </Text>

        <View style={styles.languageSelector}>
          {languages.map((language, index) => (
            <Pressable
              key={language}
              style={[styles.languageChip, index === 0 && styles.languageChipActive]}
            >
              <Text style={[styles.languageText, index === 0 && styles.languageTextActive]}>{language}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formCard}>
        <Image source={require('../../assets/illustrations/Hero.png')} style={styles.mascot} />

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Personal Shopper System</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor="#8B8B99"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#8B8B99"
          />
        </View>

        <Pressable style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot password</Text>
        </Pressable>

        <Pressable onPress={handleLogin} disabled={submitting}>
          <LinearGradient
            colors={['#5B3DF5', '#7C3AED', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>New to OpsPS?</Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  brand: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  brandOps: {
    color: '#111827',
  },
  brandPs: {
    color: '#EC4899',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE8FF',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  languageChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  languageChipActive: {
    backgroundColor: '#1F1B4D',
  },
  languageText: {
    fontSize: 10,
    color: '#2B2550',
    fontWeight: '700',
  },
  languageTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#1F1B4D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  mascot: {
    width: 190,
    height: 190,
    alignSelf: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#181145',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2550',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#F8F8FC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#111827',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotPasswordText: {
    color: '#5B3DF5',
    fontWeight: '700',
    fontSize: 13,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    gap: 5,
  },
  registerPrompt: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  registerLink: {
    color: '#5B3DF5',
    fontSize: 14,
    fontWeight: '800',
  },
});
