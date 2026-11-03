// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calendarDateForPicker, isCalendarDate, localCalendarDate } from '../services/calendarDate';
afterEach(()=>vi.unstubAllEnvs());
describe('trip date-only values',()=>{
 it('keeps Malaysia after-midnight date instead of saving the previous UTC day',()=>{
  vi.stubEnv('TZ','Asia/Kuala_Lumpur');const now=new Date('2026-10-31T19:00:00Z');
  expect(now.toISOString().slice(0,10)).toBe('2026-10-31');expect(localCalendarDate(now)).toBe('2026-11-01');
 });
 it('round trips a chosen date through the native picker without changing the day',()=>{
  vi.stubEnv('TZ','Asia/Kuala_Lumpur');expect(localCalendarDate(calendarDateForPicker('2026-11-02'))).toBe('2026-11-02');
 });
 it.each(['','2026-02-30','2026-13-01','01/11/2026','2026-11-1'])('rejects invalid calendar value %s',value=>{expect(isCalendarDate(value)).toBe(false);expect(()=>calendarDateForPicker(value)).toThrow();});
 it('accepts leap day only in leap years',()=>{expect(isCalendarDate('2028-02-29')).toBe(true);expect(isCalendarDate('2026-02-29')).toBe(false);});
});
