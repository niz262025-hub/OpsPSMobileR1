import React, { act } from 'react';
const { createRoot } = require('react-dom/client') as { createRoot: (node: Element) => { render: (node: React.ReactNode) => void; unmount: () => void } };
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { ready: false, currentUser: null as null | { role: string } }, replace: vi.fn(), portal: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('expo-router', () => ({ router: { replace: mocks.replace } }));
vi.mock('../services/myopsNavigation', () => ({ returnToMyops: mocks.portal }));
import MyopsEntry from '../components/MyopsEntry';
let root: ReturnType<typeof createRoot> | undefined;
afterEach(() => { if(root) act(()=>root?.unmount()); root=undefined;document.body.innerHTML='';vi.clearAllMocks();mocks.auth={ready:false,currentUser:null}; });
function render() {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const node=document.createElement('div');document.body.append(node);root=createRoot(node);
  act(()=>root!.render(React.createElement(MyopsEntry)));
  expect(node.querySelector('input')).toBeNull();
  expect(node.textContent).toBe('');
}
describe('OpsPS single login entry',()=>{
 it('waits for central session hydration',()=>{render();expect(mocks.replace).not.toHaveBeenCalled();expect(mocks.portal).not.toHaveBeenCalled();});
 it('returns unauthenticated access directly to MYOPS without a second login screen',()=>{mocks.auth={ready:true,currentUser:null};render();expect(mocks.portal).toHaveBeenCalledOnce();expect(mocks.replace).not.toHaveBeenCalled();});
 it.each([['founder','/(tabs)/dashboard'],['customer','/customer'],['admin','/admin'],['support','/admin']])('opens the correct existing %s dashboard', (role,path)=>{mocks.auth={ready:true,currentUser:{role}};render();expect(mocks.replace).toHaveBeenCalledWith(path);expect(mocks.portal).not.toHaveBeenCalled();});
});
