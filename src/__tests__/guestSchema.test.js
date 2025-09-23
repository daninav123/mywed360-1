import { describe, it, expect } from 'vitest';
import { guestSchema } from '../schemas/guest';

describe('guestSchema', () => {
  it('requires a non-empty name', () => {
    const res = guestSchema.safeParse({ name: '' });
    expect(res.success).toBe(false);
  });

  it('accepts minimal valid guest', () => {
    const res = guestSchema.safeParse({ name: 'Ana García' });
    expect(res.success).toBe(true);
  });

  it('limits companion to non-negative int', () => {
    const bad = guestSchema.safeParse({ name: 'Luis', companion: -1 });
    const ok = guestSchema.safeParse({ name: 'Luis', companion: 2 });
    expect(bad.success).toBe(false);
    expect(ok.success).toBe(true);
  });
});

