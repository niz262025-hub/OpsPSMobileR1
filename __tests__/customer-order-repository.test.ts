import { beforeEach, describe, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({client:null as any,rpc:vi.fn(),fields:[] as string[],uid:'buyer'}));
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:()=>m.client}));
import { getDataSource } from '../services/repository';
const order={id:'order-a',business_id:'seller',customer_profile_id:'profile-b',customer_name:'UAT Buyer',total:43,created_at:'2026-11-16T00:00:00Z'};
beforeEach(()=>{
 vi.clearAllMocks();m.fields=[];m.uid='buyer';
 m.client={auth:{getUser:async()=>({data:{user:m.uid?{id:m.uid}:null},error:null})},rpc:m.rpc,from:(table:string)=>{
  const filters:Record<string,unknown>={};
  const rows=()=>table==='profiles'?[{id:'profile-b'}]:table==='products'?[{id:'product',business_id:'seller',trip_id:'trip',is_published:true,selling_price:21.5}]:table==='product_variants'?[{id:'variant',business_id:'seller',product_id:'product',stock:10}]:table==='orders'?[order].filter(o=>!filters.customer_profile_id||o.customer_profile_id===filters.customer_profile_id):[];
  const q:any={select:()=>q,eq:(field:string,value:unknown)=>{m.fields.push(field);if(field==='customer_id')throw Error('Column does not exist');filters[field]=value;return q;},maybeSingle:async()=>({data:rows()[0]??null,error:null}),then:(resolve:any)=>Promise.resolve({data:rows(),error:null}).then(resolve)};
  return q;
 }};
 m.rpc.mockResolvedValue({data:order,error:null});
});
const request={businessId:'seller',tripId:'trip',productId:'product',productVariantId:'variant',customerName:'UAT Buyer',customerPhone:'0120000000',deliveryAddress:'UAT TEST ONLY',quantity:2,paymentMethod:'bank'};
describe('real customer order schema and atomic write',()=>{
 it('creates a verified request through one atomic RPC, never separate table inserts',async()=>{
  expect(await getDataSource('production').orders.create(request)).toMatchObject({id:'order-a',total:43});
  expect(m.rpc).toHaveBeenCalledOnce();
  expect(m.rpc).toHaveBeenCalledWith('opsps_create_customer_order',expect.objectContaining({p_business_id:'seller',p_product_id:'product',p_variant_id:'variant',p_quantity:2}));
 });
 it('does not report success after a server transaction failure',async()=>{
  m.rpc.mockResolvedValue({data:null,error:{message:'item insert denied'}});
  expect(await getDataSource('production').orders.create(request)).toBeNull();
 });
 it('requires sign-in before creating an order',async()=>{
  m.uid='';expect(await getDataSource('production').orders.create(request)).toBeNull();expect(m.rpc).not.toHaveBeenCalled();
 });
 it('rejects fractional quantities before making a server request',async()=>{
  expect(await getDataSource('production').orders.create({...request,quantity:1.5})).toBeNull();expect(m.rpc).not.toHaveBeenCalled();
 });
 it('lists and opens orders using the authenticated customer_profile_id',async()=>{
  expect(await getDataSource('production').orders.listForCustomer('profile-b')).toHaveLength(1);
  expect(await getDataSource('production').orders.getForCustomer('profile-b','order-a')).toMatchObject({id:'order-a'});
  expect(m.fields).toContain('customer_profile_id');expect(m.fields).not.toContain('customer_id');
 });
 it('rejects another customer identity even when supplied by the caller',async()=>{
  expect(await getDataSource('production').orders.listForCustomer('profile-c')).toEqual([]);
  expect(await getDataSource('production').orders.getForCustomer('profile-c','order-a')).toBeNull();
 });
});
