// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
it('enforces gallery persistence, role/tenant/session RLS and trip editing in isolated PostgreSQL', () => {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/test-web-galleries.mjs', import.meta.url))], { encoding: 'utf8', timeout: 60000 });
  expect(output).toContain('PASS: additive legacy preservation');
}, 65000);
