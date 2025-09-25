import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import EmailDetail from '../../components/email/UnifiedInbox/EmailDetail';
import { axe, formatViolations } from '../helpers/axeSetup';

// Mock mínimo de EmailComments para evitar dependencias externas
vi.mock('../../components/email/EmailComments', () => ({
  default: () => <div data-testid="email-comments" />,
}));

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

const mockEmail = {
  id: 'email123',
  from: 'remitente@example.com',
  to: 'usuario@mywed360.com',
  subject: 'Asunto de prueba accesibilidad',
  body: '<p>Este es un email de <strong>prueba</strong> para verificar la accesibilidad.</p>',
  date: '2025-07-10T15:30:00Z',
  folder: 'inbox',
  read: false,
  attachments: [],
};

describe('Pruebas de accesibilidad para EmailDetail', () => {
  let container;
  beforeEach(() => {
    vi.clearAllMocks();
    const rendered = render(
      <EmailDetail
        email={mockEmail}
        onReply={vi.fn()}
        onDelete={vi.fn()}
        onBack={vi.fn()}
        onMarkRead={vi.fn()}
      />,
      { wrapper: TestWrapper }
    );
    container = rendered.container;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const results = await axe(container);
    if (results.violations.length > 0) {
      console.error(formatViolations(results.violations));
    }
    expect(results).toHaveNoViolations();
  });

  it('muestra sujeto, remitente y cuerpo de forma accesible', () => {
    expect(screen.getByText('Asunto de prueba accesibilidad')).toBeInTheDocument();
    expect(screen.getByText('remitente@example.com')).toBeInTheDocument();
    // El cuerpo se inyecta como HTML; validamos presencia de un fragmento de texto
    expect(screen.getByText(/prueba/i)).toBeInTheDocument();
  });

  it('los botones de acción son accesibles (texto o aria-label)', () => {
    const actionButtons = container.querySelectorAll('button');
    expect(actionButtons.length).toBeGreaterThan(0);
    actionButtons.forEach((btn) => {
      const hasText = (btn.textContent || '').trim().length > 0;
      const hasAria = btn.getAttribute('aria-label');
      expect(hasText || !!hasAria).toBe(true);
    });
  });
});



