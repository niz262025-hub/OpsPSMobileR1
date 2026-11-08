import React,{act} from 'react';
import {create, type ReactTestRenderer} from 'react-test-renderer';
import {afterEach,expect,it,vi} from 'vitest';
import {LanguageProvider,useLanguage} from '../context/LanguageContext';
import {shopText} from '../constants/shopCopy';
let root:ReactTestRenderer|undefined;
afterEach(()=>{if(root)act(()=>root?.unmount());root=undefined;vi.unstubAllGlobals();});
it('late hydration cannot overwrite an explicit language selection',async()=>{
 let resolve!:(value:string)=>void;const pending=new Promise<string>(done=>{resolve=done});
 const saved=new Map<string,string>();vi.stubGlobal('window',{localStorage:{getItem:()=>pending,setItem:(k:string,v:string)=>saved.set(k,v)}});
 let value:ReturnType<typeof useLanguage>;
 function Harness(){value=useLanguage();return null;}
 await act(async()=>{root=create(React.createElement(LanguageProvider,null,React.createElement(Harness)));});
 await act(async()=>{await value!.setLanguage('TA');});
 await act(async()=>{resolve('BM');await pending;});
 expect(value!.language).toBe('TA');expect(saved.get('@opsps_language')).toBe('TA');expect(value!.ready).toBe(true);
});
it('blocked browser storage still permits language selection in memory',async()=>{
 vi.stubGlobal('window',{get localStorage(){throw new Error('storage blocked')}});
 let value:ReturnType<typeof useLanguage>;
 function Harness(){value=useLanguage();return null;}
 await act(async()=>{root=create(React.createElement(LanguageProvider,null,React.createElement(Harness)));});
 expect(value!.ready).toBe(true);
 await act(async()=>{await value!.setLanguage('ZH');});expect(value!.language).toBe('ZH');
});
it('fixed personal shopper copy changes language without modifying entered data',()=>{
 expect(shopText('MS','Create Trip')).toBe('Cipta trip');
 expect(shopText('ZH','Download PDF')).toBe('下载 PDF');
 expect(shopText('TA','Upload Product')).toBe('பொருளைப் பதிவேற்று');
 expect(shopText('ZH','Customer supplied name 123')).toBe('Customer supplied name 123');
});
