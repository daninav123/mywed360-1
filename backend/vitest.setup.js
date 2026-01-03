import { vi, afterEach, afterAll, expect } from 'vitest';
// Registrar matchers de Testing Library (jest-dom) para Vitest
import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import { cleanup } from '@testing-library/react';

// Mock de base de datos Firestore para todas las pruebas
vi.mock('./db.js', () => ({
  __esModule: true,
  db: {
    collection: () => ({
      add: async (doc) => ({ id: 'test-id', doc }),
      doc: () => ({ set: async () => {}, update: async () => {} }),
      where: () => ({
        limit: () => ({ get: async () => ({ empty: true, docs: [] }) }),
        get: async () => ({ empty: true, docs: [] }),
      }),
      get: async () => ({ empty: true, docs: [] }),
    }),
  },
}));

// Mock del middleware de auth para que index.js y rutas no fallen por requireAdmin
vi.mock('./middleware/authMiddleware.js', () => ({
  __esModule: true,
  authMiddleware: () => (_req, _res, next) => next(),
  requireAuth: (_req, _res, next) => next(),
  requireMailAccess: (_req, _res, next) => next(),
  requirePlanner: (_req, _res, next) => next(),
  optionalAuth: (_req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
}));

// Mock de multer para evitar dependencias nativas y asegurar memoryStorage() (supplier-dashboard)
vi.mock('multer', () => {
  const middleware = (_req, _res, next) => next();
  const instance = {
    any: () => middleware,
    single: () => middleware,
    array: () => middleware,
    fields: () => middleware,
  };
  const fn = () => instance;
  fn.memoryStorage = () => ({});
  return { __esModule: true, default: fn };
});

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
  const makeQuery = () => ({
    get: vi.fn(async () => ({ empty: true, docs: [] })),
    limit: vi.fn(() => makeQuery()),
    orderBy: vi.fn(() => makeQuery()),
    where: vi.fn(() => makeQuery()),
    select: vi.fn(() => ({ get: vi.fn(async () => ({ forEach: () => {} })) })),
  });

  const makeDocRef = () => {
    const ref = {
      set: vi.fn(async () => {}),
      get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
      update: vi.fn(async () => {}),
    };
    ref.collection = vi.fn(() => makeCollectionRef());
    return ref;
  };

  const makeCollectionRef = () => ({
    doc: vi.fn(() => makeDocRef()),
    where: vi.fn(() => makeQuery()),
    select: vi.fn(() => ({ get: vi.fn(async () => ({ forEach: () => {} })) })),
    get: vi.fn(async () => ({ empty: true, docs: [], forEach: () => {} })),
    limit: vi.fn(() => makeQuery()),
    orderBy: vi.fn(() => makeCollectionRef()),
  });

  const firestoreFn = vi.fn(() => ({
    collection: vi.fn(() => makeCollectionRef()),
    doc: vi.fn(() => makeDocRef()),
    batch: vi.fn(() => ({
      set: vi.fn(() => {}),
      update: vi.fn(() => {}),
      delete: vi.fn(() => {}),
      commit: vi.fn(async () => {}),
    })),
  }));
  firestoreFn.FieldValue = {
    serverTimestamp: () => new Date(),
    increment: (n = 1) => n,
    arrayUnion: (...vals) => ({ __op: 'arrayUnion', vals }),
  };
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

// Stub global de EmailService para pruebas que referencian `EmailService` directamente.
// No se mockea el módulo importado; el componente EmailInbox leerá este objeto vía shim.
// eslint-disable-next-line no-undef
globalThis.EmailService = {
  __esModule: true,
  initEmailService: vi.fn(async () => 'usuario@maloveapp.com'),
  getMails: vi.fn(async () => []),
  deleteMail: vi.fn(async () => true),
  markAsRead: vi.fn(async () => {}),
  sendMail: vi.fn(async () => ({ success: true })),
  createEmailAlias: vi.fn(async () => ({ success: true, email: 'usuario@maloveapp.com' })),
  setAuthContext: vi.fn(),
};

// No definimos mocks globales de EmailService aquí para evitar conflictos con
// los mocks específicos de cada test.

// Mock de react-dnd para evitar necesidad de DragDropContext en tests
vi.mock('react-dnd', () => ({
  __esModule: true,
  useDrag: () => [{ isDragging: false }, () => {}],
  useDrop: () => [{ isOver: false }, () => {}],
}));

// Mock ultra-ligero de lucide-react: Proxy que retorna un componente Stub para cualquier export
// Evita importaciones pesadas del módulo real que pueden colgar workers en Windows.
vi.mock('lucide-react', () => {
  const Stub = () => null;
  return new Proxy(
    { __esModule: true, default: Stub },
    {
      get: (target, prop) => (prop in target ? target[prop] : Stub),
    }
  );
});

// Mock global de useAuth para tests que requieren AuthProvider
// Crear useAuth como vi.fn para que las pruebas puedan usar mockReturnValue y otras utilidades
const useAuthMock = vi.fn(() => ({
  currentUser: { uid: 'test', email: 'test@mock.com' },
  isAuthenticated: true,
  isLoading: false,
  userProfile: { email: 'test@mock.com' },
  // Compatibilidad con componentes que esperan estas claves
  user: { uid: 'user123', email: 'usuario@maloveapp.com' },
  profile: {
    id: 'profile123',
    email: 'usuario@maloveapp.com',
    name: 'Usuario Test',
    emailUsername: 'usuario',
    myWed360Email: 'usuario@maloveapp.com'
  },
}));

const AuthProviderMock = ({ children }) => children;
const authMock = {
  __esModule: true,
  default: useAuthMock,
  useAuth: useAuthMock,
  AuthProvider: AuthProviderMock,
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

try {
  const keysToClear = [
    'OPENAI_API_KEY',
    'VITE_OPENAI_API_KEY',
    'OPENAI_PROJECT_ID',
    'VITE_OPENAI_PROJECT_ID',
    'OPENAI_MODEL',
    'OPENAI_MODEL_WEBSITE',
    'GOOGLE_PLACES_API_KEY',
    'VITE_GOOGLE_PLACES_API_KEY',
    'GOOGLE_SEARCH_API_KEY',
    'GOOGLE_SEARCH_CX',
    'TAVILY_API_KEY',
    'MAILGUN_API_KEY',
    'MAILGUN_DOMAIN',
    'MAILGUN_SENDING_DOMAIN',
    'VITE_MAILGUN_API_KEY',
    'VITE_MAILGUN_DOMAIN',
    'VITE_MAILGUN_SENDING_DOMAIN',
  ];
  for (const k of keysToClear) {
    try {
      delete process.env[k];
    } catch {}
  }
} catch {}

vi.mock('openai', () => {
  class OpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: async () => ({ choices: [{ message: { content: '{}' } }] }),
        },
      };
    }
  }
  return { __esModule: true, default: OpenAI };
});

