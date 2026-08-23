import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Link, PackagePlus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import {
  createProduct,
  PRODUCT_SIZE_OPTIONS,
  ProductCategory,
  useMockDatabase,
} from '../../services/mockDatabase';

import {
  BORDER_RADIUS,
  FONT_SIZES,
  SPACING,
  THEME,
} from '../../theme';

const categories: ProductCategory[] = [
  'Clothing',
  'Shoes',
  'Other',
];

const marketingPlatforms = [
  'Instagram',
  'Facebook',
  'TikTok',
  'Threads',
  'X',
];

const directPlatforms = [
  'WhatsApp',
  'Telegram',
];

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (value) {
        resolve(value);
        return;
      }

      reject(new Error('Failed to convert image to Data URL.'));
    };
    reader.onerror = () => reject(new Error('Failed to convert image to Data URL.'));
    reader.readAsDataURL(blob);
  });
}

async function normalizeProductImageUri(uri: string): Promise<string> {
  if (!uri) {
    return '';
  }

  if (uri.startsWith('data:')) {
    return uri;
  }

  if (uri.startsWith('blob:') || uri.startsWith('file:') || uri.startsWith('content:')) {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        return uri;
      }

      const blob = await response.blob();
      return await blobToDataUrl(blob);
    } catch (error) {
      console.warn('Unable to convert image URI to Data URL:', error);
      return uri;
    }
  }

  return uri;
}

