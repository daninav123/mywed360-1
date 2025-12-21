import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

import { sendBudgetStatusEmail } from '../../../../backend/services/budgetEmailService.js';


const baseParams = {
  supplierEmail: 'proveedor@example.com',
  supplierName: 'Floristería Ramos',
  description: 'Decoración floral',
  amount: 800,
  currency: 'EUR',
};

describe('sendBudgetStatusEmail', () => {
  const originalMailgunApiKey = process.env.MAILGUN_API_KEY;
  const originalMailgunDomain = process.env.MAILGUN_DOMAIN;

  beforeEach(() => {
    process.env.MAILGUN_API_KEY = 'test-mailgun-key';
    process.env.MAILGUN_DOMAIN = 'test.mailgun.org';
    // Limpiar mocks entre tests
    if (sendMock) sendMock.mockClear();
  });

  afterEach(() => {
    if (originalMailgunApiKey === undefined) delete process.env.MAILGUN_API_KEY;
    else process.env.MAILGUN_API_KEY = originalMailgunApiKey;

    if (originalMailgunDomain === undefined) delete process.env.MAILGUN_DOMAIN;
    else process.env.MAILGUN_DOMAIN = originalMailgunDomain;
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
