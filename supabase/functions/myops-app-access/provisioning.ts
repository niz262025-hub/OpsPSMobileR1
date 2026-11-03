// Only verified central redeem responses may call this server-side adapter.
const STAGING_PROJECT = 'https://ojamkplflqafedmxbdxb.supabase.co';
const PRODUCTION_PROJECT = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
const STAGING_MYOPS = 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app';
export function centralCompanyLabels(value:unknown):{name:string;company:string} {
  const profile=value as Record<string,unknown>|null;
  const name=typeof profile?.display_name==='string'?profile.display_name.trim():'';
  const company=typeof profile?.company_name==='string'?profile.company_name.trim():'';
  if(!name||name.length>100||!company||company.length>200)throw new Error('Complete your company profile in MYOPS.');
  return {name,company};
}

export function validateMyopsAuthority(projectUrl: string, origin: string): void {
  if (!((projectUrl === STAGING_PROJECT && origin === STAGING_MYOPS)
    || (projectUrl === PRODUCTION_PROJECT && origin === 'https://www.myops.com.my'))) {
    throw new Error('OpsPS identity provisioning is unavailable');
  }
}

type IdentityUser = { id: string; email?: string; email_confirmed_at?: string; app_metadata: Record<string, unknown> };
type NewIdentity = { id: string; email: string; email_confirm: true; app_metadata: Record<string, string> };
export type IdentityStore = {
  getUser(id: string): Promise<IdentityUser | null>;
  createUser(input: NewIdentity): Promise<IdentityUser | null>;
  provision(userRef: string, userId: string): Promise<string>;
};

export async function ensureVerifiedMyopsIdentity(userRef: string, projectUrl: string, store: IdentityStore, origin: string): Promise<string> {
  validateMyopsAuthority(projectUrl, origin);
  if ( !/^[A-Za-z0-9_-]{43}$/.test(userRef)) {
    throw new Error('OpsPS identity provisioning is unavailable');
  }
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`opsps-myops:${projectUrl}:${userRef}`)));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  const email = `myops-${hex.slice(0,32)}@opsps.invalid`;
  let user = await store.getUser(id);
  if (!user) {
    // A retry/concurrent launch reuses the same internal Auth identity; no email is sent.
    try {
      user = await store.createUser({ id, email, email_confirm: true,
        app_metadata: { identity_provider: 'myops', myops_user_ref: userRef } });
    } catch {
      user = await store.getUser(id);
    }
  }
  if (!user || user.id !== id || user.email !== email || !user.email_confirmed_at
    || user.app_metadata.identity_provider !== 'myops' || user.app_metadata.myops_user_ref !== userRef) {
    throw new Error('OpsPS identity conflict');
  }
  const linkedId = await store.provision(userRef, id);
  if (linkedId !== id) throw new Error('OpsPS identity conflict');
  return id;
}

// Retain the existing staging adapter for callers pinned to that environment.
export function ensureVerifiedStagingIdentity(userRef: string, projectUrl: string, store: IdentityStore): Promise<string> {
  return ensureVerifiedMyopsIdentity(userRef, projectUrl, store, STAGING_MYOPS);
}
