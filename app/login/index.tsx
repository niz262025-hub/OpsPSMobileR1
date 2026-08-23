import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react-native';

import { UserRole, useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

const ROLES: { label: string; value: UserRole; emoji: string }[] = [
	{ label: 'Personal Shopper', value: 'ps', emoji: '🛍️' },
	{ label: 'Customer', value: 'customer', emoji: '🛒' },
];

export default function LoginScreen() {
	const { t } = useLanguage();
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<UserRole>('ps');
	const [loading, setLoading] = useState(false);

	const submit = async () => {
		if (!email.trim() || !password.trim()) return;
		setLoading(true);
		await login(email.trim(), password, role);
		setLoading(false);
		if (role === 'customer') {
			router.replace('/(customer)/browse');
		} else {
			router.replace('/(tabs)/dashboard');
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.brandMark}><Text style={styles.brandHeart}>♥</Text></View>
				<Text style={styles.brand}>Ops<Text style={styles.brandAccent}>PS</Text></Text>
				<Text style={styles.subtitle}>{t.common.appSubtitle}</Text>

				<View style={styles.form}>
					<Text style={styles.welcome}>{t.auth.welcome}</Text>
					<Text style={styles.title}>{t.auth.loginTitle}</Text>

					{/* Role selector */}
					<Text style={styles.roleLabel}>I am a…</Text>
					<View style={styles.roleRow}>
						{ROLES.map((r) => (
							<Pressable
								key={r.value}
								style={[styles.roleChip, role === r.value && styles.roleChipActive]}
								onPress={() => setRole(r.value)}
							>
								<Text style={styles.roleEmoji}>{r.emoji}</Text>
								<Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>{r.label}</Text>
							</Pressable>
						))}
					</View>

					<View style={styles.inputWrap}>
						<Mail size={18} color="#8A83A4" />
						<TextInput value={email} onChangeText={setEmail} placeholder={t.auth.email} placeholderTextColor="#A39DB8" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
					</View>
					<View style={styles.inputWrap}>
						<LockKeyhole size={18} color="#8A83A4" />
						<TextInput value={password} onChangeText={setPassword} placeholder={t.auth.password} placeholderTextColor="#A39DB8" secureTextEntry style={styles.input} />
					</View>

					<Pressable onPress={submit} style={[styles.submitButton, loading && styles.submitDisabled]} disabled={loading}>
						<Text style={styles.submitText}>{loading ? 'Loading…' : t.auth.loginButton}</Text>
						<ArrowRight size={18} color="#FFFFFF" />
					</Pressable>

					<Pressable onPress={() => router.push('/register')} style={styles.switchButton}>
						<Text style={styles.switchText}>{t.auth.noAccount}</Text>
						<Text style={styles.switchAction}>{t.auth.createAccount}</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#F8F6FC' },
	container: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24 },
	brandMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#5B2BD9', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 34 },
	brandHeart: { color: '#FFFFFF', fontSize: 25 },
	brand: { color: '#252039', fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: 12 },
	brandAccent: { color: '#EC4C99' },
	subtitle: { color: '#77738D', textAlign: 'center', marginTop: 4 },
	form: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, marginTop: 34, borderWidth: 1, borderColor: '#E8E3F1', shadowColor: '#35245E', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
	welcome: { color: '#EC4C99', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
	title: { color: '#252039', fontSize: 28, fontWeight: '900', marginTop: 7, marginBottom: 16 },
	roleLabel: { color: '#77738D', fontSize: 13, fontWeight: '700', marginBottom: 10 },
	roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
	roleChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E3DEEC', borderRadius: 11, paddingVertical: 11, backgroundColor: '#FCFBFE' },
	roleChipActive: { borderColor: '#5B2BD9', backgroundColor: '#F5F0FF' },
	roleEmoji: { fontSize: 16 },
	roleText: { color: '#77738D', fontWeight: '700', fontSize: 13 },
	roleTextActive: { color: '#5B2BD9' },
	inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E3DEEC', borderRadius: 11, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FCFBFE' },
	input: { flex: 1, color: '#252039', paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
	submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#5B2BD9', borderRadius: 11, paddingVertical: 15, marginTop: 8 },
	submitDisabled: { opacity: 0.6 },
	submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
	switchButton: { alignItems: 'center', marginTop: 16 },
	switchText: { color: '#77738D', fontSize: 13 },
	switchAction: { color: '#EC4C99', fontSize: 14, fontWeight: '800', marginTop: 4 },
});
