import { describe, it, expect, vi, beforeEach } from 'vitest';
// Capturaremos la función send mockeada en el scope exterior
let sendMock;

vi.mock('mailgun-js', () => {
  return {
    default: () => ({
      messages() {
        // Creamos el mock en cada llamada
        sendMock = vi.fn().mockResolvedValue({ id: 'fake-id', message: 'Queued' });
        return { send: sendMock };
      },
    }),
  };
});

import { sendBudgetStatusEmail } from '../../backend/services/budgetEmailService.js';

const baseParams = {
  supplierEmail: 'proveedor@example.com',
  supplierName: 'Floristería Ramos',
  description: 'Decoración floral',
  amount: 800,
  currency: 'EUR',
};

describe('sendBudgetStatusEmail', () => {
  beforeEach(() => {
    // Limpiar mocks entre tests
    if (sendMock) sendMock.mockClear();
  });

  it('envía email cuando status es accepted', async () => {
    const res = await sendBudgetStatusEmail({ ...baseParams, status: 'accepted' });

    expect(res.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const sentData = sendMock.mock.calls[0][0];
    expect(sentData.to).toBe(baseParams.supplierEmail);
    expect(sentData.subject.toLowerCase()).toContain('aceptado');
  });

  it('envía email cuando status es rejected', async () => {
    const res = await sendBudgetStatusEmail({ ...baseParams, status: 'rejected' });

    expect(res.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const sentData = sendMock.mock.calls[0][0];
    expect(sentData.subject.toLowerCase()).toContain('rechazado');
  });
});
