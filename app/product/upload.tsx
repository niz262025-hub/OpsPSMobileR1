import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, uploadProductImage } from '../../firebase';
import { useAuth } from '../context/AuthContext';

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

export default function AddProduct() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [sizeVariant, setSizeVariant] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const pickImages = async () => {
    if (imageUris.length >= 10) {
      alert('Maximum 10 images allowed.');
      return;
    }

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('Please allow photo library access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - imageUris.length,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets
        .map((asset) => asset.uri)
        .slice(0, 10 - imageUris.length);

      setImageUris((current) => [...current, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };

  const handleAddProduct = async () => {
    if (!productName.trim()) {
      alert('Please enter product name.');
      return;
    }

    if (!sizeVariant.trim()) {
      alert('Please enter size / variant.');
      return;
    }

    if (!costPrice.trim() || !sellingPrice.trim()) {
      alert('Please enter cost price and selling price.');
      return;
    }

    if (!quantity.trim() || Number(quantity) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (imageUris.length === 0) {
      alert('Please add at least one product image.');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to post/share.');
      return;
    }

    try {
      const uploadedImageUrls = await Promise.all(
        imageUris.map((uri, index) =>
          uploadProductImage(
            uri,
            user?.uid || 'anonymous',
            productName.trim(),
            index
          )
        )
      );

      const primaryImageUrl = uploadedImageUrls[0] || '';

      const productRef = await addDoc(
        collection(db, 'products'),
        {
          ownerId: user?.uid || '',
          sourceType: tripId ? 'trip' : 'external',
          tripId: tripId || null,
          tripName: tripId ? 'Trip Product' : null,

          name: productName.trim(),
          brand: brand.trim(),
          sizeVariant: sizeVariant.trim(),

          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          quantity: Number(quantity),
          availability: Number(quantity) > 0 ? 'in_stock' : 'out_of_stock',
          marketplaceStatus: 'published',

          location: location.trim(),
          notes: notes.trim(),

          imageUrl: primaryImageUrl,
          imageUrls: uploadedImageUrls,
          imageCount: uploadedImageUrls.length,

          readyStockEnabled: Boolean(tripId ? false : true),
          postToGroupEnabled: true,

          marketingPlatforms: selectedPlatforms.filter((platform) =>
            marketingPlatforms.includes(platform)
          ),

          directPlatforms: selectedPlatforms.filter((platform) =>
            directPlatforms.includes(platform)
          ),

          platforms: selectedPlatforms,

          status: 'published',
          platformStatus: 'ready_to_share',
          shoppingModes: tripId ? ['share_buy_on_demand'] : ['customer_request'],

          createdAt: serverTimestamp(),
        }
      );

      const productLink =
        `/product/storefront?productId=${productRef.id}`;

      alert(
        `Product Added Successfully!\n\n` +
        `${productName}\n` +
        `RM ${sellingPrice}\n\n` +
        `Product Link:\n${productLink}`
      );

      if (tripId) {
        router.replace({ pathname: '/trip-detail', params: { tripId } });
      } else {
        router.replace('/(tabs)/marketplace');
      }
    } catch (error) {
      console.error('Add external product error:', error);

      alert(
        'Failed to add product: ' +
          (error instanceof Error
            ? error.message
            : String(error))
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>OpsPS Marketplace</Text>

        <Text style={styles.title}>Add Product</Text>

        <Text style={styles.subtitle}>
          Add a product purchased or sourced outside a shopping trip.
        </Text>

        {/* IMAGES */}
        <View style={styles.card}>
          <View style={styles.imageHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Product Images
              </Text>

              <Text style={styles.helper}>
                Add up to 10 images
              </Text>
            </View>

            <Text style={styles.counter}>
              {imageUris.length}/10
            </Text>
          </View>

          <Pressable
            style={styles.imagePicker}
            onPress={pickImages}
          >
            <Text style={styles.imageIcon}>📷</Text>

            <Text style={styles.imagePickerTitle}>
              Add Product Photos
            </Text>

            <Text style={styles.helper}>
              Select 1–10 images
            </Text>
          </Pressable>

          {imageUris.length > 0 && (
            <View style={styles.imageGrid}>
              {imageUris.map((uri, index) => (
                <View
                  key={`${uri}-${index}`}
                  style={styles.imageItem}
                >
                  <Image
                    source={{ uri }}
                    style={styles.thumbnail}
                  />

                  <View style={styles.imageNumber}>
                    <Text style={styles.imageNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* PRODUCT INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Information
          </Text>

          <Text style={styles.label}>
            Product Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Coach Wallet"
            placeholderTextColor="#9CA3AF"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.label}>
            Brand
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Coach"
            placeholderTextColor="#9CA3AF"
            value={brand}
            onChangeText={setBrand}
          />

          <Text style={styles.label}>
            Size / Variant *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Black / M / 42"
            placeholderTextColor="#9CA3AF"
            value={sizeVariant}
            onChangeText={setSizeVariant}
          />

          <Text style={styles.label}>
            Cost Price (RM) *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="150"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={costPrice}
            onChangeText={setCostPrice}
          />

          <Text style={styles.label}>
            Selling Price (RM) *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="220"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={sellingPrice}
            onChangeText={setSellingPrice}
          />

          <Text style={styles.label}>
            Quantity *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>
            Location
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Mid Valley Megamall"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>
            Notes
          </Text>

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Color, condition, details..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* POST TO GROUP */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Post to Group
          </Text>

          <View style={styles.lockedBox}>
            <Text style={styles.check}>✓</Text>

            <View style={styles.lockedContent}>
              <Text style={styles.optionTitle}>
                Post to Group
              </Text>

              <Text style={styles.optionText}>
                This product is available for customer viewing
                and ordering through the shared product link.
              </Text>
            </View>
          </View>
        </View>

        {/* PLATFORMS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Share Product
          </Text>

          <Text style={styles.categoryTitle}>
            📣 Marketing
          </Text>

          <Text style={styles.helper}>
            Story, Post, Reel or marketing content.
          </Text>

          <View style={styles.platformGrid}>
            {marketingPlatforms.map((platform) => {
              const selected =
                selectedPlatforms.includes(platform);

              return (
                <Pressable
                  key={platform}
                  style={[
                    styles.platformButton,
                    selected &&
                      styles.platformButtonActive,
                  ]}
                  onPress={() => togglePlatform(platform)}
                >
                  <Text
                    style={[
                      styles.platformText,
                      selected &&
                        styles.platformTextActive,
                    ]}
                  >
                    {selected ? '✓ ' : ''}
                    {platform}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.categoryTitle}>
            🔗 Direct Link Sharing
          </Text>

          <Text style={styles.helper}>
            Send the OpsPS product link directly.
          </Text>

          <View style={styles.platformGrid}>
            {directPlatforms.map((platform) => {
              const selected =
                selectedPlatforms.includes(platform);

              return (
                <Pressable
                  key={platform}
                  style={[
                    styles.platformButton,
                    selected &&
                      styles.platformButtonActive,
                  ]}
                  onPress={() => togglePlatform(platform)}
                >
                  <Text
                    style={[
                      styles.platformText,
                      selected &&
                        styles.platformTextActive,
                    ]}
                  >
                    {selected ? '✓ ' : ''}
                    {platform}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BUTTON */}
        <Pressable
          style={styles.primaryButton}
          onPress={handleAddProduct}
        >
          <Text style={styles.primaryText}>
            Add Product & Generate Link
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          This product is created outside a Trip and will appear
          together with Trip products in Marketplace.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F4FB',
  },

  content: {
    padding: 24,
    paddingBottom: 60,
  },

  eyebrow: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#181145',
  },

  subtitle: {
    color: '#6B6B8A',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 21,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    color: '#181145',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },

  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  helper: {
    color: '#6B6B8A',
    fontSize: 11,
    lineHeight: 17,
  },

  counter: {
    color: '#6C3FE8',
    fontSize: 13,
    fontWeight: '900',
  },

  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CFC8E5',
    borderRadius: 18,
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7FC',
    marginTop: 8,
  },

  imageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  imagePickerTitle: {
    color: '#181145',
    fontSize: 15,
    fontWeight: '800',
  },

  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  imageItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  imageNumber: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C3FE8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#211A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
  },

  label: {
    color: '#181145',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#181145',
    fontSize: 14,
  },

  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  lockedBox: {
    flexDirection: 'row',
    backgroundColor: '#F7F3FF',
    borderWidth: 1,
    borderColor: '#DDD2FF',
    borderRadius: 16,
    padding: 16,
  },

  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C3FE8',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '900',
    marginRight: 12,
  },

  lockedContent: {
    flex: 1,
  },

  optionTitle: {
    color: '#181145',
    fontSize: 14,
    fontWeight: '800',
  },

  optionText: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  categoryTitle: {
    color: '#181145',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 3,
  },

  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 10,
  },

  platformButton: {
    borderWidth: 1,
    borderColor: '#E5E1EF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  platformButtonActive: {
    backgroundColor: '#6C3FE8',
    borderColor: '#6C3FE8',
  },

  platformText: {
    color: '#6B6B8A',
    fontWeight: '700',
    fontSize: 12,
  },

  platformTextActive: {
    color: '#FFFFFF',
  },

  primaryButton: {
    backgroundColor: '#5B2BD9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },

  cancelButton: {
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  cancelText: {
    color: '#5B2BD9',
    fontWeight: '800',
    fontSize: 16,
  },

  footer: {
    color: '#6B6B8A',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
  },
});
