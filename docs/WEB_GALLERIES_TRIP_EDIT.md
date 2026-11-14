# OpsPS Web galleries and trip editing

## Scope

Stacked on `fix/functional-uat-publication` / PR #23, which is itself based on PR #22. Historical migrations and those PRs are not rewritten. This is the existing Expo SDK 57 / React Native Web application, not a Next.js rewrite. No mobile feature work, subscription changes, payment-provider work or production promotion is included.

## Implemented Web flows

### Trips

- Open a trip, then **Edit trip details**: edit name, destination, calendar date and RM budget. Save performs the existing business-scoped database update, then returns to detail for a new read. Input errors and denied/failed saves remain on the form.
- Planning stays `planning`; **Active** maps to the existing `open` database value; **Completed** maps to `closed`. Completed records remain in history and allow detail corrections, but cannot be reopened (UI plus database trigger).
- Budget is a non-negative amount with up to two decimal places. It is a planning field, not a financial transaction; editing it does not create expenses or move stock.
- The scrollable detail area contains **Trip image gallery**. Add one or multiple images up to ten, preview all, replace or remove individual images, and reorder or make an image primary. Changes save immediately; reload reads persisted object paths and ordering.

### Products

- Marketplace Web image selection accepts 1–10 files. After the product is created, uploads go to private Storage and the gallery metadata is saved. A failed image upload explicitly reports that the product already exists and directs the user to manage images rather than create a duplicate. The product save is guarded against double submissions.
- Marketplace lists **Manage product image galleries** links to existing product detail pages. Authorized business managers see add/remove/replace/order/primary controls on product detail; customers do not see mutation controls.
- Newly uploaded files are stored privately. The first gallery entry is the primary image and is resolved into a short-lived signed URL for product listings/detail. Signed URLs are not written back into `image_url` during ordinary product edits. The PR #23 publication fix remains intact.
- Existing product `image_url` values are not replaced or downloaded. The migration seeds a `legacy` gallery entry referencing the existing value. It counts towards the ten-image limit and can be moved, removed, replaced or restored. Thus old images survive without a destructive backfill, while the gallery order/primary selection can include them. Existing public/external/data-URI legacy images retain their previous access semantics; this change does not pretend to privatize old external URLs.

## Storage and data design

New migration: `supabase/migrations/20261114192000_web_galleries_trip_budget.sql`.

- Additive columns: `trips.budget`, plus `gallery_paths` (JSON array) and `gallery_version` on trips/products. No existing records, orders, inventory, publication flags or original image bytes are deleted.
- Private bucket: `opsps-media`, only JPEG/PNG/WebP, maximum 5 MiB per object. Browser validation enforces the same allowlist and rejects empty files. Ten gallery entries maximum, with unique names and server-validated parent/business scope.
- New paths: `business/<business-uuid>/<trips|products>/<parent-uuid>/<random-uuid>.<jpg|png|webp>`. No overwrites; replacement always uploads to a fresh UUID path.
- Managers require an active MYOPS-bound app session and founder/admin membership in that specific business, as well as an existing parent record.
- Trip media is manager-only. Published product media can be read by an authenticated customer with an active app session, but only while its path is in that product's current gallery. Anonymous private-object reads, writes by customers, cross-business writes/reads of private records, expired sessions and object overwrites are denied. Existing anonymously readable legacy image URLs are not revoked by these rules.
- Restrictive policies protect this bucket even if unrelated permissive Storage policies exist. No existing session gate is disabled. The RPC/helper functions are SECURITY INVOKER, with no anonymous EXECUTE.
- `opsps_save_gallery` locks the parent row and compares its version before replacing metadata atomically. A stale tab receives a reload/retry error instead of overwriting another user's ordering.
- Removing/replacing unlinks the image from the gallery persistently; new customer signed-URL requests for a removed private path are denied. Private old/unlinked objects are **retained for recovery**, including interrupted uploads, rather than blindly deleted after an uncertain write outcome. This is gallery deletion, not permanent byte erasure. A future authorized retention job can purge unreferenced objects after a recovery grace period. Existing signed URLs can remain valid for their remaining five-minute lifetime.
- Gallery signed URLs expire in five minutes and the mounted gallery refreshes them every four minutes. Page reload also resolves fresh signed URLs.

