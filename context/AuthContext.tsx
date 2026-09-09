import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearActiveBusinessScope,
  setActiveBusinessScope,
} from '../services/mockDatabase';
import {
  canSellerUseBusinessPrivileges,
  normalizeSellerVerificationStatus,
  type SellerVerificationStatus,
} from '../services/adminFoundation';
import { getSupabaseClient } from '../services/supabaseClient';

export type UserRole = 'founder' | 'customer' | 'admin' | 'support';

export type AuthAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
  businessId?: string;
  sellerVerificationStatus?: SellerVerificationStatus;
};

export type SupabaseSignupErrorCategory = 'duplicate' | 'rate_limit' | 'auth_error';

export type AuthRegistrationResult = {
  ok: boolean;
  kind?: SupabaseSignupErrorCategory;
  message: string;
  statusCode?: number;
};

type AuthContextValue = {
  accounts: AuthAccount[];
  ready: boolean;
  register: (account: AuthAccount) => Promise<AuthRegistrationResult>;
  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  currentUser: AuthAccount | null;
};

const ACCOUNTS_KEY = '@opsps_accounts';
const SESSION_KEY = '@opsps_session';
const ACTIVE_BUSINESS_KEY = '@opsps_active_business_id';

function isProductionRuntime(): boolean {
  if (typeof __DEV__ === 'boolean') {
    return !__DEV__;
  }

  return process.env.NODE_ENV === 'production';
}

export function sanitizePersistedAccount(account: Partial<AuthAccount> | null | undefined) {
  if (!account) {
    return null;
  }

  const sanitized = { ...account };
  delete sanitized.password;
  return sanitized;
}

function syncBrowserAuthState(user: AuthAccount | null) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    if (!user) {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
      return;
    }

    window.localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(sanitizePersistedAccount(user))
    );
    if (user.role === 'founder' && user.businessId) {
      window.localStorage.setItem(ACTIVE_BUSINESS_KEY, user.businessId);
      return;
    }

    window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
  } catch {
    // Ignore browser storage write failures in restricted contexts.
  }
}

function syncBrowserAccounts(accounts: AuthAccount[]) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(accounts.map((account) => sanitizePersistedAccount(account)))
    );
  } catch {
    // Ignore browser storage write failures in restricted contexts.
  }
}

