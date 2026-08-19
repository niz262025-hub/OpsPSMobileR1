import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';

export type UserProfile = {
  uid: string;
  fullName: string;
  phone: string;
  email: string;
  businessName: string;
  role?: 'user' | 'admin';
  accountStatus?: 'active' | 'trial' | 'inactive' | 'suspended' | 'cancelled';
  subscriptionStatus?: 'trial' | 'active' | 'inactive' | 'expired' | 'cancelled';
  plan?: 'FREE' | 'PREMIUM' | 'Founder' | 'Standard';
  subscriptionPlan?: 'FREE' | 'PREMIUM' | 'Founder' | 'Standard';
  freeTripsTotal?: number;
  freeTripAllowance?: number;
  freeTripsUsed?: number;
  trialTripsUsed?: number;
  openingBankBalance?: number;
  openingCashBalance?: number;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  registerUser: (args: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    password: string;
  }) => Promise<User>;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  canCreateTrip: () => Promise<{ allowed: boolean; used: number; remaining: number; max: number; }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function isAdminProfile(profile: UserProfile | null | undefined) {
  return profile?.role === 'admin';
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function canCreateTripForUser(uid: string) {
  const profile = await getUserProfile(uid);

  if (!profile) {
    return { allowed: false, used: 0, remaining: 0, max: 2 };
  }

  const effectivePlan = profile.plan || profile.subscriptionPlan || 'FREE';
  const maxTrips = profile.freeTripsTotal ?? profile.freeTripAllowance ?? 2;

  if (effectivePlan === 'PREMIUM') {
    return { allowed: true, used: 0, remaining: Number.POSITIVE_INFINITY, max: Number.POSITIVE_INFINITY };
  }

  const tripsSnapshot = await getDocs(collection(db, 'trips'));

  const used = tripsSnapshot.docs.filter((docSnap) => {
    const data = docSnap.data();
    return data.ownerId === uid && data.status !== 'closed';
  }).length;

  return {
    allowed: used < maxTrips,
    used,
    remaining: Math.max(maxTrips - used, 0),
    max: maxTrips,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user?.uid) {
      setProfile(null);
      return;
    }

    const nextProfile = await getUserProfile(user.uid);
    setProfile(nextProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const nextProfile = await getUserProfile(firebaseUser.uid);
        setProfile(nextProfile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const registerUser = async ({
    fullName,
    email,
    phone,
    businessName,
    password,
  }: {
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    password: string;
  }) => {
    const cleanedPhone = phone.trim();
    const cleanedFullName = fullName.trim();
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedBusiness = businessName.trim() || 'OpsPS UAT Test';

    if (!cleanedPhone || !cleanedFullName || !cleanedEmail || !password) {
      throw new Error('Please complete all required fields.');
    }

    const firebaseUser = await createUserWithEmailAndPassword(
      auth,
      cleanedEmail,
      password
    );

    const profileDoc: UserProfile = {
      uid: firebaseUser.user.uid,
      fullName: cleanedFullName,
      phone: cleanedPhone,
      email: cleanedEmail,
      businessName: cleanedBusiness,
      role: 'user',
      accountStatus: 'trial',
      subscriptionStatus: 'trial',
      plan: 'FREE',
      subscriptionPlan: 'FREE',
      freeTripsTotal: 2,
      freeTripAllowance: 2,
      freeTripsUsed: 0,
      trialTripsUsed: 0,
      openingBankBalance: 0,
      openingCashBalance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', firebaseUser.user.uid), profileDoc, { merge: true });
    setProfile(profileDoc);

    return firebaseUser.user;
  };

  const loginUser = async (email: string, password: string) => {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail || !password) {
      throw new Error('Please enter your email and password.');
    }

    await signInWithEmailAndPassword(auth, cleanedEmail, password);
  };

  const logoutUser = async () => {
    await signOut(auth);
  };

  const canCreateTrip = async () => {
    if (!user?.uid) {
      return { allowed: false, used: 0, remaining: 0, max: 2 };
    }

    return canCreateTripForUser(user.uid);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isAdmin: isAdminProfile(profile),
      loading,
      registerUser,
      loginUser,
      logoutUser,
      refreshProfile,
      canCreateTrip,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

export async function updateUserTripUsage(uid: string, increment: number) {
  const profile = await getUserProfile(uid);

  if (!profile) {
    return;
  }

  const effectivePlan = profile.plan || profile.subscriptionPlan || 'FREE';

  if (effectivePlan === 'PREMIUM') {
    return;
  }

  const tripsSnapshot = await getDocs(collection(db, 'trips'));

  const actualUsage = tripsSnapshot.docs.filter((docSnap) => {
    const data = docSnap.data();
    return data.ownerId === uid && data.status !== 'closed';
  }).length;
  const nextUsed = Math.max(actualUsage + increment, 0);

  await updateDoc(doc(db, 'users', uid), {
    freeTripsUsed: nextUsed,
    trialTripsUsed: nextUsed,
    freeTripAllowance: profile.freeTripAllowance ?? profile.freeTripsTotal ?? 2,
    updatedAt: serverTimestamp(),
  });
}
