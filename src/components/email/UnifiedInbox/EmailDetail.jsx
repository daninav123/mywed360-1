import { toBlob } from 'html-to-image';
import {
  ArrowLeft,
  Reply,
  Trash,
  Download,
  Star,
  MoreHorizontal,
  ExternalLink,
  Printer,
  Flag,
  ArrowLeftRight,
  Calendar,
  Sparkles,
  Folder,
  Clock,
} from 'lucide-react';
import React, { useState, useEffect, useRef, memo } from 'react';

import EmailCategoryLabel from './EmailCategoryLabel';
import {
  safeRender,
  ensureNotPromise,
  safeExecute,
  safeDangerouslySetInnerHTML,
} from '../../../utils/promiseSafeRenderer';
import sanitizeHtml from '../../../utils/sanitizeHtml';
import Button from '../../Button';
import EmailInsights from '../../EmailInsights';
import EmailComments from '../EmailComments';
// Importación problemática eliminada temporalmente
// import { Viewer } from 'react-tiff';

// Importamos nuestros componentes de iconos personalizados

/**
 * Componente para mostrar el detalle completo de un email.
 *
 * @param {Object} props
 * @param {Object} props.email
 * @param {Function} props.onReply
 * @param {Function} props.onDelete
 * @param {Function} props.onDeleteForever
 * @param {Function} props.onBack
 * @param {Function} props.onMarkRead
 * @param {Function} props.onRestore
 * @param {Function} props.onToggleImportant
 * @param {string} props.currentFolder
 * @returns {JSX.Element}
 */

