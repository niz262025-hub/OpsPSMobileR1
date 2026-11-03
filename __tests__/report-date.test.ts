import {describe,it,expect} from 'vitest';
import {reportDate,reportMonthRange} from '../services/reportDate';
import {buildReport,type ReportDataset} from '../services/reporting';
describe('Malaysia reporting dates',()=>{
 it('keeps date-only fields and converts UTC midnight boundaries',()=>{
  expect(reportDate('2026-10-31')).toBe('2026-10-31');
  expect(reportDate('2026-10-31T15:59:59Z')).toBe('2026-10-31');
  expect(reportDate('2026-10-31T16:00:00Z')).toBe('2026-11-01');
  expect(reportMonthRange(new Date('2026-10-31T20:00:00Z'))).toEqual({from:'2026-11-01',to:'2026-11-01'});
 });
 it('includes a Malaysia November order in November, not October',()=>{
  const data:ReportDataset={orders:[{id:'o',businessId:'b',customerName:'Dummy',orderDate:'2026-10-31T20:00:00Z',total:60,status:'shipped'}],orderItems:[],productVariants:[],products:[],trips:[],financeTransactions:[],payments:[]};
  const nov=buildReport('sales',data,'2026-11-01','2026-11-30','b');
  expect(nov.summary['Total Sales']).toBe(60);expect(nov.rows[0].Date).toBe('2026-11-01');
  expect(buildReport('sales',data,'2026-10-01','2026-10-31','b').rows).toHaveLength(0);
 });
});
