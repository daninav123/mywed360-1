import React, { useState, useEffect, useRef } from 'react';

import {
  safeRender,
  ensureNotPromise,
  safeDangerouslySetInnerHTML,
  safeExecute,
} from '../../utils/promiseSafeRenderer';
import sanitizeHtml from '../../utils/sanitizeHtml';
// Importamos nuestros componentes personalizados en lugar de lucide-react
import Button from '../Button';
import EmailInsights from '../EmailInsights';
import EmailTagsManager from './EmailTagsManager';
import FolderSelectionModal from './FolderSelectionModal';
import {
  IconArrowLeft as ArrowLeft,
  IconReply as Reply,
  IconTrash as Trash,
  IconStar as Star,
  IconDownload as Download,
  IconPrinter as Paperclip,
  IconFolderMove as FolderMove,
} from '../ui/IconComponents';

/**
 * Componente que muestra el detalle de un correo electrónico
 *
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.email - Email a mostrar
 * @param {Function} props.onBack - Función para volver a la lista
 * @param {Function} props.onReply - Función para responder al email
 * @param {Function} props.onDelete - Función para eliminar el email
 * @param {Function} props.onMoveToFolder - Función para mover el correo a una carpeta
 * @param {Array} props.folders - Lista de carpetas personalizadas disponibles
 */
