import { expect, it } from 'vitest';
import { allowedOpspsOrigins, OPSPS_GALLERY_STAGING_ORIGIN } from '../supabase/functions/myops-app-access/origins';
it('allows the exact gallery branch only on the approved staging database', () => {
  const origins = allowedOpspsOrigins('https://ojamkplflqafedmxbdxb.supabase.co', ' https://existing.example ,');
  expect(origins).toContain(OPSPS_GALLERY_STAGING_ORIGIN);
  expect(origins).toContain('https://existing.example');
  expect(origins).not.toContain('https://untrusted.vercel.app');
  expect(origins).not.toContain(OPSPS_GALLERY_STAGING_ORIGIN + '.evil.example');
});
it('does not add preview origins to production or an unknown project', () => {
  for (const project of ['https://wrsigjhhbkbomtkaqlpw.supabase.co', '', 'https://unknown.supabase.co']) {
    expect(allowedOpspsOrigins(project, 'https://approved.example')).toEqual(['https://approved.example']);
  }
});
