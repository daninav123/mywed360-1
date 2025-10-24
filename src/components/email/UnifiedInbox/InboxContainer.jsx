import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import EmailDetail from './EmailDetail';
import EmailList from './EmailList';
import { useAuth } from '../../../hooks/useAuth';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { get as apiGet, post as apiPost, del as apiDel } from '../../../services/apiClient';
import EmailService, { USE_BACKEND } from '../../../services/emailService';
import { processIncomingEmails, scheduleEmailSend, startEmailScheduler, syncAutomationConfigFromServer } from '../../../services/emailAutomationService';
import CalendarService from '../../../services/CalendarService';
import EmailComposer from '../EmailComposer';
import SmartEmailComposer from '../SmartEmailComposer';
import EmailFeedbackCollector from '../EmailFeedbackCollector';
import CalendarIntegration from '../CalendarIntegration';
import {
  Inbox as InboxIcon,
  Send as SendIcon,
  Trash2 as TrashIcon,
  Sparkles,
  Search as SearchIcon,
  SlidersHorizontal,
  RefreshCcw,
  ArrowUpDown,
  Tag as TagIcon,
  // Mail, // TEMPORALMENTE DESACTIVADO
} from 'lucide-react';
import ProviderSearchModal from '../../ProviderSearchModal';
import CustomFolders from '../CustomFolders';
import ManageFoldersModal from '../ManageFoldersModal';
import EmptyTrashModal from '../EmptyTrashModal';
// import EmailAliasConfig from '../EmailAliasConfig'; // TEMPORALMENTE DESACTIVADO
import {
  getUserFolders,
  createFolder as createCustomFolder,
  renameFolder as renameCustomFolder,
  deleteFolder as deleteCustomFolder,
  assignEmailToFolder,
  removeEmailFromFolder,
  getEmailsInFolder,
  updateFolderUnreadCount,
} from '../../../services/folderService';

const IS_CYPRESS_E2E = typeof window !== 'undefined' && typeof window.Cypress !== 'undefined';

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'No leídos' },
  { id: 'read', label: 'Leídos' },
];

const SORT_OPTIONS = [
  { id: 'date', label: 'Fecha' },
  { id: 'subject', label: 'Asunto' },
  { id: 'from', label: 'Remitente' },
];

const DENSITY_OPTIONS = [
  { id: 'comfortable', label: 'Cómoda' },
  { id: 'compact', label: 'Compacta' },
];

const apiAuthOptions = (extra = {}) => ({
  ...(extra || {}),
  auth: IS_CYPRESS_E2E ? false : extra?.auth ?? true,
  silent: extra?.silent ?? true,
});

/**
 * InboxContainer - Bandeja de entrada unificada restaurada
 * Versión completa con todas las correcciones aplicadas para evitar errores de Promise
 */
