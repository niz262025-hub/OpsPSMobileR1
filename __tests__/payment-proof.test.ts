import { describe,expect,it,vi } from 'vitest';
import { paymentProofPreview, uploadPaymentProof, validatePaymentProof } from '../services/paymentProof';
const business='10000000-0000-4000-8000-000000000001',order='20000000-0000-4000-8000-000000000001',user='30000000-0000-4000-8000-000000000001';
describe('private payment proof boundary',()=>{
 it('enforces allowed content types and size before Storage access',()=>{
  expect(validatePaymentProof({type:'image/png',size:100})).toBe('png');
  for(const file of [{type:'image/svg+xml',size:100},{type:'image/png',size:0},{type:'application/pdf',size:6*1024*1024}])expect(()=>validatePaymentProof(file)).toThrow();
 });
 it('uploads to the existing tenant/user-owned private path, without overwriting or publishing',async()=>{
  const upload=vi.fn(async (_path:string,_file:File,_options:unknown)=>({error:null})),from=vi.fn(()=>({upload}));
  const result=await uploadPaymentProof({storage:{from}} as any,business,order,user,new File(['dummy'],'proof.png',{type:'image/png'}));
  expect(from).toHaveBeenCalledWith('payment-proofs');expect(result).toContain(`storage://payment-proofs/business/${business}/orders/${user}/${order}/`);
  expect(upload.mock.calls[0][2]).toEqual({contentType:'image/png',upsert:false});
 });
 it('rejects malformed scope and other-tenant/external proof locations',async()=>{
  const from=vi.fn();await expect(uploadPaymentProof({storage:{from}} as any,'../other',order,user,new File(['dummy'],'proof.png',{type:'image/png'}))).rejects.toThrow('scope');
  await expect(paymentProofPreview({storage:{from}} as any,business,'https://external.test/proof.png')).rejects.toThrow('unavailable');expect(from).not.toHaveBeenCalled();
 });
 it('uses a short-lived private preview rather than a public bucket URL',async()=>{
  const createSignedUrl=vi.fn(async (_path:string,_seconds:number)=>({data:{signedUrl:'https://fixture.invalid/private-preview'},error:null}));
  await paymentProofPreview({storage:{from:()=>({createSignedUrl})}} as any,business,`storage://payment-proofs/business/${business}/orders/${user}/${order}/proof.png`);
  expect(createSignedUrl.mock.calls[0][1]).toBe(60);
 });
});
