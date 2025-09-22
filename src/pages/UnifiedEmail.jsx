import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import UsernameWizard from "../components/UsernameWizard";
import useEmailUsername from "../hooks/useEmailUsername";
import Button from "../components/ui/Button";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { uploadEmailAttachments } from "../services/storageUploadService";
import { getMails, getMailsPage, initEmailService, markAsRead, markAsUnread, deleteMail, sendMail, setFolder } from "../services/emailService";
import EmailRecommendationService from "../services/EmailRecommendationService";
import { detectProviderResponse } from "../services/EmailTrackingService";
import { useWedding } from "../context/WeddingContext";
import useWeddingCollection from "../hooks/useWeddingCollection";
import EmailInsights from "../components/EmailInsights";
import sanitizeHtml from "../utils/sanitizeHtml";
import EmailComposeModal from "../components/email/ComposeModal";
import Avatar from "../components/email/Avatar";
import ChipToggle from "../components/email/ChipToggle";
import MailListComponent from "../components/email/MailList";
import MailViewerComponent from "../components/email/MailViewer";
import { getUserFolders, assignEmailToFolder, createFolder, renameFolder, deleteFolder, getEmailsInFolder } from "../services/folderService";
import { getEmailTagsDetails, getUserTags, createTag, addTagToEmail, getEmailsByTag, removeTagFromEmail } from "../services/tagService";

/**
 * Página principal de Buzón (correo interno @mywed360.com)
 * Incluye: Sidebar de carpetas, lista de correos, visor del correo y modal para redactar.
 * Email backend:
 *  - GET  /getMailgunEvents  -> lista de eventos (función Cloud)
 *  - POST /sendEmail        -> envía correo (función Cloud)
 */
