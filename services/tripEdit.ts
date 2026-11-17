import { isCalendarDate } from './calendarDate';
export function validateTripEdit(input: { name: string; destination: string; tripDate: string; budget: string; status: string }) {
  if (!input.name.trim() || !input.destination.trim() || input.name.trim().length > 200 || input.destination.trim().length > 300 || !isCalendarDate(input.tripDate)) throw new Error('Enter a trip name, destination and valid calendar date.');
  if (!/^\d+(\.\d{1,2})?$/.test(input.budget.trim()) || Number(input.budget) > 999999999999.99) throw new Error('Budget must be a non-negative amount with at most two decimal places.');
  if (!['planning', 'open', 'closed'].includes(input.status)) throw new Error('Invalid trip status.');
  return { name: input.name.trim(), destination: input.destination.trim(), tripDate: input.tripDate, budget: Number(input.budget), status: input.status as 'planning' | 'open' | 'closed' };
}
