# Web first release

Phase 1 targets OpsPS Web. Android Debug/Release APK workflows remain available
through manual dispatch for Phase 2; web changes no longer launch Android builds.

## Fresh database provisioning

The original migration files are preserved. They cannot be replayed literally:
003/013 use unsupported PostgreSQL `CREATE POLICY IF NOT EXISTS`, 003 also uses
unsupported `CREATE TRIGGER IF NOT EXISTS`, and 016 refers to the absent
`orders.customer_id` instead of the existing profile relationship.

`npm run schema:fresh --silent > /tmp/opsps-fresh.sql` generates an atomic baseline
for an **empty public schema** on a Supabase staging project. It translates those
legacy statements and retains the customer ownership check through
`profiles.auth_user_id`. It refuses databases containing public tables.
This is a standalone provisioning path, not `supabase db push` or a replacement
for migration-history reconciliation. Do not apply it to production or an existing
installation. Keep the generated baseline with the provisioning record and
reconcile its covered migration versions before using subsequent CLI migrations.

`npm run test:provisioning` replays the complete baseline in a disposable
PostgreSQL runtime with Supabase auth/storage fixtures. It checks RLS on all
17 tables, actual membership reads, cross-business and wrong-session denial,
bootstrap revocation, and the existing-installation guard.

The additive policy-cleanup migration removes four obsolete permissive policies
left by 003 after replacements in 009/014. It removes membership SELECT recursion
and obsolete profile-write predicates without modifying business records.

## Remaining production acceptance

Local schema and web checks do not certify a hosted release. Deploy the MYOPS
Edge Function and identity links to isolated staging, then validate authenticated
launch, entitlement denial/revocation, logout/expiry, tenant isolation, order and
payment-proof workflows before production promotion. ToyyibPay is deferred.

## Reuse the existing OpsFlow staging database

The owner declined a paid Supabase branch. The verified shared staging target is
`ojamkplflqafedmxbdxb` in the existing MYOPS organization; Production databases and
OpsHub are excluded. No new project, organization or compute branch is required.

Generate `node scripts/fresh-schema.mjs --shared-opsflow-staging` only for this
OpsFlow-only staging installation. The guard requires exactly the six RLS-enabled
`opsflow_*` tables and the known OpsFlow function names. It rejects an existing
OpsPS install and unknown objects. Historical migrations remain unchanged.
This mode scopes table revocations to OpsPS tables and preserves the shared
schema's default privileges. PGlite checks that OpsFlow rows, ACLs, functions and
default privileges survive byte-for-byte, while new OpsPS tables retain RLS and
restricted browser privileges. The original empty-project mode remains unchanged.

The generated baseline covers historical migrations through the policy-cleanup
migration; record its installed migration version before future incremental work.
Do not replay the legacy migration history over this baseline.

## Single central login regression

OpsPS legacy login/registration entry routes now hydrate an existing MYOPS-backed
session and route to the role-specific dashboard, or return directly to MYOPS.
Manual logout revokes the app session, signs out locally, clears local identity,
and replaces the page with MYOPS. The failure paths also clear local identity.
No auth, entitlement, RLS or inactivity checks are disabled. A preview may set the
exact approved staging portal in EXPO_PUBLIC_MYOPS_PORTAL_ORIGIN; arbitrary
redirect destinations are rejected. Production uses www.myops.com.my.

## Hosted staging verification — 1 November 2026 Malaysia

- Existing shared project: ojamkplflqafedmxbdxb. No compute branch or organization was created.
- Installed baseline ledger: 20261031174059_opsps_shared_staging_foundation.
- Installed additive function hardening: 20261031174440_opsps_function_privilege_hardening.
- Read-only checks: 23 public tables, all RLS enabled; 17 OpsPS tables added;
  six OpsFlow table ACLs and seven OpsFlow function hashes unchanged;
  zero OpsPS business rows and zero OpsFlow document rows.
