import { vi, afterEach, expect } from 'vitest';
// Registrar matchers de Testing Library (jest-dom) para Vitest
import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import { cleanup } from '@testing-library/react';

// Mock de base de datos Firestore para todas las pruebas
vi.mock('./db.js', () => ({
  __esModule: true,
  db: { collection: () => ({}) },
}));

// Mock del SDK cliente de Firestore solo en entorno jsdom (evitar interferir con pruebas de reglas en entorno node)
if (typeof window !== 'undefined') {
  // Proporciona stubs seguros usados por los hooks/componentes
  vi.mock('firebase/firestore', () => ({
    __esModule: true,
    // Referencias ligeras con metadatos de ruta (para logs/debug si fuera necesario)
    doc: (...segments) => ({ __type: 'doc', path: segments.join('/') }),
    collection: (...segments) => ({ __type: 'collection', path: segments.join('/') }),
    // Lecturas devolviendo valores vacíos de forma segura
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
    getDocs: vi.fn(async () => ({ docs: [] })),
    // onSnapshot invoca callback de éxito con snapshot vacío y devuelve unsub no-op
    onSnapshot: vi.fn((ref, onNext, onError) => {
      try {
        if (typeof onNext === 'function') {
          // Ejecutar asíncrono para emular comportamiento real sin bloquear
          setTimeout(() => onNext({ docs: [], data: () => ({}) }), 0);
        }
      } catch (e) {
        if (typeof onError === 'function') onError(e);
      }
      return () => {};
    }),
    // Operaciones básicas como no-ops
    writeBatch: () => ({ set: () => {}, commit: async () => {} }),
    setDoc: vi.fn(async () => {}),
    addDoc: vi.fn(async () => ({ id: 'test-doc-id' })),
    updateDoc: vi.fn(async () => {}),
    deleteDoc: vi.fn(async () => {}),
    orderBy: vi.fn(() => ({})),
    query: vi.fn((ref) => ref),
    serverTimestamp: vi.fn(() => new Date()),
    arrayUnion: (...vals) => ({ __op: 'arrayUnion', vals }),
  }));
}

// Mock de firebase-admin por seguridad (soporta initializeApp, apps, credential, firestore y FieldValue)
vi.mock('firebase-admin', () => {
  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(async () => {}),
        get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
        update: vi.fn(async () => {}),
      })),
      where: vi.fn(() => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) })),
      select: vi.fn(() => ({ get: vi.fn(async () => ({ forEach: () => {} })) })),
      get: vi.fn(async () => ({ forEach: () => {} })),
    })),
    doc: vi.fn(() => ({ set: vi.fn(async () => {}), update: vi.fn(async () => {}) })),
  }));
  // Emular FieldValue en namespace firestore (admin.firestore.FieldValue.serverTimestamp())
  firestoreFn.FieldValue = { serverTimestamp: () => new Date() };
  return {
    __esModule: true,
    default: {
      apps: [],
      initializeApp: vi.fn(() => {}),
      credential: { applicationDefault: vi.fn(() => ({})) },
      firestore: firestoreFn,
    },
  };
});

// Mock de twilio para evitar llamadas reales durante pruebas
vi.mock('twilio', () => ({
  __esModule: true,
  default: (sid, token) => ({
    messages: {
      create: vi.fn(async ({ body }) => ({ sid: 'SM_test', status: 'queued', body })),
    },
  }),
}));

// Mock global de Firebase config (compatibilidad con distintas rutas)
const firebaseMock = {
  __esModule: true,
  db: {},
  auth: {},
  firebaseReady: Promise.resolve(),
};
// Posibles rutas según el nivel de anidamiento del import
vi.mock('../firebaseConfig', () => firebaseMock);
vi.mock('../../firebaseConfig', () => firebaseMock);
vi.mock('../../../firebaseConfig', () => firebaseMock);
vi.mock('@/firebaseConfig', () => firebaseMock);
vi.mock('src/firebaseConfig', () => firebaseMock);
vi.mock('/src/firebaseConfig.js', () => firebaseMock);

