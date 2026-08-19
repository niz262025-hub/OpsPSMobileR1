import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, uploadProductImage } from '../firebase';
import { useAuth } from './context/AuthContext';

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

export default function UploadProduct() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const tripId =
    typeof params.tripId === 'string' ? params.tripId : '';

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [sizeVariant, setSizeVariant] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [imageUris, setImageUris] = useState<string[]>([]);

  const [readyStockEnabled, setReadyStockEnabled] = useState(true);
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    []
  );

  const pickProductImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('Please allow photo library access to select product images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selected = result.assets
        .slice(0, 10)
        .map((asset) => asset.uri);

      setImageUris(selected);
    }
  };;

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms([
      ...marketingPlatforms,
      ...directPlatforms,
    ]);
  };

  const clearPlatforms = () => {
    setSelectedPlatforms([]);
  };

  const handlePublish = async () => {
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

    if (!readyStockEnabled && !preOrderEnabled) {
      alert('Please select at least one Stock Type.');
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

      console.log('PUBLISH: validation passed');
      console.log('PUBLISH: tripId =', tripId);
      console.log(
        'PUBLISH: saving product with',
        uploadedImageUrls.length,
        'uploaded image(s)'
      );

      const productRef = await addDoc(
        collection(db, 'products'),
        {
          ownerId: user!.uid,
          tripId: tripId || null,

          source: tripId
            ? 'Trip'
            : 'Outside Trip',

          name: productName.trim(),
          brand: brand.trim(),
          sizeVariant: sizeVariant.trim(),

          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),

          quantity: Number(quantity),
          location: location.trim(),
          notes: notes.trim(),

          imageUrl: primaryImageUrl,
          imageUrls: uploadedImageUrls,
          imageCount: uploadedImageUrls.length,

          readyStockEnabled,
          preOrderEnabled,

          stockStatus:
            readyStockEnabled && preOrderEnabled
              ? 'ready_stock_and_pre_order'
              : readyStockEnabled
              ? 'ready_stock'
              : 'pre_order',

          platforms: selectedPlatforms,

          marketingPlatforms: selectedPlatforms.filter(
            (platform) =>
              marketingPlatforms.includes(platform)
          ),

          directPlatforms: selectedPlatforms.filter(
            (platform) =>
              directPlatforms.includes(platform)
          ),

          platformStatus:
            selectedPlatforms.length > 0
              ? 'ready_to_share'
              : 'not_selected',

          status: 'published',

          createdAt: serverTimestamp(),
        }
      );

      console.log('PUBLISH: Firestore product created:', productRef.id);

      alert(
        `Product Published!\\n\\n${productName}\\nRM ${sellingPrice}\\n\\nStock Type: ${
          readyStockEnabled && preOrderEnabled
            ? 'Ready Stock + Post to Group / Pre-Order'
            : readyStockEnabled
            ? 'Ready Stock'
            : 'Post to Group / Pre-Order'
        }`
      );

      setProductName('');
      setBrand('');
      setSizeVariant('');
      setCostPrice('');
      setSellingPrice('');
      setQuantity('1');
      setLocation('');
      setNotes('');
      setImageUris([]);
      setReadyStockEnabled(true);
      setPreOrderEnabled(false);
      setSelectedPlatforms([]);

      router.push('/marketplace');
    } catch (error) {
      console.error('Publish product error:', error);

      alert(
        'Failed to publish product: ' +
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
        <Text style={styles.eyebrow}>OpsPS</Text>

        <Text style={styles.title}>Upload Product</Text>

        <Text style={styles.subtitle}>
          Add a product from your shopping trip.
        </Text>

        {/* TRIP */}
        <View style={styles.tripCard}>
          <Text style={styles.tripLabel}>TRIP</Text>

          <Text style={styles.tripId}>
            {tripId || 'Outside Trip / Ready Stock'}
          </Text>

          <Text style={styles.tripText}>
            {tripId
              ? 'This product is linked to this shopping trip.'
              : 'This product is ready stock and is not linked to a shopping trip.'}
          </Text>
        </View>

        {/* IMAGE */}
        <View style={styles.card}>
          <View style={styles.imageHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Product Images
              </Text>

              <Text style={styles.imageLimit}>
                Add up to 10 images
              </Text>
            </View>

            <Text style={styles.imageCounter}>
              {imageUris.length}/10
            </Text>
          </View>

          <Pressable
            style={styles.imagePicker}
            onPress={pickProductImage}
          >
            <Text style={styles.imageIcon}>📷</Text>

            <Text style={styles.imagePickerTitle}>
              {imageUris.length > 0
                ? 'Add More Photos'
                : 'Add Product Photos'}
            </Text>

            <Text style={styles.imagePickerText}>
              Select 1–10 product images
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

          <Text style={styles.label}>Product Name *</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Coach Wallet"
            placeholderTextColor="#9CA3AF"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.label}>Brand</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Coach"
            placeholderTextColor="#9CA3AF"
            value={brand}
            onChangeText={setBrand}
          />

          <Text style={styles.label}>Size / Variant *</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Black / M / 42"
            placeholderTextColor="#9CA3AF"
            value={sizeVariant}
            onChangeText={setSizeVariant}
          />

          <Text style={styles.label}>Cost Price (RM) *</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 150"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={costPrice}
            onChangeText={setCostPrice}
          />

          <Text style={styles.label}>Selling Price (RM) *</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 220"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={sellingPrice}
            onChangeText={setSellingPrice}
          />

          <Text style={styles.label}>Quantity *</Text>

          <TextInput
            style={styles.input}
            placeholder="1"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.label}>
            Shopping Location
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. ION Orchard"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Notes</Text>

          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Color, condition, limited stock, etc."
            placeholderTextColor="#9CA3AF"
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* STOCK TYPE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Stock Type
          </Text>

          <Text style={styles.platformHint}>
            You can select one or both.
          </Text>

          <Pressable
            style={[
              styles.stockOption,
              readyStockEnabled && styles.stockOptionActive,
            ]}
            onPress={() =>
              setReadyStockEnabled(!readyStockEnabled)
            }
          >
            <View
              style={[
                styles.checkbox,
                readyStockEnabled && styles.checkboxActive,
              ]}
            >
              {readyStockEnabled && (
                <Text style={styles.checkboxText}>✓</Text>
              )}
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Ready Stock
              </Text>

              <Text style={styles.optionText}>
                PS has already bought the product.
              </Text>

              <Text style={styles.flowText}>
                Inventory → Customer Order → Pack → Ship → Delivered
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.stockOption,
              preOrderEnabled && styles.stockOptionActive,
            ]}
            onPress={() =>
              setPreOrderEnabled(!preOrderEnabled)
            }
          >
            <View
              style={[
                styles.checkbox,
                preOrderEnabled && styles.checkboxActive,
              ]}
            >
              {preOrderEnabled && (
                <Text style={styles.checkboxText}>✓</Text>
              )}
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Post to Group / Pre-Order
              </Text>

              <Text style={styles.optionText}>
                Customer can view and order before PS buys.
              </Text>

              <Text style={styles.flowText}>
                Customer Order → Buy List → PS Buy → Bought → Inventory
              </Text>
            </View>
          </Pressable>
        </View>

        {/* PLATFORM */}
        <View style={styles.card}>
          <View style={styles.platformHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Post / Share Product
              </Text>

              <Text style={styles.platformHint}>
                Choose where you want to market or share the product.
              </Text>
            </View>

            <Pressable onPress={selectAllPlatforms}>
              <Text style={styles.selectAll}>
                Select All
              </Text>
            </Pressable>
          </View>

          {/* MARKETING */}
          <Text style={styles.categoryTitle}>
            📣 Marketing
          </Text>

          <Text style={styles.categoryText}>
            Use for Story, Post, Reel or marketing content.
          </Text>

          <View style={styles.platformGrid}>
            {marketingPlatforms.map((item) => {
              const selected =
                selectedPlatforms.includes(item);

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.platformButton,
                    selected &&
                      styles.platformButtonActive,
                  ]}
                  onPress={() => togglePlatform(item)}
                >
                  <Text
                    style={[
                      styles.platformText,
                      selected &&
                        styles.platformTextActive,
                    ]}
                  >
                    {selected ? '✓ ' : ''}
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* DIRECT */}
          <Text style={styles.categoryTitle}>
            🔗 Direct Link Sharing
          </Text>

          <Text style={styles.categoryText}>
            Send the OpsPS product link directly to customers,
            groups or channels.
          </Text>

          <View style={styles.platformGrid}>
            {directPlatforms.map((item) => {
              const selected =
                selectedPlatforms.includes(item);

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.platformButton,
                    selected &&
                      styles.platformButtonActive,
                  ]}
                  onPress={() => togglePlatform(item)}
                >
                  <Text
                    style={[
                      styles.platformText,
                      selected &&
                        styles.platformTextActive,
                    ]}
                  >
                    {selected ? '✓ ' : ''}
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedPlatforms.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={clearPlatforms}
            >
              <Text style={styles.clearText}>
                Clear Selection
              </Text>
            </Pressable>
          )}
        </View>

        {/* PUBLISH */}
        <Pressable
          style={styles.primaryButton}
          onPress={handlePublish}
        >
          <Text style={styles.primaryText}>
            Publish Product
          </Text>
        </Pressable>

        <Text style={styles.footer}>
          Customer links will lead back to the OpsPS product
          page so orders can be tracked to the correct trip.
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

  tripCard: {
    backgroundColor: '#EEE9FF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  tripLabel: {
    color: '#6C3FE8',
    fontSize: 10,
    fontWeight: '900',
  },

  tripId: {
    color: '#181145',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },

  tripText: {
    color: '#6B6B8A',
    fontSize: 12,
    marginTop: 5,
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

  imagePicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CFC8E5',
    borderRadius: 18,
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F7FC',
  },

  imageIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  imagePickerTitle: {
    color: '#181145',
    fontSize: 15,
    fontWeight: '800',
  },

  imagePickerText: {
    color: '#6B6B8A',
    fontSize: 12,
    marginTop: 5,
  },

  productImage: {
    width: '100%',
    height: 260,
    borderRadius: 18,
  },

  changeImageText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 9,
  },

  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  imageLimit: {
    color: '#6B6B8A',
    fontSize: 11,
    marginTop: -5,
    marginBottom: 12,
  },

  imageCounter: {
    color: '#6C3FE8',
    fontSize: 13,
    fontWeight: '900',
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

  stockOption: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E1EF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  stockOptionActive: {
    borderColor: '#6C3FE8',
    backgroundColor: '#F7F3FF',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C9C4D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    marginTop: 2,
  },

  checkboxActive: {
    backgroundColor: '#6C3FE8',
    borderColor: '#6C3FE8',
  },

  checkboxText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  optionContent: {
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
    marginTop: 4,
  },

  flowText: {
    color: '#6C3FE8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
  },

  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  platformHint: {
    color: '#6B6B8A',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 420,
  },

  selectAll: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '800',
  },

  categoryTitle: {
    color: '#181145',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 15,
  },

  categoryText: {
    color: '#6B6B8A',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
    marginBottom: 10,
  },

  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
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

  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },

  clearText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '700',
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

  footer: {
    color: '#6B6B8A',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 12,
  },
});
