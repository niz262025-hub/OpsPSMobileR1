import {describe,it,expect,vi} from 'vitest';
import {getDataSource} from '../services/repository';
import {getSupabaseClient} from '../services/supabaseClient';
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:vi.fn()}));
describe('trip profitability ledger reconciliation',()=>{
 it('deducts each cost once and separates product costs from trip expenses',async()=>{
  const rows=[{type:'income',amount:60,category:'Payment Received'},{type:'expense',amount:15,category:'Cost of Goods'},{type:'expense',amount:10,category:'Trip Expense'}];
  vi.mocked(getSupabaseClient).mockReturnValue({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:(table:string)=>{
   const result={data:table==='orders'?[{total:60,order_status:'shipped'}]:rows,error:null};
   const q:any={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{business_id:'business'}}),then:(resolve:any)=>Promise.resolve(result).then(resolve)};return q;
  }} as any);
  const summary=await getDataSource('production').finance.getTripSummary('business','trip');
  expect(summary).toMatchObject({salesRevenue:60,costOfGoods:15,grossProfit:45,moneyIn:60,moneyOut:25,netProfit:35,outstandingRevenue:0});
 });
});