const InboxContainer = () => {
  const authContext = useAuth();
  const { user } = authContext;
  const { trackOperation } = useEmailMonitoring();
  const resolvedUserId = user?.uid || 'mock-user';

  // Establecer el contexto de autenticación en EmailService
  useEffect(() => {
    EmailService?.setAuthContext?.(authContext);
  }, [authContext]);

  useEffect(() => {
    try {
      startEmailScheduler({ immediate: true });
    } catch (schedulerError) {
      console.warn('InboxContainer: no se pudo iniciar el scheduler de emails', schedulerError);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await syncAutomationConfigFromServer();
      } catch {}
    })();
  }, [resolvedUserId]);

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
  const customFoldersRef = useRef([]);
  const [showManageFolders, setShowManageFolders] = useState(false);
  const [showEmptyTrashModal, setShowEmptyTrashModal] = useState(false);
  // const [showEmailAliasConfig, setShowEmailAliasConfig] = useState(false); // TEMPORALMENTE DESACTIVADO
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composerInitial, setComposerInitial] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, read, unread
  const [classificationTagFilter, setClassificationTagFilter] = useState('all');
  const [showSuggestedOnly, setShowSuggestedOnly] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [listDensity, setListDensity] = useState('comfortable');
  const [viewMode, setViewMode] = useState('list'); // list, detail
  const currentCustomFolderId = folder.startsWith('custom:') ? folder.slice(7) : null;
  const isTrash = folder === 'trash';
  const systemFolders = useMemo(
    () => [
      { id: 'inbox', name: 'Bandeja de entrada', system: true },
      { id: 'sent', name: 'Enviados', system: true },
      { id: 'trash', name: 'Papelera', system: true },
    ],
    []
  );

  useEffect(() => {
    customFoldersRef.current = customFolders;
  }, [customFolders]);
  const manageFoldersList = useMemo(
    () => [
      ...systemFolders,
      ...customFolders.map((folderItem) => ({
        id: folderItem.id,
        name: folderItem.name || folderItem.id,
        system: false,
      })),
    ],
    [systemFolders, customFolders]
  );

  const moveTargetFolders = useMemo(
    () => [
      ...systemFolders,
      ...customFolders.map((folderItem) => ({
        id: `custom:${folderItem.id}`,
        name: folderItem.name || folderItem.id,
        system: false,
      })),
    ],
    [systemFolders, customFolders]
  );

  const systemSidebarItems = useMemo(
    () => [
      {
        id: 'inbox',
        label: 'Bandeja de entrada',
        icon: InboxIcon,
        badge: inboxCounts.unread > 0 ? inboxCounts.unread : inboxCounts.total,
        badgeTitle: `${inboxCounts.unread} no leídos · ${inboxCounts.total} totales`,
        badgeTone: 'bg-blue-600 text-white',
        ia: iaCounts.inbox,
      },
      {
        id: 'sent',
        label: 'Enviados',
        icon: SendIcon,
        badge: sentCounts.total,
        badgeTitle: `${sentCounts.total} enviados`,
        badgeTone: 'bg-gray-700 text-white',
        ia: iaCounts.sent,
      },
      {
        id: 'trash',
        label: 'Papelera',
        icon: TrashIcon,
        badge: trashCounts.total,
        badgeTitle: `${trashCounts.total} en papelera`,
        badgeTone: 'bg-gray-300 text-gray-800',
        ia: 0,
      },
    ],
    [inboxCounts, sentCounts, trashCounts, iaCounts]
  );

  const folderNameResolver = useMemo(() => {
    const map = new Map();
    manageFoldersList.forEach((folderItem) => {
      map.set(folderItem.id, folderItem.name);
      if (!folderItem.system) {
        map.set(`custom:${folderItem.id}`, folderItem.name);
      }
    });
    map.set('important', 'Importantes');
    return (folderId) => {
      if (!folderId) return null;
      if (map.has(folderId)) return map.get(folderId);
      if (folderId.startsWith('custom:')) {
        const raw = folderId.slice(7);
        return map.get(raw) || map.get(`custom:${raw}`) || raw || null;
      }
      return null;
    };
  }, [manageFoldersList]);

  const activeFolderLabel = useMemo(() => {
    if (folder === 'important') {
      return 'Importantes';
    }
    const resolved = folderNameResolver ? folderNameResolver(folder) : null;
    if (resolved) return resolved;
    if (folder.startsWith('custom:')) {
      return folder.slice(7);
    }
    if (folder === 'sent') return 'Enviados';
    if (folder === 'trash') return 'Papelera';
    return 'Recibidos';
  }, [folder, folderNameResolver]);

  const mapSuggestedFolder = useCallback(
    (suggestion) => {
      if (!suggestion || typeof suggestion !== 'string') {
        return { label: null, targetKey: null };
      }
      const trimmed = suggestion.trim();
      if (!trimmed) {
        return { label: null, targetKey: null };
      }
      const lower = trimmed.toLowerCase();
      if (lower === 'inbox' || lower === 'bandeja de entrada' || lower === 'recibidos') {
        return { label: 'Bandeja de entrada', targetKey: 'inbox' };
      }
      if (lower === 'sent' || lower === 'enviados') {
        return { label: 'Enviados', targetKey: 'sent' };
      }
      if (lower === 'trash' || lower === 'papelera') {
        return { label: 'Papelera', targetKey: 'trash' };
      }
      const list = customFoldersRef.current || [];
      const matched = list.find(
        (folderItem) => (folderItem?.name || '').trim().toLowerCase() === lower
      );
      if (matched) {
        return { label: matched.name || trimmed, targetKey: `custom:${matched.id}` };
      }
      return { label: trimmed, targetKey: null };
    },
    [customFoldersRef]
  );

  const filterSummary = useMemo(() => {
    const parts = [];
    if (filterStatus === 'unread') {
      parts.push('solo no leídos');
    } else if (filterStatus === 'read') {
      parts.push('solo leídos');
    }
    if (classificationTagFilter !== 'all') {
      parts.push(`etiqueta IA: ${classificationTagFilter}`);
    }
    if (showSuggestedOnly) {
      parts.push('sugerencias activas');
    }
    return parts.join(' · ');
  }, [filterStatus, classificationTagFilter, showSuggestedOnly]);

  // Cargar emails al montar el componente
  const loadCustomFolders = useCallback(async () => {
    const effectiveUserId = resolvedUserId;
    if (!effectiveUserId) {
      setCustomFolders([]);
      return;
    }

    let mergedFolders = [];
    try {
      const stored = getUserFolders(effectiveUserId);
      mergedFolders = Array.isArray(stored) ? stored : [];
    } catch (folderError) {
      console.error('Error leyendo carpetas personalizadas locales:', folderError);
      mergedFolders = [];
    }

    try {
      const res = await apiGet('/api/email/folders', apiAuthOptions({ silent: true }));
      if (res?.ok) {
        const payload = await res.json();
        const foldersFromApi = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        if (foldersFromApi.length) {
          const byId = new Map(mergedFolders.map((folderItem) => [folderItem.id, folderItem]));
          foldersFromApi.forEach((folderItem) => {
            if (!folderItem || !folderItem.id) return;
            const previous = byId.get(folderItem.id);
            byId.set(folderItem.id, previous ? { ...previous, ...folderItem } : folderItem);
          });
          mergedFolders = Array.from(byId.values());
        }
      }
    } catch (apiError) {
      console.warn('InboxContainer: no se pudieron obtener carpetas desde API', apiError);
    }

    let enhancedFolders = mergedFolders;
    try {
      const allMailsRaw = await EmailService.getMails('all').catch(() => []);
      const allMails = Array.isArray(allMailsRaw) ? allMailsRaw : [];
      const mailById = new Map();
      allMails.forEach((mail) => {
        if (mail?.id) {
          mailById.set(mail.id, mail);
        }
      });
      enhancedFolders = mergedFolders.map((folderItem) => {
        if (!folderItem?.id) return folderItem;
        const ids = getEmailsInFolder(effectiveUserId, folderItem.id);
        const unread = (Array.isArray(ids) ? ids : []).reduce((acc, mailId) => {
          const mail = mailById.get(mailId);
          return acc + (mail && !mail.read ? 1 : 0);
        }, 0);
        try {
          updateFolderUnreadCount(effectiveUserId, folderItem.id, unread);
        } catch (updateError) {
          console.warn('InboxContainer: no se pudo actualizar unread local', updateError);
        }
        return { ...folderItem, unread };
      });
    } catch (unreadError) {
      console.warn('InboxContainer: no se pudieron calcular los unread de carpetas personalizadas', unreadError);
    }

    setCustomFolders(Array.isArray(enhancedFolders) ? enhancedFolders : []);
  }, [resolvedUserId]);

  const refreshEmails = useCallback(
    async (targetFolder = folder) => {
      try {
        setLoading(true);
        let list = [];
        if (targetFolder.startsWith('custom:')) {
          const folderId = targetFolder.slice(7);
          const allMails = await EmailService.getMails('all');
          const ids =
            resolvedUserId && folderId
              ? new Set(getEmailsInFolder(resolvedUserId, folderId))
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

        let processedList = list;
        try {
          const sendMailFn = EmailService?.sendMail || EmailService?.sendEmail;
          processedList = await processIncomingEmails(list, { sendMail: sendMailFn });
        } catch (automationError) {
          console.warn('InboxContainer: no se pudo aplicar automatizacion de emails', automationError);
          processedList = list;
        }

        const normalizedList = Array.isArray(processedList)
          ? processedList
          : Array.isArray(list)
            ? list
            : [];

        setEmails(normalizedList);
        setError(null);

        if (targetFolder.startsWith('custom:')) {
          const folderId = targetFolder.slice(7);
          if (folderId && resolvedUserId) {
            const unread = normalizedList.reduce(
              (acc, mail) => acc + (mail && !mail.read ? 1 : 0),
              0
            );
            try {
              updateFolderUnreadCount(resolvedUserId, folderId, unread);
            } catch (updateError) {
              console.warn('InboxContainer: no se pudo actualizar unread tras refresh', updateError);
            }
            setCustomFolders((prev) => {
              if (!Array.isArray(prev) || !prev.length) return prev;
              let mutated = false;
              const next = prev.map((folderItem) => {
                if (!folderItem || folderItem.id !== folderId) return folderItem;
                mutated = true;
                return { ...folderItem, unread };
              });
              return mutated ? next : prev;
            });
          }
        }
      } catch (err) {
        console.error('Error cargando emails:', err);
        setError('No se pudieron cargar los emails');
      } finally {
        setLoading(false);
      }
    },
    [folder, resolvedUserId]
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

      await loadCustomFolders();

      if (!USE_BACKEND) {
        setIaCounts({ inbox: 0, sent: 0 });
        return;
      }

      // IA counts (best-effort, limitado a 50 por carpeta)
      try {
        const sample = (arr) => arr.slice(0, 50).map((m) => m.id).filter(Boolean);
        const hasInsights = async (id) => {
          try {
            const res = await apiGet(
              `/api/email-insights/${encodeURIComponent(id)}`,
              apiAuthOptions({ silent: true })
            );
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

  const refreshAllData = useCallback(async (targetFolder = folder) => {
    try {
      await Promise.all([refreshEmails(targetFolder), refreshCounts()]);
    } catch (refreshError) {
      console.warn('Error refrescando datos de email:', refreshError);
    }
  }, [folder, refreshEmails, refreshCounts]);

  useEffect(() => {
    loadCustomFolders();
  }, [loadCustomFolders]);

  useEffect(() => {
    refreshAllData(folder);
  }, [folder, refreshAllData]);

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
        const emailToUse = (user && user.email) || localMockEmail || 'usuario.test@maloveapp.com';
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

  // Marcar email como leído
  const markAsRead = useCallback(async (emailId) => {
    try {
      await EmailService.markAsRead(emailId);
      setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, read: true } : e)));
      try { await refreshCounts(); } catch {}
    } catch (err) {
      // En algunos entornos el backend puede devolver 404 si el mail solo
      // existe en la subcolección del usuario. Marcamos localmente y no
      // llenamos la consola de errores para este caso.
      const msg = String(err?.message || '');
      if (/404/.test(msg)) {
        setEmails((prev) => prev.map((e) => (e.id === emailId ? { ...e, read: true } : e)));
      } else {
        console.error('Error marcando como leído:', err);
      }
    }
  }, [refreshCounts]);

  const moveEmailToFolder = useCallback(
    async (emailId, targetFolder, options = {}) => {
      if (!emailId || !targetFolder) return;
      try {
        const effectiveOptions =
          options && Object.keys(options || {}).length > 0 ? options : undefined;
        if (typeof EmailService.moveMail === 'function') {
          if (effectiveOptions) await EmailService.moveMail(emailId, targetFolder, effectiveOptions);
          else await EmailService.moveMail(emailId, targetFolder);
        } else {
          if (effectiveOptions) await EmailService.setFolder(emailId, targetFolder, effectiveOptions);
          else await EmailService.setFolder(emailId, targetFolder);
        }
        if (resolvedUserId) {
          if (targetFolder.startsWith('custom:')) {
            assignEmailToFolder(resolvedUserId, emailId, targetFolder.slice(7));
          } else {
            removeEmailFromFolder(resolvedUserId, emailId);
          }
        }
        await refreshAllData();
      } catch (err) {
        console.error('Error moviendo email:', err);
        throw err;
      }
    },
    [resolvedUserId, refreshAllData]
  );

  const deleteEmailForever = useCallback(
    async (emailId) => {
      if (!emailId) return;
      try {
        await EmailService.deleteMail(emailId);
        if (resolvedUserId) {
          try {
            removeEmailFromFolder(resolvedUserId, emailId);
          } catch {}
        }
        await refreshAllData();
      } catch (err) {
        console.error('Error eliminando email definitivamente:', err);
        throw err;
      }
    },
    [resolvedUserId, refreshAllData]
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
        console.error('Error procesando eliminacion de email:', err);
      }
    },
    [deleteEmailForever, moveEmailToFolder, isTrash, selectedEmailId]
  );

  const handleRestoreEmail = useCallback(
    async (emailId) => {
      if (!emailId) return;
      try {
        const email = emails.find((item) => item.id === emailId) || null;
        const trashMeta = email?.trashMeta || {};
        const preferredFolder =
          trashMeta.previousFolder || trashMeta.restoredTo || trashMeta.previousFolders?.[0] || 'inbox';
        const restoreFolder =
          preferredFolder && preferredFolder !== 'trash' ? preferredFolder : 'inbox';
        await moveEmailToFolder(emailId, restoreFolder, {
          restore: true,
          fallbackFolder: preferredFolder,
        });
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setViewMode('list');
        }
      } catch (err) {
        console.error('Error restaurando email:', err);
      }
    },
    [emails, moveEmailToFolder, selectedEmailId]
  );

  const handleToggleImportant = useCallback(
    async (emailId, nextValue) => {
      if (!emailId) return;
      const previous = emails;
      setEmails((prev) =>
        prev.map((mail) =>
          mail && mail.id === emailId ? { ...mail, important: Boolean(nextValue) } : mail
        )
      );
      try {
        await EmailService.setMailImportant(emailId, Boolean(nextValue));
      } catch (error) {
        console.error('Error actualizando estado importante:', error);
        setEmails(previous);
      }
    },
    [emails]
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
    async (name) => {
      if (!name) return null;
      const trimmed = name.trim();
      if (!trimmed) return null;
      if (IS_CYPRESS_E2E) {
        try {
          const response = await apiPost(
            '/api/email/folders',
            { name: trimmed },
            apiAuthOptions({ silent: true })
          );
          if (!response?.ok) {
            throw new Error(`Fallo creando carpeta: ${response?.status}`);
          }
          await loadCustomFolders();
          return true;
        } catch (apiError) {
          console.error('Error creando carpeta personalizada (API):', apiError);
          throw apiError;
        }
      }
      try {
        const created = createCustomFolder(resolvedUserId, trimmed);
        await loadCustomFolders();
        return created;
      } catch (err) {
        console.error('Error creando carpeta personalizada:', err);
        throw err;
      }
    },
    [resolvedUserId, loadCustomFolders]
  );

  const handleRenameFolder = useCallback(
    async (folderId, newName) => {
      if (!folderId || !newName) return null;
      const trimmed = newName.trim();
      if (!trimmed) return null;
      if (IS_CYPRESS_E2E) {
        try {
          const res = await apiPost(
            `/api/email/folders/${encodeURIComponent(folderId)}`,
            { name: trimmed },
            apiAuthOptions({ silent: true })
          );
          if (!res?.ok) {
            throw new Error(`Fallo renombrando carpeta: ${res?.status}`);
          }
          await loadCustomFolders();
          return true;
        } catch (apiError) {
          console.error('Error renombrando carpeta personalizada (API):', apiError);
          throw apiError;
        }
      }
      try {
        const updated = renameCustomFolder(resolvedUserId, folderId, trimmed);
        await loadCustomFolders();
        return updated;
      } catch (err) {
        console.error('Error renombrando carpeta personalizada:', err);
        throw err;
      }
    },
    [resolvedUserId, loadCustomFolders]
  );

  const handleDeleteFolder = useCallback(
    async (folderId) => {
      if (!folderId) return false;
      if (IS_CYPRESS_E2E) {
        try {
          const response = await apiDel(`/api/email/folders/${encodeURIComponent(folderId)}`, {
            ...apiAuthOptions({ silent: true }),
          });
          if (!response?.ok && response?.status !== 204) {
            throw new Error(`Fallo eliminando carpeta: ${response?.status}`);
          }
          await loadCustomFolders();
          if (folder === `custom:${folderId}`) {
            setFolder('inbox');
            setSelectedEmailId(null);
            await refreshAllData('inbox');
          } else {
            await refreshAllData(folder);
          }
          return true;
        } catch (apiError) {
          console.error('Error eliminando carpeta personalizada (API):', apiError);
          throw apiError;
        }
      }
      try {
        const result = deleteCustomFolder(resolvedUserId, folderId);
        await loadCustomFolders();
        if (folder === `custom:${folderId}`) {
          setFolder('inbox');
          setSelectedEmailId(null);
          await refreshAllData('inbox');
        } else {
          await refreshAllData(folder);
        }
        return result;
      } catch (err) {
        console.error('Error eliminando carpeta personalizada:', err);
        throw err;
      }
    },
    [resolvedUserId, loadCustomFolders, folder, refreshAllData]
  );

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

  const decoratedEmails = useMemo(() => {
    return safeEmails.map((email) => {
      const classificationTagsSource = Array.isArray(email.suggestedTags) && email.suggestedTags.length
        ? email.suggestedTags
        : Array.isArray(email.aiClassification?.tags)
        ? email.aiClassification.tags
        : [];
      const classificationTags = Array.from(
        new Set(
          classificationTagsSource
            .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
            .filter(Boolean)
        )
      );
      const suggestionRaw = email.suggestedFolder || email.aiClassification?.folder || null;
      const suggestionInfo = mapSuggestedFolder(suggestionRaw);
      return {
        ...email,
        _classificationTags: classificationTags,
        _suggestedFolderLabel: suggestionInfo.label,
        _suggestedFolderTarget: suggestionInfo.targetKey,
        _hasSuggestion: Boolean(suggestionInfo.label),
      };
    });
  }, [safeEmails, mapSuggestedFolder]);

  const availableClassificationTags = useMemo(() => {
    const tagSet = new Set();
    decoratedEmails.forEach((email) => {
      (email._classificationTags || []).forEach((tag) => {
        if (tag) tagSet.add(tag);
      });
    });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [decoratedEmails]);

  // Email seleccionado
  const selectedEmail = selectedEmailId
    ? decoratedEmails.find((email) => email.id === selectedEmailId)
    : null;

  // Filtrar emails según búsqueda, estado y clasificación IA
  const filteredEmails = decoratedEmails.filter((email) => {
    const subjectValue = typeof email.subject === 'string' ? email.subject : '';
    const fromValue = typeof email.from === 'string' ? email.from : '';
    const bodyValue = typeof email.body === 'string' ? email.body : '';

    const matchesSearch =
      !searchTerm ||
      subjectValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bodyValue.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'read' && email.read) ||
      (filterStatus === 'unread' && !email.read);

    const tags = Array.isArray(email._classificationTags) ? email._classificationTags : [];
    const matchesTag =
      classificationTagFilter === 'all' ||
      tags.some((tag) => tag.toLowerCase() === classificationTagFilter.toLowerCase());

    const matchesSuggestion = !showSuggestedOnly || email._hasSuggestion;

    return matchesSearch && matchesFilter && matchesTag && matchesSuggestion;
  });

  const visibleEmailCount = filteredEmails.length;

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

      // Marcar como leído si no lo está
      const email = emails.find((e) => e.id === emailId);
      if (email && !email.read) {
        markAsRead(emailId);
      }
    },
    [safeEmails, markAsRead]
  );

  const handleBackToList = useCallback(() => {
    setSelectedEmailId(null);
    setViewMode('list');
  }, []);

    const handleSendEmail = useCallback(
    async (emailData) => {
      if (!emailData || typeof emailData !== 'object') return;

      if (emailData.scheduled) {
        trackOperation?.('email_scheduled', {
          success: true,
          mode: 'basic',
          when: emailData.scheduledAt || null,
        });
        closeComposer();
        try {
          await refreshEmails();
        } catch {}
        try {
          await refreshCounts();
        } catch {}
        return;
      }

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
          trackOperation?.('email_scheduled', {
            success: true,
            mode: 'smart',
            when: scheduledTime,
          });
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
          apiAuthOptions({ silent: true })
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
          apiAuthOptions({ silent: true })
        );
      } catch (error) {
        console.warn('No se pudo registrar el feedback de email:', error);
      }
    },
    [user]
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header con controles */}
      <div className="bg-surface border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px] space-y-1">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
                <SlidersHorizontal size={14} className="text-primary" />
                Bandeja unificada
              </p>
              <h1
                data-testid="email-title"
                className="text-2xl font-semibold text-body leading-tight"
              >
                {activeFolderLabel}
              </h1>
              <p className="text-sm text-muted">
                {visibleEmailCount}{' '}
                {visibleEmailCount === 1 ? 'correo visible' : 'correos visibles'}
                {filterSummary ? ` · ${filterSummary}` : ''}
                {importantCounts.total
                  ? ` · Destacados: ${
                      importantCounts.unread > 0 ? `${importantCounts.unread} sin leer` : importantCounts.total
                    }`
                  : ''}
                {user?.email ? ` · ${user.email}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                data-testid="compose-button"
                onClick={() => openComposer('basic')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Nuevo email
              </button>
              <button
                data-testid="compose-button-ai"
                onClick={() => openComposer('smart')}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
              >
                Redactar con IA
              </button>
              <button
                type="button"
                onClick={() => {
                  refreshAllData(folder);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-soft px-3 py-2 text-sm font-medium text-muted transition hover:bg-gray-100"
                title="Actualizar bandeja y contadores"
              >
                <RefreshCcw size={16} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Buscar emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="email-search-input"
                className="w-full rounded-lg border border-soft bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div
              className="flex items-center gap-1 rounded-full bg-gray-100 p-1"
              role="group"
              aria-label="Filtro por estado"
            >
              {STATUS_FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  data-testid={`filter-status-${option.id}`}
                  onClick={() => setFilterStatus(option.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition ${
                    filterStatus === option.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-muted hover:bg-gray-200'
                  }`}
                  aria-pressed={filterStatus === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSuggestedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                showSuggestedOnly
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              aria-pressed={showSuggestedOnly}
              data-testid="toggle-suggested-only"
              title="Mostrar solo correos con sugerencia de IA"
            >
              <Sparkles size={16} />
              Solo sugeridos
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <label htmlFor="email-sort" className="hidden text-muted sm:block">
                Ordenar por
              </label>
              <select
                id="email-sort"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="rounded-lg border border-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center justify-center rounded-lg border border-soft px-2 py-2 text-muted hover:bg-gray-100"
                aria-label="Invertir orden"
              >
                <ArrowUpDown size={16} />
              </button>
            </div>

            <div
              className="flex items-center gap-1 rounded-full bg-gray-100 p-1"
              role="group"
              aria-label="Densidad de lista"
            >
              {DENSITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setListDensity(option.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition ${
                    listDensity === option.id
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-muted hover:bg-gray-200'
                  }`}
                  aria-pressed={listDensity === option.id}
                  data-testid={`email-density-${option.id}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2 text-muted">
              <span>Totales</span>
              <span className="font-semibold text-body">{visibleEmailCount}</span>
            </div>
          </div>

          {availableClassificationTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pt-1 text-sm text-muted">
              <span className="flex items-center gap-1 text-xs uppercase tracking-wide">
                <TagIcon size={14} className="text-primary" />
                Etiquetas IA
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClassificationTagFilter('all')}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    classificationTagFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }`}
                  aria-pressed={classificationTagFilter === 'all'}
                >
                  Todas
                </button>
                {availableClassificationTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setClassificationTagFilter(tag)}
                    className={`rounded-full px-3 py-1 text-sm transition ${
                      classificationTagFilter === tag
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-muted hover:bg-gray-200'
                    }`}
                    aria-pressed={classificationTagFilter === tag}
                    title={`Filtrar por etiqueta ${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              data-testid="email-error-alert"
            >
              <span>{error}</span>
              <button
                onClick={() => {
                  refreshAllData(folder);
                }}
                className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {!import.meta.env.PROD && (
            <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-muted">
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
                            apiAuthOptions({ silent: true })
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
                      console.log(`[IA] Análisis backend desactivado (VITE_ENABLE_EMAIL_ANALYZE!=1). Usar panel por-email.`);
                    }
                  } catch (e) {
                    console.error('Error analizando correos', e);
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                className={`mt-2 px-3 py-2 text-xs border rounded ${analyzing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-soft'}`}
                title="Analizar correos (IA) - sólo en desarrollo"
                disabled={analyzing}
              >
                {analyzing ? 'Analizando...' : 'Analizar IA (carpeta actual)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-72 border-r bg-surface p-4 flex flex-col" data-testid="folders-sidebar">
          <nav className="space-y-1">
            {systemSidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = folder === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`system-folder flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive ? 'bg-blue-50 text-primary ring-1 ring-blue-100' : 'text-muted hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    setSelectedEmailId(null);
                    setFolder(item.id);
                  }}
                  data-testid="folder-item"
                  data-folder={item.id}
                  id={item.id === 'sent' ? 'folder-sent' : undefined}
                  aria-pressed={isActive}
                  title={item.badgeTitle}
                >
                  <span className="flex items-center gap-2">
                    <IconComponent size={18} className={isActive ? 'text-primary' : 'text-muted'} />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {item.ia > 0 && (
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                        IA {item.ia}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.badgeTone}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
              <span>Carpetas personalizadas</span>
              <span>{customFolders.length}</span>
            </div>
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
            {/* TEMPORALMENTE DESACTIVADO - Causa bucle infinito
            <button
              type="button"
              className="w-full px-3 py-2 text-sm text-body border rounded hover:bg-primary-soft flex items-center justify-center gap-2"
              onClick={() => setShowEmailAliasConfig(true)}
              data-testid="config-email-button"
            >
              <Mail size={16} />
              Configurar mi email
            </button>
            */}
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
              onToggleImportant={handleToggleImportant}
              folderNameResolver={folderNameResolver}
              error={error}
              density={listDensity}
            />
          </div>
          <div className="overflow-auto">
            {selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                userId={user?.uid}
                currentFolder={folder}
                folders={moveTargetFolders}
                onMoveToFolder={moveEmailToFolder}
                resolveFolderName={folderNameResolver}
                onBack={handleBackToList}
                onDelete={() => handleDeleteEmail(selectedEmail.id)}
                onDeleteForever={() => handleDeleteEmail(selectedEmail.id, { permanent: true })}
                onRestore={() => handleRestoreEmail(selectedEmail.id)}
                onToggleImportant={(value) => handleToggleImportant(selectedEmail.id, value)}
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

      {/* Boton flotante para busqueda de proveedores con IA (para tests/E2E) */}
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

      {/* Modal de busqueda IA de proveedores */}
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

      {/* TEMPORALMENTE DESACTIVADO - Causa bucle infinito
      {showEmailAliasConfig && (
        <EmailAliasConfig
          user={user}
          onClose={() => setShowEmailAliasConfig(false)}
          onSuccess={(newEmail) => {
            console.log('✅ Email configurado:', newEmail);
            alert(`Email configurado correctamente: ${newEmail}\n\nRecarga la página para que los cambios surtan efecto.`);
            setShowEmailAliasConfig(false);
          }}
        />
      )}
      */}
    </div>
  );
};

export default InboxContainer;














