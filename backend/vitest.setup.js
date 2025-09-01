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

// Mock global de EmailService para evitar llamadas reales a la API y facilitar los mocks en tests
const emailServiceMock = {
  __esModule: true,
  initEmailService: vi.fn(),
  getMails: vi.fn(),
  deleteMail: vi.fn(),
  markAsRead: vi.fn(),
  sendMail: vi.fn(),
  createEmailAlias: vi.fn(),
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
afterEach(() => {
  cleanup();
});
