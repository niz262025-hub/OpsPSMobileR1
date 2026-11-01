# OpsPS SSO setup from Safari on iPhone

This manual workflow configures five SSO settings for the existing OpsPS production Supabase project `wrsigjhhbkbomtkaqlpw`. It does not migrate a database, deploy the web app, activate subscriptions or modify business data.

The workflow lives on main so GitHub exposes Run workflow. It executes only from main after the explicit confirmation checkbox, uses the existing Production environment with required owner review, and checks out the exact reviewed setup commit `21db665d9c77cb460840dd15466d9afe7da36c09` (CI #23 passed). No other branch or pull-request code is executed with the token. Actions and Supabase CLI are pinned; the token is available only in the setup step.

## Owner steps on iPhone

1. In Safari, sign in to Supabase and open Account -> Access Tokens. Create a short-lived token named OpsPS SSO Setup (choose the shortest expiry offered and only the existing OpsHub organization if organization scope is offered). Keep it on your phone; never send it in chat. The token authorizes management API operations for the resources allowed by its scopes, so review them before creating it.
2. In GitHub, open this repository -> Settings -> Environments -> Production -> Add environment secret. Name: `SUPABASE_ACCESS_TOKEN`; paste the token as its value and save. Use Safari Request Desktop Website if GitHub hides Settings.
3. Open Actions -> OpsPS - Configure Production SSO -> Run workflow. Choose main, check the confirmation and run it.
4. Open the run -> Review deployments -> select Production -> Approve and deploy. Review the exact source commit before approving.
5. When setup succeeds, the only output artifact is `opsps-production-public-key`. It contains a PUBLIC key; the private key is never logged or uploaded. Retain this receipt for central MYOPS registration. If a run fails after upload started, retain its public receipt and report the error; do not generate another key blindly.
6. Once setup is confirmed, remove this one-time GitHub environment token and revoke the temporary Supabase access token. The application signing key stays encrypted in Supabase and does not depend on that management token.

The reviewed helper refuses existing signing/staging configuration and a previous local public receipt rather than rotating a key. Its private temporary env file is owner-only and deleted on success/failure. No secrets are passed as process arguments; arbitrary CLI output is suppressed. Failure before a key is made may have no artifact. The workflow has not yet been run with a production management token.

After the secret setup, the engineer registers the matching public key centrally, rechecks schema/data, applies the tested incremental upgrade and deploys SSO/web in one release window, followed by live UAT. Existing business rows must be preserved and identity must never be matched by browser email or company name.
