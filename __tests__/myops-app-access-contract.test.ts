import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  canonicalMyopsRequest,
  isMyopsTicket,
  isUuid,
  readSessionIdFromJwt,
} from '../supabase/functions/myops-app-access/contract';

describe('MYOPS app access contract', () => {
  it('validates opaque launch tickets and UUIDs', () => {
    expect(isMyopsTicket('A'.repeat(43))).toBe(true);
    expect(isMyopsTicket('A'.repeat(42))).toBe(false);
    expect(isMyopsTicket(`${'A'.repeat(42)}.`)).toBe(false);
    expect(isUuid('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')).toBe(true);
    expect(isUuid('not-a-session')).toBe(false);
  });

  it('canonicalizes object keys consistently and preserves array order', () => {
    expect(canonicalJson({ z: 1, a: { y: true, b: null } })).toBe('{"a":{"b":null,"y":true},"z":1}');
    expect(canonicalJson([2, 1])).toBe('[2,1]');
    expect(() => canonicalJson({ value: Number.NaN })).toThrow('Value cannot be signed');
  });

  it('binds the request signature input to the canonical payload hash', async () => {
    const input = await canonicalMyopsRequest(
      '/api/app/redeem', 'opsps', 'current', '1234', 'nonce', { ticket: 'A'.repeat(43) },
    );
    expect(input).toMatch(/^POST\n\/api\/app\/redeem\nopsps\ncurrent\n1234\nnonce\n[a-f0-9]{64}$/);
    expect(await canonicalMyopsRequest(
      '/api/app/redeem', 'opsps', 'current', '1234', 'nonce', { ticket: 'B'.repeat(43) },
    )).not.toBe(input);
  });

  it('extracts only a valid Supabase session_id claim', () => {
    const payload = btoa(JSON.stringify({ session_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    expect(readSessionIdFromJwt(`header.${payload}.signature`)).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(readSessionIdFromJwt('header.e30.signature')).toBeNull();
  });
});
