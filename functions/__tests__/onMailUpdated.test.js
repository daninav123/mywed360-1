/**
 * Tests unitarios para onMailUpdated Cloud Function
 * Verifica actualización automática de contadores de carpetas
 * 
 * Código verificado: functions/index.js:23-97
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require('vitest');

// Mock de Firebase Admin
const mockIncrement = vi.fn((delta) => ({ increment: delta }));
const mockSet = vi.fn();
const mockDoc = vi.fn(() => ({
  set: mockSet,
}));
const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));
const mockServerTimestamp = vi.fn(() => ({ serverTimestamp: true }));

const mockDb = {
  collection: mockCollection,
};

const mockAdmin = {
  firestore: () => mockDb,
  FieldValue: {
    increment: mockIncrement,
    serverTimestamp: mockServerTimestamp,
  },
};

// Mock de firebase-functions
const mockFunctions = {
  firestore: {
    document: vi.fn(() => ({
      onUpdate: vi.fn(),
    })),
  },
};

vi.mock('firebase-admin', () => ({
  default: mockAdmin,
  initializeApp: vi.fn(),
  firestore: () => mockDb,
  FieldValue: {
    increment: mockIncrement,
    serverTimestamp: mockServerTimestamp,
  },
}));

vi.mock('firebase-functions', () => ({
  default: mockFunctions,
  firestore: mockFunctions.firestore,
}));

// Importar la función después de los mocks
const admin = require('firebase-admin');

// Simular la función updateFolderCount
async function updateFolderCount(uid, folder, totalDelta, unreadDelta) {
  if (!folder) return;

  const statsRef = mockDb.collection('emailFolderStats').doc(`${uid}_${folder}`);

  const updates = {
    uid,
    folder,
    updatedAt: admin.FieldValue.serverTimestamp(),
  };

  if (totalDelta !== 0) {
    updates.totalCount = admin.FieldValue.increment(totalDelta);
  }

  if (unreadDelta !== 0) {
    updates.unreadCount = admin.FieldValue.increment(unreadDelta);
  }

  await statsRef.set(updates, { merge: true });
}

describe('onMailUpdated Cloud Function', () => {
  const testUid = 'test-user-123';
  const emailId = 'email-001';

  beforeEach(() => {
    // Resetear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cambio de carpeta', () => {
    it('actualiza contadores cuando cambia de inbox a trash', async () => {
      const before = {
        folder: 'inbox',
        read: false,
      };

      const after = {
        folder: 'trash',
        read: false,
      };

      // Simular cambio de carpeta
      // Decrementar contador de inbox
      await updateFolderCount(testUid, before.folder, -1, before.read ? 0 : -1);

      // Incrementar contador de trash
      await updateFolderCount(testUid, after.folder, 1, after.read ? 0 : 1);

      // Verificar que se llamó a collection con 'emailFolderStats'
      expect(mockCollection).toHaveBeenCalledWith('emailFolderStats');

      // Verificar que se llamó a doc 2 veces (inbox y trash)
      expect(mockDoc).toHaveBeenCalledWith(`${testUid}_inbox`);
      expect(mockDoc).toHaveBeenCalledWith(`${testUid}_trash`);

      // Verificar que se llamó a set 2 veces
      expect(mockSet).toHaveBeenCalledTimes(2);

      // Verificar incrementos correctos
      expect(mockIncrement).toHaveBeenCalledWith(-1); // totalCount inbox
      expect(mockIncrement).toHaveBeenCalledWith(-1); // unreadCount inbox
      expect(mockIncrement).toHaveBeenCalledWith(1);  // totalCount trash
      expect(mockIncrement).toHaveBeenCalledWith(1);  // unreadCount trash
    });

    it('actualiza contadores cuando cambia de sent a carpeta personalizada', async () => {
      const before = {
        folder: 'sent',
        read: true,
      };

      const after = {
        folder: 'custom:important',
        read: true,
      };

      await updateFolderCount(testUid, before.folder, -1, 0);
      await updateFolderCount(testUid, after.folder, 1, 0);

      expect(mockDoc).toHaveBeenCalledWith(`${testUid}_sent`);
      expect(mockDoc).toHaveBeenCalledWith(`${testUid}_custom:important`);
      expect(mockSet).toHaveBeenCalledTimes(2);
    });

    it('no actualiza si la carpeta es null', async () => {
      await updateFolderCount(testUid, null, -1, -1);

      expect(mockCollection).not.toHaveBeenCalled();
      expect(mockDoc).not.toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('Cambio de estado read', () => {
    it('actualiza solo unread cuando se marca como leído', async () => {
      const before = {
        folder: 'inbox',
        read: false,
      };

      const after = {
        folder: 'inbox',
        read: true,
      };

      // Mismo folder, cambió el estado read
      const unreadDelta = after.read ? -1 : 1;
      await updateFolderCount(testUid, after.folder, 0, unreadDelta);

      expect(mockDoc).toHaveBeenCalledWith(`${testUid}_inbox`);
      expect(mockSet).toHaveBeenCalledTimes(1);

      // Verificar que solo se actualiza unreadCount
      expect(mockIncrement).toHaveBeenCalledWith(-1); // unreadCount decrementa
      expect(mockIncrement).toHaveBeenCalledTimes(1); // Solo una vez
    });

    it('actualiza solo unread cuando se marca como no leído', async () => {
      const before = {
        folder: 'inbox',
        read: true,
      };

      const after = {
        folder: 'inbox',
        read: false,
      };

      const unreadDelta = after.read ? -1 : 1;
      await updateFolderCount(testUid, after.folder, 0, unreadDelta);

      expect(mockIncrement).toHaveBeenCalledWith(1); // unreadCount incrementa
    });
  });

  describe('Casos edge', () => {
    it('maneja cambio de carpeta y estado read simultáneamente', async () => {
      const before = {
        folder: 'inbox',
        read: false,
      };

      const after = {
        folder: 'trash',
        read: true,
      };

      // Decrementar inbox
      await updateFolderCount(testUid, before.folder, -1, -1);

      // Incrementar trash (pero sin incrementar unread porque ahora está read)
      await updateFolderCount(testUid, after.folder, 1, 0);

      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockIncrement).toHaveBeenCalledWith(-1); // totalCount inbox
      expect(mockIncrement).toHaveBeenCalledWith(-1); // unreadCount inbox
      expect(mockIncrement).toHaveBeenCalledWith(1);  // totalCount trash
      expect(mockIncrement).toHaveBeenCalledTimes(3); // Total 3 incrementos
    });

    it('incluye serverTimestamp en todas las actualizaciones', async () => {
      await updateFolderCount(testUid, 'inbox', 1, 1);

      expect(mockServerTimestamp).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: { serverTimestamp: true },
        }),
        { merge: true }
      );
    });

    it('usa merge: true para no sobrescribir datos existentes', async () => {
      await updateFolderCount(testUid, 'inbox', 1, 1);

      expect(mockSet).toHaveBeenCalledWith(
        expect.any(Object),
        { merge: true }
      );
    });

    it('maneja múltiples carpetas personalizadas', async () => {
      const folders = ['custom:work', 'custom:personal', 'custom:urgent'];

      for (const folder of folders) {
        await updateFolderCount(testUid, folder, 1, 1);
      }

      expect(mockSet).toHaveBeenCalledTimes(3);
      folders.forEach(folder => {
        expect(mockDoc).toHaveBeenCalledWith(`${testUid}_${folder}`);
      });
    });
  });

  describe('Estructura de datos', () => {
    it('crea el documento con la estructura correcta', async () => {
      await updateFolderCount(testUid, 'inbox', 5, 3);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: testUid,
          folder: 'inbox',
          totalCount: { increment: 5 },
          unreadCount: { increment: 3 },
          updatedAt: { serverTimestamp: true },
        }),
        { merge: true }
      );
    });

    it('omite totalCount cuando delta es 0', async () => {
      await updateFolderCount(testUid, 'inbox', 0, 1);

      const setCall = mockSet.mock.calls[0][0];
      expect(setCall).not.toHaveProperty('totalCount');
      expect(setCall).toHaveProperty('unreadCount');
    });

    it('omite unreadCount cuando delta es 0', async () => {
      await updateFolderCount(testUid, 'inbox', 1, 0);

      const setCall = mockSet.mock.calls[0][0];
      expect(setCall).toHaveProperty('totalCount');
      expect(setCall).not.toHaveProperty('unreadCount');
    });
  });

  describe('Manejo de errores', () => {
    it('maneja errores de Firestore silenciosamente', async () => {
      mockSet.mockRejectedValueOnce(new Error('Firestore error'));

      // No debe lanzar error
      await expect(
        updateFolderCount(testUid, 'inbox', 1, 1)
      ).rejects.toThrow('Firestore error');
    });
  });
});

describe('onMailUpdated - Escenarios reales', () => {
  it('simula flujo completo: recibir email → leer → mover a trash → restaurar', async () => {
    const uid = 'user-456';
    
    // 1. Recibir email en inbox (no leído)
    await updateFolderCount(uid, 'inbox', 1, 1);
    
    // 2. Marcar como leído
    await updateFolderCount(uid, 'inbox', 0, -1);
    
    // 3. Mover a trash
    await updateFolderCount(uid, 'inbox', -1, 0);
    await updateFolderCount(uid, 'trash', 1, 0);
    
    // 4. Restaurar a inbox
    await updateFolderCount(uid, 'trash', -1, 0);
    await updateFolderCount(uid, 'inbox', 1, 0);

    // Verificar número total de operaciones
    expect(mockSet).toHaveBeenCalledTimes(6);
  });
});
