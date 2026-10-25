# OpsPS Web production readiness

**Status checked: 2026-10-25**

## Current decision

OpsPS Web is buildable and its local checks pass, but it is **not ready for go-live**. This checkout has no `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` configured. There has been no staging connection or live browser UAT in this run, and the app does not yet use MYOPS single sign-on or MYOPS subscription entitlements.

## What is implemented

- `AuthContext` uses Supabase Auth for sign-up, login, session restore, and logout. When Supabase is missing, authentication operations fail closed; they do not create a local password login.
- The default production data source in `services/repository.ts` is Supabase-backed and throws if Supabase is not configured. Mock data is a separate explicit mode used for local/demo flows and tests.
- The repository contains migrations for auth membership, tenant-scoped RLS, founder bootstrap, payment/shipping hardening, and payment provider metadata (migrations `001`–`016`, with historical version gaps).
- Local verification on 2026-10-25 passed: 126 tests, TypeScript check, lint, and Expo Web export.

## Remaining go-live blockers

1. **MYOPS SSO and access:** Public landing-page access buttons now lead to MYOPS, and OpsPS no longer displays its own pricing or generated subscription status. The legacy `/login` and `/register` routes still exist; the app has no MYOPS ticket redemption, trusted identity mapping, app-session enforcement, or entitlement check. A web-compatible server endpoint/BFF must be chosen and implemented before users can enter directly from MYOPS without a second login.
2. **Staging configuration:** configure the Supabase project URL and anon key in the Expo build environment. Keep any service-role key server-side; the static web client must never receive it.
3. **Migration validation:** inspect the complete historical migration sequence and replay it on a disposable Supabase project. Verify RLS for every business-scoped table and confirm cross-business reads/writes are denied. The numbered gaps mean a clean replay cannot be assumed from the files currently present.
4. **End-to-end UAT:** verify login/launch, expired or revoked access, logout, founder and customer workflows, payment and shipment callbacks, reporting/export, and desktop/mobile browser layouts against staging. `UAT_REPORT.md` records the earlier UI checklist as not executed; local unit tests do not replace this.
5. **Billing ownership:** OpsPS still has its own plan/subscription UI and schema. Confirm the MYOPS package entitlement mapping and remove/disable any app-side billing gate before launch so package access is controlled centrally by MYOPS.

## Deployment guardrails

- Do not deploy the current state to production or claim go-live until staging migration replay, RLS checks, MYOPS SSO/entitlement checks, and browser UAT pass.
- Do not apply guessed RLS changes to a production database. Use a disposable or staging Supabase project first.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in an `EXPO_PUBLIC_*` variable or static web bundle.