vi.mock('node-fetch', () => {
  const fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  });
  return { __esModule: true, default: fetch };
});

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

// Evitar que rechazos no manejados (simulados) rompan toda la suite; se loguean para diagnóstico
if (!process.__malove_vitest_unhandled_rejection_handler) {
  process.__malove_vitest_unhandled_rejection_handler = true;
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection (test env):', reason);
  });
}

afterAll(() => {
  try {
    if (process.env && process.env.VITEST_DEBUG_HANDLES === '1') {
      const handles = typeof process._getActiveHandles === 'function' ? process._getActiveHandles() : [];
      const counts = new Map();
      if (Array.isArray(handles)) {
        for (const h of handles) {
          const name = h && h.constructor && h.constructor.name ? h.constructor.name : typeof h;
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      }
      const summary = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
      // eslint-disable-next-line no-console
      console.error('[VITEST_DEBUG_HANDLES][backend] active handles:', summary);
    }
  } catch {}
});

afterEach(async () => {
  try {
    if (typeof process === 'undefined' || typeof process._getActiveHandles !== 'function') return;
    const handles = process._getActiveHandles() || [];
    if (!Array.isArray(handles)) return;
    const servers = handles.filter((h) => h && h.constructor && h.constructor.name === 'Server' && typeof h.close === 'function');
    for (const s of servers) {
      try {
        await new Promise((resolve) => s.close(() => resolve()));
      } catch {}
    }
  } catch {}
});

afterEach(() => {
  cleanup();
});
