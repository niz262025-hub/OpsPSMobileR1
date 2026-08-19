import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const languages = ['BM', 'EN', '中文', 'தமிழ்'];

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
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

        <Text style={styles.systemName}>Personal Shopper System</Text>

        <View style={styles.heroCard}>
          <Image
            source={require('../assets/illustrations/Hero.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.heroTitle}>Urus Personal Shopper{'\n'}Dalam Satu Aplikasi</Text>
        <Text style={styles.heroDescription}>
          Optimakan workflow pembelian, pengurusan trip, inventori dan pemasaran produk dalam satu platform yang mudah dipantau.
        </Text>

        <View style={styles.ctaRow}>
          <Pressable style={styles.primaryButtonWrapper} onPress={() => router.push('/register')}>
            <LinearGradient
              colors={['#5B3DF5', '#7C3AED', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Mula Percuma</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.secondaryButtonText}>Log In</Text>
          </Pressable>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureTitle}>Mudah Digitalisasi</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>☁</Text>
              <Text style={styles.featureTitle}>Cloud Based</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureTitle}>Real-time Sync</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureTitle}>Selamat & Stabil</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pricingScrollContent}
          snapToInterval={300}
          decelerationRate="fast"
        >
          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>OpsPS Free</Text>
            <Text style={styles.pricingValue}>RM0</Text>
            <Text style={styles.pricingNote}>Percuma untuk semua pengguna</Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>2 Trips</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>2 Products</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Basic Order Management</Text>
              </View>
            </View>
          </View>

          <View style={[styles.pricingCard, styles.pricingHighlight]}>
            <Text style={styles.pricingLabel}>Founder 100 Users</Text>
            <Text style={styles.pricingValue}>RM29/bulan</Text>
            <Text style={styles.pricingNote}>100 pengguna pertama - harga seumur hidup</Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>AI Content</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Inventory</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Finance</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Report</Text>
              </View>
            </View>
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>OpsPS Standard</Text>
            <Text style={styles.pricingValue}>RM39/bulan</Text>
            <Text style={styles.pricingNote}>Harga standard selepas Founder quota tamat</Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>AI Content</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Inventory</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Finance</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>✓</Text>
                <Text style={styles.benefitText}>Report</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F5F3FF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 42,
    backgroundColor: '#F5F3FF',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brand: {
    fontSize: 40,
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
    paddingHorizontal: 10,
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
  systemName: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 10,
  },
  heroCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#1F1B4D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 18,
  },
  mascot: {
    width: 260,
    height: 260,
    alignSelf: 'center',
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    color: '#181145',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 400,
  },
  heroDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#514B6E',
    textAlign: 'center',
    maxWidth: 380,
    marginBottom: 24,
  },
  ctaRow: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  primaryButtonWrapper: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 17,
    borderRadius: 18,
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#181145',
    fontSize: 16,
    fontWeight: '700',
  },
  ghostButton: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#5B3DF5',
    marginBottom: 28,
  },
  ghostButtonText: {
    color: '#5B3DF5',
    fontSize: 15,
    fontWeight: '800',
  },
  featuresSection: {
    width: '100%',
    marginBottom: 28,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    minHeight: 118,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#1F1B4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  pricingScrollContent: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  pricingCard: {
    width: 290,
    backgroundColor: '#1D1A44',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2B5E',
    shadowColor: '#1F1B4D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    marginRight: 16,
  },
  pricingHighlight: {
    borderColor: '#EC4899',
    shadowColor: '#EC4899',
    shadowOpacity: 0.22,
  },
  pricingLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D8D1FF',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    textAlign: 'center',
  },
  pricingValue: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pricingNote: {
    fontSize: 12,
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '600',
  },
  benefitsList: {
    width: '100%',
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  benefitIcon: {
    color: '#A7F3D0',
    fontSize: 16,
    fontWeight: '900',
  },
  benefitText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
