import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, describe, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({auth:{ready:true,currentUser:{role:'customer',name:'Customer'},profile:{id:'customer-1'},logout:vi.fn()},list:vi.fn()}));
vi.mock('../context/AuthContext',()=>({useAuth:()=>m.auth}));
vi.mock('../services/repository',()=>({getDataSource:()=>({orders:{listForCustomer:m.list}})}));
vi.mock('../components/MyopsEntry',()=>({default:()=>React.createElement('div',null,'central-entry')}));
vi.mock('lucide-react-native',()=>({ArrowRight:()=>null,Package:()=>null,ShoppingBag:()=>null,Sparkles:()=>null,WalletCards:()=>null}));
vi.mock('expo-router',()=>({router:{push:vi.fn()}}));
vi.mock('expo-linear-gradient',()=>({LinearGradient:({children}:{children:React.ReactNode})=>React.createElement('div',null,children)}));
import CustomerHome from '../app/customer/index';
let root: ReturnType<typeof createRoot> | undefined;
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();m.auth.currentUser={role:'customer',name:'Customer'};});
async function render(){
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 const node=document.createElement('div');document.body.append(node);root=createRoot(node);
 await act(async()=>root!.render(React.createElement(CustomerHome)));return node;
}
describe('real customer dashboard data',()=>{
 it('loads only the current customer profile and shows an empty account without sample totals',async()=>{
  m.list.mockResolvedValue([]);const node=await render();expect(m.list).toHaveBeenCalledWith('customer-1');
  expect(node.textContent).toContain('Orders0');expect(node.textContent).toContain('Open0');expect(node.textContent).toContain('Paid0');expect(node.textContent).toContain('No orders yet.');expect(node.textContent).not.toContain('Updated today');
 });
 it('returns founders to their normal central entry instead of showing the customer page',async()=>{
  m.auth.currentUser={role:'founder',name:'Owner'};const node=await render();expect(node.textContent).toBe('central-entry');expect(m.list).not.toHaveBeenCalled();
 });
 it('reports actual owned order status counts',async()=>{
  m.list.mockResolvedValue([{id:'order-a',requestStatus:'PENDING_PAYMENT'},{id:'order-b',requestStatus:'DELIVERED',paymentStatus:'paid'}]);const node=await render();
  expect(node.textContent).toContain('Orders2');expect(node.textContent).toContain('Open1');expect(node.textContent).toContain('Paid1');expect(node.textContent).toContain('order-a');
 });
});
