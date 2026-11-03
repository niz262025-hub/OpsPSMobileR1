import {expect,it} from 'vitest';
import {assertOpspsPremiumFeature,opspsAccessFromEntitlement,opspsSessionAccessFields,opspsTrialReady} from '../supabase/functions/myops-app-access/trial-policy';
const id='11111111-1111-4111-8111-111111111111';
const response={entitled:true,session_active:true,access_mode:'trial',trial:{id,expires_at:'2099-01-01T00:00:00Z',policy_version:1}};
it('preserves existing paid contracts and never silently treats a trial as paid',()=>{
 for(const access_mode of [undefined,'paid'])expect(opspsAccessFromEntitlement({entitled:true,session_active:true,access_mode})).toEqual({mode:'paid'});
 for(const data of [response,{...response,access_mode:undefined},{...response,access_mode:'unknown'},{entitled:false,session_active:true}])expect(()=>opspsAccessFromEntitlement(data)).toThrow();
});
it('admits only explicit valid trial metadata and rejects exact expiry',()=>{
 expect(opspsAccessFromEntitlement(response,true)).toMatchObject({mode:'trial',trialId:id});
 for(const trial of [{...response.trial,id:'bad'},{...response.trial,policy_version:2},{...response.trial,expires_at:'bad'},null])expect(()=>opspsAccessFromEntitlement({...response,trial},true)).toThrow();
 expect(()=>opspsAccessFromEntitlement(response,true,Date.parse(response.trial.expires_at))).toThrow();
});
it('isolates trial readiness to staging and clears trial metadata on paid upgrade',()=>{
 expect(opspsTrialReady('https://ojamkplflqafedmxbdxb.supabase.co','true')).toBe(true);
 expect(opspsTrialReady('https://wrsigjhhbkbomtkaqlpw.supabase.co','true')).toBe(false);
 expect(opspsTrialReady('https://ojamkplflqafedmxbdxb.supabase.co',undefined)).toBe(false);
 expect(opspsSessionAccessFields({mode:'paid'},false)).toEqual({});
 expect(opspsSessionAccessFields({mode:'paid'},true)).toMatchObject({access_mode:'paid',trial_id:null,trial_expires_at:null});
});
it('denies each premium feature for a verified trial and allows verified paid access only',()=>{
 const trial=opspsAccessFromEntitlement(response,true);
 for(const feature of ['advanced_reporting','export','multi_user']){
  expect(()=>assertOpspsPremiumFeature(trial,feature)).toThrow('Upgrade in MYOPS');
  expect(()=>assertOpspsPremiumFeature({mode:'paid'},feature)).not.toThrow();
 }
 expect(()=>assertOpspsPremiumFeature({mode:'paid'},'unknown')).toThrow();
});
