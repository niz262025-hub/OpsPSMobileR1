import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';

type Product = {
  id: string;
  name?: string;
  brand?: string;
  sizeVariant?: string;
  sellingPrice?: number;
  quantity?: number;
  imageUrls?: string[];
  imageCount?: number;
  sourceType?: 'trip' | 'external';
  tripId?: string | null;
  readyStockEnabled?: boolean;
  postToGroupEnabled?: boolean;
  status?: string;
};

export default function Marketplace() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const productsQuery = query(
      collection(db, 'products'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const items: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setProducts(items);
        setLoading(false);
      },
      (error) => {
        console.error('Marketplace products error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const handleAddProduct = () => {
    router.push('/product/upload');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>
              OpsPS Marketplace
            </Text>
            <Text style={styles.title}>
              Marketplace
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addProductButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.addProductText}>
              + Add Product
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchText}>
            Search products...
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            All Products
          </Text>

          <Text style={styles.productCount}>
            {products.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#6C3FE8" />
            <Text style={styles.loadingText}>
              Loading products...
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                🛍
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              No marketplace products yet
            </Text>

            <Text style={styles.emptyText}>
              Products from Trips and products added directly
              from Marketplace will appear here.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleAddProduct}
            >
              <Text style={styles.emptyButtonText}>
                + Add Product
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {products.map((product) => {
              const image =
                product.imageUrls &&
                product.imageUrls.length > 0
                  ? product.imageUrls[0]
                  : null;

              const source =
                product.sourceType === 'external'
                  ? 'Outside Trip'
                  : 'Trip Product';

              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/product/detail',
                      params: {
                        productId: product.id,
                      },
                    })
                  }
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.noImage}>
                      <Text style={styles.noImageText}>
                        📦
                      </Text>
                    </View>
                  )}

                  <View style={styles.productInfo}>
                    <View style={styles.productTopRow}>
                      <View style={styles.sourceBadge}>
                        <Text style={styles.sourceBadgeText}>
                          {source}
                        </Text>
                      </View>

                      {product.postToGroupEnabled && (
                        <View style={styles.groupBadge}>
                          <Text style={styles.groupBadgeText}>
                            POST TO GROUP
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={styles.productName}
                      numberOfLines={2}
                    >
                      {product.name || 'Unnamed Product'}
                    </Text>

                    {!!product.brand && (
                      <Text style={styles.brand}>
                        {product.brand}
                      </Text>
                    )}

                    {!!product.sizeVariant && (
                      <Text style={styles.variant}>
                        {product.sizeVariant}
                      </Text>
                    )}

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>
                        RM{' '}
                        {Number(
                          product.sellingPrice || 0
                        ).toFixed(2)}
                      </Text>

                      <Text style={styles.quantity}>
                        Qty: {product.quantity || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.sourceCard}>
          <Text style={styles.sourceTitle}>
            Product Sources
          </Text>

          <Text style={styles.sourceText}>
            Trip products and products added directly from
            Marketplace can appear together here. Each
            product keeps its own images and source.
          </Text>
        </View>

        <View style={styles.storeCard}>
          <View>
            <Text style={styles.storeLabel}>
              Your Storefront
            </Text>

            <Text style={styles.storeName}>
              opsps.my/store/your-store
            </Text>
          </View>

          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareText}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5FB',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  subtitle: {
    fontSize: 13,
    color: '#817B89',
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#211A2D',
  },

  addProductButton: {
    backgroundColor: '#6C3FE8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
  },

  addProductText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  searchBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 24,
  },

  searchText: {
    fontSize: 14,
    color: '#9A95A1',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#211A2D',
  },

  productCount: {
    marginLeft: 8,
    backgroundColor: '#EEE9FF',
    color: '#6C3FE8',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: '800',
  },

  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },

  loadingText: {
    marginTop: 10,
    color: '#8A8492',
    fontSize: 13,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyIconText: {
    fontSize: 25,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#211A2D',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#8A8492',
    textAlign: 'center',
    marginBottom: 18,
  },

  emptyButton: {
    backgroundColor: '#6C3FE8',
    borderRadius: 13,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
  },

  productImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
  },

  noImage: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: '#F0EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noImageText: {
    fontSize: 28,
  },

  productInfo: {
    flex: 1,
    marginLeft: 13,
  },

  productTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },

  sourceBadge: {
    backgroundColor: '#F0EBFF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  sourceBadgeText: {
    color: '#6C3FE8',
    fontSize: 9,
    fontWeight: '800',
  },

  groupBadge: {
    backgroundColor: '#EAF7EF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  groupBadgeText: {
    color: '#287A45',
    fontSize: 8,
    fontWeight: '800',
  },

  productName: {
    color: '#211A2D',
    fontSize: 16,
    fontWeight: '800',
  },

  brand: {
    color: '#817B89',
    fontSize: 12,
    marginTop: 3,
  },

  variant: {
    color: '#817B89',
    fontSize: 11,
    marginTop: 2,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  price: {
    color: '#5B2BD9',
    fontSize: 15,
    fontWeight: '900',
  },

  quantity: {
    color: '#817B89',
    fontSize: 10,
  },

  sourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    marginBottom: 20,
  },

  sourceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#211A2D',
    marginBottom: 8,
  },

  sourceText: {
    color: '#8A8492',
    fontSize: 12,
    lineHeight: 18,
  },

  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  storeLabel: {
    fontSize: 12,
    color: '#817B89',
    marginBottom: 5,
  },

  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#211A2D',
  },

  shareButton: {
    backgroundColor: '#6C3FE8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },

  shareText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
