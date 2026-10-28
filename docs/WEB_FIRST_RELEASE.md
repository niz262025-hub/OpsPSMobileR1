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
