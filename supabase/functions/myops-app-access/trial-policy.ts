const isUuid=(value:unknown):value is string=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export type OpspsAccess = {mode:'paid'} | {mode:'trial';trialId:string;expiresAt:string;policyVersion:1};
export type OpspsPremiumFeature='advanced_reporting'|'export'|'multi_user';
export function assertOpspsPremiumFeature(access:OpspsAccess,feature:string):void {
 if(!['advanced_reporting','export','multi_user'].includes(feature))throw new Error('Unknown OpsPS feature');
 if(access.mode!=='paid')throw new Error('Upgrade in MYOPS to use this feature.');
}

/** Input must come from the authenticated server-to-server MYOPS transport. */
export function opspsAccessFromEntitlement(value:unknown,trialReady=false,now=Date.now()):OpspsAccess {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('MYOPS access is not active');
 const data=value as Record<string,unknown>;
 if(data.entitled!==true||data.session_active!==true)throw new Error('MYOPS access is not active');
 if((data.access_mode===undefined||data.access_mode==='paid')&&data.trial==null)return {mode:'paid'};
 if(data.access_mode!=='trial'||!trialReady)throw new Error('OpsPS trial is not available yet. Manage access in MYOPS.');
 const trial=data.trial as Record<string,unknown>|null;
 if(!trial||!isUuid(trial.id)||trial.policy_version!==1||typeof trial.expires_at!=='string'
  ||!Number.isFinite(Date.parse(trial.expires_at))||Date.parse(trial.expires_at)<=now)throw new Error('MYOPS trial expired or unavailable');
 return {mode:'trial',trialId:trial.id,expiresAt:trial.expires_at,policyVersion:1};
}

export function opspsTrialReady(projectUrl:string,enabled:string|undefined):boolean {
 return projectUrl==='https://ojamkplflqafedmxbdxb.supabase.co'&&enabled==='true';
}

export function opspsSessionAccessFields(access:OpspsAccess,ready:boolean) {
 if(!ready)return {};
 return access.mode==='trial'
  ?{access_mode:'trial',trial_id:access.trialId,trial_expires_at:access.expiresAt,trial_policy_version:1}
  :{access_mode:'paid',trial_id:null,trial_expires_at:null,trial_policy_version:null};
}
