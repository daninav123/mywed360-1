import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import * as WeddingCtx from '../context/WeddingContext';
import useSupplierBudgets from '../hooks/useSupplierBudgets';

// Mock fetch
global.fetch = vi.fn();

vi.mock('firebase/firestore', () => {
  return {
    collection: () => ({}),
    query: () => ({}),
    orderBy: () => ({}),
    onSnapshot: (q, cb) => {
      // Simular snapshot vacío
      cb({ docs: [] });
      return () => {};
    },
  };
});

vi.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      getIdToken: vi.fn(async () => 'test-token'),
    },
  },
  db: {},
  firebaseReady: Promise.resolve(),
}));

describe('useSupplierBudgets', () => {
  beforeEach(() => {
    fetch.mockReset();
    vi.spyOn(WeddingCtx, 'useWedding').mockReturnValue({ activeWedding: 'wed1' });
  });

  it('realiza llamada fetch al aceptar presupuesto', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    const { result } = renderHook(() => useSupplierBudgets('sup1'));

    await act(async () => {
      const resp = await result.current.updateBudgetStatus('bud1', 'accept');
      expect(resp.success).toBe(true);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/weddings/wed1/suppliers/sup1/budget'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: expect.stringContaining('Bearer '),
        }),
        body: JSON.stringify({ action: 'accept', budgetId: 'bud1' }),
      })
    );
  });
});
