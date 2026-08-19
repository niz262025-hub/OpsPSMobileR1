import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '../../components/ui/GradientButton';
import { Colors } from '../../constants/colors';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoHeart}>♥</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>
                <Text style={{ color: '#181145' }}>Ops</Text>
                <Text style={{ color: '#EC4C99' }}>PS</Text>
              </Text>
              <Text style={styles.logoSubtitle}>Personal Shopper System</Text>
            </View>
          </View>

          <View style={styles.bell}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Image
            source={require('../../assets/illustrations/opsone-reference.png')}
            style={styles.heroImage}
            resizeMode='cover'
          />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Urus <Text style={styles.pink}>Personal</Text>
          </Text>
          <Text style={styles.title}>
            <Text style={styles.pink}>Shopper</Text> Dalam
          </Text>
          <Text style={styles.title}>Satu Aplikasi</Text>

          <Text style={styles.description}>
            Sistem lengkap untuk upload produk, generate content AI, urus order, inventory,
            himpunan dan push ke platform dengan lebih pantas & mudah.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <Feature icon='📱' label='Mudah Digitalisasi' />
          <Feature icon='☁️' label='Cloud Based' />
          <Feature icon='🔄' label='Real-time Sync' />
          <Feature icon='🛡️' label='Selamat & Stabil' />
        </View>

        {/* CTA */}
        <GradientButton title='Mula Percuma' />

        <Text style={styles.smallNote}>
          Tiada kad kredit diperlukan • Batal bila-bila masa
        </Text>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <View>
              <Text style={styles.pricingTitle}>OpsPS Pro</Text>
              <Text style={styles.pricingSubtitle}>Pelan paling popular</Text>
            </View>

            <View style={styles.launchBadge}>
              <Text style={styles.launchBadgeText}>100 pengguna pertama</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>RM39</Text>
            <Text style={styles.perMonth}>/bulan</Text>
          </View>

          <Text style={styles.pricingDesc}>
            Basic Launch (lifetime price) • Free RM0 termasuk 2 Trips + 2 Products.
          </Text>

          <Text style={styles.standardNote}>
            Basic Standard RM49/bulan selepas kuota launch habis • Team User RM10/bulan setiap user.
          </Text>
        </View>

        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <NavItem label='Home' active />
          <NavItem label='Orders' />
          <NavItem label='Inventory' />
          <NavItem label='Finance' />
          <NavItem label='More' />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Text>{icon}</Text>
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

function NavItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <Pressable style={styles.navItem}>
      <View style={[styles.navIcon, active && styles.navIconActive]} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#5B2BD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoHeart: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: '#6B6B8A',
    fontSize: 12,
    marginTop: 2,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EC4C99',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 20,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 360,
  },
  titleSection: {
    marginTop: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#181145',
    lineHeight: 40,
  },
  pink: {
    color: '#EC4C99',
  },
  description: {
    marginTop: 16,
    color: '#6B6B8A',
    fontSize: 15,
    lineHeight: 24,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    width: '23%',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 12,
    color: '#181145',
    textAlign: 'center',
    lineHeight: 16,
  },
  smallNote: {
    textAlign: 'center',
    color: '#6B6B8A',
    fontSize: 12,
    marginTop: 12,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 24,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pricingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181145',
  },
  pricingSubtitle: {
    color: '#6B6B8A',
    marginTop: 4,
  },
  launchBadge: {
    backgroundColor: '#5B2BD9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  launchBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },
  price: {
    fontSize: 46,
    fontWeight: '900',
    color: '#F97316',
  },
  perMonth: {
    marginLeft: 6,
    color: '#181145',
    fontSize: 18,
    marginBottom: 8,
  },
  pricingDesc: {
    marginTop: 12,
    color: '#181145',
    fontSize: 15,
    lineHeight: 22,
  },
  standardNote: {
    marginTop: 10,
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 28,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D9D6E6',
    marginBottom: 6,
  },
  navIconActive: {
    backgroundColor: '#5B2BD9',
  },
  navLabel: {
    fontSize: 12,
    color: '#6B6B8A',
  },
  navLabelActive: {
    color: '#5B2BD9',
    fontWeight: '700',
  },
});