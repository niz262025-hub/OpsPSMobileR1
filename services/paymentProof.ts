import type { SupabaseClient } from '@supabase/supabase-js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES: Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf'};
export function validatePaymentProof(file: { type: string; size: number }): string {
  if (!TYPES[file.type] || file.size<=0 || file.size>5*1024*1024) throw new Error('Choose a PNG, JPEG, WebP or PDF file up to 5 MB.');
  return TYPES[file.type];
}
export async function uploadPaymentProof(client: SupabaseClient,businessId:string,orderId:string,userId:string,file:File):Promise<string>{
  if (![businessId,orderId,userId].every(value=>UUID.test(value))) throw new Error('Invalid payment scope.');
  const extension=validatePaymentProof(file);
  const path=`business/${businessId}/orders/${userId}/${orderId}/${globalThis.crypto.randomUUID()}.${extension}`;
  const result=await client.storage.from('payment-proofs').upload(path,file,{contentType:file.type,upsert:false});
  if(result.error)throw new Error('Payment proof could not be uploaded. Please retry.');
  return `storage://payment-proofs/${path}`;
}
export async function paymentProofPreview(client:SupabaseClient,businessId:string,receiptUri:string):Promise<string>{
  const prefix='storage://payment-proofs/';
  if(!UUID.test(businessId)||!receiptUri.startsWith(`${prefix}business/${businessId}/`))throw new Error('Payment proof is unavailable.');
  const result=await client.storage.from('payment-proofs').createSignedUrl(receiptUri.slice(prefix.length),60);
  if(result.error||!result.data?.signedUrl)throw new Error('Payment proof is unavailable.');
  return result.data.signedUrl;
}
