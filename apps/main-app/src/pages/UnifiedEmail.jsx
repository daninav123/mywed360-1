import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, Trash2, Archive, Star, Clock, CheckCircle, User, Moon, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import useTranslations from '../hooks/useTranslations';
import { useAuth } from '../hooks/useAuth.jsx';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';

import ChipToggle from '../components/email/ChipToggle';
import { formatDate } from '../utils/formatUtils';
import MailListComponent from '../components/email/MailList';
import MailViewerComponent from '../components/email/MailViewer';
import EmailInsights from '../components/EmailInsights';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import UsernameWizard from '../components/UsernameWizard';
import ComposeEmailModal from '../components/email/ComposeEmailModal';
import { useWedding } from '../context/WeddingContext';
import useEmailUsername from '../hooks/useEmailUsername';
import useWeddingCollection from '../hooks/useWeddingCollection';
import EmailRecommendationService from '../services/EmailRecommendationService';
import {
  getMails,
  getMailsPage,
  initEmailService,
  markAsRead,
  markAsUnread,
  deleteMail,
  sendMail,
  setFolder as setMailFolder,
} from '../services/emailService';
import { detectProviderResponse } from '../services/EmailTrackingService';
import {
  getUserFolders,
  assignEmailToFolder,
  createFolder,
  renameFolder,
  deleteFolder,
  getEmailsInFolder,
} from '../services/folderService';
import { uploadEmailAttachments } from '../services/storageUploadService';
import {
  getEmailTagsDetails,
  getUserTags,
  createTag,
  addTagToEmail,
  getEmailsByTag,
  removeTagFromEmail,
} from '../services/tagService';
import sanitizeHtml from '../utils/sanitizeHtml';
import { ensureContractFromEmail } from '../services/contractEmailService';
/**
 * P)gina principal de Buz)n (correo interno @maloveapp.com)
 * Incluye: Sidebar de carpetas, lista de correos, visor del correo y modal para redactar.
 * Email backend:
 *  - GET  /getMailgunEvents  -> lista de eventos (funci)n Cloud)
 *  - POST /sendEmail        -> env)a correo (funci)n Cloud)
 */
