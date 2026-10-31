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

## Signing transport verified — 1 November 2026

The owner explicitly approved replacement of the expired staging link. Only the
expired MYOPS staging Shareable Link was regenerated with ttl=82800 seconds;
its new expiry is 1793555490. Other links and Production were not changed.
The signing private key and renewed transport token are saved in Supabase Secrets
without printing their values. Six custom settings are now configured. The
matching Ed25519 public key is registered for app_id=opsp/product_slug=opsp and
enabled only in MYOPS staging wengxxiqwtosirealghx. No production key was rotated.

Runtime debugging identified the actual pre-network failure: WebCrypto sign()
returns ArrayBuffer, while the old encoder iterated it as Uint8Array. The shared
encoder now accepts both representations. A real Ed25519 sign/encode/decode/verify
regression test verifies the signature and rejects changed payloads. Central
401/403 JSON denial is now handled as denial, allowing session revocation, while
503/non-JSON/array responses still fail closed.

The temporary bootstrap avoids fetching the homepage once Vercel issues a
same-origin protection cookie, and supports Edge Headers without getSetCookie.
Cross-origin redirects, missing cookies, other project/origin combinations and
loops remain denied. Diagnostics log only static categories; no request secrets.

Validation PASS: 154 tests, TypeScript and lint. Supabase myops-app-access ACTIVE
version 11. Hosted dummy redeem from the approved OpsPS preview returns HTTP 403
MYOPS access denied. MYOPS staging records two verified app nonces for opsp,
confirming actual Ed25519 authentication before invalid-ticket denial. This proves
signed transport and unknown-ticket denial, not authenticated dashboard UAT.

MYOPS preview environment now includes MYOPS_APP_URL_OPSP pointing at the
existing OpsPS branch alias. Exact existing MYOPS source 13db24bebf6216d0ece589cb1b629858fb2f6793
was rebuilt as staging dpl_APkdbjHTepwuweGoUMRZbbPLYDGU (READY).
OpsPS web preview remains dpl_5f8jLtD1ZGJcnUANAfViXcNfuuq5.
OpsFlow preview transport was renewed using the same approved temporary link;
existing tested code f8eccc2fd06f6fae1d3cd1c1a4ec88a6e104bc6b is rebuilding as
dpl_C6KXShtcBnEVjF3pziDSwKJKv66J. No inactivity timer changes.

Remaining: real MYOPS staging login, verified identity mapping/provisioning for
the empty OpsPS database, dashboard/workflow UAT and logout/revocation checks.
OpsFlow real company onboarding UAT also remains pending. No full app PASS or
Production release is claimed.

## Browser continuation — 1 November 2026 Malaysia

MYOPS staging signed-in UI was observed with My Account, Admin and Logout.
The actual OpsPS Open App action reached the OpsPS launch denial screen;
no authenticated OpsPS dashboard PASS is claimed. Read-only shared staging
counts: identity_links=0, profiles=0, app_sessions=0. Verified identity
provisioning remains required; no local Auth account or tenant was fabricated.

A separate confirmed navigation bug was reproduced: Kembali ke MYOPS on the
OpsPS launch denial opened www.myops.com.my in a new tab during staging UAT.
The button now calls the existing strict returnToMyops helper, preserving the
configured exact staging portal and replacing the same tab. Source commit
518e5237fb16c1a4602b2bea303f502406e7a0c9 on fix/web-first-provisioning.
Git-triggered preview dpl_2CPGQJZDQP5A5NdWTJHecoNa9s8P is READY; no duplicate
deployment was created. Browser reload on the branch alias and button click
confirmed same-tab navigation to the exact MYOPS staging root.

Validation: 154 tests PASS, TypeScript PASS, lint PASS, Expo web export PASS.
Prior commit 33969ff GitHub Actions run10 SUCCESS; current commit 518e523 run11 SUCCESS. OpsFlow preview dpl_C6KXShtcBnEVjF3pziDSwKJKv66J READY.
Browser Open App for OpsFlow also reached its launch denial screen; company
onboarding remains untested. No Production, timer, subscription or RLS changes.

## SSO repairs and verified first launch — 1 November 2026 Malaysia

OpsFlow's stable staging branch alias still referenced dpl_4To5R97zBGynwrUK1sucvVruQLnA
(source f61772bd), while tested source f8eccc2f was READY at dpl_C6KXShtcBnEVjF3pziDSwKJKv66J.
Reassigned only that existing staging branch alias to the tested deployment.
No build, share-link creation, Production alias or Production environment change.
Browser /api/sso-ready returned ready=true, signed_transport=verified and
unknown_session=denied. Actual MYOPS Open App then reached OpsFlow /app with
MYOPS Staging UAT admin, zero-value dashboard and Logout; no second login.
This verifies SSO and dashboard, not full module acceptance.

