import React, { useState, useEffect, useCallback } from 'react';

import EmailDetail from './EmailDetail';
import EmailList from './EmailList';
import { useAuth } from '../../../hooks/useAuth';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { post as apiPost } from '../../../services/apiClient';
import EmailService from '../../../services/emailService';
import { scheduleEmailSend } from '../../../services/emailAutomationService';
import CalendarService from '../../../services/CalendarService';
import EmailComposer from '../EmailComposer';
import SmartEmailComposer from '../SmartEmailComposer';
import EmailFeedbackCollector from '../EmailFeedbackCollector';
import CalendarIntegration from '../CalendarIntegration';
import ProviderSearchModal from '../../ProviderSearchModal';
import CustomFolders from '../CustomFolders';
import ManageFoldersModal from '../ManageFoldersModal';
import EmptyTrashModal from '../EmptyTrashModal';
import {
  getUserFolders,
  createFolder as createCustomFolder,
  renameFolder as renameCustomFolder,
  deleteFolder as deleteCustomFolder,
  assignEmailToFolder,
  removeEmailFromFolder,
  getEmailsInFolder,
} from '../../../services/folderService';

/**
 * InboxContainer - Bandeja de entrada unificada restaurada
 * VersiÃ³n completa con todas las correcciones aplicadas para evitar errores de Promise
 */