const UnifiedEmail = () => {
  console.log('🔵 [UnifiedEmail] Componente montado/renderizado');
  
  const { t } = useTranslations();
  const { getCurrentUsername } = useEmailUsername();
  const { userProfile } = useAuth();
  
  console.log('🔵 [UnifiedEmail] userProfile en render:', userProfile);
  
  const [myEmail, setMyEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [folder, setFolder] = useState('inbox'); // inbox | sent
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);
  const [composeInitial, setComposeInitial] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [userId, setUserId] = useState(null);
  const [customFolders, setCustomFolders] = useState([]);
  // Proveedores de la boda activa para detecci)n de respuestas
  const { activeWedding } = useWedding();
  const { data: providers } = useWeddingCollection('suppliers', activeWedding, []);

  const [activeCustomFolder, setActiveCustomFolder] = useState(null); // id carpeta
  const [activeTagId, setActiveTagId] = useState(null); // filtro etiqueta
  const [allTags, setAllTags] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Helper local para marcar como NO le)do en backend
  const markAsUnreadApi = async (id) => {
    try {
      await markAsUnread(id);
    } catch (_) {
      /* fallback local ya aplicado en UI */
    }
  };
  const fetchEmails = useCallback(async () => {
    if (!myEmail) return;
    setLoading(true);
    setError(null);
    try {
      const fetchFolder =
        activeCustomFolder || activeTagId ? 'all' : folder === 'sent' ? 'sent' : 'inbox';
      if (fetchFolder === 'all') {
        const mails = await getMails(fetchFolder);
        setEmails(Array.isArray(mails) ? mails : []);
        setNextCursor(null);
        setHasMore(false);
      } else {
        const page = await getMailsPage(fetchFolder, { limit: 50, cursor: null });
        setEmails(Array.isArray(page.items) ? page.items : []);
        setNextCursor(page.nextCursor || null);
        setHasMore(Boolean(page.nextCursor));
      }
    } catch (err) {
      // console.error('Error cargando correos:', err);
      setError('No se pudieron cargar los correos');
    } finally {
      setLoading(false);
    }
  }, [myEmail, folder, activeCustomFolder, activeTagId]);

  const loadMore = useCallback(async () => {
    try {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const fetchFolder = folder === 'sent' ? 'sent' : 'inbox';
      const page = await getMailsPage(fetchFolder, { limit: 50, cursor: nextCursor });
      const newItems = Array.isArray(page.items) ? page.items : [];
      setEmails((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        for (const m of newItems) {
          if (!byId.has(m.id)) byId.set(m.id, m);
        }
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        );
      });
      setNextCursor(page.nextCursor || null);
      setHasMore(Boolean(page.nextCursor));
    } catch (e) {
      // console.warn('loadMore failed', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor, folder]);

  // Detectar respuestas de proveedores
  useEffect(() => {
    try {
      if (!emails || emails.length === 0) return;
      if (!providers || providers.length === 0) return;

      const processedKey = 'maloveapp_provider_response_checked';
      const processed = new Set(JSON.parse(localStorage.getItem(processedKey) || '[]'));
      let changed = false;

      emails.forEach((email) => {
        if (!email?.id) return;
        if (processed.has(email.id)) return;
        if (email.folder && email.folder !== 'inbox') return;
        const updated = detectProviderResponse(email, providers);
        if (updated) {
          changed = true;
        }
        processed.add(email.id);
      });

      if (processed.size) {
        localStorage.setItem(processedKey, JSON.stringify(Array.from(processed)));
      }
      if (changed) {
        try {
          window.dispatchEvent(new Event('maloveapp-tracking-updated'));
        } catch {}
      }
    } catch (e) {
      // console.warn('UnifiedEmail: error detectando respuesta de proveedor', e);
    }
  }, [emails, providers]);

  useEffect(() => {
    if (!activeWedding || !Array.isArray(emails) || emails.length === 0) return;
    let cancelled = false;

    const processContracts = async () => {
      for (const email of emails) {
        if (cancelled) break;
        try {
          await ensureContractFromEmail(email, activeWedding);
        } catch (error) {
          // console.warn('UnifiedEmail: error al guardar contrato desde correo', error);
        }
      }
    };

    processContracts();

    return () => {
      cancelled = true;
    };
  }, [emails, activeWedding]);
  
  // Obtener email del usuario desde PostgreSQL (sin Firebase Auth)
  useEffect(() => {
    const initUserEmail = async () => {
      if (!currentUser) return;

      console.log('[UnifiedEmail] Auth state changed, userProfile:', userProfile);
      setUserId(currentUser.uid);
      
      // Usar myWed360Email del perfil de PostgreSQL
      if (userProfile?.myWed360Email) {
        const resolvedEmail = userProfile.myWed360Email;
        console.log('[UnifiedEmail] ✅ Usando email del perfil:', resolvedEmail);
        await initEmailService({
          uid: currentUser.uid,
          myWed360Email: resolvedEmail,
          email: currentUser.email,
        });
        setMyEmail(resolvedEmail);
      } else {
        console.log('[UnifiedEmail] ⚠️ No hay userProfile.myWed360Email, usando fallback');
        // Fallback si no hay perfil cargado aún
        const username = await getCurrentUsername();
        if (username) {
          const resolvedEmail = `${username}@planivia.net`;
          console.log('[UnifiedEmail] Fallback email:', resolvedEmail);
          await initEmailService({
            uid: currentUser.uid,
            emailUsername: username,
            myWed360Email: resolvedEmail,
            email: currentUser.email,
          });
          setMyEmail(resolvedEmail);
        } else {
          console.log('[UnifiedEmail] ❌ No username disponible');
        }
      }
    };
    
    initUserEmail();
  }, [currentUser, userProfile, getCurrentUsername]);

  // Carga inicial + polling
  useEffect(() => {
    if (!myEmail) return;
    fetchEmails();
    const id = setInterval(fetchEmails, 60000);
    return () => clearInterval(id);
  }, [fetchEmails, myEmail, folder, activeCustomFolder, activeTagId]);

  // Cargar carpetas personalizadas del usuario
  useEffect(() => {
    if (!userId) return;
    try {
      const folders = getUserFolders(userId);
      setCustomFolders(folders);
    } catch (e) {
      // console.warn('No se pudieron cargar carpetas personalizadas', e);
    }
  }, [userId]);

  // Cargar etiquetas
  useEffect(() => {
    if (!userId) return;
    try {
      const tags = getUserTags(userId);
      setAllTags(tags);
    } catch (e) {
      // console.warn('No se pudieron cargar etiquetas', e);
    }
  }, [userId]);
  const handleMarkRead = async (mail) => {
    try {
      await markAsRead(mail.id);
      setEmails((prev) => prev.map((m) => (m.id === mail.id ? { ...m, read: true } : m)));
      setSelected((prev) => (prev ? { ...prev, read: true } : prev));
    } catch (err) {
      // console.error('Error marcando le)do:', err);
      toast.error(t('email.markReadError'));
    }
  };

  const handleDelete = async (mail) => {
    try {
      await deleteMail(mail.id);
      setEmails((prev) => prev.filter((m) => m.id !== mail.id));
      setSelected(null);
    } catch (err) {
      // console.error('Error eliminando correo:', err);
      toast.error(t('email.deleteError'));
    }
  };
  async function handleToggleRead(mail) {
    try {
      if (!mail.read) {
        await handleMarkRead(mail);
      } else {
        try {
          await markAsUnreadApi(mail.id);
        } catch {}
        setEmails((prev) => prev.map((m) => (m.id === mail.id ? { ...m, read: false } : m)));
        setSelected((prev) => (prev && prev.id === mail.id ? { ...prev, read: false } : prev));
      }
    } catch (e) {
      // console.warn('Error alternando le)do', e);
    }
  }

  const handleMoveToFolder = async (mail, folderId) => {
    try {
      if (!userId || !mail?.id || !folderId) return;
      const ok = assignEmailToFolder(userId, mail.id, folderId);
      if (ok) {
        // console.log('Correo movido a carpeta');
      }
      // Best-effort: reflejar en backend
      try {
        // Persistir como carpeta personalizada en backend para excluir de inbox
        await setMailFolder(mail.id, `custom:${folderId}`);
      } catch {}
    } catch (e) {
      // console.error('Error moviendo correo a carpeta', e);
    }
  };

  // Filtro local por b)squeda y chips
  const filteredEmails = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = emails
      .filter((m) => (onlyUnread ? !m.read : true))
      .filter((m) =>
        onlyWithAttachments ? Array.isArray(m.attachments) && m.attachments.length > 0 : true
      )
      .filter((m) => {
        if (!q) return true;
        const haystack =
          `${m.subject || ''} ${m.body || ''} ${m.from || m.sender || ''}`.toLowerCase();
        return haystack.includes(q);
      });

    if (activeCustomFolder && userId) {
      try {
        const ids = new Set(getEmailsInFolder(userId, activeCustomFolder));
        base = base.filter((m) => ids.has(m.id));
      } catch {}
    }

    if (activeTagId && userId) {
      try {
        const ids = new Set(getEmailsByTag(userId, activeTagId));
        base = base.filter((m) => ids.has(m.id));
      } catch {}
    }

    return base.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [emails, search, onlyUnread, onlyWithAttachments, activeCustomFolder, activeTagId, userId]);
  
  const { logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  
  return (
    <>
    <div className="absolute top-4 right-4 flex items-center space-x-3 z-[100]">
      <LanguageSelector variant="minimal" />
      <div className="relative" data-user-menu>
        <button onClick={() => setOpenUserMenu(!openUserMenu)} className={`w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center ${openUserMenu ? 'bg-lavender border-2 border-primary shadow-lg' : 'bg-white/95 border-2 border-white/80 shadow-md'}`} title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}>
          <User className={`w-5 h-5 ${openUserMenu ? 'text-primary' : 'text-secondary'}`} />
        </button>
        {openUserMenu && (
          <div className="absolute right-0 mt-3 bg-surface p-2 space-y-1 min-w-[220px] border border-soft rounded-lg shadow-xl z-[9999]">
            <div className="px-2 py-1"><NotificationCenter /></div>
            <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="menu-item">
              <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
            </Link>
            <Link to="/email" onClick={() => setOpenUserMenu(false)} className="menu-item">
              <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
            </Link>
            <div className="px-3 py-2.5 rounded-xl transition-all duration-200 hover-lavender">
              <div className="flex items-center justify-between"><span className="text-sm flex items-center text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
            </div>
            <div className="divider"></div>
            <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center text-danger hover-danger-bg">
              <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="flex h-full w-full flex-col">
      {/* Wizard para elegir nombre si es la primera vez */}
      <UsernameWizard />
      {/* B)squeda y filtros r)pidos */}
      <div className="flex flex-col gap-2 border-b /50 p-3 md:flex-row md:items-center md:justify-between bg-page">
        <div className="flex items-center gap-2">
          <ChipToggle
            active={onlyUnread}
            onClick={() => setOnlyUnread((v) => !v)}
            label="No le)do"
          />
          <ChipToggle
            active={onlyWithAttachments}
            onClick={() => setOnlyWithAttachments((v) => !v)}
            label="Con adjuntos"
          />
        </div>
        <div className="relative w-full md:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar correos"
            className="w-full rounded border px-3 py-2 text-sm pr-8"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted">
            🔍
          </span>
        </div>
        {/* Filtro por etiqueta */}
        <div className="flex items-center gap-2">
          <select
            value={activeTagId || ''}
            onChange={(e) => setActiveTagId(e.target.value || null)}
            className="px-3 py-2 border border-default rounded-lg text-sm"
          >
            <option value="">Todas las etiquetas</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            onClick={() => {
              try {
                const name = prompt('Nombre del tag');
                if (!name) return;
                createTag(userId || '', name);
                setAllTags(getUserTags(userId || ''));
              } catch (_) {}
            }}
          >
            Nuevo tag
          </Button>
        </div>
      </div>

      {/* Barra superior */}
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold" data-testid="email-title">Buzón</h1>
        <Button variant="primary" onClick={() => setShowCompose(true)} data-testid="compose-button">
          Redactar
        </Button>
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-64 border-r p-4 bg-page">
          <nav className="space-y-2">
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === 'inbox' && !activeCustomFolder
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                setFolder('inbox');
                setActiveCustomFolder(null);
                setActiveTagId(null);
              }}
              data-testid="folder-item"
              data-folder="inbox"
            >
              Recibidos
            </button>
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === 'sent' && !activeCustomFolder
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                setFolder('sent');
                setActiveCustomFolder(null);
                setActiveTagId(null);
              }}
              data-testid="folder-item"
              data-folder="sent"
            >
              Enviados
            </button>

            {/* Carpetas personalizadas */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-secondary">
                <span>Carpetas</span>
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    try {
                      const name = prompt('Nombre de la carpeta');
                      if (!name) return;
                      createFolder(userId || '', name);
                      setCustomFolders(getUserFolders(userId || ''));
                    } catch (_) {}
                  }}
                >
                  Nueva
                </button>
              </div>
              <div className="space-y-1">
                {customFolders.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between rounded px-2 py-1 text-sm ${activeCustomFolder === f.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <button
                      className="flex-1 text-left"
                      onClick={() => {
                        setActiveCustomFolder(f.id);
                        setFolder('inbox');
                      }}
                    >
                      {f.name}
                    </button>
                    <div className="ml-2 flex items-center gap-1 text-xs text-muted">
                      <button
                        title="Renombrar"
                        onClick={() => {
                          try {
                            const nn = prompt('Nuevo nombre', f.name);
                            if (!nn) return;
                            renameFolder(userId || '', f.id, nn);
                            setCustomFolders(getUserFolders(userId || ''));
                          } catch (_) {}
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => {
                          try {
                            if (!confirm('Eliminar carpeta?')) return;
                            deleteFolder(userId || '', f.id);
                            setCustomFolders(getUserFolders(userId || ''));
                            if (activeCustomFolder === f.id) setActiveCustomFolder(null);
                          } catch (_) {}
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Lista de correos */}
        <div className="w-80 border-r">
          {/* Acciones masivas */}
          <div className="flex items-center justify-between p-2 border-b text-xs bg-surface">
            <div className="text-secondary">Seleccionados: {selectedIds.size}</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedIds(new Set(filteredEmails.map((m) => m.id)));
                }}
              >
                Seleccionar todo
              </Button>
              <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Limpiar
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  const ids = Array.from(selectedIds);
                  for (const id of ids) {
                    try {
                      await markAsRead(id);
                    } catch {}
                  }
                  setEmails((prev) =>
                    prev.map((m) => (selectedIds.has(m.id) ? { ...m, read: true } : m))
                  );
                  setSelectedIds(new Set());
                }}
              >
                Marcar leído
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  const ids = Array.from(selectedIds);
                  for (const id of ids) {
                    try {
                      await deleteMail(id);
                    } catch {}
                  }
                  setEmails((prev) => prev.filter((m) => !selectedIds.has(m.id)));
                  setSelectedIds(new Set());
                }}
              >
                Borrar
              </Button>
            </div>
          </div>
          <MailListComponent
            emails={filteredEmails}
            onSelect={setSelected}
            selected={selected}
            loading={loading}
            emptyMessage={
              search || onlyUnread || onlyWithAttachments
                ? 'No hay correos que coincidan'
                : 'No hay correos'
            }
            onToggleRead={handleToggleRead}
            onDelete={handleDelete}
            folders={customFolders}
            userId={userId}
            onMoveToFolder={handleMoveToFolder}
            selectedIds={selectedIds}
            onToggleSelect={(id) =>
              setSelectedIds((prev) => {
                const n = new Set(prev);
                if (n.has(id)) n.delete(id);
                else n.add(id);
                return n;
              })
            }
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" />
            </div>
          )}
          {error && (
            <Alert variant="error" className="m-4">
              {error}
            </Alert>
          )}
        </div>

        {/* Visor del correo */}
        <main className="flex-1 p-6">
          {selected ? (
            <MailViewerComponent
              mail={selected}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onCompose={(initial) => {
                setComposeInitial(initial);
                setShowCompose(true);
              }}
              folders={customFolders}
              onMoveToFolder={handleMoveToFolder}
              userId={userId}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              Selecciona un correo para verlo aquí
            </div>
          )}
        </main>
      </div>

      {/* Modal de redactar */}
      {showCompose && (
        <ComposeEmailModal
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
          userEmail={myEmail}
          replyTo={composeInitial}
        />
      )}
    </div>
    <Nav />
    </>
  );
};
export default UnifiedEmail;

// --- UI helpers ---
const formatDateShort = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  if (sameDay) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return formatDate(dt, 'short');
};

// Avatar y ChipToggle se han extra)do a componentes reutilizables
