import * as Linking from 'expo-linking';
export const CENTRAL_LOGIN = 'https://www.myops.com.my';
export const CALLBACK_URL = Linking.createURL('auth/callback', { scheme: 'myops' });
/**
 * Contract only: the MYOPS central backend must implement an authorized
 * mobile OAuth/OIDC PKCE flow with exact redirect allowlisting.
 * Never send browser session cookies or access tokens in deep-link query strings.
 * Do not treat returning from the browser as proof of authentication.
 */
export function getLoginEntryUrl(): string {
  return CENTRAL_LOGIN;
}
export type VerifiedSession = {
  userId: string;
  tenantId: string;
  roles: string[];
  expiresAt: number;
};
export function isSessionValid(session: VerifiedSession | null): boolean {
  return !!session && !!session.userId && !!session.tenantId &&
    session.expiresAt > Date.now();
}