OpsPS previously rejected every new user because its empty database required an
operator-created identity link. After a verified central redeem, staging-only
first launch now derives a deterministic internal Auth UUID and reserved .invalid
alias from the app-specific opaque reference. Admin API creates a passwordless
internal identity, with confirmed internal alias and server-owned app_metadata.
Existing linked accounts are unchanged; conflicting metadata fails closed.
No user email is matched or trusted, no message/email is sent, and no central
subscription/feature entitlement or platform-admin access is created.

A service-only SECURITY INVOKER RPC atomically creates one empty My OpsPS tenant,
its founder profile/membership and identity link. It locks by opaque reference,
validates the deterministic staging identity, rejects attaching preexisting local
profiles/tenants, and is idempotent. New tenant contains no products/orders/payments
or subscriptions. Existing RLS, bound central session rechecks, expiry and server
checks remain enforced. Automatic provisioning is refused on every other project.
Production rollout remains subject to separate approval.

Local validation: 161 tests PASS; TypeScript and lint PASS; full fresh/shared
provisioning and session/RLS suites PASS. Tests include wrong-project/reference,
metadata collision, failed-database retry, wrong returned identity, browser RPC
denial, transaction/idempotence and zero business transaction/subscription rows.
Migration installed on shared staging only; hosted authenticated acceptance pending
Edge Function update and browser retest. Frontend is unchanged from 518e523.

## Hosted acceptance results — 1 November 2026 Malaysia

Commit 0027f8e664c73cca13682b96ff165daf047ce43f pushed to existing
fix/web-first-provisioning, PR #5 updated in place (draft, not merged).
GitHub Actions run12 SUCCESS. Git-triggered preview dpl_3FBHi825tNANd4fSbcTR4i4BWv5s READY.
Supabase myops-app-access v12 ACTIVE; additive provisioning migration applied.

Browser MYOPS Open App → OpsPS /dashboard PASS, no second login. Exactly one
identity link, profile, business and membership; zero products/orders/subscriptions.
Manual Settings Logout → MYOPS staging root PASS without dialog/new tab. Hosted
app session revoked_at and valid_until both 2026-10-31T19:36:32.483Z. Reopen
MYOPS → OpsPS dashboard PASS: still one tenant/identity; two issued sessions,
one revoked and one valid. No fresh 15-minute browser idle test was performed.

Hosted RPC grant checks: anon=false, authenticated=false, service_role=true.
Public tables without RLS=0. Security advisors unchanged from before provisioning:
eight server-only no-policy informational findings, seven existing authenticated
SECURITY DEFINER helper warnings. No new advisor findings.

OpsFlow alias repair and actual central SSO/dashboard also PASS as above.
Full app transaction/report/payment-proof acceptance remains pending; these
results certify the repaired SSO flows, not overall Production readiness.

## Transaction UAT continuation — 1 November 2026 Malaysia

OpsFlow browser and read-only database acceptance PASS on existing tested staging:
product UAT-NOV01-001, opening stock 10 at cost RM10/selling RM20; POS sale
S76119109 for two units, subtotal RM40 + tax RM2.40 = RM42.40; stock 8 and
cash ledger +RM42.40. Reports remain correct after protected-page reload.
Purchase PO76175228 for five units at RM10 totals RM50. Receive6 was denied
against outstanding5. Partial receipt GR76235845 (2 units/RM20), final receipt
GR76261508 (3 units/RM30); status Fully Received, no receive action remains.
Final stock13; Reports sales RM42.40/purchases RM50; Finance cash flow RM42.40.
Logout returned directly to MYOPS staging. Data is clearly labelled disposable UAT.
OpsFlow automated checks: 28 frontend and29 backend tests PASS; TypeScript, lint,
web export, gateway/tenant/RLS/atomicity and onboarding suites PASS. No OpsFlow
code change or deployment was needed. Core transaction paths passed; role/invite
and full business acceptance remain separate gates.

OpsPS new hosted UAT found an intermittent founder→customer misroute. Database
profile and membership remained founder, while the auth listener hydrated a prior
expired session in parallel with the new verified launch. Missing scoped rows
fell back to role customer and made the route change before launch hydration ended.
The listener no longer queries Supabase inside its synchronous auth callback;
verified restore/launch owns scope hydration. Role resolution now requires matching
server profile, membership, business and user; incomplete/mismatched scope fails
closed instead of inventing customer role. Token notifications only update an
existing matching local token; no entitlement/RLS/session duration is relaxed.

The observed customer screen also showed hardcoded08/03/05 counts and fake
Updated today statuses. It now loads only the current customer profile's actual
orders, shows empty state, and returns non-customer roles through normal entry.
Regression tests reproduce old INITIAL_SESSION arriving before redeem resolves,
verify synchronous/no-query callbacks and incomplete-scope denial, validate
identity mismatch denial, and test empty/owned customer counts and founder redirect.
169 tests, TypeScript, lint and web export PASS. Hosted repair retest pending.