export default function MarketplaceScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const db = useMockDatabase();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  const [category, setCategory] =
    useState<ProductCategory>('Clothing');

  const [size, setSize] = useState(
    PRODUCT_SIZE_OPTIONS.Clothing[2]
  );

  const [stock, setStock] = useState('0');
  const [cost, setCost] = useState('0');
  const [price, setPrice] = useState('0');

  const [picker, setPicker] = useState<
    'category' | 'size' | null
  >(null);

  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');

  const [selected, setSelected] = useState<string[]>([]);

  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  const sizeOptions =
    category === 'Other'
      ? []
      : PRODUCT_SIZE_OPTIONS[category];

  const products = db.products;

  const selectCategory = (next: ProductCategory) => {
    setCategory(next);

    setSize(
      next === 'Other'
        ? ''
        : PRODUCT_SIZE_OPTIONS[next][2]
    );

    setPicker(null);
  };

  /**
   * Create product first.
   *
   * The generated link uses the actual Expo Router route:
   *
   * /product/[id]
   *
   * Example:
   *
   * /product/product-1755841234567
   */
  const saveProduct = async () => {
    if (!name.trim()) {
      setFormError('Please enter a product name.');
      return;
    }

    if (!image.trim()) {
      setFormError('Please upload a product image.');
      return;
    }

    if (!category || (category !== 'Other' && !size.trim())) {
      setFormError('Please select a category and size.');
      return;
    }

    const stockNumber = Number(stock);
    const costNumber = Number(cost);
    const priceNumber = Number(price);
    if (!Number.isFinite(stockNumber) || stockNumber < 0) {
      setFormError('Stock must be a valid number of 0 or more.');
      return;
    }
    if (!Number.isFinite(costNumber) || costNumber < 0) {
      setFormError('Cost must be a valid amount of 0 or more.');
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setFormError('Price must be a valid amount greater than 0.');
      return;
    }

    try {
      const durableImage = await normalizeProductImageUri(image);
      const product = createProduct({
        name,
        image: durableImage,
        description,
        category,
        tripId,
        size: size || undefined,
        stock: stockNumber,
        costPrice: costNumber,
        sellingPrice: priceNumber,
      });

      if (!product) {
        setFormError('Product creation failed. Please try again.');
        Alert.alert(
          'Product Creation Failed',
          'Product was not created.'
        );
        return;
      }

      if (!product.id) {
        setFormError('Product creation failed because no Product ID was returned.');
        Alert.alert(
          'Product Creation Failed',
          'Product was not created because no Product ID was returned.'
        );
        return;
      }

      const productPath = `/product/${product.id}`;
      const appOrigin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : '';

      const productLink = appOrigin
        ? `${appOrigin}${productPath}`
        : productPath;

      setGeneratedLink(productLink);
      setGeneratedImage(product.image);
      setFormError('');

      setCopied(false);

      setName('');
      setImage('');
      setDescription('');
      setStock('0');
      setCost('0');
      setPrice('0');

      Alert.alert(
        'Product Link Generated',
        productLink
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create the product.';

      setFormError(message);

      Alert.alert(
        'Product Creation Failed',
        message
      );
    }
  };

  const chooseImage = async (camera: boolean) => {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        camera
          ? 'Camera permission is required.'
          : 'Photo Library permission is required.'
      );

      return;
    }

    const result = camera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.9,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.9,
        });

    if (!result.canceled && result.assets.length > 0) {
      const selectedUri = result.assets[0].uri;
      const durableImage = await normalizeProductImageUri(selectedUri);
      setImage(durableImage);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelected((current) =>
      current.includes(platform)
        ? current.filter(
            (item) => item !== platform
          )
        : [...current, platform]
    );
  };

  const copyGeneratedLink = async () => {
    if (!generatedLink) {
      return;
    }

    await Clipboard.setStringAsync(generatedLink);

    setCopied(true);

    Alert.alert(
      'Copied',
      'Product link copied.'
    );
  };

  const openGeneratedProduct = () => {
    if (!generatedLink) {
      return;
    }

    const productPath = generatedLink.replace(
      /^https?:\/\/[^/]+/i,
      ''
    );

    if (productPath.startsWith('/')) {
      router.push(productPath as any);
      return;
    }

    router.push('/' as any);
  };

  const shareProduct = async (platform: string) => {
    if (!generatedLink) {
      return;
    }

    const message = `Check out this product:\n${generatedLink}`;

    if (platform === 'WhatsApp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      try {
        const supported = await Linking.canOpenURL(whatsappUrl);
        if (supported) {
          await Linking.openURL(whatsappUrl);
          return;
        }
      } catch (error) {
        console.warn('Unable to open WhatsApp share URL', error);
      }

      Alert.alert(
        'WhatsApp Unavailable',
        'WhatsApp could not be opened from this device.'
      );
      return;
    }

    if (platform === 'Telegram') {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent('Check out this product')}`;

      try {
        const supported = await Linking.canOpenURL(telegramUrl);
        if (supported) {
          await Linking.openURL(telegramUrl);
          return;
        }
      } catch (error) {
        console.warn('Unable to open Telegram share URL', error);
      }

      Alert.alert(
        'Telegram Unavailable',
        'Telegram could not be opened from this device.'
      );
      return;
    }

    Alert.alert(
      `Share to ${platform}`,
      `Use your preferred ${platform} channel to share this product:\n\n${generatedLink}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>
              Product operations
            </Text>

            <Text style={styles.title}>
              Marketplace
            </Text>

            <Text style={styles.subtitle}>
              Upload, price and share products from one place.
            </Text>
          </View>

          <PackagePlus
            size={28}
            color={THEME.primary}
          />
        </View>

        {/* UPLOAD PRODUCT */}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Upload Product
          </Text>

          <Text style={styles.label}>
            Product Photo
          </Text>

          {image ? (
            <View style={styles.imagePreviewWrap}>
              <Image
                source={{ uri: image }}
                style={styles.imagePreview}
                resizeMode="contain"
              />

              <View style={styles.imageActions}>
                <Pressable
                  onPress={() => chooseImage(false)}
                >
                  <Text style={styles.linkButtonText}>
                    Replace
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setImage('')}
                >
                  <Text style={styles.deleteText}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.imagePickerButton}
              onPress={() => chooseImage(false)}
            >
              <Text style={styles.imagePickerText}>
                Upload Photo
              </Text>
            </Pressable>
          )}

          <Field
            label="Product Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Premium Cotton Tee"
          />

          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Product details"
          />

          <Text style={styles.label}>
            Category
          </Text>

          <PickerButton
            value={category}
            onPress={() => setPicker('category')}
          />

          {category !== 'Other' && (
            <>
              <Text style={styles.label}>
                Size
              </Text>

              <PickerButton
                value={size}
                onPress={() => setPicker('size')}
              />
            </>
          )}

          <View style={styles.fieldRow}>
            <Field
              label="Price (RM)"
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              numeric
            />

            <Field
              label="Cost (RM)"
              value={cost}
              onChangeText={setCost}
              placeholder="0"
              numeric
            />
          </View>

          <Field
            label="Stock"
            value={stock}
            onChangeText={setStock}
            placeholder="0"
            numeric
          />

          <Pressable
            style={styles.primaryButton}
            onPress={saveProduct}
          >
            <Text style={styles.primaryButtonText}>
              Generate Product Link
            </Text>
          </Pressable>
          {!!formError && (
            <Text style={styles.formError}>{formError}</Text>
          )}
        </View>

        {/* GENERATED PRODUCT */}

        {generatedLink && (
          <View style={styles.shareCard}>
            <Text style={styles.sectionTitle}>
              Share / Post Product
            </Text>

            {!!generatedImage && (
              <Image
                source={{ uri: generatedImage }}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}

            <Text style={styles.groupLabel}>
              Product Link
            </Text>

            <View style={styles.linkBox}>
              <Link
                size={17}
                color={THEME.primary}
              />

              <Text
                style={styles.linkText}
                selectable
              >
                {generatedLink}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={copyGeneratedLink}
              >
                <Text style={styles.secondaryButtonText}>
                  {copied
                    ? 'Copied'
                    : 'Copy Link'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={openGeneratedProduct}
              >
                <Text style={styles.secondaryButtonText}>
                  Open Customer Page
                </Text>
              </Pressable>
            </View>

            <View style={styles.linkButton}>
              <Link
                size={17}
                color={THEME.primary}
              />

              <Text style={styles.linkButtonText}>
                Product link generated
              </Text>
            </View>

            {/* MARKETING */}

            <Text style={styles.groupLabel}>
              Marketing
            </Text>

            <View style={styles.chipRow}>
              {marketingPlatforms.map(
                (platform) => (
                  <PlatformChip
                    key={platform}
                    label={platform}
                    selected={selected.includes(
                      platform
                    )}
                    onPress={() => {
                      togglePlatform(
                        platform
                      );
                      void shareProduct(
                        platform
                      );
                    }}
                  />
                )
              )}
            </View>

            {/* DIRECT */}

            <Text style={styles.groupLabel}>
              Direct Link
            </Text>

            <View style={styles.chipRow}>
              {directPlatforms.map(
                (platform) => (
                  <PlatformChip
                    key={platform}
                    label={platform}
                    selected={selected.includes(
                      platform
                    )}
                    onPress={() => {
                      togglePlatform(
                        platform
                      );
                      void shareProduct(
                        platform
                      );
                    }}
                  />
                )
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* CATEGORY / SIZE MODAL */}

      <Modal
        visible={picker !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setPicker(null)
        }
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPicker(null)}
        >
          <View
            style={styles.modalSheet}
          >
            <Text
              style={styles.sectionTitle}
            >
              {picker === 'category'
                ? 'Choose Category'
                : 'Choose Size'}
            </Text>

            {(picker === 'category'
              ? categories
              : sizeOptions
            ).map((option) => (
              <Pressable
                key={option}
                style={styles.option}
                onPress={() => {
                  if (
                    picker ===
                    'category'
                  ) {
                    selectCategory(
                      option as ProductCategory
                    );
                  } else {
                    setSize(option);
                    setPicker(null);
                  }
                }}
              >
                <Text
                  style={
                    styles.optionText
                  }
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          THEME.text.light
        }
        keyboardType={
          numeric
            ? 'numeric'
            : 'default'
        }
        style={styles.input}
      />
    </View>
  );
}

function PickerButton({
  value,
  onPress,
}: {
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.pickerButton}
      onPress={onPress}
    >
      <Text style={styles.inputText}>
        {value || 'Select'}
      </Text>

      <Text style={styles.chevron}>
        ▾
      </Text>
    </Pressable>
  );
}

function PlatformChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chip,
        selected &&
          styles.chipSelected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          selected &&
            styles.chipTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      THEME.background,
  },

  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    padding: SPACING['2xl'],
    paddingBottom:
      SPACING['3xl'],
  },

  headingRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
    marginBottom:
      SPACING.lg,
  },

  eyebrow: {
    color: THEME.primary,
    fontSize:
      FONT_SIZES.xs,
    fontWeight: '800',
    textTransform:
      'uppercase',
    letterSpacing: 1,
  },

  title: {
    color:
      THEME.text.primary,
    fontSize:
      FONT_SIZES['2xl'],
    fontWeight: '800',
    marginTop:
      SPACING.xs,
  },

  subtitle: {
    color:
      THEME.text.secondary,
    fontSize:
      FONT_SIZES.sm,
    marginTop:
      SPACING.xs,
  },

  formCard: {
    backgroundColor:
      THEME.surface,
    borderRadius:
      BORDER_RADIUS.lg,
    padding:
      SPACING['2xl'],
    borderWidth: 1,
    borderColor:
      THEME.border,
    ...THEME.shadow.small,
  },

  shareCard: {
    backgroundColor:
      THEME.surface,
    borderRadius:
      BORDER_RADIUS.lg,
    padding:
      SPACING['2xl'],
    marginTop:
      SPACING.lg,
    borderWidth: 1,
    borderColor:
      THEME.border,
    ...THEME.shadow.small,
  },

  sectionTitle: {
    color:
      THEME.text.primary,
    fontSize:
      FONT_SIZES.lg,
    fontWeight: '800',
    marginBottom:
      SPACING.md,
  },

  label: {
    color:
      THEME.text.primary,
    fontSize:
      FONT_SIZES.sm,
    fontWeight: '700',
    marginBottom:
      SPACING.sm,
  },

  field: {
    flex: 1,
    marginBottom:
      SPACING.lg,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  input: {
    borderWidth: 1,
    borderColor:
      THEME.border,
    borderRadius:
      BORDER_RADIUS.md,
    color:
      THEME.text.primary,
    padding:
      SPACING.md,
    backgroundColor:
      '#FCFCFD',
    fontSize:
      FONT_SIZES.sm,
  },

  inputText: {
    color:
      THEME.text.primary,
    fontSize:
      FONT_SIZES.sm,
  },

  pickerButton: {
    borderWidth: 1,
    borderColor:
      THEME.border,
    borderRadius:
      BORDER_RADIUS.md,
    padding:
      SPACING.md,
    backgroundColor:
      '#FCFCFD',
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    marginBottom:
      SPACING.lg,
  },

  chevron: {
    color:
      THEME.primary,
    fontSize: 18,
  },

  primaryButton: {
    backgroundColor:
      THEME.primary,
    borderRadius:
      BORDER_RADIUS.md,
    paddingVertical:
      SPACING.md,
    paddingHorizontal:
      SPACING.lg,
    alignItems:
      'center',
    justifyContent:
      'center',
    minHeight: 48,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize:
      FONT_SIZES.base,
    fontWeight: '800',
  },

  formError: {
    color: THEME.status.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
  },

  linkText: {
    flex: 1,
    color:
      THEME.text.secondary,
    fontSize:
      FONT_SIZES.sm,
    marginLeft:
      SPACING.sm,
  },

  linkBox: {
    flexDirection:
      'row',
    alignItems:
      'center',
    borderWidth: 1,
    borderColor:
      THEME.border,
    borderRadius:
      BORDER_RADIUS.md,
    padding:
      SPACING.md,
    backgroundColor:
      '#FCFCFD',
    marginBottom:
      SPACING.md,
  },

  actionRow: {
    flexDirection:
      'row',
    gap: SPACING.sm,
    marginBottom:
      SPACING.md,
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor:
      THEME.primary,
    borderRadius:
      BORDER_RADIUS.md,
    paddingVertical:
      SPACING.sm,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  secondaryButtonText: {
    color:
      THEME.primary,
    fontSize:
      FONT_SIZES.sm,
    fontWeight: '800',
  },

  productImage: {
    width: '100%',
    height: 180,
    borderRadius:
      BORDER_RADIUS.md,
    marginBottom:
      SPACING.md,
    backgroundColor:
      '#F3F4F6',
  },

  imagePickerRow: {
    flexDirection:
      'row',
    gap: SPACING.sm,
    marginBottom:
      SPACING.lg,
  },

  imagePickerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor:
      THEME.primary,
    borderRadius:
      BORDER_RADIUS.md,
    padding:
      SPACING.md,
    alignItems:
      'center',
  },

  imagePickerText: {
    color:
      THEME.primary,
    fontWeight: '800',
    fontSize:
      FONT_SIZES.xs,
  },

  imagePreviewWrap: {
    marginBottom:
      SPACING.lg,
  },

  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius:
      BORDER_RADIUS.md,
    backgroundColor:
      '#F3F4F6',
  },

  imageActions: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    paddingTop:
      SPACING.sm,
  },

  deleteText: {
    color:
      THEME.status.error,
    fontWeight: '700',
    fontSize:
      FONT_SIZES.xs,
  },

  linkButton: {
    flexDirection:
      'row',
    alignItems:
      'center',
    gap: SPACING.sm,
    marginBottom:
      SPACING.md,
  },

  linkButtonText: {
    color:
      THEME.primary,
    fontWeight: '800',
  },

  groupLabel: {
    color:
      THEME.text.primary,
    fontWeight: '700',
    marginTop:
      SPACING.sm,
    marginBottom:
      SPACING.sm,
  },

  chipRow: {
    flexDirection:
      'row',
    flexWrap:
      'wrap',
    gap: SPACING.sm,
  },

  chip: {
    borderWidth: 1,
    borderColor:
      THEME.border,
    borderRadius:
      BORDER_RADIUS.md,
    paddingHorizontal:
      SPACING.md,
    paddingVertical:
      SPACING.sm,
  },

  chipSelected: {
    backgroundColor:
      THEME.primary,
    borderColor:
      THEME.primary,
  },

  chipText: {
    color:
      THEME.text.secondary,
    fontSize:
      FONT_SIZES.sm,
  },

  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  shareHeader: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
  },

  emptyText: {
    color:
      THEME.text.secondary,
    fontSize:
      FONT_SIZES.sm,
  },

  productRow: {
    flexDirection:
      'row',
    justifyContent:
      'space-between',
    paddingVertical:
      SPACING.md,
    borderTopWidth: 1,
    borderTopColor:
      THEME.border,
  },

  productSelect: {
    flex: 1,
    flexDirection:
      'row',
    justifyContent:
      'space-between',
  },

  wantButton: {
    backgroundColor:
      '#FCE7F3',
    borderRadius:
      BORDER_RADIUS.md,
    paddingHorizontal:
      SPACING.sm,
    paddingVertical:
      SPACING.xs,
    marginLeft:
      SPACING.sm,
    justifyContent:
      'center',
  },

  wantText: {
    color: '#BE185D',
    fontSize:
      FONT_SIZES.xs,
    fontWeight: '800',
  },

  productName: {
    color:
      THEME.text.primary,
    fontWeight: '700',
  },

  marketImage: {
    width: 64,
    height: 64,
    borderRadius:
      BORDER_RADIUS.sm,
    backgroundColor:
      '#F3F4F6',
    marginRight:
      SPACING.sm,
  },

  productDetails: {
    flex: 1,
  },

  selectText: {
    color:
      THEME.primary,
    fontWeight: '800',
  },

  modalBackdrop: {
    flex: 1,
    justifyContent:
      'flex-end',
    backgroundColor:
      'rgba(20,15,35,0.35)',
  },

  modalSheet: {
    backgroundColor:
      THEME.surface,
    borderTopLeftRadius:
      BORDER_RADIUS.xl,
    borderTopRightRadius:
      BORDER_RADIUS.xl,
    padding:
      SPACING['2xl'],
    maxHeight:
      '75%',
  },

  option: {
    paddingVertical:
      SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor:
      THEME.border,
  },

  optionText: {
    color:
      THEME.text.primary,
    fontSize:
      FONT_SIZES.base,
  },
});