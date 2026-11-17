# OpsPS urgent UAT recovery — 15 November 2026

Decision: **NO-GO for production.** Staging recovery and verified fixes are complete; full independent customer/second-business browser and Storage API acceptance, plus hosted fulfillment, remain incomplete.

## Scope and environment
- Repository: niz262025-hub/OpsPSMobileR1; PR #24 stays open/draft, unmerged.
- Working branch: feat/web-galleries-trip-edit.
- Starting commit: 1c155c70a91b0f10ef52b016ff0d68acc89c839c.
- Latest tested application code: 1866fe437cd77b93e71ba30e2bb6ea96f2263108.
- Supabase: ojamkplflqafedmxbdxb, ACTIVE_HEALTHY. Its display name is OpsFlow Staging; it is the existing shared staging database, with public OpsPS tables.
- Correct stable feature preview: https://opsp-mobile-r1-git-feat-web-gallerie-273940-mohd-syaiful-nizam1.vercel.app
- Application deployment for 1866fe4: dpl_6pryVXuGmQpaktCiiDs8Gf6zMhyk, READY.
- Immutable build URL: https://opsp-mobile-r1-6020j41zp-mohd-syaiful-nizam1.vercel.app . Use the stable feature alias for SSO: the reviewed CORS origin is the stable alias, not every immutable Vercel hostname.
- MYOPS staging alias: https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app
- No production database, merge, production promotion, real payment, OpsHub or mobile work occurred.

## Confirmed fixes and deployment evidence

| Change | Published commit | Verification |
| --- | --- | --- |
| Exact staging-only CORS origins; repair old Budget component tests | a0739b0dd64f852229d03065f406df626333eef5 | Before: current preview POST 403 Origin is not allowed. After: POST 200, ready:true, signed_transport:verified, unknown_session:denied. Untrusted Vercel origin still 403. Staging Edge Function myops-app-access v23 ACTIVE; existing verify_jwt:false and internal authentication retained. |
| Refresh persisted finance/profit after closing a trip | 5b4f77fde04545f225de596719b336fa04bfa131 | Before: immediate summary RM0 despite saved RM4.50. After: new trip closes with RM2.00 expense, UI immediately shows expense -RM2.00 / net RM-2.00 without page refresh. |
| Business-scoped product details editor and explicit publication | 0cf91ecc9c2fa7787a78ab345bd750e4fbeb4630 | Founder/admin editor only for matching product business; hosted name/description/price edit persisted, Draft preserved until explicit Publish Product; published flag true and ten gallery paths preserved. |
| Persisted merchant availability, no speculative status replacement | 1866fe437cd77b93e71ba30e2bb6ea96f2263108 | Before: DB PENDING_AVAILABILITY but UI AVAILABLE from a stock estimate; no merchant action. After: UI PENDING_AVAILABILITY, no premature payment panel; explicit Pay Now confirmation invokes existing protected RPC and persists PAYMENT_REQUIRED. No payment submitted. |

Configuration fix outside the OpsPS repository:
- MYOPS staging MYOPS_APP_URL_OPSP previously pointed to the old fix/web-first-provisioning preview, explaining the missing Edit Trip screenshot.
- Changed only the feat/myops-isolated-staging preview override to the stable PR #24 alias.
- Redeployed the existing MYOPS staging code ca9f7a61d059bfc2991d0cbf730d4637701c9932; deployment dpl_GKSzptxLwNVg8JUeW2yAG2ommvoX READY. Reassigned the existing staging branch alias to it. Production was not promoted.
- Hosted MYOPS login -> correct OpsPS feature dashboard succeeded without a second login.

## Migration reconciliation

The two feature migrations were already applied. No migrations were applied or replayed remotely.

| Repository migration | Staging history | MD5 of exact SQL |
| --- | --- | --- |
| 20261114192000_web_galleries_trip_budget.sql | 20261114203127 / web_galleries_trip_budget | 19e2fd39c6d9c7597a5bd14d786dfe74 |
| 20261114195800_media_delete_guard.sql | 20261114203131 / media_delete_guard | fd2848ff099038aa876964629c2c41cb |

