import {getSupabaseClient} from './supabaseClient';
export type PremiumFeature='advanced_reporting'|'export'|'multi_user';
export async function requireMyopsFeature(feature:PremiumFeature):Promise<void> {
 const client=getSupabaseClient();
 if(!client)throw new Error('Open OpsPS from MYOPS to verify feature access.');
 const {data,error}=await client.functions.invoke('myops-app-access',{body:{action:'feature',feature}});
 if(error){
  const body=await error.context?.json?.().catch(()=>null);
  if(body?.code==='premium_required')throw new Error('Upgrade in MYOPS to use this feature.');
  throw new Error('Feature access could not be verified. Reopen OpsPS from MYOPS.');
 }
 if(data?.allowed!==true||data?.entitled!==true||data?.access_mode!=='paid'||data?.feature!==feature)throw new Error('Upgrade in MYOPS to use this feature.');
}