### RLS recursion defect found during acceptance

Real isolated PostgreSQL UPDATE tests reproduced `42P17 infinite recursion detected in policy for relation trips`. Existing trip/product UPDATE policies queried their own protected table in WITH CHECK. The migration replaces only those two policies with the same business-manager role checks; the existing restrictive session policies remain. New triggers enforce immutable id/business ownership and immutable product-trip ownership without self-querying RLS. Cross-business and ownership-change denial are exercised in the SQL acceptance script.

## Automated evidence

- Full suite: 235 tests / 39 files PASS, including 23 new cases across gallery services, web components, trip editor and the isolated SQL acceptance wrapper.
- Web-component tests exercise trip field loading, valid save, completion, validation errors, failed saves, customer denial, gallery previews/primary/reorder/remove/replacement, customer read-only controls and failed gallery saves.
- `scripts/test-web-galleries.mjs` uses an in-memory PGlite database only. It provisions the previous schema, inserts original trip/product fixtures, applies **only the new migration**, and tests legacy preservation, budget/date/status persistence, 1/10-image saves and reloads, replacement/removal/reordering, stale-version denial, size-count/duplicate/scope denial, immutable ownership, customer access, expiry and anonymous denial. It adds broad unrelated Storage policies deliberately to test the restrictive guard. Object metadata is simulated; this is not the hosted Storage service or a real file-transfer test.
- `__tests__/web-galleries-database.test.ts` invokes the SQL script from standard `npm test`, so existing web CI runs the new database acceptance without a workflow-file edit.
- Additional session/RLS, fresh/shared provisioning, isolated order fulfillment/inventory and production-upgrade simulation checks PASS.
- Lint, TypeScript and production-mode Expo web export PASS. No new dependencies or lockfile changes.

## Hosted rollout gate (not executed here)

This session can inspect repository SQL and run isolated PostgreSQL, but has no live Supabase management connection. **The new migration has not been applied to staging or production.** Live schema drift and actual Storage service behavior remain unverified.

1. An authorized database operator must inspect the existing staging schema/bucket/policies, confirm recovery capability, and apply only the new migration transactionally through the approved Supabase migration process. Do not run the fresh-schema baseline or replay historical migrations on an existing installation. An existing mismatched `opsps-media` bucket fails closed for review instead of being silently changed.
2. Use the existing approved isolated OpsPS staging database and the exact MYOPS staging portal bindings. This feature branch does not automatically inherit environment variables scoped to `fix/web-first-provisioning`; configure an approved feature-preview target or stage the approved code into that configured staging environment. Verify the exact preview origin is allowed without broadening production CORS or disabling Vercel protection.
3. In an owner-controlled authorized browser/runner, sign into MYOPS staging and launch OpsPS using the same session. No credentials, cookies, signing keys or launch tickets should be placed in chat, source, reports or logs.
4. Upload real synthetic JPEG/PNG/WebP fixtures (1 and 10 files) to a trip and a product. Verify all previews, primary/order, replace/remove, refresh persistence, and 11th-file rejection. Verify legacy primary/remove/restore and no publication change after ordinary product editing.
5. Edit/reload trip details and budget, set Active then Completed, verify history and refusal to reopen. Verify unauthorized customer and second-business direct API/Storage attempts, expired session behavior, order requests, inventory and reports.
6. Verify `myops-app-access` staging readiness returns HTTP 200, `ready:true`, `signed_transport:"verified"`, `unknown_session:"denied"`. Owner-reported production dashboard SSO does not establish this staging result.

**Release decision:** code is prepared for review and staging migration/UAT, not approved for production. No hosted authenticated gallery/trip-edit PASS is claimed. Preserve deployment protection; no merge or production promotion without owner approval.