Timestamp differences reflect the prior application history; SQL contents match. trips.budget remains numeric; trip/product gallery_paths jsonb and gallery_version integer exist. opsps-media is private, 5,242,880 bytes maximum, JPEG/PNG/WebP only. Restrictive DELETE guard and manager predicates were inspected.

Two earlier staging repairs were absent from this branch. Their exact SQL is restored from staging history in this checkpoint commit, preserving actual applied versions:
- 20261114164732_opsps_explicit_availability.sql — MD5 1d54c7f02794bcc0cbe4300cd0c26e90.
- 20261114181506_opsps_trip_product_updates_and_atomic_close.sql — MD5 de16cd87db46ab0d1c14c4ce1b529ab4.
These files are restored history, not newly executed schema changes. Never run a fresh-install baseline against an existing database.

## Complete acceptance matrix at this checkpoint

PASS below is scoped to the evidence level stated. BLOCKED/NOT RUN is not a claimed product failure.

| Requirement | Result | Evidence / limitation |
| --- | --- | --- |
| Correct Git commit, Vercel, staging binding | PASS | GitHub head matched original checkpoint; subsequent code builds READY on branch; preview EXPO_PUBLIC_SUPABASE_URL matches ojamkplflqafedmxbdxb and portal origin matches MYOPS staging. |
| MYOPS -> correct feature SSO | PASS hosted | Owner signed in through secure browser authentication; central Open OpsPS launched PR #24 alias and authenticated dashboard. |
| Admin bypass | PASS hosted | Existing central administrator access opened app without purchasing a plan. |
| Session refresh | PASS hosted | Trip/product pages survived full browser reload and resolved authenticated private gallery images. |
| Global logout/revocation | PASS hosted | MYOPS global logout restored anonymous links; direct OpsPS dashboard navigation redirected to anonymous MYOPS. Final browser is at MYOPS staging login. |
| Create Trip Name/Destination/Date/Notes | PASS hosted | Trip 55ccfb1d-c8f1-4f8d-811b-7f12fc31310f created; notes persisted in DB. |
| Edit Trip button and Name/Destination/Date | PASS hosted | Visible Edit Trip action; updated name, destination and 2026-11-16 persisted and reloaded. |
| Budget removed, DB retained | PASS | No Budget UI in create/detail/editor; DB numeric column retained. |
| Trip images 1 and 10, refresh | PASS hosted | Real synthetic PNG transfers; gallery 10/10 after reload; ten corresponding storage.objects rows. Add images disabled at capacity. |
| Complete Trip/history/no reopen | PASS hosted | Completed retained in Trips list, database status closed; edit screen has no Set Active on completed trip. |
| Product create/edit/publish | PASS hosted | Product 3acfadee-0e3a-418c-a7c6-10928bf0cc1e created; edited to UAT-RECOVERY-GALLERY-EDITED at RM21.50; Draft unchanged by ordinary edit, then explicit publication true. |
| Product images 1 and 10, refresh | PASS hosted | Ten real PNG objects, ten gallery paths and ten rendered images after reload; publication/edit preserved gallery. |
| Independent customer image page | BLOCKED | Only owner/admin browser identity was available. Manager rendering is not independent customer acceptance. |
| Customer cannot delete manager media | PARTIAL | Staging authenticated-role fixture reads ten published images; write predicate returns zero allowed paths. Restrictive DELETE policy present. Full isolated regression tests DELETE. Actual hosted customer Storage API DELETE has NOT run. |
| Cross-business isolation | PASS at hosted SQL policy level; browser pending | Rolled-back distinct customer and second-business founder sessions: no private trip image reads, zero product edits, no manager media write permission. No RLS disabled or grants widened. |
| Anonymous/expired/revoked session denial | PASS isolated SQL; hosted global logout PASS | Fresh/session-RLS tests cover legacy, wrong-user/session, expiry/revocation and storage gates. Full independent hosted expired-customer transport remains untested. |
| Marketplace/product request | PASS hosted with owner identity; customer-role repetition pending | Product form generated order 3095a566-9b43-49f0-b3fc-af90655e3d9e at RM21.50, initial DB request PENDING_AVAILABILITY. Form submission used the active owner identity, not a distinct customer login. |
| Availability confirmation | PASS hosted merchant | Explicit merchant PAY_NOW -> PAYMENT_REQUIRED, availability confirmed; no payment submitted or verified. PAY_LATER and rejection controls invoke the same protected RPC; their separate hosted transitions have not run. |
| Packing/shipping/status transitions | PASS isolated SQL; hosted remainder NOT RUN | Synthetic already-paid fixture exercises packing/ready/manual shipping, rollback and exactly-once stock 5 -> 3. Hosted request currently awaits payment; do not mark hosted fulfillment complete. |
| Inventory | PASS hosted adjustment | Synthetic product stock 5 -> 6 -> 5; DB verified restored 5. |
| Trip expenses and Finance | PASS hosted scoped fixtures | Two isolated expenses RM4.50 and RM2.00 persisted; corresponding finance entries visible; immediate-close refresh defect fixed and retested. |
| Reports | PASS hosted scoped reconciliation | Expenses report 4 rows, RM18.50 matches existing RM12 plus new RM6.50; new descriptions present. Sales report shows RM96.50, outstanding RM21.50 including pending synthetic order. Export not tested. |
| Subscription/payment/provider acceptance | DEFERRED | Remains LAST at MYOPS Master. No real payments performed. |
| Production readiness | NO-GO | Independent identities/Storage API and hosted fulfillment outstanding. PR stays draft/unmerged, production approval not requested. |

