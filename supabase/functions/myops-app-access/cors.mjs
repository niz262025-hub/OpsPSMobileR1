const PRODUCTION_PROJECT = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
const PRODUCTION_WEB_ORIGIN = 'https://opsps.myops.com.my';

// Keep existing configured clients during the custom-domain migration. The
// canonical production origin must never be implicitly admitted in staging.
export function allowedOpspsOrigins(projectUrl, configuredOrigins = '') {
  const allowed = configuredOrigins.split(',').map(value => value.trim()).filter(Boolean);
  if (projectUrl === PRODUCTION_PROJECT) allowed.push(PRODUCTION_WEB_ORIGIN);
  return [...new Set(allowed)];
}