const UnifiedEmail = () => {
  const { getCurrentUsername } = useEmailUsername();
  const [myEmail, setMyEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [folder, setFolder] = useState("inbox"); // inbox | sent
  const [search, setSearch] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyWithAttachments, setOnlyWithAttachments] = useState(false);
  const [composeInitial, setComposeInitial] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [userId, setUserId] = useState(null);
  const [customFolders, setCustomFolders] = useState([]);
  // Proveedores de la boda activa para detección de respuestas
  const { activeWedding } = useWedding();
  const { data: providers } = useWeddingCollection('suppliers', activeWedding, []);

  const [activeCustomFolder, setActiveCustomFolder] = useState(null); // id carpeta
  const [activeTagId, setActiveTagId] = useState(null); // filtro etiqueta
  const [allTags, setAllTags] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Helper local para marcar como NO leído en backend
  const markAsUnreadApi = async (id) => {
    try {
      await markAsUnread(id);
    } catch (_) { /* fallback local ya aplicado en UI */ }
  };
  const fetchEmails = useCallback(async () => {
    if (!myEmail) return;
    setLoading(true);
    setError(null);
    try {
      const fetchFolder = activeCustomFolder || activeTagId ? "all" : (folder === "sent" ? "sent" : "inbox");
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
      console.error("Error cargando correos:", err);
      setError("No se pudieron cargar los correos");
    } finally {
      setLoading(false);
    }
  }, [myEmail, folder, activeCustomFolder, activeTagId]);

  const loadMore = useCallback(async () => {
    try {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const fetchFolder = (folder === "sent" ? "sent" : "inbox");
      const page = await getMailsPage(fetchFolder, { limit: 50, cursor: nextCursor });
      const newItems = Array.isArray(page.items) ? page.items : [];
      setEmails(prev => {
        const byId = new Map(prev.map(m => [m.id, m]));
        for (const m of newItems) { if (!byId.has(m.id)) byId.set(m.id, m); }
        return Array.from(byId.values()).sort((a,b)=> new Date(b.date||0)-new Date(a.date||0));
      });
      setNextCursor(page.nextCursor || null);
      setHasMore(Boolean(page.nextCursor));
    } catch (e) {
      console.warn('loadMore failed', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextCursor, folder]);

  // Detectar respuestas de proveedores
  useEffect(() => {
    try {
      if (!emails || emails.length === 0) return;
      if (!providers || providers.length === 0) return;

      const processedKey = 'lovenda_provider_response_checked';
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
        try { window.dispatchEvent(new Event('lovenda-tracking-updated')); } catch {}
      }
    } catch (e) {
      console.warn('UnifiedEmail: error detectando respuesta de proveedor', e);
    }
  }, [emails, providers]);
  // Obtener email del usuario
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const username = await getCurrentUsername();
      let resolvedEmail;

      if (username) {
        resolvedEmail = `${username}@mywed360.com`;
        await initEmailService({
          uid: user.uid,
          emailUsername: username,
          myWed360Email: resolvedEmail,
          email: user.email,
        });
      } else {
        resolvedEmail = user.email;
        await initEmailService({
          uid: user.uid,
          email: user.email,
        });
      }

      setUserId(user.uid);
      setMyEmail(resolvedEmail);
    });
    return () => unsub();
  }, []);

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
      console.warn('No se pudieron cargar carpetas personalizadas', e);
    }
  }, [userId]);

  // Cargar etiquetas
  useEffect(() => {
    if (!userId) return;
    try {
      const tags = getUserTags(userId);
      setAllTags(tags);
    } catch (e) {
      console.warn('No se pudieron cargar etiquetas', e);
    }
  }, [userId]);
  const handleMarkRead = async (mail) => {
    try {
      await markAsRead(mail.id);
      setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
      setSelected(prev => prev ? { ...prev, read: true } : prev);
    } catch (err) {
      console.error('Error marcando leído:', err);
      alert('No se pudo marcar como leído');
    }
  };

  const handleDelete = async (mail) => {
    try {
      await deleteMail(mail.id);
      setEmails(prev => prev.filter(m => m.id !== mail.id));
      setSelected(null);
    } catch (err) {
      console.error('Error eliminando correo:', err);
      alert('No se pudo eliminar el correo');
    }
  };
  async function handleToggleRead(mail) {
    try {
      if (!mail.read) {
        await handleMarkRead(mail);
      } else {
        try { await markAsUnreadApi(mail.id); } catch {}
        setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, read: false } : m));
        setSelected(prev => prev && prev.id === mail.id ? { ...prev, read: false } : prev);
      }
    } catch (e) {
      console.warn("Error alternando leído", e);
    }
  };

  const handleMoveToFolder = async (mail, folderId) => {
    try {
      if (!userId || !mail?.id || !folderId) return;
      const ok = assignEmailToFolder(userId, mail.id, folderId);
      if (ok) {
        console.log("Correo movido a carpeta");
      }
      // Best-effort: reflejar en backend
      try {
        // Persistir como carpeta personalizada en backend para excluir de inbox
        await setFolder(mail.id, `custom:${folderId}`);
      } catch {}
    } catch (e) {
      console.error("Error moviendo correo a carpeta", e);
    }
  };

  // Filtro local por búsqueda y chips
  const filteredEmails = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = emails
      .filter((m) => (onlyUnread ? !m.read : true))
      .filter((m) => (onlyWithAttachments ? (Array.isArray(m.attachments) && m.attachments.length > 0) : true))
      .filter((m) => {
        if (!q) return true;
        const haystack = `${m.subject || ''} ${m.body || ''} ${m.from || m.sender || ''}`.toLowerCase();
        return haystack.includes(q);
      });

    if (activeCustomFolder && userId) {
      try {
        const ids = new Set(getEmailsInFolder(userId, activeCustomFolder));
        base = base.filter(m => ids.has(m.id));
      } catch {}
    }

    if (activeTagId && userId) {
      try {
        const ids = new Set(getEmailsByTag(userId, activeTagId));
        base = base.filter(m => ids.has(m.id));
      } catch {}
    }

    return base.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [emails, search, onlyUnread, onlyWithAttachments, activeCustomFolder, activeTagId, userId]);
  return (
    <div className="flex h-full w-full flex-col">
      {/* Wizard para elegir nombre si es la primera vez */}
      <UsernameWizard />
      {/* Búsqueda y filtros rápidos */}
      <div className="flex flex-col gap-2 border-b bg-gray-50/50 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <ChipToggle active={onlyUnread} onClick={() => setOnlyUnread(v => !v)} label="No leído" />
          <ChipToggle active={onlyWithAttachments} onClick={() => setOnlyWithAttachments(v => !v)} label="Con adjuntos" />
        </div>
        <div className="relative w-full md:w-96">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar asunto, remitente o texto"
            className="w-full rounded border px-3 py-2 text-sm pr-8"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">??</span>
        </div>
        {/* Filtro por etiqueta */}
        <div className="flex items-center gap-2">
          <select
            value={activeTagId || ''}
            onChange={(e) => setActiveTagId(e.target.value || null)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todas las etiquetas</option>
            {allTags.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Button
            variant="ghost"
            onClick={() => { try { const name = prompt('Nombre del tag'); if (!name) return; createTag(userId||'', name); setAllTags(getUserTags(userId||'')); } catch(_){} }}
          >
            Nuevo tag
          </Button>
        </div>
      </div>

      {/* Barra superior */}
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">Buzón</h1>
        <Button variant="primary" onClick={() => setShowCompose(true)}>
          Redactar
        </Button>
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-64 border-r bg-gray-50 p-4">
          <nav className="space-y-2">
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "inbox" && !activeCustomFolder
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => { setFolder("inbox"); setActiveCustomFolder(null); setActiveTagId(null);} }
            >
              Recibidos
            </button>
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "sent" && !activeCustomFolder
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => { setFolder("sent"); setActiveCustomFolder(null); setActiveTagId(null);} }
            >
              Enviados
            </button>

            {/* Carpetas personalizadas */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Carpetas</span>
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => { try { const name = prompt('Nombre de la carpeta'); if (!name) return; createFolder(userId||'', name); setCustomFolders(getUserFolders(userId||'')); } catch(_){} }}
                >
                  Nueva
                </button>
              </div>
              <div className="space-y-1">
                {customFolders.map(f => (
                  <div key={f.id} className={`flex items-center justify-between rounded px-2 py-1 text-sm ${activeCustomFolder === f.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    <button className="flex-1 text-left" onClick={() => { setActiveCustomFolder(f.id); setFolder('inbox'); }}>
                      {f.name}
                    </button>
                    <div className="ml-2 flex items-center gap-1 text-xs text-gray-500">
                      <button title="Renombrar" onClick={() => { try { const nn = prompt('Nuevo nombre', f.name); if (!nn) return; renameFolder(userId||'', f.id, nn); setCustomFolders(getUserFolders(userId||'')); } catch(_){} }}>??</button>
                      <button title="Eliminar" onClick={() => { try { if (!confirm('Â¿Eliminar carpeta?')) return; deleteFolder(userId||'', f.id); setCustomFolders(getUserFolders(userId||'')); if (activeCustomFolder===f.id) setActiveCustomFolder(null); } catch(_){} }}>???</button>
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
          <div className="flex items-center justify-between p-2 border-b bg-white text-xs">
            <div className="text-gray-600">Seleccionados: {selectedIds.size}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => {
                setSelectedIds(new Set(filteredEmails.map(m => m.id)));
              }}>Seleccionar todo</Button>
              <Button variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpiar</Button>
              <Button variant="ghost" onClick={async () => {
                const ids = Array.from(selectedIds);
                for (const id of ids) {
                  try { await markAsRead(id); } catch {}
                }
                setEmails(prev => prev.map(m => selectedIds.has(m.id) ? { ...m, read: true } : m));
                setSelectedIds(new Set());
              }}>Marcar leído</Button>
              <Button variant="ghost" onClick={async () => {
                const ids = Array.from(selectedIds);
                for (const id of ids) {
                  try { await deleteMail(id); } catch {}
                }
                setEmails(prev => prev.filter(m => !selectedIds.has(m.id)));
                setSelectedIds(new Set());
              }}>Borrar</Button>
            </div>
          </div>
          <MailListComponent
            emails={filteredEmails}
            onSelect={setSelected}
            selected={selected}
            loading={loading}
            emptyMessage={search || onlyUnread || onlyWithAttachments ? 'No hay correos que coincidan' : 'No hay correos'}
            onToggleRead={handleToggleRead}
            onDelete={handleDelete}
            folders={customFolders}
            userId={userId}
            onMoveToFolder={handleMoveToFolder}
            selectedIds={selectedIds}
            onToggleSelect={(id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
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
              onCompose={(initial) => { setComposeInitial(initial); setShowCompose(true); }}
              folders={customFolders}
              onMoveToFolder={handleMoveToFolder}
              userId={userId}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Selecciona un correo para verlo aquí
            </div>
          )}
        </main>
      </div>

      {/* Modal de redactar */}
      {showCompose && (
        <EmailComposeModal onClose={() => setShowCompose(false)} from={myEmail} userId={userId} initial={composeInitial || {}} />
      )}
    </div>
  );
};
/**
 * Lista lateral de correos sencillos.
 */
const MailList = ({ emails, onSelect, selected, loading = false, emptyMessage = 'No hay correos', onToggleRead = () => {}, onDelete = () => {}, folders = [], onMoveToFolder = () => {}, userId = null, selectedIds = new Set(), onToggleSelect = () => {}, hasMore = false, loadingMore = false, onLoadMore = null }) => {
  const [visible, setVisible] = useState(30);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [tick, setTick] = useState(0);
  const bottomRef = useRef(null);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener('lovenda-email-tags', h);
    return () => window.removeEventListener('lovenda-email-tags', h);
  }, []);

  useEffect(() => {
    if (!hasMore || typeof onLoadMore !== 'function') return;
    const el = bottomRef.current;
    if (!el) return;
    let pending = false;
    const io = new IntersectionObserver((entries) => {
      const e = entries && entries[0];
      if (e && e.isIntersecting && !pending) {
        pending = true;
        Promise.resolve(onLoadMore()).finally(() => { pending = false; });
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => { try { io.disconnect(); } catch {} };
  }, [hasMore, onLoadMore]);

  const dateGroupLabel = (d) => {
    if (!d) return 'Sin fecha';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Sin fecha';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = startOfToday - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7 && diffDays > 1) return 'Esta semana';
    return dt.toLocaleDateString();
  };

  const renderSkeleton = (i) => (
    <div key={`sk-${i}`} className="border-b p-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-3 w-3/5 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-4/5 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );

  const items = loading && emails.length === 0
    ? Array.from({ length: 8 }).map((_, i) => renderSkeleton(i))
    : emails.map((mail, idx) => (
        <div key={`wrap-${mail.id}`}>
          {(idx === 0 || dateGroupLabel(emails[idx-1].date) !== dateGroupLabel(mail.date)) && (
            <div key={`hdr-${dateGroupLabel(mail.date)}-${idx}`} className="bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
              {dateGroupLabel(mail.date)}
            </div>
          )}
          <div
            key={mail.id}
            className={`group relative cursor-pointer border-b p-3 hover:bg-gray-50 ${selected?.id === mail.id ? 'bg-blue-50' : ''}`}
            onClick={() => onSelect(mail)}
          >
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={selectedIds.has(mail.id)} onChange={(e)=>{ e.stopPropagation(); onToggleSelect(mail.id); }} />
              <Avatar email={mail.from || mail.sender} unread={!mail.read} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className={`truncate ${!mail.read ? 'font-semibold' : ''}`}>{mail.subject || '(Sin asunto)'}</div>
                  <div className="shrink-0 text-xs text-gray-500">{formatDateShort(mail.date)}</div>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span className="truncate">{mail.sender || mail.from}</span>
                  {Array.isArray(mail.attachments) && mail.attachments.length > 0 && <span title="Adjuntos">??</span>}
                </div>
                {/* Estado de entrega/lectura */}
                <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                  {(() => {
                    try {
                      const failed = Boolean(mail.failedAt || (mail.lastEvent && String(mail.lastEvent).toLowerCase()==='failed'));
                      const delivered = Boolean(mail.deliveredAt || (mail.lastEvent && String(mail.lastEvent).toLowerCase()==='delivered'));
                      const openCount = Number(mail.openCount || 0);
                      const clickCount = Number(mail.clickCount || 0);
                      const badges = [];
                      if (failed) badges.push(<span key="b-f" className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 border border-red-200">Fallo</span>);
                      if (delivered && !failed) badges.push(<span key="b-d" className="rounded bg-green-50 px-1.5 py-0.5 text-green-700 border border-green-200">Entregado</span>);
                      if (openCount>0) badges.push(<span key="b-o" className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 border border-blue-200">Abierto {openCount}</span>);
                      if (clickCount>0) badges.push(<span key="b-c" className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 border border-purple-200">Clicks {clickCount}</span>);
                      return badges.length ? badges : null;
                    } catch { return null; }
                  })()}
                </div>
                {(() => {
                  const tds = userId ? getEmailTagsDetails(userId, mail.id) : [];
                  return tds && tds.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tds.slice(0,3).map(t => (
                        <span key={t.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">#{t.name}</span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            {/* Acciones rápidas al hover, dentro del item (scope correcto) */}
            <div className="absolute right-2 top-2 hidden gap-1 sm:flex sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
              <button title={mail.read ? 'Marcar No leído' : 'Marcar leído'} onClick={(e)=>{e.stopPropagation(); onToggleRead(mail);}} className="rounded border bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50">{mail.read ? 'No leído' : 'Leer'}</button>
              <button title="Eliminar" onClick={(e)=>{e.stopPropagation(); onDelete(mail);}} className="rounded border bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">Borrar</button>
            </div>
            {/* Menú móvil */}
            {menuOpenId === mail.id && (
              <div className="absolute right-2 top-8 z-10 w-32 rounded border bg-white shadow">
                <button className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(null); onToggleRead(mail); }}>{mail.read ? 'Marcar No leído' : 'Marcar leído'}</button>
                {folders.length > 0 && (
                  <div className="border-t">
                    {folders.map((f) => (
                      <button key={f.id} className="block w-full px-3 py-2 text-left text-xs hover:bg-gray-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(null); onMoveToFolder(mail, f.id); }}>Mover a: {f.name}</button>
                    ))}
                  </div>
                )}
                <button className="block w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50" onClick={(e)=>{ e.stopPropagation(); setMenuOpenId(null); onDelete(mail); }}>Borrar</button>
              </div>
            )}
          </div>
        </div>
      ));

  return (
    <div className="h-full overflow-y-auto">
      {items.length > 0 ? items : (
        <div className="p-4 text-sm text-gray-500">{emptyMessage}</div>
      )}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
/**
 * Visor del correo seleccionado
 */
const MailViewer = ({ mail, onMarkRead, onDelete, onCompose, folders = [], onMoveToFolder = () => {}, userId = null }) => {
  const replyInitial = () => ({
    to: mail.from || mail.sender || '',
    subject: mail.subject ? `Re: ${mail.subject}` : 'Re: (Sin asunto)',
    body: `\n\n----- Mensaje original -----\n${(mail.body || '').toString()}`,
  });
  const forwardInitial = () => ({
    to: '',
    subject: mail.subject ? `Fwd: ${mail.subject}` : 'Fwd: (Sin asunto)',
    body: `\n\n----- Mensaje reenviado -----\n${(mail.body || '').toString()}`,
  });
  const downloadAttachment = async (att, i = 0) => {
    try {
      let url = att && (att.url || att.link);
      const name = (att && (att.filename || att.name)) || `adjunto-${i+1}`;
      if (!url && att && att.file) url = URL.createObjectURL(att.file);
      if (!url) return;

      // Si es un endpoint del backend, intentar URL firmada desde Storage primero
      const isApi = typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/mail/'));
      if (isApi) {
        try {
          const base = (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_BASE_URL) || '';
          const toFull = (path) => (path.startsWith('http') ? path : (base ? `${base}${path.startsWith('/') ? '' : '/'}${path}` : path));
          // Derivar endpoint /url
          let urlInfo = url;
          // si coincide /api/mail/{id}/attachments/{attId}
          const m = url.match(/^(.*\/api\/mail\/[^/]+\/attachments\/[^/]+)(?:\/?|$)/);
          if (m) {
            const signedEndpoint = `${m[1]}/url`;
            const token = auth && auth.currentUser && auth.currentUser.getIdToken ? await auth.currentUser.getIdToken() : null;
            const resSigned = await fetch(toFull(signedEndpoint), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (resSigned.ok) {
              const json = await resSigned.json();
              if (json && json.url) {
                const a = document.createElement('a');
                a.href = json.url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { try { a.remove(); } catch {} }, 0);
                return;
              }
            }
          }
          // Fallback: descarga autenticada vía proxy binario
          {
            const full = toFull(urlInfo);
            const token = auth && auth.currentUser && auth.currentUser.getIdToken ? await auth.currentUser.getIdToken() : null;
            const res = await fetch(full, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              try { a.remove(); } catch {}
              try { URL.revokeObjectURL(blobUrl); } catch {}
            }, 0);
            return;
          }
        } catch (fetchErr) {
          console.error('Descarga autenticada falló', fetchErr);
        }
      }

      // Fallback: abrir URL directa
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { a.remove(); } catch {}
        if (att && att.file && url && url.startsWith('blob:')) {
          try { URL.revokeObjectURL(url); } catch {}
        }
      }, 0);
    } catch (e) {
      console.error('No se pudo descargar adjunto', e);
    }
  };
  const handleMark = () => { onMarkRead(mail); };
  const handleDelete = () => {
    if (onDelete && window.confirm("Â¿Borrar este correo?")) {
      onDelete(mail);
    }
  };

  return (
    <div className="prose max-w-none">
      {/* Encabezado con acciones */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="m-0">{mail.subject || "(Sin asunto)"}</h2>
        <div className="flex gap-2">
          {folders && folders.length > 0 && (
            <div className="flex items-center gap-2">
              <select className="border rounded px-2 py-1 text-xs" onChange={(e)=>{ const fid=e.target.value; if(fid) onMoveToFolder(mail, fid); }} defaultValue="">
                <option value="">Mover a carpetaâ€¦</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Gestión de etiquetas */}
          <div className="flex items-center gap-1">
            <select className="border rounded px-2 py-1 text-xs" defaultValue="" onChange={async (e)=>{ const tid=e.target.value; if(!tid) return; try { addTagToEmail(userId||'', mail.id, tid); try { await updateMailTags(mail.id, { add: [tid] }); } catch {} window.dispatchEvent(new Event('lovenda-email-tags')); } catch(_){} e.target.value=''; }}>
              <option value="">Añadir etiquetaâ€¦</option>
              {getUserTags(userId||'').map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onCompose && onCompose(replyInitial())}>Responder</Button>
          <Button size="sm" variant="ghost" onClick={() => onCompose && onCompose(forwardInitial())}>Reenviar</Button>
          {!mail.read && (
            <Button size="sm" onClick={handleMark}>Marcar leído</Button>
          )}
          <Button size="sm" variant="danger" onClick={handleDelete}>Borrar</Button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-2">
        De: {mail.sender || mail.from} - Para: {mail.recipient || mail.to}
      </p>
      {/* Mostrar etiquetas asignadas */}
      {(() => { try { const tds = getEmailTagsDetails(userId||'', mail.id); return tds.length ? (
        <div className="mb-3 flex flex-wrap gap-1">
          {tds.map(t => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
              #{t.name}
              <button title="Quitar" onClick={() => { try { removeTagFromEmail(userId||'', mail.id, t.id); window.dispatchEvent(new Event('lovenda-email-tags')); } catch(_){} }}>Ã—</button>
            </span>
          ))}
        </div>
      ) : null; } catch { return null; } })()}

      {Array.isArray(mail.attachments) && mail.attachments.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Adjuntos ({mail.attachments.length})</div>
            <Button size="sm" variant="ghost" onClick={() => { try { mail.attachments.forEach((att, i) => downloadAttachment(att, i)); } catch (e) { console.error('Descarga múltiple falló', e); } }}>Descargar todo</Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mail.attachments.map((att, i) => (
              <button key={(att.id||att.filename||att.name||'att')+i} onClick={() => downloadAttachment(att, i)} className="rounded border p-2 text-left hover:bg-gray-50">
                <div className="text-xs text-gray-500 truncate">{att.filename || att.name || `Adjunto ${i+1}`}</div>
                <div className="text-[11px] text-blue-600">Descargar</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(mail.body || "Sin contenido.") }}
      />

      <EmailInsights mailId={mail.id} userId={userId} email={mail} />
    </div>
  );
};
/**
 * Modal para redactar y enviar correos
 */
const ComposeModal = ({ onClose, from, initial = {}, userId = null }) => {
  const [to, setTo] = useState(initial.to || "");
  const [subject, setSubject] = useState(initial.subject || "");
  const [body, setBody] = useState(initial.body || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [attachments, setAttachments] = useState([]); // [{file, filename, size}]

  // Recomendaciones inteligentes de asunto (best-effort local)
  const recService = new EmailRecommendationService();
  const [subjectSuggestions, setSubjectSuggestions] = useState([]);
  useEffect(() => {
    try {
      const recs = recService.generateRecommendations();
      const patterns = recs?.subjectLineRecommendations?.recommendedPatterns || [];
      setSubjectSuggestions(patterns.slice(0, 3));
    } catch {}
  }, []);

  const handleFiles = (files) => {
    try {
      const arr = Array.from(files || []).map(f => ({ file: f, filename: f.name, size: f.size }));
      setAttachments(prev => [...prev, ...arr]);
    } catch {}
  };
  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const uploaded = attachments && attachments.length ? await uploadEmailAttachments(attachments.map(a => a.file).filter(Boolean), userId||"anon") : [];
      await sendMail({ to, subject, body, attachments: uploaded.length ? uploaded : attachments });
      onClose();
    } catch (err) {
      console.error("Error enviando correo:", err);
      setError(String(err?.message || err) || "No se pudo enviar el correo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold">Nuevo correo</h2>
        </div>

        <div className="px-6 space-y-4 flex-1 overflow-y-auto">
          <input
            type="email"
            placeholder="Para"
            className="w-full rounded border px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Asunto"
            className="w-full rounded border px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          {subjectSuggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {subjectSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                  onClick={() => setSubject(sug)}
                >{sug}</button>
              ))}
            </div>
          )}
          <textarea
            rows="8"
            placeholder="Escribe tu mensajeâ€¦"
            className="w-full rounded border px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && (
            <Alert variant="error" className="text-sm">
              {error}
            </Alert>
          )}
          {/* Adjuntos */}
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Adjuntos</div>
            <input type="file" multiple onChange={(e)=> handleFiles(e.target.files)} />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <div key={`${a.filename}-${i}`} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
                    <span className="truncate">{a.filename} ({Math.round((a.size||0)/1024)} KB)</span>
                    <button className="text-red-600" onClick={()=> removeAttachment(i)}>Quitar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-6 pt-4 mt-2 border-t flex justify-end gap-2 bg-white sticky bottom-0">
          <Button onClick={onClose} disabled={sending} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !to} variant="primary">
            {sending ? <Spinner size="sm" /> : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedEmail;

// --- UI helpers ---
const formatDateShort = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const now = new Date();
  const sameDay = dt.toDateString() === now.toDateString();
  if (sameDay) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString();
};

// Avatar y ChipToggle se han extraído a componentes reutilizables








