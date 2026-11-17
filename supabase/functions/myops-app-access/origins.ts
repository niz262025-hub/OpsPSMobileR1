// Exact reviewed preview origins only; never accept arbitrary Vercel hosts.
export const OPSPS_GALLERY_STAGING_ORIGIN = 'https://opsp-mobile-r1-git-feat-web-gallerie-273940-mohd-syaiful-nizam1.vercel.app';
export function allowedOpspsOrigins(projectUrl: string, configured = ''): string[] {
  const origins = configured.split(',').map(value => value.trim()).filter(Boolean);
  if (projectUrl === 'https://ojamkplflqafedmxbdxb.supabase.co') {
    origins.push(OPSPS_GALLERY_STAGING_ORIGIN);
    origins.push('https://opsp-mobile-r1-plzs0e8yj-mohd-syaiful-nizam1.vercel.app');
  }
  return [...new Set(origins)];
}
