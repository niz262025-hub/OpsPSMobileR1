# Functional UAT continuation — 14 November 2026

## Scope and release decision

NO-GO for a full functional release. This change fixes product visibility mutation and expands local functional coverage; it does not claim completed hosted acceptance. No hosted data, protection configuration, production release, pricing, subscription or payment-provider configuration was changed.

Based on `a4f8f23a6bfcf3e09b472b90a480842478acfe0f` (PR #22). Keep this work stacked on that PR; do not duplicate its Vitest setup change or treat that setup as runtime SSO evidence.

## Confirmed defect and fix

`SupabaseDataSource.products.update` inferred `is_published` from stock readiness whenever the caller omitted `isPublished`. A routine edit published an unpublished Ready Stock product and hid a published Pre-Order product. Both cases failed new behavioral tests before the fix.

The update now omits `is_published` unless the caller explicitly supplies a boolean publishing instruction. The database preserves its existing value; no stale read or stock-status inference controls visibility. Explicit publish and unpublish still work. The two failing regressions now pass. There is no schema migration.

## Executed local coverage

| Module | Result | Evidence and limits |
| --- | --- | --- |
| Trips | PASS at repository/mock level | Create, edit, date/notes persistence across a new repository read, planning/open/closed state, retained closed history, cross-business read/edit/close denial. Existing browser-input component test covers trip creation date submission. No hosted save/reload claimed. |
| Products | PASS at repository/mock level | Create/edit, Ready Stock and Pre-Order visibility preservation, explicit publication toggles, single image URI round-trip, published link lookup, unpublished/wrong-business denial. An image URI round-trip is not a file upload or Storage persistence test. |
| Customer requests/orders | PASS at mock/isolated SQL levels | Published-product customer request and ownership/invalid-quantity/insufficient-stock checks in the existing repository suite. Default pending payment and immutable ownership enforced in isolated SQL. |
| Fulfillment/inventory | PASS at isolated SQL level | New `node scripts/test-order-fulfillment.mjs`: initial pending-payment row, forbidden direct-paid update, already-paid synthetic fixture, packing/ready/dispatch, incomplete and excessive packing denial, quantity immutability, rollback if shipment insertion fails, exactly-once dispatch stock 5 → 3, one inventory movement/shipment, wrong-user/expired/anonymous denial. No payment verification/provider invoked. |
| Finance/profit | PASS at repository/mock level | Expense and purchase entries reloaded; foreign-company data excluded; foreign create/update denied. Fixture totals: sales 100, COGS 30, gross profit 70, receipt 60, expenses 40, outstanding 40, net profit 60. Receipt is a synthetic ledger row, not payment processing. Existing regression verifies each cost deducted only once. |
| Reports | PASS at unit/dataset level | Day total 150/one order and month total 230/two orders, foreign company 220 excluded; existing Malaysia date-boundary, trip-profit and PDF generation checks pass. Dataset/PDF tests do not establish hosted dashboard or premium-export access. |
| Auth/permissions | PASS at unit/mock and isolated SQL levels | Existing signing, staging transport restrictions, identity hydration, navigation, tenant scope and admin-role checks; database session expiry, revocation, legacy token denial, owner isolation and Storage policy gates. No hosted token effectiveness claim. |

Final non-payment functional regression: **156 tests / 24 files PASS**. The run excludes files matching payment, QR, trial, subscription and feature suites to preserve the requested release priority. Five new Vitest cases extend the baseline of this filtered run; counts must not be compared directly to the previously reported all-suite 207.

Additional checks: `npm run test:database`, `npm run test:provisioning`, `npm run lint`, `npm run typecheck`, and production-mode `npm run build` PASS. A non-blocking Vite native-config-loader warning remains unchanged.

The new SQL script uses a new in-memory PGlite database only. Synthetic fixture setup does not disable business transition guards or write to any remote endpoint. A first fixture-seeding attempt was rejected by the pending-to-paid guard as expected; setup was corrected to INSERT a separate already-paid synthetic order instead of weakening the guard.

## Remaining capability gaps and hosted requirements

- Trip gallery for 1–10 images: **FAIL capability audit**. Trip repository/model has no image collection; trip receipt images are not a trip gallery.
- Product gallery for 2–10 images: **FAIL capability audit**. Current model/UI use one image string and one selected file. Multi-image uploads/persistence are not implemented by this patch.
- Trip edit UI: repository editing works in mocks, but the inspected trip detail UI does not expose an equivalent edit-details form. Hosted edit acceptance remains incomplete.
- UI uses planning/open/closed labels, not Active/Completed; acceptance must map these states explicitly rather than claim matching labels.
- Hosted file upload, refresh persistence, trip history UI, customer requests/availability, dashboard/report reconciliation and multi-identity isolation remain **BLOCKED** on an authenticated staging execution context.
- Owner reports production MYOPS → OpsPS dashboard SSO PASS with no second login. This is owner-manual evidence only, not an automated full SSO/functional result.
- Shared staging signed transport remains **BLOCKED/unverified** until an authorized environment invokes `myops-app-access` with `{"action":"staging_status"}` and observes HTTP 200, `ready:true`, `signed_transport:"verified"`, `unknown_session:"denied"`. An independently authorized preview browser does not verify the Edge Function's stored transport secret.
- Staging environment values are scoped to the established `fix/web-first-provisioning` preview, not automatically inherited by the PR #22 branch. Use the approved configured staging target or deliberately provision equivalent approved branch-specific bindings/CORS before hosted acceptance. Never substitute production configuration.
- Authenticated browser continuity requires a trusted owner-controlled browser or securely provisioned runner with central MYOPS test identity and a same-session launch. Do not put credentials, cookies or tickets in PRs, logs or chat.

## Adjacent Phase 1 checks

MYOPS at the existing Master checkpoint: six registration/TAC/application-routing/project-selection component/config checks PASS; 46 selected server auth-contract checks PASS, covering signup/confirmation, cookies, callback restrictions, inactivity, logout/revocation and durable login binding. These use controlled fixtures/mocks, not delivered-email or customer hosted acceptance. No MYOPS source changed.

OpsHR remains a protected demo: previous browser evidence established employee search/edit in memory and reset on reload. Inspected implementation explicitly lacks connected central SSO, persistence and tenant APIs. Keep it restricted/Coming Soon until those gates pass; rendered demo functionality is not production readiness. No OpsHR source changed in this execution.

Dedicated hosted subscription/pricing/bundle/payment-provider acceptance and Phase 2 mobile work remain deferred. The existing web CI workflow runs its standard unit/SQL regressions (which include payment/subscription-related cases); those do not constitute hosted subscription or sandbox-payment UAT. The isolated fulfillment script passes locally, but is not wired into CI: the publisher cannot modify GitHub Actions workflow files. A maintainer can add `- run: node scripts/test-order-fulfillment.mjs` after the existing provisioning step in `.github/workflows/web-readiness.yml`. No app-permission change is requested. No production merge or promotion is authorized by this report.
