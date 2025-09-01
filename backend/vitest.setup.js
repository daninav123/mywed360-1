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

// Mock global de Firebase config para evitar inicialización real
vi.mock(/^.*firebaseConfig(?:\.js)?$/, () => ({
  __esModule: true,
  db: {},
  auth: {},
  firebaseReady: Promise.resolve()
}));

// Mock genérico de axios para evitar llamadas externas inesperadas
vi.mock('axios', () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

// Asegurar entorno de tests antes de que index.js se cargue
process.env.NODE_ENV = 'test';

// Limpiar el DOM después de cada prueba para evitar colisiones
afterEach(() => {
  cleanup();
});
