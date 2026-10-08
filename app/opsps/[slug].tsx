import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, MessageCircle, ShoppingBag, Star, Users } from 'lucide-react-native';

import { getDataSource } from '../../services/repository';
import { BORDER_RADIUS, FONT_SIZES, SPACING, THEME } from '../../theme';

type MarketplaceProfile = {
  id: string;
  name: string;
  slug: string;
  description: string;
  profileImage?: string;
  coverImage?: string;
  location?: string;
  contact?: string;
  status: 'DRAFT' | 'LIVE' | 'PAUSED';
};

type MarketplaceProduct = {
  id: string;
  name: string;
  image: string;
  sellingPrice: number;
  description?: string;
  category?: string;
};

export default function PublicMarketplaceScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;

  const [business, setBusiness] = useState<{ id: string; name: string; slug: string; email?: string | null; phone?: string | null; address?: string | null } | null>(null);
  const [profile, setProfile] = useState<MarketplaceProfile | null>(null);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!normalizedSlug) {
        if (isActive) {
          setBusiness(null);
          setProfile(null);
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      try {
        const repo = getDataSource('production');
        const nextBusiness = await repo.business.getBySlug(normalizedSlug);

        if (!isActive) {
          return;
        }

        const fallbackBusiness = nextBusiness
          ? {
              id: nextBusiness.id,
              name: nextBusiness.name,
              slug: nextBusiness.slug ?? normalizedSlug,
              email: nextBusiness.email ?? undefined,
              phone: nextBusiness.phone ?? undefined,
              address: nextBusiness.address ?? undefined,
            }
          : null;

        setBusiness(fallbackBusiness);

        if (!nextBusiness) {
          setProfile(null);
          setProducts([]);
          setLoading(false);
          return;
        }

        const marketplaceProfile: MarketplaceProfile = {
          id: nextBusiness.id,
          name: nextBusiness.name,
          slug: nextBusiness.slug ?? normalizedSlug,
          description: 'Curated personal shopper collections and premium essentials for your next trip.',
          profileImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          coverImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80',
          location: nextBusiness.address ?? 'Kuala Lumpur',
          contact: nextBusiness.phone ?? 'WhatsApp message',
          status: 'LIVE',
        };

        const publishedProducts = await repo.products.listPublishedForBusiness(nextBusiness.id);
        setProfile(marketplaceProfile);
        setProducts(
          (publishedProducts ?? []).slice(0, 8).map((product) => ({
            id: product.id,
            name: product.name,
            image: product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
            sellingPrice: product.sellingPrice,
            description: product.description,
            category: product.category,
          }))
        );
      } catch {
        if (isActive) {
          setBusiness(null);
          setProfile(null);
          setProducts([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [normalizedSlug]);

  const heroImage = useMemo(
    () => profile?.coverImage ?? 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80',
    [profile]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Loading marketplace…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile || !business) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Pressable onPress={() => router.back()} style={styles.backAction}>
            <ArrowLeft size={16} color={THEME.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.emptyTitle}>Marketplace not found</Text>
          <Text style={styles.emptySubtitle}>This personal shopper marketplace is not available right now.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backAction}>
          <ArrowLeft size={18} color={THEME.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <LinearGradient colors={THEME.gradient} style={styles.heroSection}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
            <Text style={styles.storeName}>{profile.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaBadge}>{profile.status}</Text>
              <Text style={styles.metaText}>@{profile.slug}</Text>
            </View>
            <Text style={styles.description}>{profile.description}</Text>
            <View style={styles.quickStats}>
              <View style={styles.statPill}><Users size={14} color="#FFFFFF" /><Text style={styles.statText}>{products.length} products</Text></View>
              <View style={styles.statPill}><MapPin size={14} color="#FFFFFF" /><Text style={styles.statText}>{profile.location}</Text></View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by collection</Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Founder login</Text>
          </Pressable>
        </View>

        <View style={styles.collectionCard}>
          <View style={styles.collectionMeta}>
            <Text style={styles.collectionLabel}>Featured</Text>
            <Text style={styles.collectionName}>Curated picks for this trip</Text>
          </View>
          <Text style={styles.collectionDesc}>Browse style-led essentials, must-haves, and premium arrivals sourced for the latest personal shopping trip.</Text>
          <View style={styles.contactRow}>
            <MessageCircle size={16} color={THEME.primary} />
            <Text style={styles.contactText}>{profile.contact}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
          <Text style={styles.sectionMeta}>{products.length} live items</Text>
        </View>

        <View style={styles.productGrid}>
          {products.map((product) => (
            <Pressable
              key={product.id}
              style={styles.productCard}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id, businessId: business.id } })}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
              <View style={styles.productBody}>
                <Text style={styles.productCategory}>{product.category ?? 'Collection'}</Text>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>RM{Number(product.sellingPrice ?? 0).toFixed(2)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerCard}>
          <View style={styles.footerRow}>
            <Star size={16} color={THEME.accent} />
            <Text style={styles.footerText}>Marketplace supplied by {profile.name}</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={() => router.push({ pathname: '/product/[id]', params: { id: products[0]?.id ?? '', businessId: business.id } })}>
            <ShoppingBag size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{products[0] ? 'Shop now' : 'View products'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.background },
  content: { width: '100%', maxWidth: 1100, alignSelf: 'center', padding: SPACING['2xl'], paddingBottom: SPACING['3xl'] },
  backAction: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  backText: { color: THEME.primary, fontWeight: '700', fontSize: FONT_SIZES.sm },
  heroSection: { borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', marginBottom: SPACING['2xl'], position: 'relative', ...THEME.shadow.large },
  heroImage: { width: '100%', height: 280 },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(22, 16, 38, 0.38)' },
  heroContent: { position: 'absolute', inset: 0, padding: SPACING['2xl'], justifyContent: 'flex-end' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#FFFFFF', marginBottom: SPACING.md },
  storeName: { color: '#FFFFFF', fontSize: FONT_SIZES['3xl'], fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, flexWrap: 'wrap' },
  metaBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZES.xs },
  metaText: { color: '#F5F3FF', fontSize: FONT_SIZES.sm },
  description: { color: '#F5F3FF', fontSize: FONT_SIZES.base, marginTop: SPACING.md, maxWidth: 560 },
  quickStats: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, flexWrap: 'wrap' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  statText: { color: '#FFFFFF', fontWeight: '600', fontSize: FONT_SIZES.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md, marginTop: SPACING.sm },
  sectionTitle: { color: THEME.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '800' },
  sectionMeta: { color: THEME.text.secondary, fontSize: FONT_SIZES.sm },
  collectionCard: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING['2xl'], borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small, marginBottom: SPACING['2xl'] },
  collectionMeta: { marginBottom: SPACING.sm },
  collectionLabel: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  collectionName: { color: THEME.text.primary, fontSize: FONT_SIZES.xl, fontWeight: '700', marginTop: SPACING.xs },
  collectionDesc: { color: THEME.text.secondary, fontSize: FONT_SIZES.base, lineHeight: 24 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  contactText: { color: THEME.text.primary, fontWeight: '600' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.sm },
  productCard: { width: '50%', padding: SPACING.sm, minWidth: 220 },
  productImage: { width: '100%', height: 220, borderRadius: BORDER_RADIUS.lg, backgroundColor: '#F3F4F6' },
  productBody: { paddingTop: SPACING.md },
  productCategory: { color: THEME.primary, fontSize: FONT_SIZES.xs, fontWeight: '700', textTransform: 'uppercase' },
  productName: { color: THEME.text.primary, fontSize: FONT_SIZES.base, fontWeight: '700', marginTop: SPACING.xs },
  productPrice: { color: THEME.text.primary, fontSize: FONT_SIZES.lg, fontWeight: '800', marginTop: SPACING.xs },
  footerCard: { backgroundColor: THEME.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING['2xl'], marginTop: SPACING['2xl'], borderWidth: 1, borderColor: THEME.border, ...THEME.shadow.small },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  footerText: { color: THEME.text.primary, fontWeight: '700' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: THEME.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: FONT_SIZES.sm },
  linkText: { color: THEME.primary, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING['2xl'] },
  emptyTitle: { color: THEME.text.primary, fontSize: FONT_SIZES['2xl'], fontWeight: '800', marginBottom: SPACING.sm },
  emptySubtitle: { color: THEME.text.secondary, textAlign: 'center', maxWidth: 320 },
});