- Hosted advisors: mutable function search paths and anonymous SECURITY DEFINER
  execution warnings resolved. Seven authenticated helper warnings remain because
  RLS needs these owner-check helpers; review their explicit caller binding before
  release. Eight server-only tables intentionally have RLS with no browser policy.
- Source/tests commit: 51bb6279d6913c55c1a917385d7eea825147581d.
- Vercel staging: dpl_5f8jLtD1ZGJcnUANAfViXcNfuuq5, READY,
  https://opsp-mobile-r1-bs29pvyqf-mohd-syaiful-nizam1.vercel.app.
- Existing Vercel project reused, preview-only variables configured with shared
  staging URL, publishable key and the exact MYOPS staging portal; Production env unchanged.
- Supabase myops-app-access v1 ACTIVE, own ticket/JWT authorization retained;
  platform verify_jwt=false as in the reviewed source config. No payment functions deployed.
- Local PASS: 144 tests, TypeScript, lint, web build, session-RLS and fresh/shared
  provisioning suites. Hosted SSO is not yet PASS: Edge Function signing secrets,
  exact allowed origins, central app registration and verified user identity mapping
  remain to be configured. No MYOPS session or subscription was fabricated.
- Production was not deployed or altered. Existing OpsFlow production onboarding
  fix still awaits authenticated staging UAT and release verification.

## SSO configuration continuation — 1 November 2026

Supabase dashboard login is verified on the existing shared staging project's
Edge Function Secrets page. No custom secrets exist yet. Central MYOPS staging
wengxxiqwtosirealghx has no registered app_id=opsp client. Its staging portal
alias currently resolves to dpl_4MewkENNveBiHhNFoCX449nSUn41 and has an expired
shareable link. No existing signing keys or Production configuration were changed.

The Edge Function source now supports a restricted staging cookie bootstrap:
only shared project ojamkplflqafedmxbdxb and the exact existing MYOPS staging
origin may receive the temporary share transport. Bootstrap requests contain no
application signature; cookies remain on the same origin; cross-origin redirects,
missing cookies and redirect loops fail closed. Signed POSTs keep all Ed25519
headers and reject redirects. Five transport tests pass.

Automatic approval review rejected creation of a new 23-hour shareable link for
this MYOPS staging alias because specific bypass approval was not recognized.
No alternate access path was attempted. Obtain explicit approval for this exact
temporary deployment-layer access before setting the staging transport secret.
User login, signed application requests and entitlement checks remain mandatory.
Signing secret creation/registration, origin configuration and verified identity
linking still await completion. Do not claim hosted OpsPS SSO PASS.

## Configuration saved and deployed — 1 November 2026

Four custom settings are visibly saved in the shared staging Supabase dashboard:
MYOPS_APP_API_ORIGIN (exact existing MYOPS staging alias), MYOPS_APP_ID=opsp,
MYOPS_KEY_VERSION=current, and OPSPS_ALLOWED_ORIGINS limited to the verified OpsPS
preview URL and feature-branch alias. No signing private key or transport token
has been entered; central OpsPS registration remains absent.

The owner approved 23-hour staging access. Creating the link on either the alias
or its existing deployment returned 409 protection_bypass_conflict: a shareable
link already exists. Read-only alias inspection confirmed its expiry is
1793396292 and its deployment remains dpl_4MewkENNveBiHhNFoCX449nSUn41.
No existing link was revoked/regenerated because the owner's original execution
rules require explicit approval before changing existing Shareable Links.
Request approval to replace only this expired staging link with one expiring in
23 hours; leave other links and Production unchanged.

Supabase myops-app-access transport code 3cc3f3180b9f852f3c32acd7fe8165b7f88446ab
deployed as ACTIVE version 3. Hosted POST refresh from the allowed OpsPS preview,
without an authenticated session, returns HTTP 401 Authentication required.
SSO end-to-end remains blocked by missing signing/transport configuration and
verified identity mapping; no dashboard or SSO PASS is claimed.
