import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

const env = process.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig).filter(([, value]) => !value);

if (missingConfig.length > 0) {
  const keys = missingConfig.map(([key]) => key).join(', ');
  throw new Error(
    `Missing Firebase configuration. Set the following Expo environment variables before starting the app: ${keys}`
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function uploadProductImage(
  uri: string,
  ownerId: string,
  productName: string,
  index = 0
): Promise<string> {
  if (!uri) {
    throw new Error('No product image selected.');
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  try {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error(
        `Image download failed with status ${response.status}.`
      );
    }

    const blob = await response.blob();

    const safeName = (productName || 'product')
      .trim()
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .toLowerCase();

    const imageRef = ref(
      storage,
      `products/${ownerId || 'anonymous'}/${safeName || 'product'}-${Date.now()}-${index}.jpg`
    );

    await uploadBytes(imageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });

    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Product image upload error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Unable to upload product image to Firebase Storage.'
    );
  }
}

export default app;
