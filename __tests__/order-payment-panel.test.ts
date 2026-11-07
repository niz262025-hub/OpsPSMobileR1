import React,{act} from 'react';
const {createRoot}=require('react-dom/client') as {createRoot:(node:Element)=>{render:(node:React.ReactNode)=>void;unmount:()=>void}};
import {afterEach,describe,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({role:'founder',get:vi.fn(),submit:vi.fn(),verify:vi.fn(),changed:vi.fn()}));
vi.mock('../context/AuthContext',()=>({useAuth:()=>({role:m.role,user:{id:'owner'}})}));
vi.mock('../services/repository',()=>({getDataSource:()=>({payments:{getByOrder:m.get,submitDirectQrPayment:m.submit,verifyDirectQrPayment:m.verify}})}));
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:()=>null}));
import OrderPaymentPanel from '../components/OrderPaymentPanel';
let root:ReturnType<typeof createRoot>|undefined;
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();m.role='founder';});
async function render(){(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;const node=document.createElement('div');document.body.append(node);root=createRoot(node);await act(async()=>root!.render(React.createElement(OrderPaymentPanel,{businessId:'business',orderId:'order',total:60,onChanged:m.changed})));return node;}
const pending={id:'payment',payment_status:'submitted',amount:60};
describe('order payment evidence UI',()=>{
 it('does not auto-verify submitted evidence; an owner must perform the explicit verify action',async()=>{
  m.get.mockResolvedValue(pending);m.verify.mockResolvedValue({...pending,payment_status:'paid',verified:true});const node=await render();expect(m.verify).not.toHaveBeenCalled();
  const button=Array.from(node.querySelectorAll('[role="button"]')).find(el=>el.textContent==='Verify received payment');expect(button).toBeTruthy();
  await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(m.verify).toHaveBeenCalledWith('payment','business','owner');expect(m.changed).toHaveBeenCalledOnce();expect(node.textContent).toContain('Payment status: paid');expect(node.textContent).not.toContain('Verify received payment');
 });
 it('never offers customer-side verification',async()=>{m.role='customer';m.get.mockResolvedValue(pending);const node=await render();expect(node.textContent).not.toContain('Verify received payment');expect(m.verify).not.toHaveBeenCalled();});
 it('blocks evidence submission without proof or reference',async()=>{m.get.mockResolvedValue(null);const node=await render();const button=Array.from(node.querySelectorAll('[role="button"]')).find(el=>el.textContent==='Submit payment evidence');await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(m.submit).not.toHaveBeenCalled();expect(node.textContent).toContain('Upload proof or enter a payment reference.');});
 it('does not display successful verification when the repository rejects it',async()=>{m.get.mockResolvedValue(pending);m.verify.mockResolvedValue(null);const node=await render();const button=Array.from(node.querySelectorAll('[role="button"]')).find(el=>el.textContent==='Verify received payment');await act(async()=>button!.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(m.changed).not.toHaveBeenCalled();expect(node.textContent).toContain('Payment status: submitted');expect(node.textContent).toContain('could not be verified');});
});
