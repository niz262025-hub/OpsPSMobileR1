import React,{act} from 'react';
const {createRoot}=require('react-dom/client') as {createRoot:(node:Element)=>{render:(node:React.ReactNode)=>void;unmount:()=>void}};
import {afterEach,expect,it,vi} from 'vitest';
const m=vi.hoisted(()=>({create:vi.fn(),replace:vi.fn()}));
vi.mock('../context/AuthContext',()=>({useAuth:()=>({membership:{business_id:'business'},business:{id:'business'}})}));
vi.mock('../services/repository',()=>({getDataSource:()=>({trips:{create:m.create}})}));
vi.mock('expo-router',()=>({router:{replace:m.replace,back:vi.fn()}}));
vi.mock('lucide-react-native',()=>({ArrowLeft:()=>null,Calendar:()=>null}));
vi.mock('@react-native-community/datetimepicker',()=>({default:()=>null}));
import CreateTrip from '../app/trip/create';
let root:ReturnType<typeof createRoot>|undefined;
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;document.body.innerHTML='';vi.clearAllMocks();});
it.each(['native','tracked'])('submits the calendar date through the %s browser input event',async(mode)=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;const node=document.createElement('div');document.body.append(node);root=createRoot(node);m.create.mockResolvedValue({id:'trip'});
 await act(async()=>root!.render(React.createElement(CreateTrip)));
 async function input(selector:string,value:string){const el=node.querySelector(selector) as HTMLInputElement;expect(el).toBeTruthy();await act(async()=>{if(selector==='input[type="date"]'&&mode==='tracked')el.value=value;else Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));});}
 await input('input[placeholder="e.g. Bangkok Shopping"]','UAT Trip');await input('input[placeholder="e.g. ION Orchard"]','UAT Mall');await input('input[type="date"]','2026-11-02');
 const submit=Array.from(node.querySelectorAll('div')).filter(el=>el.textContent==='Create Trip').at(-1)!;
 await act(async()=>submit.dispatchEvent(new MouseEvent('click',{bubbles:true})));
 expect(m.create).toHaveBeenCalledWith(expect.objectContaining({name:'UAT Trip',tripDate:'2026-11-02'}));
});
