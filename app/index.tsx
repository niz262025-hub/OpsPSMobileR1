import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const heroImage = require('../assets/illustrations/Hero.png');

export default function FrontPage() {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>OPS</Text>
            </View>

            <View>
              <Text style={styles.logoTitle}>
                <Text style={styles.ops}>Ops</Text>
                <Text style={styles.ps}>PS</Text>
              </Text>

              <Text style={styles.logoSubtitle}>
                Personal Shopper System
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginText}>Login</Text>
          </Pressable>
        </View>

        {/* HERO */}
        <View
          style={[
            styles.hero,
            isMobile && styles.heroMobile,
          ]}
        >
          <View
            style={[
              styles.heroTextContainer,
              isMobile && styles.heroTextMobile,
            ]}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                MADE FOR PERSONAL SHOPPERS
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Run Your{' '}
              <Text style={styles.pink}>Personal Shopper</Text>
              {'\n'}
              Business Smarter
            </Text>

            <Text style={styles.heroDescription}>
              Manage trips, products, orders, inventory,
              payments, shipping, finance and profit —
              all in one place.
            </Text>

            <View style={styles.heroButtons}>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push('/register')}
              >
                <Text style={styles.primaryButtonText}>
                  Start Free — 2 Shopping Trips
                </Text>
              </Pressable>


            </View>

            <Text style={styles.heroNote}>
              No credit card required • 24/7 support
            </Text>
          </View>

          <View
            style={[
              styles.heroImageContainer,
              isMobile && styles.heroImageMobile,
            ]}
          >
            <Image
              source={heroImage}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            EVERYTHING IN ONE SYSTEM
          </Text>

          <Text style={styles.sectionTitle}>
            Built around how Personal Shoppers actually work
          </Text>

          <View style={styles.features}>
            <Feature
              icon="✈"
              title="Trips"
              text="Create, manage and close shopping trips."
            />

            <Feature
              icon="🛍"
              title="Orders"
              text="Track customer orders from purchase to shipped."
            />

            <Feature
              icon="📦"
              title="Inventory"
              text="Know your stock and inventory value."
            />

            <Feature
              icon="💰"
              title="Finance"
              text="Track income, expenses and business profit."
            />

            <Feature
              icon="🚚"
              title="Shipping"
              text="Prepare shipments and connect with EasyParcel."
            />

            <Feature
              icon="📊"
              title="Reports"
              text="Get simple business reports automatically."
            />
          </View>
        </View>

        {/* PRICING */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>
            SIMPLE PRICING
          </Text>

          <Text style={styles.sectionTitle}>
            Choose the plan that fits your business
          </Text>

          <View
            style={[
              styles.pricingContainer,
              isMobile && styles.pricingMobile,
            ]}
          >

            {/* FOUNDER */}
            <View
              style={[
                styles.pricingCard,
                styles.founderCard,
                isMobile && styles.pricingCardMobile,
              ]}
            >
              <View style={styles.pricingTop}>
                <View>
                  <Text style={styles.planName}>
                    Founder
                  </Text>

                  <Text style={styles.planSubtitle}>
                    First 100 customers only
                  </Text>
                </View>

                <View style={styles.founderBadge}>
                  <Text style={styles.founderBadgeText}>
                    FIRST 100
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  RM39
                </Text>

                <Text style={styles.perMonth}>
                  /month
                </Text>
              </View>

              <Text style={styles.priceLock}>
                Founder price while subscription remains active
              </Text>

              <View style={styles.featureList}>
                <PriceFeature text="All premium features" />
                <PriceFeature text="All future features" />
                <PriceFeature text="EasyParcel integration" />
                <PriceFeature text="Finance & reports" />
                <PriceFeature text="24/7 support" />
              </View>

              <Pressable
                style={styles.founderButton}
                onPress={() => router.push('/register')}
              >
                <Text style={styles.founderButtonText}>
                  Become a Founder
                </Text>
              </Pressable>
            </View>

            {/* STANDARD */}
            <View
              style={[
                styles.pricingCard,
                isMobile && styles.pricingCardMobile,
              ]}
            >
              <View style={styles.pricingTop}>
                <View>
                  <Text style={styles.planName}>
                    Standard
                  </Text>

                  <Text style={styles.planSubtitle}>
                    For everyone after Founder
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  RM49
                </Text>

                <Text style={styles.perMonth}>
                  /month
                </Text>
              </View>

              <Text style={styles.priceLockInvisible}>
                Full OpsPS subscription
              </Text>

              <View style={styles.featureList}>
                <PriceFeature text="All premium features" />
                <PriceFeature text="Future updates" />
                <PriceFeature text="EasyParcel integration" />
                <PriceFeature text="Finance & reports" />
                <PriceFeature text="24/7 support" />
              </View>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push('/register')}
              >
                <Text style={styles.secondaryButtonText}>
                  Get Started
                </Text>
              </Pressable>
            </View>

          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>
          {icon}
        </Text>
      </View>

      <Text style={styles.featureTitle}>
        {title}
      </Text>

      <Text style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
}