const EmailDetail = ({
  email,
  onBack,
  onReply,
  onDelete,
  onMoveToFolder,
  folders = [],
  isMobile = false,
}) => {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const mainContentRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enfocar el contenido principal cuando se carga un nuevo correo
  useEffect(() => {
    if (email && mainContentRef.current) {
      mainContentRef.current.focus();
    }
  }, [email]);

  // Determinar si estamos en pantalla móvil basado en prop o en el tamaño de ventana
  const isSmallScreen = isMobile || windowWidth < 768;

  if (!email) return null;

  const classification = email?.aiClassification || null;
  const suggestedTags = classification?.tags || email?.suggestedTags || [];
  const suggestedFolder = classification?.folder || email?.suggestedFolder || null;

  // Formatear fecha completa
  const formatFullDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Error al formatear fecha:', e);
      return dateStr;
    }
  };

  // Extraer nombre del remitente a partir del email
  const getSenderName = (emailAddress) => {
    if (!emailAddress) return '';

    // Si tiene formato "Nombre <email@ejemplo.com>"
    const match = emailAddress.match(/^([^<]+)\s*<([^>]+)>$/);
    if (match) {
      return match[1].trim();
    }

    // Si es solo una dirección de correo, extraer la parte antes de @
    return emailAddress.split('@')[0].replace(/[.]/g, ' ');
  };

  // Extraer dirección de correo del remitente
  const getSenderEmail = (emailAddress) => {
    if (!emailAddress) return '';
    const match = emailAddress.match(/<([^>]+)>/);
    if (match) return match[1];
    return emailAddress;
  };

  // Manejar eventos de teclado para navegación
  const handleKeyDown = (e) => {
    // ESC para volver a la lista de correos
    if (e.key === 'Escape') {
      onBack && onBack();
    }
    // R para responder
    else if (e.key === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      onReply && onReply();
    }
  };

  return (
    <div
      className="h-full flex flex-col"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Detalle del correo electrónico"
    >
      {/* Cabecera - Adaptativa para móvil */}
      <header className="mb-3 sm:mb-4 pb-2 border-b border-gray-200" role="header">
        <div
          className={`flex items-center ${isSmallScreen ? 'flex-col items-start' : 'justify-between'} mb-3 sm:mb-4`}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center mb-2 sm:mb-0"
            aria-label="Volver a la lista de correos"
          >
            <ArrowLeft size={16} className="mr-1" /> Volver
          </Button>

          <div className={`flex ${isSmallScreen ? 'w-full justify-between mt-1' : 'space-x-2'}`}>
            <Button
              variant="ghost"
              size={isSmallScreen ? 'xs' : 'sm'}
              onClick={onReply}
              title="Responder"
              aria-label="Responder"
              className="flex items-center"
            >
              <Reply size={isSmallScreen ? 14 : 16} />
              {isSmallScreen && <span className="ml-1 text-xs">Responder</span>}
            </Button>
            {onMoveToFolder && folders && folders.length > 0 && (
              <Button
                variant="ghost"
                size={isSmallScreen ? 'xs' : 'sm'}
                data-testid="move-to-folder-button"
                onClick={() => setIsFolderModalOpen(true)}
                title="Mover a carpeta"
                aria-label="Mover a carpeta"
                className="flex items-center"
              >
                <FolderMove size={isSmallScreen ? 14 : 16} />
                {isSmallScreen && <span className="ml-1 text-xs">Mover</span>}
              </Button>
            )}
            <Button
              variant="ghost"
              size={isSmallScreen ? 'xs' : 'sm'}
              onClick={() => onDelete && onDelete(email.id)}
              title="Eliminar"
              aria-label="Eliminar"
              className="flex items-center"
            >
              <Trash size={isSmallScreen ? 14 : 16} />
              {isSmallScreen && <span className="ml-1 text-xs">Eliminar</span>}
            </Button>
            <Button
              variant="ghost"
              size={isSmallScreen ? 'xs' : 'sm'}
              title="Marcar como importante"
              className="flex items-center"
            >
              <Star size={isSmallScreen ? 14 : 16} />
              {isSmallScreen && <span className="ml-1 text-xs">Destacar</span>}
            </Button>
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-semibold mb-2" id="email-subject">
          {email.subject || '(Sin asunto)'}
        </h2>

        <div className="flex items-start mb-2">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2 sm:mr-3 mt-1"
            aria-hidden="true"
          >
            {getSenderName(email.from).charAt(0).toUpperCase()}
          </div>

          <div className="flex-grow">
            <div
              className={`${isSmallScreen ? 'flex flex-col' : 'flex items-baseline justify-between'}`}
            >
              <div>
                <p className="font-medium text-sm sm:text-base" id="sender-name">
                  {getSenderName(email.from)}
                </p>
                <p
                  className="text-xs text-gray-700 break-all"
                  id="sender-email"
                  aria-label="Dirección de correo del remitente"
                >
                  {getSenderEmail(email.from)}
                </p>
              </div>
              <p className="text-xs text-gray-700 mt-1 sm:mt-0" aria-label="Fecha de envío">
                {formatFullDate(email.date)}
              </p>
            </div>

            <p className="text-xs sm:text-sm mt-1">
              <span id="recipient-label">Para:</span>{' '}
              <span className="text-gray-700 break-all" aria-labelledby="recipient-label">
                {email.to}
              </span>
            </p>

            <div className="mt-2 sm:mt-3">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Etiquetas:</span>
              <EmailTagsManager
                emailId={email.id}
                onTagsChange={(tags) => {
                  // Podríamos actualizar el estado local si es necesario
                  console.log('Etiquetas actualizadas:', tags);
                }}
                isSmallScreen={isSmallScreen}
              />
            </div>
          </div>
        </div>
      </header>

      {classification || suggestedTags.length || suggestedFolder ? (
        <section
          className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800"
          role="note"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Análisis inteligente</span>
            {classification?.source && (
              <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                {classification.source === 'ai' ? 'IA' : 'Heurística'}
              </span>
            )}
            {suggestedFolder && (
              <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                Carpeta sugerida: {suggestedFolder}
              </span>
            )}
          </div>
          {suggestedTags.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestedTags.slice(0, 6).map((tag) => (
                <span
                  key={`ai-tag-${tag}`}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-px text-[10px] font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {suggestedFolder && typeof onMoveToFolder === 'function' ? (
            <div className="mt-3">
              <Button
                variant="outline"
                size="xs"
                onClick={() => onMoveToFolder(email.id, suggestedFolder)}
              >
                Mover a {suggestedFolder}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Contenido del email */}
      <main
        className="flex-grow overflow-auto mb-3 sm:mb-4"
        tabIndex="0"
        ref={mainContentRef}
        role="article"
        aria-labelledby="email-subject sender-name"
      >
        {/* Si es HTML, renderizarlo de forma segura */}
        {email.body && email.body.includes('<') ? (
          <div
            className="prose prose-sm sm:prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: safeExecute(
                () => {
                  const result = sanitizeHtml(email.body);
                  return typeof result === 'string' ? result : String(result || '');
                },
                email.body || '' // fallback si sanitizeHtml retorna una Promesa
              ),
            }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm sm:text-base text-gray-800">{email.body}</div>
        )}
      </main>

      {/* Archivos adjuntos */}
      {email.attachments && email.attachments.length > 0 && (
        <section className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200" role="group">
          <h3
            className="text-xs sm:text-sm font-medium mb-2 flex items-center"
            id="attachments-heading"
          >
            <Paperclip size={isSmallScreen ? 14 : 16} className="mr-1" aria-hidden="true" />
            Archivos adjuntos ({email.attachments.length})
          </h3>

          <div className="space-y-2" role="list" aria-labelledby="attachments-heading">
            {email.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center p-1.5 sm:p-2 border rounded-lg hover:bg-gray-50"
                role="listitem"
              >
                <div className="flex-grow min-w-0">
                  {' '}
                  {/* min-width: 0 para evitar overflow */}
                  <p
                    className="text-xs sm:text-sm font-medium truncate text-gray-800"
                    id={`attachment-${index}-name`}
                  >
                    {attachment.filename || `adjunto-${index + 1}`}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-gray-700" aria-label="Tamaño del archivo">
                      {Math.round(attachment.size / 1024)} KB
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size={isSmallScreen ? 'xs' : 'sm'}
                  className="ml-1 flex-shrink-0"
                  aria-label={`Descargar ${attachment.filename || `adjunto-${index + 1}`}`}
                >
                  <Download size={isSmallScreen ? 14 : 16} />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* IA: Acciones sugeridas */}
      <EmailInsights mailId={email.id} email={email} />

      {/* Modal de selección de carpetas */}
      <FolderSelectionModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={folders}
        onSelectFolder={(folderId) => {
          if (onMoveToFolder && email) {
            onMoveToFolder(email.id, folderId);
          }
          setIsFolderModalOpen(false);
        }}
        title="Mover correo a carpeta"
        description={`Seleccione una carpeta para mover "${email.subject || '(Sin asunto)'}":`}
        aria-label="Selección de carpetas"
      />
    </div>
  );
};

export default EmailDetail;
