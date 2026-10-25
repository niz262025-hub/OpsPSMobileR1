# OpsPS Web production readiness

**Status checked: 2026-10-25**

## Current decision

OpsPS has a source implementation for MYOPS launch tickets, entitlement refresh, logout, and database session enforcement. It is **not ready for staging UAT or go-live**: this checkout has no Supabase URL/anon key, MYOPS signing key, Edge Function secrets, provisioned identity links, or staging connection. The SQL migration and Edge Function have not been deployed or tested against a Supabase project.

## Implemented in this branch

- Landing, login, registration, and password-reset entry points direct users to MYOPS. OpsPS no longer accepts a separate password login or registration.
- `myops-app-access` validates the 60-second launch ticket through the signed MYOPS `/api/app/redeem` contract, then creates a Supabase Auth session for an operator-linked account.
- The Edge Function signs MYOPS requests with an Ed25519 private key stored server-side. It refreshes the package entitlement and revokes the bound OpsPS session on denial.
- Migration `017_opsps_myops_app_sessions.sql` adds trusted identity links, binds Supabase JWT session IDs to MYOPS sessions, and applies a restrictive RLS session gate to the app's business data and private payment proofs. The legacy `SECURITY DEFINER` founder-bootstrap RPC is revoked from client roles.
- The browser client calls the Edge Function every 10 seconds. Only recent pointer, keyboard, touch, or scroll input is reported to MYOPS as activity; background heartbeats do not reset MYOPS idle time. Database access expires after 20 seconds without a successful entitlement check.
- OpsPS keeps its own Supabase project, as intended; only MYOPS identity and package access are central.

## Required before staging UAT

1. Configure the staging Expo build with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Deploy the Edge Function with server-side secrets: `MYOPS_APP_API_ORIGIN`, `MYOPS_APP_ID=opsp`, `MYOPS_KEY_VERSION`, `MYOPS_APP_PRIVATE_KEY_CURRENT` (Ed25519 PKCS#8 PEM), and `OPSPS_ALLOWED_ORIGINS` (comma-separated exact HTTPS origins). The registered MYOPS product slug and app ID are `opsp`; `opsps` is only the repository name. Supabase's service-role/secret key must remain server-side.
3. Confirm the MYOPS service uses the same signed request contract and returns `session_id`, opaque 43-character `user_ref`, and `product=opsp` for redeem; entitlement must return `entitled` and `session_active` booleans.
4. Apply migration 017 to a disposable/staging database after replaying the repository's historical migrations. Seed `myops_identity_links` only for verified, pre-existing OpsPS Auth users; check every protected table and storage policy exists in that database.
5. Configure the MYOPS OpsPS launch URL to return to the HTTPS OpsPS origin with the one-time ticket in the URL fragment (`#t=<ticket>`). Run browser UAT for valid, expired, replayed, and revoked tickets, package denial, network failure, logout, founder/customer workflows, payment proofs, and cross-business access.

## Verification and limits

- Previously verified UI/source checks: 126 tests, TypeScript, lint, and Expo Web export passed before this SSO change.
- The new contract tests and the full local checks must pass before updating the draft PR.
- This environment has no configured staging credentials and does not include the Supabase CLI or Deno runtime, so the SQL migration cannot be replayed here and the Edge Function cannot be runtime-tested here.
- Keep the PR in draft. Do not merge or deploy to production until staging migration replay, RLS checks, MYOPS SSO/entitlement UAT, and browser workflows pass.
