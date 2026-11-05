import { Buffer } from 'node:buffer';
import { generateKeyPairSync, sign, verify } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { log, error as logError } from 'node:console';

export const projectRef = 'wrsigjhhbkbomtkaqlpw';
const cliVersion = '2.81.3';
const publicSettings = {
  MYOPS_APP_ID: 'opsp',
  MYOPS_APP_API_ORIGIN: 'https://www.myops.com.my',
  MYOPS_KEY_VERSION: 'current',
  OPSPS_ALLOWED_ORIGINS: 'https://opsp-mobile-r1.vercel.app',
};
function defaultRun(args) {
  const cliArgs = ['--yes', `supabase@${cliVersion}`, ...args];
  if (process.platform === 'win32') {
    // Invoke npm's JS launcher directly: Windows .cmd files require a shell.
    // This keeps secret file paths out of shell interpolation entirely.
    const candidates = [join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js'),
      ...(process.env.APPDATA ? [join(process.env.APPDATA, 'npm', 'node_modules', 'npm', 'bin', 'npx-cli.js')] : [])];
    const launcher = candidates.find(path => existsSync(path));
    if (!launcher) return { status: 1 };
    return spawnSync(process.execPath, [launcher, ...cliArgs],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: false });
  }
  return spawnSync('npx', cliArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: false });
}
function listSecrets(run) {
  const result = run(['secrets', 'list', '--project-ref', projectRef, '--output', 'json']);
  if (result.status !== 0) throw new Error('Supabase CLI access unavailable. Run npx --yes supabase@2.81.3 login locally, then verify the setup before retrying.');
  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch { throw new Error('Unrecognized CLI response; no key rotation attempted.'); }
  const entries = Array.isArray(parsed) ? parsed : parsed?.secrets;
  if (!Array.isArray(entries) || entries.some(entry => typeof entry?.name !== 'string')) throw new Error('Unrecognized secret metadata; no key rotation attempted.');
  return entries;
}

// Run on the owner's computer with their own CLI login. No access token is accepted
// as a command argument, and no private key or CLI output is printed.
export function configureProductionSso({ run = defaultRun, directory = process.cwd() } = {}) {
  const publicPath = resolve(directory, 'opsps-production-public-key.pem');
  if (existsSync(publicPath)) throw new Error('Public-key receipt already exists. Do not rotate or overwrite it; verify the earlier setup first.');
  const before = listSecrets(run);
  if (before.some(entry => ['MYOPS_APP_PRIVATE_KEY_CURRENT', 'MYOPS_APP_PRIVATE_KEY_NEXT', 'MYOPS_APP_PRIVATE_KEY', 'MYOPS_STAGING_SHARE_TOKEN'].includes(entry.name))) {
    throw new Error('Existing MYOPS signing/staging configuration detected; refusing to overwrite or rotate it.');
  }
  const pair = generateKeyPairSync('ed25519');
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' });
  const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const probe = Buffer.from('opsps-production-key-self-test');
  if (!verify(null, probe, pair.publicKey, sign(null, probe, pair.privateKey))) throw new Error('Signing self-test failed.');
  // Public receipt is retained even if upload fails, so a partial upload can be
  // reconciled without another rotation. Only the private temporary file is erased.
  writeFileSync(publicPath, publicKey, { mode: 0o600, flag: 'wx' });
  const temporary = mkdtempSync(join(tmpdir(), 'opsps-sso-'));
  const envPath = join(temporary, '.env');
  try {
    const lines = Object.entries({ ...publicSettings, MYOPS_APP_PRIVATE_KEY_CURRENT: privateKey })
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`).join('\n') + '\n';
    writeFileSync(envPath, lines, { mode: 0o600, flag: 'wx' });
    const result = run(['secrets', 'set', '--project-ref', projectRef, '--env-file', envPath]);
    if (result.status !== 0) throw new Error('Secret upload was not confirmed. Keep the public-key receipt and check the dashboard; do not rerun or rotate blindly.');
    const after = listSecrets(run);
    if (![...Object.keys(publicSettings), 'MYOPS_APP_PRIVATE_KEY_CURRENT'].every(name => after.some(entry => entry.name === name))) {
      throw new Error('Secret metadata verification is incomplete. Keep the public-key receipt; do not rotate.');
    }
    return { publicPath, publicKey: readFileSync(publicPath, 'utf8'), secretCount: 5, projectRef };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = configureProductionSso();
    log(`PASS: ${result.secretCount} settings saved to OpsPS Production (${result.projectRef}).`);
    log('Send only this PUBLIC key for central registration. Never send a private key or CLI token.');
    log(result.publicKey);
    log(`Public-key receipt: ${result.publicPath}`);
  } catch (error) {
    logError(error.message);
    process.exitCode = 1;
  }
}
