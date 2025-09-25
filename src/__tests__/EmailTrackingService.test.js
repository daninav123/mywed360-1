import { describe, it, expect, beforeEach } from 'vitest';

import {
  loadTrackingRecords,
  saveTrackingRecords,
  createTrackingRecord,
  updateTrackingStatus,
  getTrackingNeedingFollowup,
  TRACKING_STATUS,
} from '../services/EmailTrackingService';

// Clave usada por el servicio
const KEY = 'mywed360_email_tracking';

describe('EmailTrackingService (mínimo)', () => {
  beforeEach(() => {
    // Limpiar almacenamiento antes de cada prueba
    try {
      localStorage.removeItem(KEY);
    } catch {}
  });

  it('crea un seguimiento en estado WAITING con un hilo inicial', () => {
    const email = { id: 'e1', subject: 'Solicitud de presupuesto', body: 'Hola, nos interesa...' };
    const provider = { id: 'p1', name: 'Proveedor Prueba', email: 'prov@demo.com' };

    const record = createTrackingRecord(email, provider);

    expect(record).toBeTruthy();
    expect(record.status).toBe(TRACKING_STATUS.WAITING);
    expect(Array.isArray(record.thread)).toBe(true);
    expect(record.thread.length).toBe(1);

    const stored = loadTrackingRecords();
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
    expect(stored[0].providerEmail).toBe('prov@demo.com');
  });

  it('detecta registros que requieren seguimiento después de 3 días', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 días atrás

    // Guardar manualmente un registro de prueba en WAITING con fecha antigua
    const records = [
      {
        id: 't1',
        emailId: 'e1',
        providerId: 'p1',
        providerName: 'Proveedor Antiguo',
        providerEmail: 'old@demo.com',
        subject: 'Seguimiento antiguo',
        status: TRACKING_STATUS.WAITING,
        tags: [],
        lastEmailDate: past,
        thread: [],
      },
    ];
    saveTrackingRecords(records);

    const needing = getTrackingNeedingFollowup(3);
    expect(Array.isArray(needing)).toBe(true);
    expect(needing.length).toBe(1);
    expect(needing[0].providerEmail).toBe('old@demo.com');
  });

  it('actualiza el estado de seguimiento y persiste', () => {
    const email = { id: 'e2', subject: 'Consulta', body: 'Hola' };
    const provider = { id: 'p2', name: 'Proveedor 2', email: 'p2@demo.com' };
    const record = createTrackingRecord(email, provider);

    updateTrackingStatus(record.id, TRACKING_STATUS.FOLLOWUP, 'Requiere llamada');
    const stored = loadTrackingRecords();

    expect(stored[0].status).toBe(TRACKING_STATUS.FOLLOWUP);
    expect(stored[0].notes).toBe('Requiere llamada');
  });
});

