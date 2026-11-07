export function trialWriteMessage(error: unknown): string | null {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  if (message === 'Trial projects limit reached (2). Upgrade in MYOPS.') return 'Your free trial includes a maximum of 2 trips. Upgrade your subscription in MYOPS to create more trips. Your existing data is kept.';
  if (message === 'Trial transactions limit reached (30). Upgrade in MYOPS.') return 'Your free trial includes a maximum of 30 transactions (orders and manual finance entries combined). Upgrade your subscription in MYOPS to continue. Your existing data is kept.';
  return null;
}
