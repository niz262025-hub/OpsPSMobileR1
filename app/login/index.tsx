import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from 'lucide-react-native';

import { useLanguage } from '../../context/LanguageContext';
import { useAuth, UserRole } from '../../context/AuthContext';

export default function LoginScreen() {
	const { t } = useLanguage();
	const { role = 'founder' } = useLocalSearchParams<{ role?: UserRole }>();
	const { login, ready } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const submit = async () => {
		if (!ready) return;
		if (!email.trim() || !password.trim()) {
			setError('Please enter your email and password.');
			return;
		}

		const success = await login(email, password, role);
		if (success) {
			router.replace(role === 'founder' ? '/(tabs)/dashboard' : '/customer');
			return;
		}

		setError('Invalid email or password.');
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<ArrowLeft size={18} color="#5B2BD9" />
					<Text style={styles.backText}>{t.common.back}</Text>
				</Pressable>

				<View style={styles.brandMark}><Text style={styles.brandHeart}>♥</Text></View>
				<Text style={styles.brand}>Ops<Text style={styles.brandAccent}>PS</Text></Text>
				<Text style={styles.subtitle}>{t.common.appSubtitle}</Text>

				<View style={styles.form}>
					<Text style={styles.welcome}>{t.auth.welcome}</Text>
					<Text style={styles.title}>{t.auth.loginTitle}</Text>

					<View style={styles.inputWrap}>
						<Mail size={18} color="#8A83A4" />
						<TextInput value={email} onChangeText={setEmail} placeholder={t.auth.email} placeholderTextColor="#A39DB8" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
					</View>
					<View style={styles.inputWrap}>
						<LockKeyhole size={18} color="#8A83A4" />
						<TextInput value={password} onChangeText={setPassword} placeholder={t.auth.password} placeholderTextColor="#A39DB8" secureTextEntry style={styles.input} />
					</View>

					<Pressable onPress={submit} style={styles.submitButton}>
						<Text style={styles.submitText}>{t.auth.loginButton}</Text>
						<ArrowRight size={18} color="#FFFFFF" />
					</Pressable>
					{!!error && <Text style={styles.error}>{error}</Text>}
					<Pressable style={styles.forgotButton} onPress={() => router.push('/forgot-password')}>
						<Text style={styles.forgotText}>{t.auth.forgotPassword}</Text>
					</Pressable>
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
	brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#5B2BD9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 34 },
	brandHeart: { color: '#FFFFFF', fontSize: 25 },
	brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 12 },
	brandAccent: { color: '#EC4C99' },
	subtitle: { color: '#77738D', textAlign: 'center', marginTop: 4 },
	form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, marginTop: 34, borderWidth: 1, borderColor: '#E8E3F1', shadowColor: '#35245E', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
	welcome: { color: '#EC4C99', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
	title: { color: '#252039', fontSize: 28, fontWeight: '900', marginTop: 7, marginBottom: 22 },
	inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FCFBFE' },
	input: { flex: 1, color: '#252039', paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
	submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#5B2BD9', borderRadius: 11, paddingVertical: 15, marginTop: 8 },
	submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
	forgotButton: { alignSelf: 'center', padding: 12 },
	forgotText: { color: '#5B2BD9', fontSize: 13, fontWeight: '700' },
	error: { color: '#B42318', fontSize: 13, marginTop: 10 },
});
