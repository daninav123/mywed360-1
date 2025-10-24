import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks globales de hooks ---
// Mock del hook que genera y envía emails IA
const mockSendEmail = vi.fn();

// Necesitamos poder cambiar la respuesta del hook en cada test, por eso lo inicializamos vacío
let hookReturn;

vi.mock('../../../../hooks/useAIProviderEmail', () => ({
  useAIProviderEmail: () => hookReturn,
}));

// Mock de autenticación para evitar error del AuthProvider
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user123', email: 'usuario.test@maloveapp.com' } }),
}));

// Mock del componente Alert para simplificar assertions
vi.mock('../../../../components/Alert', () => ({
  __esModule: true,
  default: ({ type, title, message, children, 'data-testid': testId = `${type}-alert` }) => (
    <div data-testid={testId}>
      {title && <div>{title}</div>}
      {message && <div>{message}</div>}
      {children}
    </div>
  ),
}));

import AIEmailModal from '../../../../components/proveedores/ai/AIEmailModal';
import { useAIProviderEmail } from '../../../../hooks/useAIProviderEmail';

const defaultAIResult = {
  id: 1,
  name: 'Fotógrafo Prueba',
  service: 'Fotografía',
  email: 'fotografo@prueba.com',
  aiSummary: 'Este fotógrafo tiene un estilo moderno perfecto para bodas.',
};

const baseHookState = {
  userEmail: 'usuario.test@maloveapp.com',
  isSending: false,
  error: null,
  sendEmailFromAIResult: mockSendEmail,
  generateAISubject: () => 'Consulta sobre Fotografía para boda - Fotógrafo Prueba',
  generateAIEmailBody: () => 'Cuerpo de email generado por IA',
};

describe('AIEmailModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue(true);
    // Restablecer estado base del hook para cada prueba
    hookReturn = { ...baseHookState };
  });

  const renderModal = (props = {}) =>
    render(
      <AIEmailModal
        isOpen
        aiResult={defaultAIResult}
        searchQuery="fotógrafo estilo moderno para boda"
        onClose={onClose}
        {...props}
      />
    );

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <AIEmailModal isOpen={false} aiResult={defaultAIResult} searchQuery="q" onClose={onClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra la información del proveedor y los campos precargados', () => {
    renderModal();
    expect(screen.getByText(/Contactar a Fotógrafo Prueba/i)).toBeInTheDocument();
    expect(screen.getByText(/usuario.test@maloveapp.com/i)).toBeInTheDocument();
    expect(screen.getByText(/fotografo@prueba.com/i)).toBeInTheDocument();
    expect(screen.getByTestId('email-subject')).toHaveValue(
      'Consulta sobre Fotografía para boda - Fotógrafo Prueba'
    );
    expect(screen.getByTestId('email-body')).toHaveValue('Cuerpo de email generado por IA');
  });

  it('permite editar el asunto y cuerpo del email', () => {
    renderModal();
    const subjectInput = screen.getByTestId('email-subject');
    const bodyInput = screen.getByTestId('email-body');

    fireEvent.change(subjectInput, { target: { value: 'Nuevo asunto' } });
    fireEvent.change(bodyInput, { target: { value: 'Nuevo cuerpo' } });

    expect(subjectInput).toHaveValue('Nuevo asunto');
    expect(bodyInput).toHaveValue('Nuevo cuerpo');
  });

  it('cierra el modal al pulsar el botón de cerrar', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('close-modal-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('envía el email y muestra alerta de éxito', async () => {
    mockSendEmail.mockResolvedValueOnce(true);
    renderModal();
    fireEvent.click(screen.getByTestId('send-email-btn'));

    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByTestId('success-alert')).toBeInTheDocument();
    });
  });

  it('muestra alerta de error si hook reporta error', () => {
    hookReturn = {
      ...baseHookState,
      error: 'Algo salió mal',
    };
    renderModal();
    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
    // Se muestra el título fijo de la alerta
    expect(screen.getAllByText(/Error al enviar el email/i).length).toBeGreaterThan(0);
    // Y el mensaje que proviene del hook
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });
});