function PriceFeature({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.priceFeature}>
      <View style={styles.checkCircle}>
        <Text style={styles.check}>
          ✓
        </Text>
      </View>

      <Text style={styles.priceFeatureText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },

  header: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#5B2BD9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  logoTitle: {
    fontSize: 24,
    fontWeight: '900',
  },

  ops: {
    color: '#181145',
  },

  ps: {
    color: '#EC4C99',
  },

  logoSubtitle: {
    color: '#77728A',
    fontSize: 11,
    marginTop: 2,
  },

  loginButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  loginText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '800',
  },

  hero: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    minHeight: 540,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 45,
  },

  heroMobile: {
    flexDirection: 'column',
  },

  heroTextContainer: {
    flex: 1,
    padding: 45,
    zIndex: 2,
  },

  heroTextMobile: {
    padding: 28,
    paddingBottom: 5,
  },

  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEE9FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 18,
  },

  badgeText: {
    color: '#5B2BD9',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  heroTitle: {
    fontSize: 42,
    lineHeight: 49,
    fontWeight: '900',
    color: '#181145',
  },

  pink: {
    color: '#EC4C99',
  },

  heroDescription: {
    marginTop: 18,
    color: '#6B6B8A',
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 540,
  },

  heroButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },

  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  heroLogin: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  heroLoginText: {
    color: '#5B2BD9',
    fontSize: 14,
    fontWeight: '800',
  },

  heroNote: {
    color: '#8B8798',
    fontSize: 11,
    marginTop: 11,
  },

  heroImageContainer: {
    flex: 1,
    height: 540,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroImageMobile: {
    width: '100%',
    height: 440,
    marginTop: 5,
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  section: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 45,
  },

  sectionEyebrow: {
    color: '#5B2BD9',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 7,
  },

  sectionTitle: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '900',
    color: '#181145',
  },

  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 22,
  },

  featureCard: {
    width: '31.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  featureIconText: {
    fontSize: 19,
  },

  featureTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#181145',
  },

  featureText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#77728A',
    marginTop: 5,
  },

  cta: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#181145',
    borderRadius: 26,
    padding: 30,
    marginBottom: 45,
  },

  ctaContent: {
    maxWidth: 700,
  },

  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  ctaText: {
    color: '#D8D4E5',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 18,
  },

  ctaButtonText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '900',
  },

  pricingContainer: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 20,
  },

  pricingMobile: {
    flexDirection: 'column',
  },

  pricingCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    minHeight: 360,
  },

  pricingCardMobile: {
    width: '100%',
  },

  founderCard: {
    borderWidth: 2,
    borderColor: '#5B2BD9',
  },

  pricingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  planName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#181145',
  },

  planSubtitle: {
    color: '#77728A',
    fontSize: 11,
    marginTop: 4,
  },

  founderBadge: {
    backgroundColor: '#5B2BD9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  founderBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 18,
  },

  price: {
    fontSize: 42,
    fontWeight: '900',
    color: '#181145',
  },

  perMonth: {
    fontSize: 15,
    color: '#6B6B8A',
    marginLeft: 5,
    marginBottom: 7,
  },

  priceLock: {
    color: '#5B2BD9',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },

  priceLockInvisible: {
    color: '#77728A',
    fontSize: 11,
    marginTop: 2,
  },

  featureList: {
    marginTop: 18,
  },

  priceFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  check: {
    color: '#5B2BD9',
    fontSize: 11,
    fontWeight: '900',
  },

  priceFeatureText: {
    flex: 1,
    color: '#4F4A5C',
    fontSize: 12,
  },

  founderButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  founderButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#5B2BD9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },

  secondaryButtonText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '800',
  },

  bottomCta: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#181145',
    borderRadius: 26,
    padding: 30,
    alignItems: 'center',
  },

  bottomTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  bottomText: {
    color: '#D8D4E5',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 600,
    marginTop: 8,
  },

  bottomButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 25,
    paddingVertical: 14,
    marginTop: 18,
  },

  bottomButtonText: {
    color: '#5B2BD9',
    fontSize: 13,
    fontWeight: '900',
  },

  existingAccount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 15,
  },
});
