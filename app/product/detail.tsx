import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Share,
  Linking,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

type Product = {
  name?: string;
  brand?: string;
  sizeVariant?: string;

  costPrice?: number;
  sellingPrice?: number;
  price?: number;

  quantity?: number;
  stock?: number;

  location?: string;
  notes?: string;

  imageUrls?: string[];
  imageUrl?: string;

  imageCount?: number;

  sourceType?: string;
  tripId?: string | null;

  readyStockEnabled?: boolean;
  postToGroupEnabled?: boolean;

  status?: string;
};

export default function ProductDetail() {
  const { productId } = useLocalSearchParams<{
    productId: string;
  }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDoc(
          doc(db, 'products', productId)
        );

        if (snapshot.exists()) {
          setProduct(snapshot.data() as Product);
        }
      } catch (error) {
        console.error('Product detail error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const handleGenerateLink = () => {
    if (!productId) return;

    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://opsps.com';

    const primaryImage =
      product?.imageUrl || product?.imageUrls?.[0] || '';

    const link =
      `${baseUrl}/product/storefront?productId=${productId}` +
      (primaryImage
        ? `&imageUrl=${encodeURIComponent(primaryImage)}`
        : '');

    setGeneratedLink(link);
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(generatedLink);
        alert('Product link copied.');
      } else {
        alert(generatedLink);
      }
    } catch (error) {
      console.error('Copy link error:', error);
      alert(generatedLink);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#6C3FE8"
          />

          <Text style={styles.loadingText}>
            Loading product...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.errorTitle}>
            Product not found
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/marketplace')}
          >
            <Text style={styles.primaryText}>
              Back to Marketplace
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : [];

  const sellingPrice =
    product.sellingPrice ?? product.price ?? 0;

  const quantity =
    product.quantity ?? product.stock ?? 0;

  const productImage =
    product.imageUrl || product.imageUrls?.[0] || '';

  const source =
    product.sourceType === 'external'
      ? 'Outside Trip'
      : 'Trip Product';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/marketplace')}
        >
          <Text style={styles.backText}>
            ← Marketplace
          </Text>
        </Pressable>

        {/* PRODUCT IMAGES */}
        <View style={styles.imageCard}>
          {images.length > 0 ? (
            <>
              <Image
                source={{
                  uri: images[selectedImage],
                }}
                style={styles.mainImage}
              />

              {images.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                >
                  {images.map((uri, index) => (
                    <Pressable
                      key={`${uri}-${index}`}
                      onPress={() =>
                        setSelectedImage(index)
                      }
                      style={[
                        styles.thumbnailBox,
                        selectedImage === index &&
                          styles.thumbnailSelected,
                      ]}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.thumbnail}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>
                📦
              </Text>

              <Text style={styles.noImageLabel}>
                No product image
              </Text>
            </View>
          )}
        </View>

        {/* BADGES */}
        <View style={styles.badges}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>
              {source}
            </Text>
          </View>

          {product.postToGroupEnabled && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupText}>
                POST TO GROUP
              </Text>
            </View>
          )}

          {product.readyStockEnabled && (
            <View style={styles.readyBadge}>
              <Text style={styles.readyText}>
                READY STOCK
              </Text>
            </View>
          )}
        </View>

        {/* PRODUCT NAME + SELLING PRICE */}
        <View style={styles.card}>
          <Text style={styles.name}>
            {product.name || 'Unnamed Product'}
          </Text>

          {!!product.brand && (
            <Text style={styles.brand}>
              {product.brand}
            </Text>
          )}

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>
              Selling Price
            </Text>

            <Text style={styles.price}>
              RM {Number(sellingPrice).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* PRODUCT INFORMATION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Information
          </Text>

          <InfoRow
            label="Size / Variant"
            value={product.sizeVariant || '-'}
          />

          <InfoRow
            label="Quantity"
            value={String(quantity)}
          />

          <InfoRow
            label="Cost Price"
            value={
              product.costPrice !== undefined
                ? `RM ${Number(
                    product.costPrice
                  ).toFixed(2)}`
                : '-'
            }
          />

          <InfoRow
            label="Location"
            value={product.location || '-'}
          />

          <InfoRow
            label="Source"
            value={source}
          />

          {product.tripId && (
            <InfoRow
              label="Trip ID"
              value={product.tripId}
            />
          )}
        </View>

        {/* NOTES */}
        {!!product.notes && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Notes
            </Text>

            <Text style={styles.notes}>
              {product.notes}
            </Text>
          </View>
        )}

        {/* ONE LINK FUNCTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Link
          </Text>

          <Text style={styles.linkDescription}>
            Generate one product link to share with
            customers and across your selected platforms.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={handleGenerateLink}
          >
            <Text style={styles.primaryText}>
              Generate Product Link
            </Text>
          </Pressable>

          {!!generatedLink && (
            <View style={styles.generatedLinkBox}>
              <Text style={styles.generatedLabel}>
                Generated Product Link
              </Text>

              <Text
                style={styles.generatedLink}
                selectable
              >
                {generatedLink}
              </Text>

              <Pressable
                style={styles.copyButton}
                onPress={handleCopyLink}
              >
                <Text style={styles.copyText}>
                  Copy Link
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* SHARE / POST */}
        {!!generatedLink && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Share / Post Product
            </Text>

            <Text style={styles.shareDescription}>
              Use the generated product link for marketing
              or direct sharing.
            </Text>

            <Text style={styles.categoryTitle}>
              📣 Marketing
            </Text>

            <View style={styles.platformRow}>
              <PlatformButton
                label="Instagram"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
              <PlatformButton
                label="Facebook"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
              <PlatformButton
                label="TikTok"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
              <PlatformButton
                label="Threads"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
              <PlatformButton
                label="X"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
            </View>

            <Text style={styles.categoryTitle}>
              🔗 Direct Link
            </Text>

            <View style={styles.platformRow}>
              <PlatformButton
                label="WhatsApp"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
              <PlatformButton
                label="Telegram"
                link={generatedLink}
                imageUrl={productImage}
                productName={product.name || 'Product'}
                size={product.sizeVariant || 'N/A'}
                price={sellingPrice}
                quantity={quantity}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function PlatformButton({
  label,
  link,
  imageUrl,
  productName,
  size,
  price,
  quantity,
}: {
  label: string;
  link: string;
  imageUrl?: string;
  productName: string;
  size: string;
  price: number;
  quantity: number;
}) {
  const handleShare = async () => {
    if (!link) {
      alert('Please generate the Product Link first.');
      return;
    }

    const caption =
      `${productName}\nSize: ${size}\nPrice: RM ${Number(price).toFixed(2)}\nAvailable: ${quantity}\n\n${link}`;

    const sharePayload = {
      title: productName,
      message: caption,
      url: imageUrl || link,
    };

    try {
      if (label === 'WhatsApp') {
        const whatsappUrl =
          `whatsapp://send?text=${encodeURIComponent(caption)}`;

        const supported =
          await Linking.canOpenURL(whatsappUrl);

        if (supported) {
          await Linking.openURL(whatsappUrl);
        } else {
          alert(
            'WhatsApp app is not installed on this device.'
          );
        }

        return;
      }

      if (label === 'Telegram') {
        const telegramUrl =
          `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(caption)}`;

        const supported =
          await Linking.canOpenURL('tg://') ||
          await Linking.canOpenURL('https://t.me');

        if (supported) {
          await Linking.openURL(telegramUrl);
        } else {
          alert(
            'Telegram app is not installed on this device. Share the generated link and caption manually instead.'
          );
        }

        return;
      }

      await Share.share(sharePayload);
    } catch (error) {
      console.error(`${label} share error:`, error);

      alert(
        `Unable to open ${label}. Please try again.`
      );
    }
  };

  return (
    <Pressable
      style={styles.platformButton}
      onPress={handleShare}
    >
      <Text style={styles.platformText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  content: {
    padding: 20,
    paddingBottom: 50,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    color: '#817B89',
    marginTop: 12,
  },

  errorTitle: {
    color: '#211A2D',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },

  backButton: {
    marginBottom: 14,
  },

  backText: {
    color: '#6C3FE8',
    fontSize: 14,
    fontWeight: '800',
  },

  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
  },

  mainImage: {
    width: '100%',
    height: 330,
    borderRadius: 16,
  },

  thumbnailRow: {
    gap: 8,
    paddingTop: 10,
  },

  thumbnailBox: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  thumbnailSelected: {
    borderColor: '#6C3FE8',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  noImage: {
    height: 330,
    borderRadius: 16,
    backgroundColor: '#F0EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImageText: {
    fontSize: 50,
    marginBottom: 10,
  },

  noImageLabel: {
    color: '#817B89',
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },

  sourceBadge: {
    backgroundColor: '#EEE9FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  sourceText: {
    color: '#6C3FE8',
    fontSize: 10,
    fontWeight: '800',
  },

  groupBadge: {
    backgroundColor: '#EAF7EF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  groupText: {
    color: '#287A45',
    fontSize: 10,
    fontWeight: '800',
  },

  readyBadge: {
    backgroundColor: '#FFF3DD',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  readyText: {
    color: '#9A6400',
    fontSize: 10,
    fontWeight: '800',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },

  name: {
    color: '#211A2D',
    fontSize: 25,
    fontWeight: '900',
  },

  brand: {
    color: '#817B89',
    fontSize: 14,
    marginTop: 4,
  },

  priceSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EDF5',
  },

  priceLabel: {
    color: '#817B89',
    fontSize: 12,
    marginBottom: 4,
  },

  price: {
    color: '#5B2BD9',
    fontSize: 24,
    fontWeight: '900',
  },

  sectionTitle: {
    color: '#211A2D',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },

  infoLabel: {
    color: '#817B89',
    fontSize: 13,
  },

  infoValue: {
    color: '#211A2D',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },

  notes: {
    color: '#5F5968',
    fontSize: 13,
    lineHeight: 21,
  },

  linkDescription: {
    color: '#817B89',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },

  generatedLinkBox: {
    backgroundColor: '#F6F3FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  generatedLabel: {
    color: '#817B89',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },

  generatedLink: {
    color: '#5B2BD9',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  copyButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6C3FE8',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },

  copyText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '800',
  },

  primaryButton: {
    backgroundColor: '#6C3FE8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  shareDescription: {
    color: '#817B89',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  categoryTitle: {
    color: '#211A2D',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },

  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  platformButton: {
    backgroundColor: '#F0EBFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  platformText: {
    color: '#6C3FE8',
    fontSize: 12,
    fontWeight: '800',
  },
});
