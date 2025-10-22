import { describe, it, expect } from 'vitest';

import { normalizeCommissionRules, calculateCommission } from '../utils/commission.js';

describe('commission utils', () => {
  it('normalizes commission rules with defaults and bounds', () => {
    const normalized = normalizeCommissionRules({
      currency: 'usd',
      periods: [
        {
          label: 'Periodo prueba',
          startMonth: -3,
          endMonth: 6,
          tiers: [
            {
              id: 'tier-1',
              label: 'Entrada',
              percentage: 15,
              minRevenue: -100,
              fixedAmount: -50,
            },
          ],
        },
      ],
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.currency).toBe('USD');
    expect(normalized?.periods).toHaveLength(1);
    expect(normalized?.periods[0].startMonth).toBe(0);
    expect(normalized?.periods[0].endMonth).toBe(6);
    expect(normalized?.periods[0].tiers[0].minRevenue).toBe(0);
    expect(normalized?.periods[0].tiers[0].fixedAmount).toBe(0);
    expect(normalized?.periods[0].tiers[0].percentage).toBeCloseTo(0.15);
  });

  it('calculates commission across periods and tiers', () => {
    const rules = {
      currency: 'EUR',
      periods: [
        {
          id: 'first-year',
          label: 'Primer año',
          startMonth: 0,
          endMonth: 12,
          tiers: [
            { id: 'base', label: 'Base', minRevenue: 0, maxRevenue: 10000, percentage: 0.1, fixedAmount: 0 },
            { id: 'plus', label: 'Plus', minRevenue: 10000, maxRevenue: null, percentage: 0.12, fixedAmount: 200 },
          ],
        },
        {
          id: 'after-year',
          label: 'Recurrentes',
          startMonth: 12,
          endMonth: null,
          tiers: [
            { id: 'rec', label: 'Recurrencia', minRevenue: 0, maxRevenue: null, percentage: 0.05, fixedAmount: 0 },
          ],
        },
      ],
    };

    const payments = [
      { amount: 5000, createdAt: new Date('2023-02-10') },
      { amount: 7000, createdAt: new Date('2023-08-19') },
      { amount: 4000, createdAt: new Date('2024-03-01') },
    ];

    const summary = calculateCommission(payments, rules, {
      currency: 'EUR',
      startDate: new Date('2023-01-01'),
    });

    expect(summary.amount).toBeCloseTo(1840);
    expect(summary.currency).toBe('EUR');
    expect(summary.breakdown).toHaveLength(2);
    expect(summary.breakdown[0].commission).toBeCloseTo(1640);
    expect(summary.breakdown[0].tierId).toBe('plus');
    expect(summary.breakdown[0].paymentCount).toBe(2);
    expect(summary.breakdown[1].commission).toBeCloseTo(200);
    expect(summary.breakdown[1].paymentCount).toBe(1);
    expect(summary.unassignedRevenue).toBe(0);
  });
});
