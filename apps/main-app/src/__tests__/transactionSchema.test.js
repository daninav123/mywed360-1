import { describe, it, expect } from 'vitest';
import { transactionSchema } from '../schemas/transaction.js';

describe('transactionSchema', () => {
  it('accepts a valid expense with paid <= amount', () => {
    const data = {
      type: 'expense',
      amount: 100,
      status: 'paid',
      paidAmount: 100,
      concept: 'Catering',
    };
    const res = transactionSchema.safeParse(data);
    expect(res.success).toBe(true);
  });

  it('rejects paidAmount greater than amount', () => {
    const data = { type: 'expense', amount: 50, status: 'paid', paidAmount: 60 };
    const res = transactionSchema.safeParse(data);
    expect(res.success).toBe(false);
  });

  it('rejects invalid status for income', () => {
    const data = { type: 'income', amount: 100, status: 'paid' };
    const res = transactionSchema.safeParse(data);
    expect(res.success).toBe(false);
  });

  it('accepts expected/received for income', () => {
    const ok1 = transactionSchema.safeParse({ type: 'income', amount: 10, status: 'expected' });
    const ok2 = transactionSchema.safeParse({ type: 'income', amount: 10, status: 'received' });
    expect(ok1.success).toBe(true);
    expect(ok2.success).toBe(true);
  });
});