// Mock genérico de axios para evitar llamadas externas inesperadas
vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

// Mock global de EmailService para evitar llamadas reales a la API y facilitar los mocks en tests
const emailServiceMock = {
  __esModule: true,
  initEmailService: vi.fn(),
  getMails: vi.fn(),
  deleteMail: vi.fn(),
  markAsRead: vi.fn(),
  sendMail: vi.fn(),
  createEmailAlias: vi.fn(),
  setAuthContext: vi.fn(),
};
// Registrar mocks para las rutas más comunes (distintos niveles de anidamiento y casing)
vi.mock('../services/EmailService', () => emailServiceMock);
vi.mock('../../services/EmailService', () => emailServiceMock);
vi.mock('../../../services/EmailService', () => emailServiceMock);
vi.mock('@/services/EmailService', () => emailServiceMock);
vi.mock('src/services/EmailService', () => emailServiceMock);
vi.mock('../services/emailService', () => emailServiceMock);
vi.mock('../../services/emailService', () => emailServiceMock);
vi.mock('../../../services/emailService', () => emailServiceMock);
vi.mock('@/services/emailService', () => emailServiceMock);
vi.mock('src/services/emailService', () => emailServiceMock);

// Exponer EmailService como variable global para tests que no realizan import explícito
// eslint-disable-next-line no-undef
globalThis.EmailService = emailServiceMock;

// Mock de react-dnd para evitar necesidad de DragDropContext en tests
vi.mock('react-dnd', () => ({
  __esModule: true,
  useDrag: () => [{ isDragging: false }, () => {}],
  useDrop: () => [{ isOver: false }, () => {}],
}));

// Mock de lucide-react para evitar llamadas reales durante pruebas
vi.mock('lucide-react', () => ({
  __esModule: true,
  Plus: () => <div data-testid="plus-icon">+</div>,
  ArrowLeft: () => <div data-testid="arrowleft-icon">←</div>,
  Paperclip: () => <div data-testid="paperclip-icon">📎</div>,
  Calendar: () => <div data-testid="calendar-icon">📅</div>,
}));

// Mock global de useAuth para tests que requieren AuthProvider
// Crear useAuth como vi.fn para que las pruebas puedan usar mockReturnValue y otras utilidades
const useAuthMock = vi.fn(() => ({
  currentUser: { uid: 'test', email: 'test@mock.com' },
  isAuthenticated: true,
  isLoading: false,
  userProfile: { email: 'test@mock.com' },
}));

const authMock = {
  __esModule: true,
  default: useAuthMock,
  useAuth: useAuthMock,
};
vi.mock('../hooks/useAuth', () => authMock);
vi.mock('../../hooks/useAuth', () => authMock);
vi.mock('../../../hooks/useAuth', () => authMock);
vi.mock('@/hooks/useAuth', () => authMock);
vi.mock('src/hooks/useAuth', () => authMock);

// Hacer accesible useAuth como variable global para tests que no lo importan explícitamente
// Esto evita ReferenceError "useAuth is not defined" en algunos archivos de prueba
// eslint-disable-next-line no-undef
globalThis.useAuth = authMock.useAuth;


// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';

// Limpiar el DOM después de cada prueba para evitar colisiones
// Parche para jest-axe: eliminar tag runOnly desconocido "wcag2aa" que no existe en axe-core v4
import axeCore from 'axe-core';
const originalAxeRun = axeCore.run.bind(axeCore);
axeCore.run = (node, options = {}, callback) => {
  if (options.runOnly) {
    if (Array.isArray(options.runOnly)) {
      options.runOnly = options.runOnly.filter(tag => tag !== 'wcag2aa');
    } else if (typeof options.runOnly === 'object' && Array.isArray(options.runOnly.values)) {
      options.runOnly.values = options.runOnly.values.filter(tag => tag !== 'wcag2aa');
      if (options.runOnly.values.length === 0) delete options.runOnly; // sin tags
    }
  }
  return originalAxeRun(node, options, callback);
};

afterEach(() => {
  cleanup();
});
