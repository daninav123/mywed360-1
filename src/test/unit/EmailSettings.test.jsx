import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import EmailSettings from '../../components/email/EmailSettings';
import { useAuth } from '../../context/AuthContext';
import { createEmailAlias, initEmailService } from '../../services/emailService';

// Mock de los m�dulos necesarios
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/emailService', () => ({
  createEmailAlias: vi.fn(),
  initEmailService: vi.fn(),
}));

// Mock del componente TagsManager para aislarlo
vi.mock('../../components/settings/WeddingAccountLink', () => ({
  default: () => <div data-testid="wedding-link">WeddingAccountLink Mock</div>,
}));

// Mock del componente TagsManager para aislarlo
vi.mock('../../components/email/TagsManager', () => ({
  default: () => <div data-testid="tags-manager">Gestor de etiquetas (Mock)</div>,
}));

describe('EmailSettings', () => {
  // Datos de prueba
  const mockUserProfile = {
    id: 'profile123',
    userId: 'user123',
    brideFirstName: 'Mar�a',
    brideLastName: 'Garc�a',
    emailAlias: 'maria.garcia',
  };

  const mockUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Configuraci�n por defecto para los mocks
    useAuth.mockReturnValue({
      userProfile: mockUserProfile,
      currentUser: { uid: 'user123' },
      updateUserProfile: mockUpdateProfile,
    });

    initEmailService.mockReturnValue('maria.garcia@maloveapp.com');

    createEmailAlias.mockResolvedValue({
      success: true,
      alias: 'nuevo.alias',
      email: 'nuevo.alias@maloveapp.com',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('muestra correctamente la direcci�n de correo actual del usuario', () => {
    render(<EmailSettings />);

    // Verificar que se muestra la direcci�n actual
    expect(screen.getByText('maria.garcia@maloveapp.com')).toBeInTheDocument();

    // Verificar que se llam� a initEmailService con el perfil del usuario
    expect(initEmailService).toHaveBeenCalledWith(mockUserProfile);
  });

  it('muestra el placeholder correcto en el input de alias', () => {
    render(<EmailSettings />);

    const aliasInput = screen.getByPlaceholderText('maria.garcia');
    expect(aliasInput).toBeInTheDocument();
  });

  it('permite actualizar el alias de correo electr�nico', async () => {
    render(<EmailSettings />);

    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar direcci�n' });

    // El bot�n debe estar inicialmente deshabilitado
    expect(submitButton).toBeDisabled();

    // Introducir un nuevo alias
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');

    // El bot�n debe estar habilitado ahora
    expect(submitButton).toBeEnabled();

    // Enviar el formulario
    fireEvent.click(submitButton);

    // Verificar que se llam� a la API con los par�metros correctos
    expect(createEmailAlias).toHaveBeenCalledWith(mockUserProfile, 'nuevo.alias');

    // Verificar que se muestra el mensaje de �xito
    await waitFor(() => {
      expect(
        screen.getByText('�Tu direcci�n de correo ha sido actualizada con �xito!')
      ).toBeInTheDocument();
    });

    // Verificar que se llam� a la funci�n de actualizaci�n de perfil
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      ...mockUserProfile,
      emailAlias: 'nuevo.alias',
    });

    // Esperar a que el setTimeout interno o l�gica equivalente oculten el mensaje
    await waitFor(
      () => {
        expect(
          screen.queryByText('�Tu direcci�n de correo ha sido actualizada con �xito!')
        ).not.toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it('muestra error cuando el alias no es v�lido', async () => {
    render(<EmailSettings />);

    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar direcci�n' });

    // Introducir un alias inv�lido (demasiado corto)
    const user = userEvent.setup();
    await user.type(aliasInput, 'ab');

    // Intentar enviar el formulario
    fireEvent.click(submitButton);

    // Verificar que se muestra el mensaje de error
    expect(screen.getByText(/El alias debe tener al menos 3 caracteres/)).toBeInTheDocument();

    // Verificar que NO se llam� a la API
    expect(createEmailAlias).not.toHaveBeenCalled();

    // Limpiar el input e introducir otro alias inv�lido (caracteres no permitidos)
    await user.clear(aliasInput);
    await user.type(aliasInput, 'nuevo-alias!');

    // Intentar enviar el formulario de nuevo
    fireEvent.click(submitButton);

    // Verificar que se muestra el mensaje de error
    expect(screen.getByText(/El alias debe tener al menos 3 caracteres/)).toBeInTheDocument();

    // Verificar que NO se llam� a la API
    expect(createEmailAlias).not.toHaveBeenCalled();
  });

  it('maneja correctamente los errores de la API', async () => {
    // Configurar el mock para simular un error
    createEmailAlias.mockRejectedValueOnce(new Error('El alias ya est� en uso'));

    render(<EmailSettings />);

    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar direcci�n' });

    // Introducir un nuevo alias
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');

    // Enviar el formulario
    fireEvent.click(submitButton);

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('Error: El alias ya est� en uso')).toBeInTheDocument();
    });

    // Verificar que NO se llam� a la funci�n de actualizaci�n de perfil
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('convierte el alias a min�sculas autom�ticamente', async () => {
    render(<EmailSettings />);

    // Obtener el input de alias
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');

    // Introducir un alias con may�sculas
    const user = userEvent.setup();
    await user.type(aliasInput, 'NUEVO.ALIAS');

    // Verificar que el valor del input se convirti� a min�sculas
    expect(aliasInput).toHaveValue('nuevo.alias');
  });

  it('incluye preferencias de notificaci�n con valores predeterminados', () => {
    render(<EmailSettings />);

    // Verificar que existen las opciones de notificaci�n
    expect(screen.getByLabelText('Notificarme cuando reciba nuevos correos')).toBeChecked();
    expect(screen.getByLabelText('Notificarme cuando mis correos sean le�dos')).toBeChecked();
  });

  it('incluye el componente TagsManager', () => {
    render(<EmailSettings />);

    // Verificar que se renderiza el componente TagsManager
    const tagsManager = screen.getByTestId('tags-manager');
    expect(tagsManager).toBeInTheDocument();
    expect(tagsManager.textContent).toContain('Gestor de etiquetas (Mock)');
  });

  it('muestra el estado de carga durante la actualizaci�n', async () => {
    // Crear una promesa que no se resuelve inmediatamente para simular carga
    let resolvePromise;
    const loadingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    createEmailAlias.mockReturnValueOnce(loadingPromise);

    render(<EmailSettings />);

    // Obtener elementos del formulario
    const aliasInput = screen.getByLabelText('Nuevo alias de correo');
    const submitButton = screen.getByRole('button', { name: 'Actualizar direcci�n' });

    // Introducir un nuevo alias y enviar
    const user = userEvent.setup();
    await user.type(aliasInput, 'nuevo.alias');
    fireEvent.click(submitButton);

    // Verificar que se muestra el estado de carga
    expect(screen.getByRole('button', { name: 'Actualizando...' })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolver la promesa para finalizar la carga
    resolvePromise({
      success: true,
      alias: 'nuevo.alias',
      email: 'nuevo.alias@maloveapp.com',
    });

    // Verificar que el bot�n vuelve a su estado normal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Actualizar direcci�n' })).toBeInTheDocument();
    });
  });

  it('no intenta inicializar si no hay perfil de usuario', () => {
    // Simular que no hay perfil de usuario
    useAuth.mockReturnValueOnce({
      userProfile: null,
      currentUser: null,
      updateUserProfile: mockUpdateProfile,
    });

    render(<EmailSettings />);

    // Verificar que no se llam� a initEmailService
    expect(initEmailService).not.toHaveBeenCalled();

    // La direcci�n de correo deber�a estar vac�a
    expect(screen.queryByText('@maloveapp.com')).toBeInTheDocument();
    expect(screen.queryByText('maria.garcia@maloveapp.com')).not.toBeInTheDocument();
  });
});



