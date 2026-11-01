# OpsPS production release preparation — 1 November 2026

The existing production project is `wrsigjhhbkbomtkaqlpw`; keep its tenants and records. No production change has been applied by this preparation.

## Confirmed gaps

- Production migration ledger contains only 001, 002, 003, 009 and 011; the MYOPS binding tables/RPCs are absent.
- No production Edge Functions were listed.
- MYOPS production has no registered `opsp` app client or `MYOPS_APP_URL_OPSP` configuration.
- Existing OpsPS production has one business/profile, two orders and one payment. Preserve these. Never attach a MYOPS identity by matching a browser-supplied email.

## Changes

- Exact project/portal pairs are enforced before signed central requests and Auth provisioning. Production uses `https://www.myops.com.my`; staging keeps its existing portal.
- A service-only additive v2 identity RPC derives identities from the verified reference and project. It cannot claim an existing tenant, grant a subscription or create a platform admin.
- `node scripts/production-upgrade.mjs` generates a transactional upgrade for the verified existing 14-table baseline. It refuses an unexpected ledger/schema or a rerun; historical migrations remain unchanged. It applies missing migrations and records each source version, fixes only unsupported historical syntax and the confirmed customer ownership column mismatch.
- No timer, session lease, entitlement or existing application workflow was changed.

## Validation

- 196 Vitest tests passed; TypeScript and lint passed.
- Fresh-schema SQL tests passed, including service-only production provisioning, wrong-project rejection, idempotence and preservation of an existing tenant.
- Production-upgrade SQL replay passed on a local seeded baseline: all original business/profile/membership/order/payment column values survived; RLS remained enabled; unbound legacy sessions were denied; a repeated upgrade was refused without changing rows.
- Web export passed. Hosted production authentication remains untested until configuration is ready.

## Release sequence

1. Securely configure an OpsPS-specific production Ed25519 signer in Supabase Edge Function secrets (`MYOPS_APP_PRIVATE_KEY_CURRENT`) and its matching public key in the central MYOPS `opsp` app registration. Never reuse the staging signer or paste secrets into chat, source or migration SQL. Set `MYOPS_APP_API_ORIGIN=https://www.myops.com.my`, the matching `MYOPS_APP_ID`, `MYOPS_KEY_VERSION=current`, and `OPSPS_ALLOWED_ORIGINS` to the verified production web origin. Do not set a staging share token in production.
2. Verify all non-secret settings and key presence without reading private key values. The connected Supabase tools do not expose a secrets setter; this step needs secure dashboard/CLI access.
3. Recheck production schema, migration ledger, advisories and data counts immediately before applying the generated upgrade. Do not apply the fresh-install baseline. Apply the upgrade only when the SSO backend can be deployed in the same release window, because it locks legacy unbound sessions.
4. Deploy `myops-app-access` and its relative dependencies to the existing production Supabase project. Its body validates the central signed app session and user bearer token; retain that authentication contract.
5. Build the tested commit against the existing production project configuration; register the verified application URL centrally and promote only the production build.
6. Verify MYOPS login → authorized launch → empty new tenant without second login, existing data isolation, passive refresh, logout to MYOPS and protected API denial. Do not seed dummy records in production.

## Related OpsFlow release

OpsFlow production `dpl_2UYmjzLpEZu29MUgLeJ9zWsUckfj`, commit `c328691987c0607b8b8fea0afd83d87954a8f177`, was promoted to `opsflow.myops.com.my`. Post-release readiness returned HTTP 200 with database reachable; anonymous `/api/auth/me` returned 403; preview-only readiness returned 404; browser `/login` redirected to MYOPS homepage. No error/fatal logs appeared in the queried new deployment window. Authenticated post-release UAT still requires a fresh MYOPS browser session.

## Staging deployment and security review

The additive v2 migration was applied to staging `ojamkplflqafedmxbdxb` only. Edge Function `myops-app-access` version 13 is ACTIVE. SQL verified SECURITY INVOKER, no anon/authenticated EXECUTE, and service_role-only EXECUTE. Before/after security advisors showed the same existing notices: intentional deny-by-default RLS tables without browser policies, existing authenticated SECURITY DEFINER helper warnings, and leaked-password protection disabled. No new advisory finding was introduced. Remediation references: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Review existing helper warnings separately; do not remove helpers needed by current RLS as an unrelated release change.

## Windows setup without clipboard

The connected tools cannot set Edge Function secrets. Browser creation of new credentials requires the owner to enter and submit them; the earlier browser clipboard handoff did not populate the form. Do not retry that clipboard or reuse its pending key. A CLI login requires its verification code in the owner's terminal; never send that code or a CLI token through chat.

Run the following in Windows PowerShell on the owner's computer (Node.js/npm and Git required). The new local folder avoids altering any existing checkout; it does not create another hosted project, branch or database.

```powershell
git clone --single-branch --branch fix/web-first-provisioning https://github.com/niz262025-hub/OpsPSMobileR1.git OpsPS-SSO
cd OpsPS-SSO
npx.cmd --yes supabase@2.81.3 login
node .\scripts\configure-production-sso.mjs
```

Complete Supabase CLI login in the browser/terminal on your own computer. The script uses that CLI login and sends five settings to the exact existing production project only. It generates a new Ed25519 key; never prints the private key or passes it as a process argument; writes its short-lived env file with owner-only permissions and removes it on success/failure. Windows invokes npm's JS launcher directly without shell interpolation. It retains only a public-key receipt (already ignored by the existing *.pem rule), refuses existing signing/staging configuration, and refuses an existing receipt instead of rotating a key blindly. If upload outcome is unknown, keep the public receipt and check metadata rather than rerunning.

On PASS, send only the printed PUBLIC key (BEGIN PUBLIC KEY) or its public receipt for central app registration. Never send a PRIVATE KEY, CLI token, password or verification code. The operator script does not apply migrations, deploy code, alter entitlement or touch existing business rows.

Validation of this helper uses a mock CLI only: exact project scope, actual Ed25519 signing/verification, private temp-file permissions and cleanup on both success/failure, retained public receipt, refusal to overwrite an existing signer and safe suppression of arbitrary CLI output. It has not been used to write production secrets yet.
