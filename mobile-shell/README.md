# MYOPS Unified Mobile — foundation (not production-ready)

This directory is an isolated foundation inside the existing OpsPS repository.
Do not replace the OpsPS app entrypoint or production configuration with this scaffold.

## Architecture
- One Android/iOS app using Expo Router and React Native.
- Central MYOPS SSO; no separate mobile passwords or tenant bypass.
- App catalog with explicit coming-soon state.
- Server-verified roles, tenant membership and entitlements required before opening modules.

## Required before sign-in can work
1. Inspect the existing MYOPS web SSO backend and choose a supported OAuth/OIDC Authorization Code + PKCE integration for native clients.
2. Configure the mobile redirect URI and allowlist in the identity provider.
3. Exchange code securely, verify issuer/audience/state/nonce as applicable, store refresh credentials in OS secure storage.
4. Implement session refresh, revocation, logout and app-specific authorization.
5. Verify production URLs for OpsPS, OpsHR and OpsRental; catalog entries intentionally omit unverified URLs.
6. Complete Android and iOS device UAT, build signing and store compliance.

## Caution
This is a source scaffold, not an installed APK/IPA, a working SSO integration or an app-store release.
