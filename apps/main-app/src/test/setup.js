import { beforeAll, afterEach, afterAll, expect, vi } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

vi.mock('../firebaseConfig', () => ({
  auth: null,
  db: null,
  storage: null,
  analytics: null,
  firebaseReady: Promise.resolve(),
  getFirebaseAuth: () => null,
  isOnline: true,
}));

if (matchers && typeof expect?.extend === 'function') {
  expect.extend(matchers);
}

if (!globalThis.vi) {
  globalThis.vi = vi;
}
if (!globalThis.vitest) {
  globalThis.vitest = true;
}

if (!globalThis.fetch || !globalThis.fetch.__vitestMock) {
  const makeHeaders = () => {
    try {
      return typeof Headers !== 'undefined' ? new Headers() : {};
    } catch {
      return {};
    }
  };

  const makeBlob = () => {
    try {
      return typeof Blob !== 'undefined' ? new Blob([]) : {};
    } catch {
      return {};
    }
  };

  const mockFetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: makeHeaders(),
    json: async () => ({}),
    text: async () => '',
    blob: async () => makeBlob(),
    arrayBuffer: async () => new ArrayBuffer(0),
  }));
  mockFetch.__vitestMock = true;
  globalThis.fetch = mockFetch;
}

const __realSetTimeout = globalThis.setTimeout;
const __realClearTimeout = globalThis.clearTimeout;
const __realSetInterval = globalThis.setInterval;
const __realClearInterval = globalThis.clearInterval;

const __activeTimeouts = new Set();
const __activeIntervals = new Set();

globalThis.setTimeout = (...args) => {
  const id = __realSetTimeout(...args);
  __activeTimeouts.add(id);
  return id;
};

globalThis.clearTimeout = (id) => {
  __activeTimeouts.delete(id);
  return __realClearTimeout(id);
};

globalThis.setInterval = (...args) => {
  const id = __realSetInterval(...args);
  __activeIntervals.add(id);
  return id;
};

globalThis.clearInterval = (id) => {
  __activeIntervals.delete(id);
  return __realClearInterval(id);
};

// Alias global "jest" apuntando a la API de "vi" para compatibilidad con pruebas que usan Jest
if (!globalThis.jest) {
  globalThis.jest = vi;
  globalThis.jest.fn = vi.fn;
  globalThis.jest.spyOn = vi.spyOn;
  globalThis.jest.mock = vi.mock;
}

// ---------- Render con proveedores globales ----------
// DESHABILITADO TEMPORALMENTE: Mock incompatible con Vitest v1.x
// Para tests que requieran providers, se deben envolver manualmente
// TODO: Implementar solución alternativa compatible con Vitest v1.x

// vi.mock('@testing-library/react', async () => {
//   const rtl = await vi.importActual('@testing-library/react');
//   const { default: AllProviders } = await import('./AllProviders.jsx');
//   return {
//     __esModule: true,
//     ...rtl,
//     render: (ui, options = {}) => rtl.render(ui, { wrapper: AllProviders, ...options }),
//   };
// });

// Limpieza automática después de cada prueba
afterEach(() => {
  cleanup();
});

afterEach(() => {
  __activeTimeouts.forEach((id) => {
    try {
      __realClearTimeout(id);
    } catch {}
  });
  __activeTimeouts.clear();

  __activeIntervals.forEach((id) => {
    try {
      __realClearInterval(id);
    } catch {}
  });
  __activeIntervals.clear();
});

afterAll(() => {
  try {
    __activeTimeouts.forEach((id) => {
      try {
        __realClearTimeout(id);
      } catch {}
    });
    __activeTimeouts.clear();

    __activeIntervals.forEach((id) => {
      try {
        __realClearInterval(id);
      } catch {}
    });
    __activeIntervals.clear();

    if (typeof process !== 'undefined' && process.env && process.env.VITEST_DEBUG_HANDLES === '1') {
      const handles = typeof process._getActiveHandles === 'function' ? process._getActiveHandles() : [];
      const summary = Array.isArray(handles)
        ? handles
            .map((h) => (h && h.constructor && h.constructor.name ? h.constructor.name : typeof h))
            .filter(Boolean)
        : [];
      // eslint-disable-next-line no-console
      console.error('[VITEST_DEBUG_HANDLES] active handles:', summary);
    }
  } catch {}
});

// ---------- Mocks genericos ----------
// Mock de react-beautiful-dnd para evitar necesidad del DragDropContext real
vi.mock('react-beautiful-dnd', () => {
  const Noop = ({ children }) => children;
  // Draggable y Droppable renderizan children()
  const Draggable = ({ children }) => {
    const provided = {
      draggableProps: { style: {} },
      dragHandleProps: {},
      innerRef: () => {},
    };
    return children(provided, {});
  };
  const Droppable = ({ children }) => {
    const provided = {
      droppableProps: {},
      innerRef: () => {},
    };
    return children(provided, {});
  };
  return {
    __esModule: true,
    DragDropContext: Noop,
    Draggable,
    Droppable,
  };
});
// Mock de todos los iconos Lucide: cualquier componente será un div vacío (o svg)
// Usamos un Proxy para evitar declarar cada icono individualmente
vi.mock('lucide-react', () => {
  const Stub = () => null;
  // Usamos un Proxy para que cualquier named export devuelva el componente Stub.
  return new Proxy(
    { __esModule: true, default: Stub },
    {
      get: (target, prop) => {
        if (prop in target) return target[prop];
        return Stub;
      },
    }
  );
});

// Implementación de localStorage para pruebas (global)
// IMPORTANTE: Debe definirse ANTES de importar módulos que lo usen
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Exponer localStorage como global inmediatamente
global.localStorage = localStorageMock;

// Si window existe (jsdom), configurar también window.localStorage
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  // Mock de navigator.onLine
  if (window.navigator) {
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  }

  // Mock para matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

