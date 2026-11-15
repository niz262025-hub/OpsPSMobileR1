import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({role:'founder',order:{id:'order',businessId:'business',customerName:'Test',total:20,orderStatus:'pending',paymentStatus:'pending',requestStatus:'PENDING_AVAILABILITY',availabilityStatus:'pending',paymentRequestedAt:undefined as string|undefined},stock:vi.fn(),rpc:vi.fn()}));
vi.mock('../context/AuthContext',()=>({useAuth:()=>({ready:true,role:m.role,user:{id:'user'},profile:{id:'profile'},membership:m.role==='customer'?null:{business_id:'business',role:m.role},business:null})}));
vi.mock('expo-router',()=>({router:{back:vi.fn(),push:vi.fn()},useLocalSearchParams:()=>({id:'order'})}));
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:()=>({rpc:m.rpc})}));
vi.mock('../services/repository',()=>({getDataSource:()=>({orders:{getForBusiness:async()=>m.order,getForCustomer:async()=>m.order,listItemsForOrder:async()=>[],checkStockAvailability:m.stock}})}));
vi.mock('../components/OrderPaymentPanel',()=>({default:()=>React.createElement('div',null,'PAYMENT_PANEL')}));
vi.mock('lucide-react-native',()=>({ArrowLeft:()=>null}));
import OrderDetail from '../app/order/[id]/index';
let root:ReturnType<typeof createRoot>|undefined,node:HTMLDivElement;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;m.role='founder';m.order={id:'order',businessId:'business',customerName:'Test',total:20,orderStatus:'pending',paymentStatus:'pending',requestStatus:'PENDING_AVAILABILITY',availabilityStatus:'pending',paymentRequestedAt:undefined};m.rpc.mockImplementation(async()=>{m.order={...m.order,requestStatus:'PAYMENT_REQUIRED',availabilityStatus:'confirmed',paymentRequestedAt:'2026-11-15T14:00:00Z'};return {data:{id:'order',business_id:'business'},error:null};});});
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();});
async function mount(){node=document.createElement('div');document.body.append(node);root=createRoot(node);await act(async()=>root!.render(React.createElement(OrderDetail)));}
it('preserves pending availability on read and offers no premature payment panel',async()=>{await mount();expect(node.textContent).toContain('PENDING_AVAILABILITY');expect(node.textContent).not.toContain('PAYMENT_PANEL');expect(m.stock).not.toHaveBeenCalled();});
it('requires explicit merchant confirmation then reloads persisted payment eligibility',async()=>{await mount();const button=[...node.querySelectorAll('[role="button"]')].find(el=>el.textContent==='Confirm available · Pay Now')!;await act(async()=>button.dispatchEvent(new MouseEvent('click',{bubbles:true})));expect(m.rpc).toHaveBeenCalledWith('opsps_confirm_availability',{p_business_id:'business',p_order_id:'order',p_decision:'PAY_NOW'});expect(node.textContent).toContain('PAYMENT_REQUIRED');expect(node.textContent).toContain('PAYMENT_PANEL');});
it('does not show merchant confirmation controls to a customer',async()=>{m.role='customer';await mount();expect(node.textContent).not.toContain('Confirm available');expect(m.rpc).not.toHaveBeenCalled();});
