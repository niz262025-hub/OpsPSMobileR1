// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { base64UrlEncode, canonicalMyopsRequest, readMyopsJson } from '../supabase/functions/myops-app-access/contract';

describe('OpsPS WebCrypto signature wire format', () => {
  it('encodes native sign() ArrayBuffer and verifies the resulting Ed25519 signature', async () => {
    const keys = await crypto.subtle.generateKey({name:'Ed25519'},true,['sign','verify']);
    const request = await canonicalMyopsRequest('/api/app/entitlement','opsp','current','1234','nonce',{product:'opsp'});
    const bytes = new TextEncoder().encode(request);
    const signature = await crypto.subtle.sign('Ed25519',keys.privateKey,bytes);
    expect(signature).toBeInstanceOf(ArrayBuffer);
    const encoded = base64UrlEncode(signature);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]{86}$/);
    expect(await crypto.subtle.verify('Ed25519',keys.publicKey,Buffer.from(encoded,'base64url'),bytes)).toBe(true);
    expect(await crypto.subtle.verify('Ed25519',keys.publicKey,Buffer.from(encoded,'base64url'),new TextEncoder().encode(request+'changed'))).toBe(false);
  });
  it('also encodes byte nonces and strips padding and unsafe base64 characters', () => {
    expect(base64UrlEncode(new Uint8Array([251,255]))).toBe('-_8');
    expect(base64UrlEncode(new Uint8Array([251,255]).buffer)).toBe('-_8');
  });
});

describe('MYOPS central denial handling', () => {
  it('preserves explicit denied entitlement for local session revocation', async () => {
    const denied = { entitled:false, session_active:false };
    expect(await readMyopsJson(new Response(JSON.stringify(denied),{status:403}))).toEqual(denied);
    expect(await readMyopsJson(new Response(JSON.stringify({error:'Unauthorized'}),{status:401}))).toEqual({error:'Unauthorized'});
  });
  it('keeps transient outages and malformed responses fail-closed', async () => {
    await expect(readMyopsJson(new Response('{}',{status:503}))).rejects.toThrow('MYOPS access check failed');
    await expect(readMyopsJson(new Response('<html>login</html>',{status:401}))).rejects.toThrow('MYOPS access check failed');
    await expect(readMyopsJson(new Response('[]',{status:200}))).rejects.toThrow('MYOPS access check failed');
  });
});