OpsPS c166d818 staging dpl_2ibRmz3rnKfrV6iHw5Ley6e2Pe6c READY, GitHub CI run13
SUCCESS. Browser reopen now reached founder /dashboard; Trips and trip creation
worked with real staging RLS. Product 05ff76fd-efdc-4fc9-847a-35dcef57a036
(UAT OpsPS Dummy Tee), cost RM15/selling RM30, sizeM/stock5, was stored with the
selected trip. No production or entitlement change.

Trip date UAT found two confirmed failures: native date-picker control did not
open on Web, and the displayed01Nov2026 was stored as31Oct2026 in trip
0bd0c707-008c-4133-854e-bafd5f97d835 because toISOString converted the local
after-midnight date to UTC. Keep that dummy row as failure evidence; do not
silently change it. Trip creation now stores YYYY-MM-DD directly, uses a native
HTML date input on Web and keeps the existing native picker for Phase2. Tests
cover Asia/Kuala_Lumpur after-midnight, selected-day round trip, malformed dates
and leap days. 177 tests, TypeScript, lint and web export PASS. Hosted selected
future-day save/reload acceptance remains pending deployment.

## OpsPS payment workflow UAT repair

Hosted order52380acd-abee-4025-9aa6-2a4913f40977 created from the actual product
page for two units/RM60 after invalid-phone denial. Database confirms subtotal60,
total60, pending payment and PENDING_AVAILABILITY. Order view resolves stock
availability but exposed no payment evidence or packing actions, blocking the
rest of UAT. Added a panel using existing private payment-proofs storage and
existing repository submission/verification functions. Submission remains
unverified; only owner/admin UI can explicitly verify, with database RLS intact.
Files accept PNG/JPEG/WebP/PDF <=5MB; scoped private paths follow existing
tenant/user policies and previews are short-lived. PDF inline preview remains
unavailable in this panel; PNG is used for hosted proof UAT. No transfer, checkout
or external payment provider is invoked. Existing packing/shipping routes are
linked from the order's permitted stage; no duplicate transaction system.

Schema inspection confirms orders.customer_id does not exist. Removed that
legacy field from the two payment reads; tests now reject any such select. A
regression test also proved verification left request_status unchanged, so
verification now records PAYMENT_RECEIVED alongside payment_received. Order
availability preview is limited to pending orders to preserve later stages.
Tests cover explicit owner verification, no customer verification, missing
evidence refusal, rejected-repository results, private file MIME/size/scope and
non-public previews. All changes are staging source only; no DB/RLS change.

The first browser future-date fill changed the DOM value but reset on another
field edit (rowd732198a-19e5-4174-a51e-3e332fdcc3cf remained01Nov). A component
regression reproduced this tracked input event; the date control now also
handles onInput directly. The ordinary/native and tracked event tests both
require02Nov in the submitted payload. Hosted selected-date retest remains a gate.
187 tests, TypeScript, lint and Expo web export PASS. Hosted payment and date
acceptance pending the next preview, not certified by these automated results.


### Payment verification UAT repair — 2026-10-31

Hosted dummy order RM60: private PNG proof upload succeeded; submit failed with PostgreSQL `payments_payment_status_check`, which still rejected the existing `submitted` lifecycle. No payment or income was created by that failed submit.

The migration reconciles the obsolete check with the validated direct-payment check, replaces recursive order UPDATE lookups with an immutable scope trigger, and removes the superseded recursive payment UPDATE policy. Existing membership policies, private proof storage and MYOPS active-session RLS remain in force. A SECURITY INVOKER RPC verifies the evidence/amount and atomically changes payment, order and trip-linked income; authenticated founder/admin only, verifier derived from auth.uid().

Local verification: 187 unit/component tests passed; real PostgreSQL-compatible payment integration passed owner verification, repeat/idempotence, immutable scope, full rollback on ledger failure, and other-user/expired/anonymous denials. Database session and fresh/shared provisioning suites passed. Hosted migration and browser verification must be confirmed separately; this section does not certify those or Production.


### Hosted payment PASS; packing repair — 2026-10-31

Migration `reconcile_opsps_payment_verification` applied only to shared staging. All 23 public tables retain RLS; new functions are SECURITY INVOKER. Security-advisor counts unchanged (8 server-only no-policy info, 7 legacy helper warnings, 1 existing leaked-password setting). Preview a3ee47c READY; GitHub Actions web job 124649778534 succeeded including the payment integration suite.

Browser resubmitted the existing dummy proof: payment 20cb20b5-7100-44ea-99ed-86b8801dafc2 was submitted/unverified, then owner verification set paid/verified, order PAYMENT_RECEIVED and exactly one RM60 income with trip/order links. No actual money moved.

Packing failed because order_items lacked an UPDATE policy; staging now permits founder/admin changes only to packed_quantity on paid packing orders, with immutable item scope and quantity bounds. Browser retest stored 2/2 packed. Mark Ready then exposed an existing client bug saving packing again; SECURITY INVOKER finish-packing RPC now checks all items under locks before ready. Local integration passes incomplete-order denial and correct ready transition; hosted final retest pending deployment. Shipping and stock effects remain untested.
