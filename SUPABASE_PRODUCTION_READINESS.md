# Supabase Production Readiness

## Current status

The current workspace is **NOT CONFIGURED** for Supabase. No Supabase environment variables were present during the Priority 6 assessment on 2026-09-05. The app therefore remains mock-backed.

The client now validates the public configuration and can run a read-only diagnostic for auth session access and a `businesses` table read. It does not write data, deploy migrations, or expose a service-role key.

## Required external inputs

Configure these in the Expo build/runtime environment:

```text
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<project-anon-key>
```

Keep this server-side only and never add it to an `EXPO_PUBLIC_*` variable:

```text
SUPABASE_SERVICE_ROLE_KEY=<project-service-role-key>
```

The service-role key is not required by the mobile client and must only be used by a trusted migration or server process.

## Audit findings

- `AuthContext` persists local accounts and sessions with AsyncStorage; it does not use Supabase Auth.
- `mockDatabase` owns application reads and writes; no repository currently targets Supabase tables.
- `subscriptionFoundation.ts`, `payment.ts`, and `shipping.ts` are domain/provider contracts with mock behavior, not Supabase persistence adapters.
- `001_opsps_core_schema.sql` defines the initial tables and foreign keys, but it has no RLS enablement or policies.
- `profiles.id` is generated independently and is not linked to `auth.users.id`; a production auth/RLS design must establish that relationship.
- The schema does not yet model payment webhook event uniqueness, shipment webhook event uniqueness, provider idempotency keys, or the full provider-agnostic shipping address/status contract.
- The schema has no audit trail for sensitive state changes and no server-side webhook ingress.

## Safe deployment decision

Do not deploy the current migration to a production project yet. Applying tables without RLS would create data-isolation risk, while adding guessed policies could block valid founder/customer flows or permit cross-business access. The next migration must first define the authenticated user to business membership relationship, then enable and test RLS for every business-scoped table.

## Migration order

1. Create an `auth.users` membership mapping for business access and define founder/customer/admin role rules.
2. Enable RLS and add tested policies for each business-scoped table.
3. Add unique idempotency/event constraints for payments and shipments.
4. Deploy to a non-production Supabase project and verify auth, scoped reads, scoped writes, and denied cross-business access.
5. Migrate one narrow repository, starting with read-only trips/products, before moving orders, finance, payments, or shipments.

## What remains mock

Founder and customer authentication, mock database persistence, subscriptions, payments, shipping, webhook processing, and finance reconciliation remain mock/local until the secured Supabase schema, server-side integrations, and production credentials are available.