const InboxContainer = () => {
  const authContext = useAuth();
  const { user } = authContext;
  const { trackOperation } = useEmailMonitoring();

  // Establecer el contexto de autenticaciÃ³n en EmailService
  useEffect(() => {
    EmailService?.setAuthContext?.(authContext);
  }, [authContext]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const templates = await EmailService.getEmailTemplates();
        if (!ignore) {
          setEmailTemplates(Array.isArray(templates) ? templates : []);
        }
      } catch (templateError) {
        console.warn('No se pudieron cargar las plantillas de email:', templateError);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Estados para datos de emails
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folder, setFolder] = useState('inbox'); // admite carpetas personalizadas con formato custom:{id}
  const [inboxCounts, setInboxCounts] = useState({ total: 0, unread: 0 });
  const [sentCounts, setSentCounts] = useState({ total: 0, unread: 0 });
  const [trashCounts, setTrashCounts] = useState({ total: 0, unread: 0 });
  const [importantCounts, setImportantCounts] = useState({ total: 0, unread: 0 });
  const [iaCounts, setIaCounts] = useState({ inbox: 0, sent: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const [showProviderSearch, setShowProviderSearch] = useState(false);
  const [composerMode, setComposerMode] = useState('basic');
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showCalendarIntegration, setShowCalendarIntegration] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState(null);
  const [customFolders, setCustomFolders] = useState([]);
  const [showManageFolders, setShowManageFolders] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  const currentCustomFolderId = folder.startsWith('custom:') ? folder.slice(7) : null;
  const isTrash = folder === 'trash';
  const manageFoldersList = [
    { id: 'inbox', name: 'Bandeja de entrada', system: true },
    { id: 'sent', name: 'Enviados', system: true },
    { id: 'trash', name: 'Papelera', system: true },
    ...customFolders.map((folderItem) => ({
      ...folderItem,
      system: false,
    })),
  ];

  // Cargar emails al montar el componente
  const loadCustomFolders = useCallback(() => {
    if (!user?.uid) {
      setCustomFolders([]);
      return;
    }
    try {
      const folders = getUserFolders(user.uid);
      setCustomFolders(Array.isArray(folders) ? folders : []);
    } catch (folderError) {
      console.error('Error cargando carpetas personalizadas:', folderError);
      setCustomFolders([]);
    }
  }, [user?.uid]);

  const refreshEmails = useCallback(
    async (targetFolder = folder) => {
      try {
        setLoading(true);
        let list = [];
        if (targetFolder.startsWith('custom:')) {
          const folderId = targetFolder.slice(7);
          const allMails = await EmailService.getMails('all');
          const ids =
            user?.uid && folderId
              ? new Set(getEmailsInFolder(user.uid, folderId))
              : new Set();
          list = (Array.isArray(allMails) ? allMails : []).filter((mail) => {
            if (!mail) return false;
            if (mail.folder === `custom:${folderId}`) return true;
            if (ids.size) return ids.has(mail.id);
            return false;
          });
        } else {
          const res = await EmailService.getMails(targetFolder);
          list = Array.isArray(res) ? res : [];
        }

        setEmails(Array.isArray(list) ? list : []);
        setError(null);
      } catch (err) {
        console.error('Error cargando emails:', err);
        setError('No se pudieron cargar los emails');
      } finally {
        setLoading(false);
      }
    },
    [folder, user?.uid]
  );

  // Contadores por carpeta
  const refreshCounts = useCallback(async () => {
    try {
      const [inboxList, sentList, trashList] = await Promise.all([
        EmailService.getMails('inbox').catch(() => []),
        EmailService.getMails('sent').catch(() => []),
        EmailService.getMails('trash').catch(() => []),
      ]);
      const i = Array.isArray(inboxList) ? inboxList : [];
      const s = Array.isArray(sentList) ? sentList : [];
      const t = Array.isArray(trashList) ? trashList : [];
      setInboxCounts({ total: i.length, unread: i.filter((m) => !m.read).length });
      setSentCounts({ total: s.length, unread: s.filter((m) => !m.read).length });
      setTrashCounts({ total: t.length, unread: t.filter((m) => !m.read).length });
      const importantList = [...i, ...s].filter((mail) => mail?.important);
      setImportantCounts({
        total: importantList.length,
        unread: importantList.filter((mail) => !mail?.read).length,
      });

      loadCustomFolders();

      // IA counts (best-effort, limitado a 50 por carpeta)
      try {
        const { get: apiGet } = await import('../../../services/apiClient');
        const sample = (arr) => arr.slice(0, 50).map((m) => m.id).filter(Boolean);
        const hasInsights = async (id) => {
          try {
            const res = await apiGet(`/api/email-insights/${encodeURIComponent(id)}`, { auth: true, silent: true });
            if (!res?.ok) return 0;
            const j = await res.json();
            const t = (j?.tasks?.length || 0) + (j?.meetings?.length || 0) + (j?.budgets?.length || 0) + (j?.contracts?.length || 0);
            return t > 0 ? 1 : 0;
          } catch { return 0; }
        };
        const countFor = async (ids) => {
          const promises = ids.map((id) => hasInsights(id));
          const results = await Promise.all(promises);
          return results.reduce((a, b) => a + b, 0);
        };
        const [ci, cs] = await Promise.all([
          countFor(sample(i)),
          countFor(sample(s)),
        ]);
        setIaCounts({ inbox: ci, sent: cs });
      } catch {}
    } catch {}
  }, [loadCustomFolders]);

  useEffect(() => {
    loadCustomFolders();
  }, [loadCustomFolders]);

  const refreshAllData = useCallback(async (targetFolder = folder) => {
    try {
      await Promise.all([refreshEmails(targetFolder), refreshCounts()]);
    } catch (refreshError) {
      console.warn('Error refrescando datos de email:', refreshError);
    }
  }, [folder, refreshEmails, refreshCounts]);

  // Inicializar EmailService y refrescar lista (con fallback para Cypress/dev sin usuario Firebase)
  useEffect(() => {
    let cancelled = false;
    const initAndLoad = async () => {
      try {
        const localMockEmail = (() => {
          try {
            const raw = typeof window !== 'undefined' ? window.localStorage.getItem('lovenda_user') : '';
            if (raw) {
              const parsed = JSON.parse(raw);
              return parsed?.email || '';
            }
          } catch {}
          return '';
        })();
        const emailToUse = (user && user.email) || localMockEmail || 'usuario.test@lovenda.com';
        await EmailService.initEmailService({ email: emailToUse, ...(user || {}) });
        if (!cancelled) {
          await Promise.all([refreshEmails(folder), refreshCounts()]);
        }
      } catch (err) {
        console.error('Error inicializando EmailService:', err);
        setError('Error inicializando servicio de email');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initAndLoad();
    return () => {
      cancelled = true;
    };
  }, [user, folder, refreshEmails, refreshCounts]);

  // Marcar email como leÃ­do
  const markAsRead = useCallback(async (emailId) => {
    try {
      await EmailService.markAsRead(emailId);
      setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, read: true } : e)));
      try { await refreshCounts(); } catch {}
    } catch (err) {
      // En algunos entornos el backend puede devolver 404 si el mail solo
      // existe en la subcolecciÃ³n del usuario. Marcamos localmente y no
      // llenamos la consola de errores para este caso.
      const msg = String(err?.message || '');
      if (/404/.test(msg)) {
        setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, read: true } : e)));
      } else {
        console.error('Error marcando como leÃ­do:', err);
      }
    }
  }, [refreshCounts]);

  const moveEmailToFolder = useCallback(
    async (emailId, targetFolder) => {
      if (!emailId || !targetFolder) return;
      try {
        if (typeof EmailService.moveMail === 'function') {
          await EmailService.moveMail(emailId, targetFolder);
        } else {
          await EmailService.setFolder(emailId, targetFolder);
        }
        if (user?.uid) {
          if (targetFolder.startsWith('custom:')) {
            assignEmailToFolder(user.uid, emailId, targetFolder.slice(7));
          } else {
            removeEmailFromFolder(user.uid, emailId);
          }
        }
        await refreshAllData();
      } catch (err) {
        console.error('Error moviendo email:', err);
        throw err;
      }
    },
    [user?.uid, refreshAllData]
  );

  const deleteEmailForever = useCallback(
    async (emailId) => {
      if (!emailId) return;
      try {
        await EmailService.deleteMail(emailId);
        if (user?.uid) {
          try {
            removeEmailFromFolder(user.uid, emailId);
          } catch {}
        }
        await refreshAllData();
      } catch (err) {
        console.error('Error eliminando email definitivamente:', err);
        throw err;
      }
    },
    [user?.uid, refreshAllData]
  );

  const handleDeleteEmail = useCallback(
    async (emailId, { permanent = false } = {}) => {
      if (!emailId) return;
      try {
        if (permanent || isTrash) {
          await deleteEmailForever(emailId);
        } else {
          await moveEmailToFolder(emailId, 'trash');
        }
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setViewMode('list');
        }
      } catch (err) {
        console.error('Error procesando eliminación de email:', err);
      }
    },
    [deleteEmailForever, moveEmailToFolder, isTrash, selectedEmailId]
  );

  const handleRestoreEmail = useCallback(
    async (emailId) => {
      if (!emailId) return;
      try {
        await moveEmailToFolder(emailId, 'inbox');
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setViewMode('list');
        }
      } catch (err) {
        console.error('Error restaurando email:', err);
      }
    },
    [moveEmailToFolder, selectedEmailId]
  );

  const handleEmptyTrash = useCallback(async () => {
    try {
      await EmailService.emptyTrash();
      await refreshAllData();
    } catch (err) {
      console.error('Error vaciando papelera:', err);
    } finally {
      setShowEmptyTrashModal(false);
    }
  }, [refreshAllData]);

  const handleCreateFolder = useCallback(
    (name) => {
      if (!user?.uid || !name) return null;
      try {
        const created = createCustomFolder(user.uid, name);
        loadCustomFolders();
        return created;
      } catch (err) {
        console.error('Error creando carpeta personalizada:', err);
        throw err;
      }
    },
    [user?.uid, loadCustomFolders]
  );

  const handleRenameFolder = useCallback(
    (folderId, newName) => {
      if (!user?.uid || !folderId || !newName) return null;
      try {
        const updated = renameCustomFolder(user.uid, folderId, newName);
        loadCustomFolders();
        return updated;
      } catch (err) {
        console.error('Error renombrando carpeta personalizada:', err);
        throw err;
      }
    },
    [user?.uid, loadCustomFolders]
  );

  const handleDeleteFolder = useCallback(
    (folderId) => {
      if (!user?.uid || !folderId) return false;
      try {
        const result = deleteCustomFolder(user.uid, folderId);
        loadCustomFolders();
        if (folder === `custom:${folderId}`) {
          setFolder('inbox');
          setSelectedEmailId(null);
          refreshAllData('inbox');
        } else {
          refreshAllData(folder);
        }
        return result;
      } catch (err) {
        console.error('Error eliminando carpeta personalizada:', err);
        throw err;
      }
    },
    [user?.uid, loadCustomFolders, folder, refreshAllData]
  );

  // Estados locales
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composerInitial, setComposerInitial] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, read, unread
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('list'); // list, detail

  const openComposer = useCallback(
    (mode = 'basic', initial = {}) => {
      setComposerMode(mode);
      setComposerInitial(initial);
      setShowComposer(true);
    },
    []
  );

  const closeComposer = useCallback(() => {
    setShowComposer(false);
  }, []);

  // Asegurar que emails siempre sea un array
  const safeEmails = Array.isArray(emails) ? emails : [];

  // Email seleccionado
  const selectedEmail = selectedEmailId
    ? safeEmails.find((email) => email.id === selectedEmailId)
    : null;

  // Filtrar emails segÃºn bÃºsqueda y estado
  const filteredEmails = safeEmails.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'read' && email.read) ||
      (filterStatus === 'unread' && !email.read);

    return matchesSearch && matchesFilter;
  });

  const sortedEmails = filteredEmails.slice().sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const safeValue = (value) => (value === null || value === undefined ? '' : value);

    if (sortField === 'date') {
      const aDate = new Date(a?.date || a?.sentAt || 0).getTime();
      const bDate = new Date(b?.date || b?.sentAt || 0).getTime();
      if (aDate === bDate) return 0;
      return aDate > bDate ? direction : -direction;
    }

    if (sortField === 'subject') {
      const aSubject = safeValue(a?.subject).toString().toLowerCase();
      const bSubject = safeValue(b?.subject).toString().toLowerCase();
      if (aSubject === bSubject) return 0;
      return aSubject > bSubject ? direction : -direction;
    }

    if (sortField === 'from') {
      const aFrom = safeValue(a?.from || a?.to).toString().toLowerCase();
      const bFrom = safeValue(b?.from || b?.to).toString().toLowerCase();
      if (aFrom === bFrom) return 0;
      return aFrom > bFrom ? direction : -direction;
    }

    return 0;
  });

  // Handlers
  const handleEmailSelect = useCallback(
    (emailId) => {
      setSelectedEmailId(emailId);
      setViewMode('detail');

      // Marcar como leÃ­do si no lo estÃ¡
      const email = emails.find((e) => e.id === emailId);
      if (email && !email.read) {
        markAsRead(emailId);
      }
    },
    [safeEmails, markAsRead]
  );

  const handleSortChange = useCallback(
    (field) => {
      setSortField((prevField) => {
        if (prevField === field) {
          setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
          return prevField;
        }
        setSortDirection(field === 'date' ? 'desc' : 'asc');
        return field;
      });
    },
    []
  );

  const handleBackToList = useCallback(() => {
    setSelectedEmailId(null);
    setViewMode('list');
  }, []);

    const handleSendEmail = useCallback(
    async (emailData) => {
      try {
        const result = await EmailService.sendEmail(emailData);

        if (result && result.success) {
          closeComposer();
          await refreshEmails();
          try {
            await refreshCounts();
          } catch {}
          trackOperation?.('email_sent', { success: true, mode: 'basic' });
        }
      } catch (error) {
        console.error('Error al enviar email:', error);
        trackOperation?.('email_sent', { success: false, mode: 'basic', error: error.message });
      }
    },
    [closeComposer, refreshEmails, refreshCounts, trackOperation]
  );
  const handleSmartComposerSend = useCallback(
    async ({ to, subject, message, scheduledTime, provider }) => {
      const payload = {
        to: to || provider?.email || '',
        subject,
        body: message,
      };

      if (!payload.to) {
        trackOperation?.('email_sent', {
          success: false,
          mode: 'smart',
          error: 'missing_recipient',
        });
        return;
      }

      try {
        if (scheduledTime) {
          await scheduleEmailSend(payload, scheduledTime);
        } else {
          await EmailService.sendEmail(payload);
        }

        closeComposer();
        await refreshEmails();
        try {
          await refreshCounts();
        } catch {}

        trackOperation?.('email_sent', { success: true, mode: 'smart' });
      } catch (error) {
        console.error('Error al enviar email IA:', error);
        trackOperation?.('email_sent', { success: false, mode: 'smart', error: error.message });
      }
    },
    [closeComposer, refreshEmails, refreshCounts, trackOperation]
  );


  const openCalendarIntegrationForEmail = useCallback((email) => {
    setCalendarEmail(email || null);
    setShowCalendarIntegration(Boolean(email));
  }, []);

  const closeCalendarIntegration = useCallback(() => {
    setShowCalendarIntegration(false);
    setCalendarEmail(null);
  }, []);

  const handleCalendarSave = useCallback(
    async (eventData) => {
      try {
        await apiPost(
          '/api/email/calendar-event',
          {
            ...eventData,
            emailId: calendarEmail?.id || null,
          },
          { auth: true, silent: true }
        );
      } catch (error) {
        try {
          CalendarService.createEvent({
            title: eventData.title,
            description: eventData.description,
            start: eventData.dateTime,
            end: eventData.dateTime,
            location: eventData.location,
          });
        } catch (fallbackError) {
          console.warn('No se pudo crear el evento en calendario:', fallbackError);
        }
        console.warn('Fallo al registrar el evento en backend, usando fallback local.', error);
      } finally {
        closeCalendarIntegration();
      }
    },
    [calendarEmail, closeCalendarIntegration]
  );

  const handleFeedbackSubmit = useCallback(
    async (feedback) => {
      try {
        await apiPost(
          '/api/email-feedback',
          {
            ...feedback,
            userId: user?.uid || null,
            userEmail: user?.email || null,
          },
          { auth: true, silent: true }
        );
      } catch (error) {
        console.warn('No se pudo registrar el feedback de email:', error);
      }
    },
    [user]
  );

  // Estados de carga y error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted">Cargando emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button
            onClick={refreshEmails}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header con controles */}
      <div className="bg-surface p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 data-testid="email-title" className="text-2xl font-semibold text-body">{folder === 'inbox' ? 'Recibidos' : 'Enviados'}</h1>
            <div className="flex items-center space-x-2">
              <button
                data-testid="compose-button"
                onClick={() => openComposer('basic')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nuevo Email
              </button>
              <button
                data-testid="compose-button-ai"
                onClick={() => openComposer('smart')}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Redactar con IA
              </button>
              <button
                onClick={refreshEmails}
                className="px-3 py-2 text-muted hover:text-body transition-colors"
                title="Actualizar"
              >
                ?
              </button>
            </div>
          </div>

          {/* Barra de bÃºsqueda y filtros */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-soft rounded-lg focus:ring-2 ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-soft rounded-lg focus:ring-2 ring-primary"
            >
              <option value="all">Todos</option>
              <option value="unread">No leÃ­dos</option>
              <option value="read">LeÃ­dos</option>
            </select>
          </div>

          {user?.email && (
            <p className="text-sm text-muted mt-2">
              Usuario: {user.email} | {filteredEmails.length} emails
            </p>
          )}

          {/* Herramientas de desarrollo */}
          {!import.meta.env.PROD && (
            <div className="mt-3">
              <button
                onClick={async () => {
                  if (analyzing) return;
                  try {
                    setAnalyzing(true);
                    const list = Array.isArray(filteredEmails) ? filteredEmails : [];
                    const ids = selectedEmailId
                      ? [selectedEmailId]
                      : list.map((e) => e && e.id).filter(Boolean);

                    const tryAnalyze = async (mailId, emailObj) => {
                      const candidates = Array.from(
                        new Set([
                          mailId,
                          emailObj?.apiId,
                          emailObj?.messageId,
                          emailObj?._id,
                        ].filter(Boolean))
                      );
                      let ok = false;
                      for (const cand of candidates) {
                        try {
                          const res = await apiPost(
                            '/api/email-insights/analyze',
                            {
                              mailId: cand,
                              id: cand,
                              messageId: cand,
                              user: String(user?.email || '').toLowerCase(),
                              userId: user?.uid || undefined,
                            },
                            { auth: true, silent: true }
                          );
                          if (res && res.ok) { ok = true; break; }
                        } catch (err) {
                          // continue to next candidate
                        }
                      }
                      if (!ok) {
                        console.warn('analyze failed for', mailId, 'candidates:', candidates);
                      }
                      return ok;
                    };

                    let success = 0;
                    const enableBackend = String(import.meta.env.VITE_ENABLE_EMAIL_ANALYZE || '').trim() === '1';
                    if (enableBackend) {
                      for (const id of ids) {
                        const emailObj = list.find((e) => e?.id === id || e?.apiId === id) || null;
                        const ok = await tryAnalyze(id, emailObj);
                        if (ok) success++;
                      }
                      console.log(`[IA] Analizados ${success}/${ids.length} correos en ${folder}`);
                    } else {
                      console.log(`[IA] AnÃ¡lisis backend desactivado (VITE_ENABLE_EMAIL_ANALYZE!=1). Usar panel por-email.`);
                    }
                  } catch (e) {
                    console.error('Error analizando correos', e);
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                className={`mt-2 px-3 py-2 text-xs border rounded ${analyzing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-soft'}`}
                title="Analizar correos (IA) - sÃ³lo en desarrollo"
                disabled={analyzing}
              >
                {analyzing ? 'Analizandoâ¦' : 'Analizar IA (carpeta actual)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-72 border-r bg-surface p-4 flex flex-col" data-testid="email-sidebar">
          <nav className="space-y-2">
            <button
              className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === 'inbox' ? 'bg-blue-100 text-primary' : 'text-body hover:bg-primary-soft'
              } system-folder`}
              onClick={() => {
                setSelectedEmailId(null);
                setFolder('inbox');
              }}
              data-testid="folder-item"
              title="Bandeja de entrada"
            >
              <span className="flex items-center gap-2">Bandeja de entrada {iaCounts.inbox > 0 && (
                <span className="text-[10px] font-semibold rounded-full bg-violet-100 text-violet-700 px-2 py-px" title={`IA: ${iaCounts.inbox}`}>
                  IA {iaCounts.inbox}
                </span>
              )}</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-blue-600 text-white">
                {inboxCounts.unread > 0 ? `${inboxCounts.unread}/${inboxCounts.total}` : inboxCounts.total}
              </span>
            </button>
            <button
              className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === 'sent' ? 'bg-blue-100 text-primary' : 'text-body hover:bg-primary-soft'
              } system-folder`}
              onClick={() => {
                setSelectedEmailId(null);
                setFolder('sent');
              }}
              data-testid="folder-item"
              title="Enviados"
            >
              <span className="flex items-center gap-2">Enviados {iaCounts.sent > 0 && (
                <span className="text-[10px] font-semibold rounded-full bg-violet-100 text-violet-700 px-2 py-px" title={`IA: ${iaCounts.sent}`}>
                  IA {iaCounts.sent}
                </span>
              )}</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-gray-700 text-white">
                {sentCounts.total}
              </span>
            </button>
            <button
              className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === 'trash' ? 'bg-blue-100 text-primary' : 'text-body hover:bg-primary-soft'
              } system-folder`}
              onClick={() => {
                setSelectedEmailId(null);
                setFolder('trash');
              }}
              data-testid="folder-item"
              title="Papelera"
            >
              <span className="flex items-center gap-2">Papelera</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-gray-300 text-gray-800">
                {trashCounts.total}
              </span>
            </button>
          </nav>

          <div className="mt-6">
            <CustomFolders
              folders={customFolders}
              activeFolder={currentCustomFolderId}
              onSelectFolder={(folderId) => {
                setSelectedEmailId(null);
                setFolder(`custom:${folderId}`);
              }}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>

          <div className="mt-auto pt-4 border-t space-y-2">
            <button
              type="button"
              className="w-full px-3 py-2 text-sm text-body border rounded hover:bg-primary-soft"
              onClick={() => setShowManageFolders(true)}
              data-testid="manage-folders-button"
            >
              Gestionar carpetas
            </button>
            {folder === 'trash' && (
              <button
                type="button"
                className="w-full px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                onClick={() => setShowEmptyTrashModal(true)}
                data-testid="empty-trash-button"
              >
                Vaciar papelera
              </button>
            )}
          </div>
        </aside>

        {/* Lista y detalle lado a lado */}
        <div className="flex-1 grid grid-cols-2 gap-0">
          <div className="border-r overflow-hidden">
            <EmailList
              emails={sortedEmails}
              onSelectEmail={handleEmailSelect}
              onDeleteEmail={handleDeleteEmail}
              selectedEmailId={selectedEmailId}
              loading={loading}
              currentFolder={folder}
              searchTerm={searchTerm}
              onSearch={setSearchTerm}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
            />
          </div>
          <div className="overflow-auto">
            {selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                userId={user?.uid}
                currentFolder={folder}
                onBack={handleBackToList}
                onDelete={() => handleDeleteEmail(selectedEmail.id)}
                onDeleteForever={() => handleDeleteEmail(selectedEmail.id, { permanent: true })}
                onRestore={() => handleRestoreEmail(selectedEmail.id)}
                onReply={() => {
                  const subj = selectedEmail?.subject ? `Re: ${selectedEmail.subject}` : 'Re:';
                  const to = selectedEmail?.from || '';
                  const quoted = `\n\n---- Mensaje original ----\nDe: ${selectedEmail?.from || ''}\nFecha: ${selectedEmail?.date || ''}\nAsunto: ${selectedEmail?.subject || ''}\n\n${selectedEmail?.body || ''}`;
                  openComposer('basic', { to, subject: subj, body: quoted });
                }}
                onForward={() => {
                  const subj = selectedEmail?.subject ? `Fwd: ${selectedEmail.subject}` : 'Fwd:';
                  const quoted = `\n\n---- Mensaje reenviado ----\nDe: ${selectedEmail?.from || ''}\nFecha: ${selectedEmail?.date || ''}\nAsunto: ${selectedEmail?.subject || ''}\n\n${selectedEmail?.body || ''}`;
                  openComposer('basic', { to: '', subject: subj, body: quoted });
                }}
                onSchedule={() => openCalendarIntegrationForEmail(selectedEmail)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted">
                Selecciona un correo para verlo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer modal */}
      {showComposer &&
        (composerMode === 'smart' ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden">
              <SmartEmailComposer
                provider={composerInitial?.provider || null}
                searchQuery={composerInitial?.searchQuery || ''}
                templates={emailTemplates}
                initialValues={composerInitial}
                onCancel={closeComposer}
                onSend={handleSmartComposerSend}
              />
            </div>
          </div>
        ) : (
          <EmailComposer
            isOpen={showComposer}
            onSend={handleSendEmail}
            onClose={closeComposer}
            initialValues={composerInitial}
          />
        ))}

      {/* Botón flotante para búsqueda de proveedores con IA (para tests/E2E) */}
      <button
        data-testid="open-ai-search"
        onClick={() => {
          setShowProviderSearch(true);
        }}
        className="fixed bottom-4 right-4 z-10 px-3 py-2 text-sm rounded border bg-white shadow hover:bg-gray-50"
        title="Buscar proveedores con IA"
      >
        IA Proveedores
      </button>

      {/* Modal de búsqueda IA de proveedores */}
      {showProviderSearch && (
        <ProviderSearchModal
          onClose={() => setShowProviderSearch(false)}
          onSelectProvider={(provider) => {
            try {
              const to = provider?.email || '';
              openComposer('smart', {
                to,
                provider,
                searchQuery: provider?.service || '',
              });
            } catch {}
            setShowProviderSearch(false);
          }}
        />
      )}

      {showCalendarIntegration && calendarEmail && (
        <CalendarIntegration
          email={calendarEmail}
          onClose={closeCalendarIntegration}
          onSave={handleCalendarSave}
        />
      )}

      <div className="fixed bottom-6 left-6 z-30">
        <EmailFeedbackCollector
          isMinimized
          emailId={selectedEmail?.id || null}
          onSubmit={handleFeedbackSubmit}
        />
      </div>

      <ManageFoldersModal
        isOpen={showManageFolders}
        onClose={() => setShowManageFolders(false)}
        folders={manageFoldersList}
        onDeleteFolder={handleDeleteFolder}
      />

      <EmptyTrashModal
        isOpen={showEmptyTrashModal}
        onConfirm={handleEmptyTrash}
        onClose={() => setShowEmptyTrashModal(false)}
      />
    </div>
  );
};

export default InboxContainer;













