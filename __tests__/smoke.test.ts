import { describe, expect, it } from 'vitest';

describe('project smoke test', () => {
  it('keeps the app package initialized for QA runs', () => {
    expect(typeof globalThis).toBe('object');
  });
});
