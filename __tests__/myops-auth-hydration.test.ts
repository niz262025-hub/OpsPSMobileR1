import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, describe, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({client:null as any,callback:null as any,release:null as any,redeem:vi.fn(),entitlement:vi.fn(),url:vi.fn(),scopeEmpty:false}));
vi.mock('react-native',()=>({Linking:{getInitialURL:()=>m.url(),addEventListener:()=>({remove:vi.fn()})}}));
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:()=>m.client}));
vi.mock('../services/myopsAppAccess',()=>({clearMyopsLaunchTicketFromUrl:vi.fn(),extractMyopsLaunchTicket:()=> 'T'.repeat(43),redeemMyopsLaunchTicket:()=>m.redeem(),refreshMyopsEntitlement:()=>m.entitlement()}));
import { AuthProvider, useAuth } from '../context/AuthContext';
let root: ReturnType<typeof createRoot> | undefined;
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();m.scopeEmpty=false;});
function setup(){
 const session={access_token:'dummy',user:{id:'new',email:'internal@opsps.invalid',user_metadata:{}}};
 m.url.mockResolvedValue('https://opsps.test/launch');m.entitlement.mockResolvedValue(true);
 m.redeem.mockImplementation(()=>new Promise(resolve=>{m.release=()=>resolve(session);}));
 m.client={auth:{onAuthStateChange:vi.fn((cb:any)=>{m.callback=cb;return {data:{subscription:{unsubscribe:vi.fn()}}};}),getSession:vi.fn(async()=>({data:{session:null},error:null})),signOut:vi.fn()},from:vi.fn((table:string)=>{const result=()=>m.scopeEmpty?null:table==='profiles'?{id:'p',auth_user_id:'new',business_id:'b',role:'founder',full_name:'Owner'}:table==='business_memberships'?[{user_id:'new',business_id:'b',role:'founder'}]:{id:'b',name:'My OpsPS'};const query={select:()=>query,eq:()=>query,maybeSingle:async()=>({data:result(),error:null}),limit:async()=>({data:result(),error:null})};return query;})};
 const node=document.createElement('div');document.body.append(node);
 const Consumer=()=>{const a=useAuth();return React.createElement('div',null,`${a.ready}:${a.currentUser?.role??'none'}`);};
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;root=createRoot(node);
 return {node,Consumer,session};
}
describe('MYOPS launch hydration race',()=>{
 it('ignores the expired INITIAL_SESSION notification until verified launch has loaded its actual scope',async()=>{
  const {node,Consumer,session}=setup();await act(async()=>root!.render(React.createElement(AuthProvider,null,React.createElement(Consumer))));
  expect(node.textContent).toBe('false:none');
  await act(async()=>{expect(m.callback('INITIAL_SESSION',{...session,user:{id:'old'}})).toBeUndefined();});
  expect(m.client.from).not.toHaveBeenCalled();expect(node.textContent).toBe('false:none');
  await act(async()=>m.release());expect(node.textContent).toBe('true:founder');
  const reads=m.client.from.mock.calls.length;
  await act(async()=>{expect(m.callback('SIGNED_IN',session)).toBeUndefined();expect(m.callback('TOKEN_REFRESHED',session)).toBeUndefined();});
  expect(m.client.from.mock.calls.length).toBe(reads);expect(node.textContent).toBe('true:founder');
 });
 it('fails closed when RLS returns an incomplete identity, instead of showing a sample customer dashboard',async()=>{
  const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});const {node,Consumer}=setup();m.scopeEmpty=true;
  await act(async()=>root!.render(React.createElement(AuthProvider,null,React.createElement(Consumer))));await act(async()=>m.release());
  expect(node.textContent).toBe('true:none');warning.mockRestore();
 });
});