// Constantes para tipos de archivos
const IMAGE_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};
const EmailDetail = ({
  email,
  onReply,
  onDelete,
  onDeleteForever,
  onBack,
  onMarkRead,
  onForward,
  onReplyAll,
  userId,
  onSchedule,
  resolveFolderName,
  onRestore,
  onToggleImportant,
  currentFolder = 'inbox',
  folders = [],
  onMoveToFolder,
}) => {
  // Si email es null o undefined, mostrar un mensaje
  if (!email) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <p className="text-lg">Selecciona un email para ver su contenido</p>
      </div>
    );
  }
  const [isStarred, setIsStarred] = useState(Boolean(email?.important));
  const trashMeta = email?.trashMeta || {};
  const previousFolderId = trashMeta.previousFolder || trashMeta.restoredTo || null;
  const originalFolderName =
    typeof resolveFolderName === 'function' ? resolveFolderName(previousFolderId) : null;

  const [showDropdown, setShowDropdown] = useState(false);
  const [isRead, setIsRead] = useState(email?.read || false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [loadingImages, setLoadingImages] = useState({});
  const prevEmailIdRef = useRef(email?.id);

  // Efecto para actualizar el estado visual cuando cambia el email seleccionado
  useEffect(() => {
    if (email?.id !== prevEmailIdRef.current) {
      setIsRead(email?.read || false);
      prevEmailIdRef.current = email?.id;
    }
  }, [email?.id, email?.read]);

  // Efecto para marcar automáticamente como leído cuando se visualiza un email no leído
  useEffect(() => {
    if (email && !isRead) {
      setIsRead(true); // Actualizar inmediatamente el estado visual
      if (onMarkRead) {
        // Notificar al componente padre que debe actualizar el estado
        onMarkRead(email.id);
      }
    }
  }, [email, isRead, onMarkRead]);

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Selecciona un email para ver su contenido
      </div>
    );
  }

  useEffect(() => {
    setIsStarred(Boolean(email?.important));
  }, [email?.id, email?.important]);

  // Función para manejar el marcado como importante
  const handleToggleStar = () => {
    const nextValue = !isStarred;
    setIsStarred(nextValue);
    if (typeof onToggleImportant === 'function') {
      try {
        onToggleImportant(nextValue);
      } catch (error) {
        // console.error('No se pudo actualizar el estado importante', error);
      }
    }
  };

  // Formatear la fecha completa
  const formatFullDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener extensión del archivo
  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  // Verificar si el archivo es una imagen
  const isImageFile = (filename) => {
    const ext = getFileExtension(filename);
    return Object.keys(IMAGE_TYPES).includes(ext);
  };

  // Obtener tipo MIME basado en la extensión
  const getMimeType = (filename) => {
    const ext = getFileExtension(filename);
    return IMAGE_TYPES[ext] || 'application/octet-stream';
  };

  // Manejar click en una imagen adjunta
  const handleImageClick = (attachment) => {
    setExpandedImage(attachment);
  };

  // Cerrar visualizador de imagen
  const handleCloseImageViewer = () => {
    setExpandedImage(null);
  };

  // Manejar la descarga de un archivo adjunto
  const handleDownloadAttachment = (attachment) => {
    // Aquí implementaríamos la lógica de descarga
    // console.log('Descargando:', attachment.filename);
    // Idealmente, esto conectaría con un endpoint de la API
  };

  // Obtener iniciales para el avatar
  const getInitials = (emailAddress) => {
    if (!emailAddress) return '?';

    const name = emailAddress
      .split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim();
    const parts = name.split(' ').filter((part) => part.length > 0);

    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Procesar el contenido HTML del email de forma segura
  const getSafeHtml = (htmlContent) => {
    return safeExecute(
      () => {
        const result = sanitizeHtml(htmlContent || '');
        return typeof result === 'string' ? result : String(result || '');
      },
      htmlContent || '' // fallback si sanitizeHtml retorna una Promesa
    );
  };

  // Obtener color para el avatar basado en el remitente
  const getAvatarColor = (email) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];

    // Usar una función simple de hash para asignar un color consistente
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0;
    }

    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Detectar las categorías del email
  const detectCategories = (email) => {
    const categories = [];

    // Ejemplo de lógica para detectar categorías
    if (email.from.includes('proveedor') || email.subject.toLowerCase().includes('proveedor')) {
      categories.push({ name: 'Proveedor', color: 'bg-blue-500' });
    }

    if (email.from.includes('invitado') || email.subject.toLowerCase().includes('invitado')) {
      categories.push({ name: 'Invitado', color: 'bg-green-500' });
    }

    if (email.subject.toLowerCase().includes('importante') || email.important) {
      categories.push({ name: 'Importante', color: 'bg-yellow-500' });
    }

    return categories;
  };

  const emailCategories = detectCategories(email);
  const isInTrash = currentFolder === 'trash' || safeRender(email.folder, '') === 'trash';
  const moveOptions = Array.isArray(folders)
    ? folders.filter((item) => item?.id && item.id !== currentFolder)
    : [];
  const basicFolderLabels = {
    inbox: 'Bandeja de entrada',
    sent: 'Enviados',
    trash: 'Papelera',
  };
  const folderLabel =
    (typeof resolveFolderName === 'function' && resolveFolderName(currentFolder)) ||
    basicFolderLabels[currentFolder] ||
    'Bandeja de entrada';
  const suggestedLabel = safeRender(email?._suggestedFolderLabel, null);
  const hasSuggestion = Boolean(email?._hasSuggestion && suggestedLabel);
  const headerSender = safeRender(email?.from, '') || 'Remitente desconocido';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header resumido */}
      <div className="border-b bg-surface px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              onClick={onBack}
              className="rounded-full p-1 text-muted transition hover:bg-gray-100 hover:text-body md:hidden"
              aria-label="Volver a la lista"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted">
                <span className="inline-flex items-center gap-1">
                  <Folder size={14} />
                  {folderLabel}
                </span>
                {currentFolder === 'trash' && originalFolderName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                    Origen: {originalFolderName}
                  </span>
                )}
                {hasSuggestion && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                    <Sparkles size={12} />
                    {suggestedLabel}
                  </span>
                )}
              </div>
              <h2
                className="truncate text-xl font-semibold leading-tight text-body"
                title={safeRender(email.subject, '(Sin asunto)')}
              >
                {safeRender(email.subject, '(Sin asunto)')}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="font-medium text-body" title={headerSender}>
                  {headerSender}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} />
                  {formatFullDate(email.date)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={onReply}
              variant="primary"
              size="sm"
              className="flex items-center gap-1"
              aria-label="Responder"
            >
              <Reply size={16} />
              <span>Responder</span>
            </Button>

            {onSchedule && (
              <Button
                onClick={() => onSchedule(email)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Calendar size={16} />
                <span>Agendar</span>
              </Button>
            )}

            {isInTrash ? (
              <>
                <Button
                  onClick={() => onRestore?.()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  data-testid="restore-email-button"
                  aria-label="Restaurar"
                >
                  <ArrowLeft size={16} />
                  <span>Restaurar</span>
                </Button>
                <Button
                  onClick={() => (onDeleteForever || onDelete)?.()}
                  variant="danger"
                  size="sm"
                  className="flex items-center gap-1"
                  data-testid="delete-forever-button"
                  aria-label="Eliminar permanentemente"
                >
                  <Trash size={16} />
                  <span>Eliminar</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={onDelete}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                aria-label="Eliminar"
                data-testid="delete-email-button"
              >
                <Trash size={16} />
                <span>Eliminar</span>
              </Button>
            )}

            {moveOptions.length > 0 && (
              <select
                className="rounded-lg border border-soft px-2 py-1 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary"
                defaultValue=""
                onChange={(event) => {
                  const targetId = event.target.value;
                  if (!targetId || targetId === currentFolder) return;
                  onMoveToFolder?.(email.id, targetId);
                  event.target.value = '';
                }}
                aria-label="Mover correo a otra carpeta"
              >
                <option value="" disabled>
                  Mover a...
                </option>
                {moveOptions.map((folderOption) => (
                  <option key={folderOption.id} value={folderOption.id}>
                    {folderOption.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleToggleStar}
              className={`rounded-full p-1.5 transition ${
                isStarred ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'
              }`}
              aria-label={isStarred ? 'Marcar como no importante' : 'Marcar como importante'}
            >
              <Star size={20} className={isStarred ? 'fill-yellow-500' : ''} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="rounded-full p-1.5 text-muted transition hover:bg-gray-100"
                aria-label="Más acciones"
              >
                <MoreHorizontal size={20} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg z-10">
                  <div className="py-1 text-sm">
                    <button className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <Printer size={16} className="mr-2" />
                      Imprimir
                    </button>
                    <button className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <Download size={16} className="mr-2" />
                      Descargar
                    </button>
                    <button className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <ExternalLink size={16} className="mr-2" />
                      Abrir en nueva ventana
                    </button>
                    <button
                      className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setShowDropdown(false);
                        if (onForward) onForward(email);
                      }}
                    >
                      <ArrowLeftRight size={16} className="mr-2" />
                      Reenviar
                    </button>
                    <button className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
                      <Flag size={16} className="mr-2" />
                      Marcar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cabecera del email */}
      <div className="p-6 border-b">
        <div className="flex items-start">
          <div
            className={`w-10 h-10 rounded-full ${getAvatarColor(email.from)} flex items-center justify-center text-white font-medium mr-4 flex-shrink-0`}
          >
            {getInitials(email.from)}
          </div>

          <div className="flex-grow">
            <p className="text-sm text-muted">
              <span className="font-medium text-body">Asunto:</span>{' '}
              {safeRender(email.subject, '(Sin asunto)')}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-body">{safeRender(email.from, '')}</span>
              <span className="text-muted">{'>'}</span>
              <span>{safeRender(email.to, '') || 'N/D'}</span>
            </div>

            {email.cc && (
              <div className="mt-1 text-xs text-muted">
                cc: {email.cc}
              </div>
            )}

            {emailCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {emailCategories.map((category, index) => (
                  <EmailCategoryLabel key={index} name={category.name} color={category.color} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido del email */}
      <div className="p-6 overflow-auto flex-grow">
        {safeRender(email.body) ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={safeDangerouslySetInnerHTML(
              getSafeHtml(safeRender(email.body, ''))
            )}
          />
        ) : (
          <div className="text-gray-500 italic">(Este mensaje no tiene contenido)</div>
        )}
      </div>

      {/* Adjuntos si existen */}
      {email.attachments && email.attachments.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-2">Adjuntos ({email.attachments.length})</h3>

          <div className="flex flex-wrap gap-3">
            {email.attachments.map((attachment, index) => {
              const isImage = isImageFile(attachment.filename);
              const fileExt = getFileExtension(attachment.filename);
              const isTiff = fileExt === 'tiff' || fileExt === 'tif';
              const isWebp = fileExt === 'webp';

              return (
                <div
                  key={index}
                  className={`border rounded p-2 hover:border-blue-400 transition-all ${isImage ? 'cursor-zoom-in' : 'cursor-pointer'}`}
                >
                  {isImage ? (
                    <div
                      className="w-32 h-32 flex items-center justify-center overflow-hidden bg-gray-50 mb-1 relative"
                      onClick={() => handleImageClick(attachment)}
                    >
                      {isTiff ? (
                        // Temporalmente deshabilitado el visor TIFF por problemas de compatibilidad
                        <div className="text-center text-sm text-gray-400 p-2">
                          Imagen TIFF
                          <div className="text-xs mt-1">Visor temporalmente no disponible</div>
                        </div>
                      ) : isWebp ? (
                        // Soporte específico para WebP
                        <picture>
                          <source srcSet={attachment.dataUrl} type="image/webp" />
                          <img
                            src={attachment.dataUrl || '/placeholder-image.png'}
                            alt={attachment.filename}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-broken-image.png';
                            }}
                          />
                        </picture>
                      ) : (
                        // Otras imágenes con fallback
                        <img
                          src={attachment.dataUrl || '/placeholder-image.png'}
                          alt={attachment.filename}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-broken-image.png';
                          }}
                        />
                      )}
                      {loadingImages[index] && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-gray-50 mb-1">
                      <div className="bg-gray-100 w-16 h-16 flex items-center justify-center rounded shadow-sm text-2xl">
                        📄
                      </div>
                    </div>
                  )}
                  <div className="w-32">
                    <div className="text-sm font-medium truncate" title={attachment.filename}>
                      {attachment.filename || `adjunto-${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between items-center mt-1">
                      <span>
                        {attachment.size
                          ? `${Math.round(attachment.size / 1024)} KB`
                          : 'Tamaño desconocido'}
                      </span>
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => handleDownloadAttachment(attachment)}
                        aria-label="Descargar archivo"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualizador de imagen expandida */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={handleCloseImageViewer}
        >
          <div className="max-w-4xl max-h-screen overflow-auto bg-white rounded-lg p-2">
            <div className="text-right mb-2">
              <button
                className="text-gray-700 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                onClick={handleCloseImageViewer}
              >
                ✕
              </button>
            </div>
            {getFileExtension(expandedImage.filename) === 'tiff' ||
            getFileExtension(expandedImage.filename) === 'tif' ? (
              // Temporalmente deshabilitado el visor TIFF por problemas de compatibilidad
              <div className="p-4 bg-gray-100 rounded text-center">
                <p className="text-gray-600 mb-2">
                  Vista previa de TIFF temporalmente no disponible
                </p>
                <p className="text-sm text-gray-500">
                  El visor de archivos TIFF está siendo actualizado
                </p>
              </div>
            ) : (
              <img
                src={expandedImage.dataUrl}
                alt={expandedImage.filename}
                className="max-w-full"
              />
            )}
            <div className="mt-2 text-center text-sm text-gray-600">{expandedImage.filename}</div>
          </div>
        </div>
      )}

      {/* Acciones sugeridas por IA */}
      <EmailInsights mailId={email.id} userId={userId} email={email} />

      {/* Panel de comentarios internos */}
      <EmailComments emailId={email.id} />

      {/* Acciones rápidas */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Button onClick={onReply} variant="primary" size="sm" className="flex items-center">
            <Reply size={16} className="mr-1" />
            Responder
          </Button>
          {onSchedule && (
            <Button
              onClick={() => onSchedule(email)}
              variant="outline"
              size="sm"
              className="flex items-center"
            >
              <Calendar size={16} className="mr-1" />
              Agendar evento
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Exportación simple sin memo
export default EmailDetail;



