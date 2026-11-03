// MYOPS Malaysia reports use Malaysia business dates, independent of device/server timezone.
export function reportDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(date);
  const part=(type:string)=>parts.find(entry=>entry.type===type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function reportMonthRange(now=new Date()) {
  const to=reportDate(now);
  return {from:`${to.slice(0,7)}-01`,to};
}
