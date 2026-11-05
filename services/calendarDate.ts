// Date-only business fields must not be converted through UTC.
export function localCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(year,month-1,day,12);
  return year>=1000 && date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day;
}
export function calendarDateForPicker(value: string): Date {
  if (!isCalendarDate(value)) throw new Error('Invalid trip date');
  const [year,month,day]=value.split('-').map(Number);
  return new Date(year,month-1,day,12);
}
