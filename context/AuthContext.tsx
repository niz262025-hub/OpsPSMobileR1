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

export type UserRole = 'founder' | 'customer';

export type AuthAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  businessName?: string;
  phone?: string;
  address?: string;
  businessId?: string;
};

type AuthContextValue = {
  accounts: AuthAccount[];
  ready: boolean;
  register: (account: AuthAccount) => Promise<boolean>;
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
      setActiveBusinessScope(user.businessId);
      return;
    }

    clearActiveBusinessScope();
  };

  /**
   * Restore accounts and existing session.
   */
  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      try {
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
            JSON.stringify(normalizedAccounts)
          );
        }

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

          /**
           * Persist the normalized session too, especially
           * for older sessions that did not contain businessId.
           */
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify(normalizedSession)
          );
        } else {
          clearActiveBusinessScope();
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
  ): Promise<boolean> => {
    const normalizedAccount =
      normalizeAccount(account);

    const emailExists = accounts.some(
      (entry) =>
        entry.email.toLowerCase() ===
          normalizedAccount.email.toLowerCase() &&
        entry.role === normalizedAccount.role
    );

    if (emailExists) {
      return false;
    }

    const nextAccounts = [
      ...accounts,
      normalizedAccount,
    ];

    setAccounts(nextAccounts);

    await AsyncStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(nextAccounts)
    );

    return true;
  };

  /**
   * Login.
   */
  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
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

    /**
     * Normalize the account so older accounts without
     * businessId are migrated safely.
     */
    const resolvedAccount =
      normalizeAccount(account);

    setCurrentUser(resolvedAccount);
    applyBusinessScopeForUser(resolvedAccount);

    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(resolvedAccount)
    );

    /**
     * Persist the normalized account back into the account list.
     * This ensures businessId remains stable forever.
     */
    const updatedAccounts = accounts.map(
      (entry) =>
        entry.email.toLowerCase() ===
          resolvedAccount.email.toLowerCase() &&
        entry.role === resolvedAccount.role
          ? resolvedAccount
          : entry
    );

    setAccounts(updatedAccounts);

    await AsyncStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify(updatedAccounts)
    );

    return true;
  };

  /**
   * Logout.
   */
  const logout = async (): Promise<void> => {
    setCurrentUser(null);

    clearActiveBusinessScope();

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