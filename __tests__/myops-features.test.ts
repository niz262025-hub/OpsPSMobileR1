import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({invoke:vi.fn(),getClient:vi.fn()}));
vi.mock('../services/supabaseClient',()=>({getSupabaseClient:mocks.getClient}));
import {requireMyopsFeature} from '../services/myopsFeatures';
beforeEach(()=>{vi.resetAllMocks();mocks.getClient.mockReturnValue({functions:{invoke:mocks.invoke}});});
it('requires fresh paid authorization for the exact requested feature',async()=>{
 mocks.invoke.mockResolvedValue({data:{entitled:true,allowed:true,access_mode:'paid',feature:'export'},error:null});
 await expect(requireMyopsFeature('export')).resolves.toBeUndefined();
 expect(mocks.invoke).toHaveBeenCalledWith('myops-app-access',{body:{action:'feature',feature:'export'}});
 for(const data of [{allowed:true,entitled:true,access_mode:'trial',feature:'export'},{allowed:true,entitled:true,access_mode:'paid',feature:'multi_user'},{entitled:false},null]){
  mocks.invoke.mockResolvedValue({data,error:null});await expect(requireMyopsFeature('export')).rejects.toThrow();
 }
});
it('does not grant access on missing client, transport failure or a premium denial',async()=>{
 mocks.getClient.mockReturnValueOnce(null);await expect(requireMyopsFeature('export')).rejects.toThrow('MYOPS');
 mocks.invoke.mockResolvedValue({data:null,error:{context:{json:async()=>({code:'premium_required'})}}});
 await expect(requireMyopsFeature('export')).rejects.toThrow('Upgrade in MYOPS');
 mocks.invoke.mockResolvedValue({data:null,error:{}});await expect(requireMyopsFeature('export')).rejects.toThrow('could not be verified');
});
