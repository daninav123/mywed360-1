import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// Mock de base de datos Firestore para todas las pruebas
vi.mock('./db.js', () => ({
  __esModule: true,
  db: { collection: () => ({}) },
}));

// Mock de firebase-admin por seguridad
vi.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: () => ({}) },
  firestore: () => ({})
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

// Mock de react-dnd para evitar necesidad de DragDropContext en tests
vi.mock('react-dnd', () => ({
  __esModule: true,
  useDrag: () => [{ isDragging: false }, () => {}],
  useDrop: () => [{ isOver: false }, () => {}],
}));

// Mock global de useAuth para tests que requieren AuthProvider
const authMock = {
  __esModule: true,
  default: () => ({
    currentUser: { uid: 'test', email: 'test@mock.com' },
    isAuthenticated: true,
    isLoading: false,
    userProfile: { email: 'test@mock.com' },
  }),
  useAuth: () => ({
    currentUser: { uid: 'test', email: 'test@mock.com' },
    isAuthenticated: true,
    isLoading: false,
    userProfile: { email: 'test@mock.com' },
  }),
};
vi.mock('../hooks/useAuth', () => authMock);
vi.mock('../../hooks/useAuth', () => authMock);
vi.mock('../../../hooks/useAuth', () => authMock);
vi.mock('@/hooks/useAuth', () => authMock);
vi.mock('src/hooks/useAuth', () => authMock);


// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';

// Limpiar el DOM después de cada prueba para evitar colisiones
afterEach(() => {
  cleanup();
});
