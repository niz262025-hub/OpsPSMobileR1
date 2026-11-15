import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { confirmOrderAvailability } from '../services/orderAvailability';
it('uses the protected RPC with explicit business, order and merchant decision', async () => {
 const rpc=vi.fn().mockResolvedValue({data:{id:'order',business_id:'business'},error:null});
 await confirmOrderAvailability({rpc} as unknown as SupabaseClient,'business','order','PAY_NOW');
 expect(rpc).toHaveBeenCalledWith('opsps_confirm_availability',{p_business_id:'business',p_order_id:'order',p_decision:'PAY_NOW'});
});
it('does not accept errors or a result for another tenant/order', async () => {
 for(const result of [{data:null,error:{message:'denied'}},{data:{id:'order',business_id:'foreign'},error:null},{data:{id:'foreign',business_id:'business'},error:null}]) {
  const rpc=vi.fn().mockResolvedValue(result);
  await expect(confirmOrderAvailability({rpc} as unknown as SupabaseClient,'business','order','PAY_LATER')).rejects.toThrow('could not be confirmed');
 }
});
