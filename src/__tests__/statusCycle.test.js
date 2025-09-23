import { describe, it, expect } from 'vitest';

import statusCycle from '../utils/statusCycle';

describe('statusCycle utility', () => {
  it('cycles pending → confirmed', () => {
    expect(statusCycle('pending')).toBe('confirmed');
    expect(statusCycle('Pendiente')).toBe('confirmed');
  });

  it('cycles confirmed → declined', () => {
    expect(statusCycle('confirmed')).toBe('declined');
    expect(statusCycle('Sí')).toBe('declined');
  });

  it('cycles declined → pending', () => {
    expect(statusCycle('declined')).toBe('pending');
    expect(statusCycle('No')).toBe('pending');
  });
});
