import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedOpspsOrigins } from '../supabase/functions/myops-app-access/cors.mjs';

const production = 'https://wrsigjhhbkbomtkaqlpw.supabase.co';
const canonical = 'https://opsps.myops.com.my';
const legacy = 'https://opsp-mobile-r1.vercel.app';

test('production admits canonical domain and retains configured migration clients', () => {
  assert.deepEqual(allowedOpspsOrigins(production, ` ${legacy}, ${legacy}, `), [legacy, canonical]);
  assert.deepEqual(allowedOpspsOrigins(production), [canonical]);
});

test('staging and missing project never implicitly admit production origin', () => {
  for (const project of ['', 'https://ojamkplflqafedmxbdxb.supabase.co', `${production}/`, 'https://foreign.supabase.co']) {
    assert.equal(allowedOpspsOrigins(project, legacy).includes(canonical), false);
  }
});

test('production admission uses exact HTTPS origin and rejects foreign/lookalike origins', () => {
  const allowed = allowedOpspsOrigins(production, legacy);
  for (const origin of ['https://foreign.example', 'http://opsps.myops.com.my', 'https://opsps.myops.com.my.evil.example', 'https://opsps.myops.com.my:444', '*']) {
    assert.equal(allowed.includes(origin), false);
  }
});
