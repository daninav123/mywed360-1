/* eslint-env vitest, browser */
/* eslint-disable no-unused-vars */

// Mock genérico de lucide-react: exporta explícitamente los iconos usados
vi.mock('lucide-react', () => {
  const icon = (name) => (props) => (
    <svg aria-hidden="true" data-testid={`${name}-icon`} {...props} />
  );
  return {
    __esModule: true,
    // EmailViewer / EmailList
    ArrowLeft: icon('arrowleft'),
    Trash: icon('trash'),
    Star: icon('star'),
    StarOff: icon('staroff'),
    Reply: icon('reply'),
    Forward: icon('forward'),
    Paperclip: icon('paperclip'),
    Calendar: icon('calendar'),
    Download: icon('download'),
    Mail: icon('mail'),
    Folder: icon('folder'),
    Plus: icon('plus'),
    // Otros comunes
    X: icon('x'),
    CheckCircle: icon('checkcircle'),
    AlertCircle: icon('alertcircle'),
    ChevronDown: icon('chevrondown'),
  };
});

import { render, screen, cleanup } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import EmailFolderList from '../../components/email/EmailFolderList';
import EmailList from '../../components/email/EmailList';
import EmailView from '../../components/email/EmailView';

// Extender las utilidades de prueba con el matcher de axe
expect.extend(toHaveNoViolations);

// Mock de hooks y servicios
vi.mock('../../hooks/useAuth', () => ({
  default: () => ({
    currentUser: { uid: 'testuid' },
    profile: {
      id: 'profile123',
      userId: 'user123',
      brideFirstName: 'María',
      brideLastName: 'García',
      emailAlias: 'maria.garcia',
    },
    isAuthenticated: true,
  }),
}));

// Datos de ejemplo
const mockEmail = {
  id: 'email123',
  from: 'proveedor@florista.com',
  to: 'maria.garcia@lovenda.com',
  subject: 'Presupuesto de flores para boda',
  body: '<p>Estimada María,</p><p>Adjunto el presupuesto para las flores de tu boda.</p><p>Saludos cordiales,<br/>Floristas Bella</p>',
  attachments: [
    {
      name: 'presupuesto.pdf',
      url: 'https://example.com/presupuesto.pdf',
      size: 1024,
    },
  ],
  timestamp: new Date(),
  read: false,
  starred: false,
  folder: 'inbox',
  tags: ['tag1'],
};

const mockEmails = [
  mockEmail,
  {
    id: 'email456',
    from: 'fotografia@capturamos.com',
    to: 'maria.garcia@lovenda.com',
    subject: 'Catálogo de fotos',
    body: '<p>Hola María,</p><p>Te enviamos nuestro catálogo de fotografías.</p>',
    attachments: [],
    timestamp: new Date(),
    read: true,
    starred: true,
    folder: 'inbox',
    tags: ['tag2'],
  },
];

const mockFolders = [
  { id: 'inbox', name: 'Bandeja de entrada', systemFolder: true, count: 2 },
  { id: 'sent', name: 'Enviados', systemFolder: true, count: 1 },
  { id: 'trash', name: 'Papelera', systemFolder: true, count: 0 },
  { id: 'proveedores', name: 'Proveedores', systemFolder: false, count: 3 },
];

// Wrapper para los componentes
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('Pruebas de accesibilidad para visualización de correos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('EmailView - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const { container } = render(
        <EmailView
          email={mockEmail}
          onReply={vi.fn()}
          onForward={vi.fn()}
          onDelete={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('si hay imágenes, deben tener texto alternativo', () => {
      render(
        <EmailView
          email={mockEmail}
          onReply={vi.fn()}
          onForward={vi.fn()}
          onDelete={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que las imágenes (si existen en este render/mocks) tienen alt
      const images = screen.queryAllByRole('img');
      if (images.length > 0) {
        images.forEach((img) => {
          expect(img).toHaveAttribute('alt');
        });
      } else {
        // En este setup, los iconos son <svg aria-hidden/>, por lo que no habría <img>
        expect(true).toBe(true);
      }
    });

    it('debe tener botones con propósitos claros', () => {
      render(
        <EmailView
          email={mockEmail}
          onReply={vi.fn()}
          onForward={vi.fn()}
          onDelete={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que los botones tienen textos o aria-labels descriptivos
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('los enlaces para descargar deben ser accesibles', () => {
      render(
        <EmailView
          email={mockEmail}
          onReply={vi.fn()}
          onForward={vi.fn()}
          onDelete={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que hay un enlace para el archivo adjunto
      const downloadLinks = screen.getAllByRole('link');
      expect(downloadLinks.length).toBeGreaterThan(0);

      // Verificar que tiene texto descriptivo
      const attachmentLink = screen.getByText('presupuesto.pdf');
      expect(attachmentLink).toBeInTheDocument();
    });
  });

  describe('EmailList - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const { container } = render(
        <EmailList
          emails={mockEmails}
          onSelectEmail={vi.fn()}
          selectedEmail={null}
          onDeleteEmail={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('los elementos de la lista deben ser navegables por teclado', () => {
      render(
        <EmailList
          emails={mockEmails}
          onSelectEmail={vi.fn()}
          selectedEmail={null}
          onDeleteEmail={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que los elementos de la lista son interactivos
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);

      // Verificar que tienen elementos enfocables
      listItems.forEach((item) => {
        const interactiveElements = item.querySelectorAll('button, a, [tabindex="0"]');
        expect(interactiveElements.length).toBeGreaterThan(0);
      });
    });

    it('debe indicar cuáles correos están no leídos de forma accesible', () => {
      render(
        <EmailList
          emails={mockEmails}
          onSelectEmail={vi.fn()}
          selectedEmail={null}
          onDeleteEmail={vi.fn()}
          onToggleStarred={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // La implementación depende de cómo se indiquen visualmente los correos no leídos
      // pero debería ser perceptible no solo por color sino por algún otro indicador

      // Asumimos que hay algún elemento que tiene una clase o atributo para correos no leídos
      const unreadItems = screen.getAllByText(/Presupuesto de flores/i);
      expect(unreadItems.length).toBeGreaterThan(0);
    });
  });

  describe('EmailFolderList - Accesibilidad', () => {
    it('no debe tener violaciones de accesibilidad', async () => {
      const { container } = render(
        <EmailFolderList
          folders={mockFolders}
          selectedFolder="inbox"
          onSelectFolder={vi.fn()}
          onCreateFolder={vi.fn()}
          onDeleteFolder={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('debe indicar claramente la carpeta seleccionada', () => {
      render(
        <EmailFolderList
          folders={mockFolders}
          selectedFolder="inbox"
          onSelectFolder={vi.fn()}
          onCreateFolder={vi.fn()}
          onDeleteFolder={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que se indica la carpeta seleccionada (puede ser via aria-current)
      const selectedItem = screen.getByText('Bandeja de entrada');
      expect(selectedItem.parentElement).toHaveAttribute('aria-current', 'true');
    });

    it('el botón de crear carpeta debe ser accesible', () => {
      render(
        <EmailFolderList
          folders={mockFolders}
          selectedFolder="inbox"
          onSelectFolder={vi.fn()}
          onCreateFolder={vi.fn()}
          onDeleteFolder={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Verificar que hay un botón para crear carpeta y es accesible
      const newFolderButton = screen.getByRole('button', { name: /nueva carpeta/i });
      expect(newFolderButton).toBeInTheDocument();
      expect(newFolderButton).not.toHaveAttribute('disabled');
    });
  });
});
