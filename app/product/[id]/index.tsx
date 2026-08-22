import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';

import {
  getProduct,
  getProductVariantByProduct,
  useMockDatabase,
} from '../../../services/mockDatabase';
import {
  BORDER_RADIUS,
  FONT_SIZES,
  SPACING,
  THEME,
} from '../../../theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useMockDatabase();

  const [quantity, setQuantity] = useState('1');
  const [selectedSize, setSelectedSize] = useState('');

  const product = id ? getProduct(id, db) : undefined;

  const variants = useMemo(
    () => (product ? getProductVariantByProduct(product.id, db) : []),
    [product, db]
  );

  const activeVariant =
    variants.find((variant) => variant.size === selectedSize) ??
    variants[0];

  const availableStock = activeVariant?.stock ?? 0;

  const quantityNumber = Math.max(
    1,
    Number(quantity) || 1
  );

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Product Not Found</Text>
          <Text style={styles.emptyText}>
            This product is no longer available.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sizes = variants.map((variant) => variant.size);

  const total = product.sellingPrice * quantityNumber;

  const handleWantThis = () => {
    if (!activeVariant) {
      return;
    }

    router.push({
      pathname: '/order/create',
      params: {
        productId: product.id,
        productVariantId: activeVariant.id,
        quantity: String(quantityNumber),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={THEME.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.imageCard}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ShoppingBag size={42} color={THEME.text.light} />
              <Text style={styles.emptyText}>No product image</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.category}>{product.category}</Text>

          <Text style={styles.title}>{product.name}</Text>

          <Text style={styles.price}>
            RM{product.sellingPrice.toFixed(2)}
          </Text>

          {!!product.description && (
            <Text style={styles.description}>
              {product.description}
            </Text>
          )}

          <View style={styles.divider} />

          {sizes.length > 0 && (
            <>
              <Text style={styles.label}>Size</Text>

              <View style={styles.sizeRow}>
                {sizes.map((size) => {
                  const variant = variants.find(
                    (item) => item.size === size
                  );

                  const isSelected =
                    (selectedSize || activeVariant?.size) === size;

                  return (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[
                        styles.sizeButton,
                        isSelected && styles.sizeButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          isSelected && styles.sizeTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Quantity</Text>

          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            style={styles.quantityInput}
            placeholder="1"
            placeholderTextColor={THEME.text.light}
          />

          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Available Stock</Text>
            <Text style={styles.stockValue}>
              {availableStock > 0 ? availableStock : 'Out of stock'}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              RM{total.toFixed(2)}
            </Text>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
            ]}
            onPress={handleWantThis}
          >
            <ShoppingBag size={19} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              I Want This
            </Text>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.background,
  },

  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: SPACING['2xl'],
    paddingBottom: SPACING['3xl'],
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  backText: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },

  imageCard: {
    width: '100%',
    minHeight: 320,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#F3F4F6',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 320,
  },

  infoCard: {
    marginTop: SPACING.lg,
    backgroundColor: THEME.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING['2xl'],
  },

  category: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  title: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '800',
    marginTop: SPACING.xs,
  },

  price: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },

  description: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 21,
    marginTop: SPACING.md,
  },

  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: SPACING.lg,
  },

  label: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },

  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  sizeButton: {
    minWidth: 52,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },

  sizeButtonSelected: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },

  sizeButtonDisabled: {
    opacity: 0.4,
  },

  sizeText: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },

  sizeTextSelected: {
    color: '#FFFFFF',
  },

  sizeTextDisabled: {
    color: THEME.text.light,
  },

  quantityInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: BORDER_RADIUS.md,
    color: THEME.text.primary,
    padding: SPACING.md,
    backgroundColor: '#FCFCFD',
    fontSize: FONT_SIZES.sm,
    maxWidth: 160,
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },

  stockLabel: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
  },

  stockValue: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },

  totalLabel: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },

  totalValue: {
    color: THEME.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },

  primaryButton: {
    backgroundColor: THEME.primary,
    borderRadius: BORDER_RADIUS.md,
    minHeight: 50,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.45,
  },

  unavailableText: {
    color: THEME.status.error,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },

  emptyTitle: {
    color: THEME.text.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
  },

  emptyText: {
    color: THEME.text.secondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});