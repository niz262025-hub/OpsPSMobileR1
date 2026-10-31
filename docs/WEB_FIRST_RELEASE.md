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