## Security-test limits and recovery
- A hosted SQL DELETE attempt against storage.objects was rejected by Supabase storage.protect_delete with 42501: Direct deletion from storage tables is not allowed. Use the Storage API instead.
- This guard was not disabled. The corrected rollback-only test inspected effective read/write predicates and executed denied product UPDATE checks under authenticated roles.
- All assertions in the corrected transaction passed. Synthetic auth identities and second business were rolled back; follow-up count of both synthetic auth user IDs was zero.
- This is database role/JWT-claim simulation, not a customer-authenticated browser or Storage HTTP API test.
- Existing advisory findings include authenticated SECURITY DEFINER helper warnings and disabled leaked-password protection. They were not silently changed or represented as new defects caused by this patch.

## Automated verification
- npm test: 246 tests / 43 files PASS.
- npm run lint and npm run typecheck: PASS.
- npm run build: PASS, Expo web export produced dist. Existing non-blocking Vite native-config warning and Expo forced-exit-after-export warning noted; exit code zero.
- npm run test:database: PASS, session/RLS and migration replay checks.
- npm run test:provisioning: PASS, full baseline and shared staging preservation.
- node scripts/test-order-fulfillment.mjs: PASS, isolated already-paid synthetic fixture, no payment provider invoked.
- Restored migration SQL checksums match staging history. Full suite and schema/fulfillment checks reran after recovery.

## Resume without repeating completed work
1. Supply a securely authenticated non-admin customer staging identity and a manager identity in a different business, or an approved authenticated UAT runner. Do not place passwords, cookies or tokens in chat/source/logs.
2. Relaunch through MYOPS staging -> OpsPS stable feature alias. Repeat customer-facing ten-image display, customer mutation-control denial, direct Storage API delete denial (objects must remain), cross-business direct request denial, customer request and session expiry.
3. Complete hosted packing/ready/manual-shipping on a clearly isolated already-paid simulation fixture, without real payments or external courier purchase.
4. Verify final feature head/deployment; then issue a revised GO/NO-GO. Subscription/provider acceptance remains with MYOPS Master last.
5. Merge PR #24 and deploy production only after explicit owner approval and remaining gates pass.

Preserve the two created trips, product and order as labeled staging fixtures; do not modify older UAT records. No actual customer shipment should be created from the synthetic address.
