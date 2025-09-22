import { describe, it, expect } from 'vitest';
import { validateAndNormalizeDate, normalizeAnyDate, addMonths } from './dateUtils';

describe('dateUtils', () => {
  it('validateAndNormalizeDate handles Date/string/invalid', () => {
    const d = new Date('2025-01-02T00:00:00Z');
    expect(validateAndNormalizeDate(d)?.toISOString()).toBe(d.toISOString());
    const s = '2025-01-03';
    expect(validateAndNormalizeDate(s)).toBeInstanceOf(Date);
    expect(validateAndNormalizeDate('invalid-value')).toBeNull();
  });

  it('validateAndNormalizeDate handles firestore Timestamp-like', () => {
    const ts = { toDate: () => new Date('2025-02-02T00:00:00Z') };
    expect(validateAndNormalizeDate(ts)).toBeInstanceOf(Date);
  });

  it('normalizeAnyDate supports number epoch', () => {
    const epoch = Date.UTC(2025, 0, 1);
    const d = normalizeAnyDate(epoch);
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCFullYear()).toBe(2025);
  });

  it('addMonths shifts months keeping day bounds', () => {
    const base = new Date('2025-01-31T00:00:00Z');
    const moved = addMonths(base, 1);
    expect(moved.getUTCMonth()).toBe(1); // February
  });
});