export function classifySupabaseSignupError(
  error: {
    status?: number | string;
    code?: string | number;
    error_code?: string;
    message?: string;
    msg?: string;
  } | null | undefined
): AuthRegistrationResult {
  const statusValue = error?.status ?? error?.code ?? 0;
  const status = Number(statusValue) || 0;
  const errorCode = String(error?.error_code ?? error?.code ?? '').toLowerCase();
  const messageText = String(error?.message ?? error?.msg ?? '').toLowerCase();

  if (
    status === 429 ||
    errorCode.includes('over_email_send_rate_limit') ||
    messageText.includes('rate limit exceeded') ||
    messageText.includes('email rate limit')
  ) {
    return {
      ok: false,
      kind: 'rate_limit',
      message: 'Registration temporarily unavailable because email sending is temporarily rate-limited. Please try again later.',
      statusCode: status || 429,
    };
  }

  const duplicateSignals = [
    'already registered',
    'already exists',
    'user already exists',
    'email already in use',
    'duplicate',
    'user_already_exists',
    'email_exists',
  ];

  if (
    duplicateSignals.some((signal) => messageText.includes(signal) || errorCode.includes(signal)) ||
    (status === 400 && messageText.includes('already'))
  ) {
    return {
      ok: false,
      kind: 'duplicate',
      message: 'An account with this email already exists.',
      statusCode: status || 400,
    };
  }

  return {
    ok: false,
    kind: 'auth_error',
    message: 'Registration failed. Please check your details and try again in a moment.',
    statusCode: status || 0,
  };
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

/**
 * Creates a stable business scope ID.
 *
 * IMPORTANT:
 * Do not use Math.random() here.
 * The same account must always resolve to the same businessId.
 */
function createBusinessScopeId(
  account: Pick<AuthAccount, 'email' | 'role' | 'name'>
): string {
  const seeded = `${account.role}:${
    account.email || account.name || 'business'
  }`
    .trim()
    .toLowerCase();

  const slug =
    seeded
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'business';

  return `business-${slug}`;
}

/**
 * Normalizes an account loaded from storage or received during registration.
 *
 * Existing accounts without a businessId are migrated to a stable ID.
 */
function normalizeAccount(
  account: Partial<AuthAccount>
): AuthAccount {
  const email = String(account.email ?? '').trim();

  const role: UserRole =
    account.role === 'customer'
      ? 'customer'
      : account.role === 'admin'
        ? 'admin'
        : account.role === 'support'
          ? 'support'
          : 'founder';

  const name = String(account.name ?? '');

  const businessId =
    account.businessId ||
    createBusinessScopeId({
      email,
      role,
      name,
    });

  return {
    email,
    password: String(account.password ?? ''),
    role,
    name,
    businessName: account.businessName ?? '',
    phone: account.phone ?? '',
    address: account.address ?? '',
    businessId,
    sellerVerificationStatus: normalizeSellerVerificationStatus(account.sellerVerificationStatus ?? 'PENDING'),
  };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);

  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(null);

  const [ready, setReady] = useState(false);

  const applyBusinessScopeForUser = (user: AuthAccount | null) => {
    if (user?.role === 'founder' && user.businessId) {
      const sellerApproved = canSellerUseBusinessPrivileges(user.role, user.sellerVerificationStatus ?? 'PENDING');
      if (!sellerApproved) {
        clearActiveBusinessScope();
        syncBrowserAuthState(null);
        return;
      }

      setActiveBusinessScope(user.businessId);
      syncBrowserAuthState(user);
      return;
    }

    clearActiveBusinessScope();
    syncBrowserAuthState(null);
  };

  const applySupabaseSession = async () => {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }

    const { data, error } = await client.auth.getSession();
    if (error || !data.session) {
      return null;
    }

    const user = data.session.user;
    const { data: profileData } = await client
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const { data: membershipData } = await client
      .from('business_memberships')
      .select('business_id, role')
      .eq('user_id', user.id)
      .limit(1);

    const businessId = membershipData?.[0]?.business_id ?? undefined;
    const normalizedRole = (profileData?.role as UserRole) || (membershipData?.[0]?.role as UserRole) || 'customer';
    const normalizedUser: AuthAccount = {
      email: user.email ?? '',
      password: '',
      role: normalizedRole,
      name: profileData?.full_name ?? user.user_metadata?.full_name ?? user.email ?? 'User',
      businessId,
      businessName: profileData?.business_id ? 'Supabase Business' : '',
      phone: profileData?.phone ?? '',
      address: profileData?.address ?? '',
      sellerVerificationStatus: normalizeSellerVerificationStatus(profileData?.seller_verification_status ?? 'PENDING'),
    };

    setCurrentUser(normalizedUser);
    applyBusinessScopeForUser(normalizedUser);
    syncBrowserAuthState(normalizedUser);
    return normalizedUser;
  };

  /**
   * Restore accounts and existing session.
   */
  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          const supabaseSession = await applySupabaseSession();
          if (supabaseSession && active) {
            setReady(true);
            return;
          }
        }

        if (isProductionRuntime()) {
          clearActiveBusinessScope();
          syncBrowserAuthState(null);
          setAccounts([]);
          setCurrentUser(null);
          setReady(true);
          return;
        }

        const [
          storedAccounts,
          storedSession,
        ] = await Promise.all([
          AsyncStorage.getItem(ACCOUNTS_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);

        const parsedAccounts = storedAccounts
          ? (JSON.parse(
              storedAccounts
            ) as Partial<AuthAccount>[])
          : [];

        /**
         * Normalize/migrate all existing accounts.
         *
         * This is important because older accounts may not
         * have businessId yet.
         */
        const normalizedAccounts =
          parsedAccounts.map(normalizeAccount);

        if (!active) {
          return;
        }

        setAccounts(normalizedAccounts);

        /**
         * Persist migrated accounts so the generated
         * businessId does not change on the next launch.
         */
        if (
          JSON.stringify(normalizedAccounts) !==
          JSON.stringify(parsedAccounts)
        ) {
          await AsyncStorage.setItem(
            ACCOUNTS_KEY,
            JSON.stringify(normalizedAccounts.map((account) => sanitizePersistedAccount(account)))
          );
        }

        syncBrowserAccounts(normalizedAccounts);

        const savedSession = storedSession
          ? (JSON.parse(
              storedSession
            ) as Partial<AuthAccount>)
          : null;

        const normalizedSession = savedSession
          ? normalizeAccount(savedSession)
          : null;

        if (!active) {
          return;
        }

        if (normalizedSession) {
          setCurrentUser(normalizedSession);
          applyBusinessScopeForUser(normalizedSession);
          syncBrowserAuthState(normalizedSession);

          /**
           * Persist the normalized session too, especially
           * for older sessions that did not contain businessId.
           */
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify(sanitizePersistedAccount(normalizedSession))
          );
        } else {
          clearActiveBusinessScope();
          syncBrowserAuthState(null);
        }
      } catch (error) {
        console.warn(
          'Unable to restore authentication state:',
          error
        );

        clearActiveBusinessScope();
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    void restoreAuth();

    return () => {
      active = false;
    };
  }, []);

  /**
   * Register a new account.
   *
   * Every new Founder receives a unique and stable business scope.
   */
  const register = async (
    account: AuthAccount
  ): Promise<AuthRegistrationResult> => {
    const client = getSupabaseClient();
    if (!client && isProductionRuntime()) {
      return {
        ok: false,
        kind: 'auth_error',
        message: 'Registration is temporarily unavailable. Please try again later.',
      };
    }

    if (client) {
      const { data, error } = await client.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            full_name: account.name,
            role: account.role,
          },
        },
      });

      if (error || !data.user) {
        return classifySupabaseSignupError(error ?? { status: 0, message: 'Unable to create account.' });
      }

      const { error: profileError } = await client.from('profiles').upsert({
        auth_user_id: data.user.id,
        full_name: account.name,
        email: account.email,
        phone: account.phone ?? '',
        address: account.address ?? '',
        role: account.role,
        business_id: account.businessId ?? null,
      }, { onConflict: 'auth_user_id' });

      if (profileError) {
        return classifySupabaseSignupError(profileError ?? { status: 0, message: 'Unable to create profile.' });
      }

      const normalizedAccount = normalizeAccount({
        ...account,
        sellerVerificationStatus: 'PENDING',
      });
      setCurrentUser(normalizedAccount);
      applyBusinessScopeForUser(normalizedAccount);
      syncBrowserAuthState(normalizedAccount);
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(sanitizePersistedAccount(normalizedAccount))
      );
      return { ok: true, message: 'Registration successful.' };
    }

    const normalizedAccount =
      normalizeAccount({
        ...account,
        sellerVerificationStatus: account.role === 'founder' ? 'PENDING' : undefined,
      });

    const emailExists = accounts.some(
      (entry) =>
        entry.email.toLowerCase() ===
          normalizedAccount.email.toLowerCase() &&
        entry.role === normalizedAccount.role
    );

    if (emailExists) {
      return {
        ok: false,
        kind: 'duplicate',
        message: 'An account with this email already exists.',
      };
    }

    const nextAccounts = [
      ...accounts,
      normalizedAccount,
    ];

    setAccounts(nextAccounts);
    syncBrowserAccounts(nextAccounts);

    await AsyncStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(nextAccounts.map((account) => sanitizePersistedAccount(account)))
    );

    return { ok: true, message: 'Registration successful.' };
  };

  /**
   * Login.
   */
  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    const client = getSupabaseClient();
    if (!client && isProductionRuntime()) {
      return false;
    }

    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return false;
      }

      const { data: profileData } = await client
        .from('profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      if (profileData && profileData.role !== role && role !== 'customer') {
        return false;
      }

      const { data: membershipData } = await client
        .from('business_memberships')
        .select('business_id')
        .eq('user_id', data.user.id)
        .limit(1);

      const normalizedAccount: AuthAccount = {
        email: data.user.email ?? email.trim(),
        password,
        role: profileData?.role ?? role,
        name: profileData?.full_name ?? data.user.user_metadata?.full_name ?? email.trim(),
        businessId: membershipData?.[0]?.business_id ?? undefined,
        businessName: membershipData?.[0]?.business_id ? 'Supabase Business' : '',
        phone: profileData?.phone ?? '',
        address: profileData?.address ?? '',
        sellerVerificationStatus: normalizeSellerVerificationStatus((profileData as { seller_verification_status?: string } | null | undefined)?.seller_verification_status ?? 'PENDING'),
      };

      setCurrentUser(normalizedAccount);
      applyBusinessScopeForUser(normalizedAccount);
      syncBrowserAuthState(normalizedAccount);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(normalizedAccount));
      return true;
    }

    const sanitizedEmail = email.trim();

    const account = accounts.find(
      (entry) =>
        entry.email.toLowerCase() ===
          sanitizedEmail.toLowerCase() &&
        entry.password === password &&
        entry.role === role
    );

    if (!account) {
      return false;
    }

    const resolvedAccount =
      normalizeAccount(account);

    setCurrentUser(resolvedAccount);
    applyBusinessScopeForUser(resolvedAccount);
    syncBrowserAuthState(resolvedAccount);

    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(sanitizePersistedAccount(resolvedAccount))
    );

    const updatedAccounts = accounts.map(
      (entry) =>
        entry.email.toLowerCase() ===
          resolvedAccount.email.toLowerCase() &&
        entry.role === resolvedAccount.role
          ? resolvedAccount
          : entry
    );

    setAccounts(updatedAccounts);
    syncBrowserAccounts(updatedAccounts);

    await AsyncStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(updatedAccounts.map((account) => sanitizePersistedAccount(account)))
    );

    return true;
  };

  /**
   * Logout.
   */
  const logout = async (): Promise<void> => {
    setCurrentUser(null);

    clearActiveBusinessScope();
    syncBrowserAuthState(null);

    await AsyncStorage.removeItem(
      SESSION_KEY
    );
  };

  return (
    <AuthContext.Provider
      value={{
        accounts,
        ready,
        register,
        login,
        logout,
        currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}