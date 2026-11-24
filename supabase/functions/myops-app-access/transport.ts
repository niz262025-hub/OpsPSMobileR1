const STEP1_ORIGIN = 'https://southerndotcom-website-git-fix-centr-db9115-mohd-syaiful-nizam1.vercel.app';
const STAGING_PROJECT = 'https://ojamkplflqafedmxbdxb.supabase.co';
import { validateMyopsAuthority } from './provisioning.ts';

// Deployment protection and application authorization remain separate layers.
export async function sendMyopsRequest(origin: string, path: string, init: RequestInit,
  config: { projectUrl: string; shareToken?: string; automationSecret?: string }, send: typeof fetch = fetch): Promise<Response> {
  if (!['/api/app/redeem', '/api/app/entitlement'].includes(path)) throw new Error('Unsupported MYOPS path');
  const headers = new Headers(init.headers);
  const shareToken = config.shareToken?.trim();
  const automationSecret = config.automationSecret?.trim();
  if (automationSecret) {
    if (config.projectUrl !== STAGING_PROJECT || origin !== STEP1_ORIGIN) throw new Error('Staging transport is restricted');
    headers.set('x-vercel-protection-bypass', automationSecret);
  } else if (shareToken) {
    if (config.projectUrl !== STAGING_PROJECT) throw new Error('Staging transport is restricted');
    try {
      validateMyopsAuthority(config.projectUrl, origin);
    } catch {
      throw new Error('Staging transport is restricted');
    }
    const cookies = new Map<string, string>();
    const bootstrap = new URL('/', origin);
    bootstrap.searchParams.set('_vercel_share', shareToken);
    let url = bootstrap;
    let complete = false;
    for (let step = 0; step < 4; step++) {
      const cookie = [...cookies.values()].join('; ');
      const response = await send(url, { method: 'GET', redirect: 'manual', cache: 'no-store', signal: init.signal,
        headers: cookie ? { Cookie: cookie } : {} });
      // Some Edge runtimes expose Set-Cookie only through get().
      const combined = response.headers.get('set-cookie');
      const setCookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : (combined ? combined.split(/,(?=\s*[^;,=]+=)/) : []);
      for (const setCookie of setCookies) {
        const pair = setCookie.split(';', 1)[0];
        cookies.set(pair.split('=', 1)[0], pair);
      }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error('Invalid staging redirect');
        url = new URL(location, url);
        if (url.origin !== origin) {
          console.warn('opsps_staging_redirect_rejected', {
            requestOrigin: origin, status: response.status, destinationOrigin: url.origin,
          });
          await response.body?.cancel();
          throw new Error('Staging redirect rejected');
        }
        // Vercel already issued the protection cookie. Avoid an unnecessary
        // homepage fetch before the signed API request.
        if (cookies.size > 0) {
          await response.body?.cancel();
          complete = true;
          break;
        }
      } else {
        if (!response.ok) throw new Error('Staging access unavailable');
        complete = true;
        break;
      }
    }
    if (!complete || cookies.size === 0) throw new Error('Staging access unavailable');
    headers.set('Cookie', [...cookies.values()].join('; '));
  }
  try {
    return await send(new URL(path, origin), { ...init, headers, redirect: 'error' });
  } catch {
    throw new Error('MYOPS signed transport failed');
  }
}
