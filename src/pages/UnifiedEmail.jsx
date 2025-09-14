import { useEffect, useState, useCallback, useMemo } from "react";
import UsernameWizard from "../components/UsernameWizard";
import useEmailUsername from "../hooks/useEmailUsername";
import Button from "../components/ui/Button";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { getMails, initEmailService, markAsRead, deleteMail, sendMail } from "../services/emailService";
import EmailInsights from "../components/EmailInsights";
import sanitizeHtml from "../utils/sanitizeHtml";
import { getUserFolders, assignEmailToFolder } from "../services/folderService";
import { getEmailTagsDetails, getUserTags, createTag, addTagToEmail } from "../services/tagService";

/**
 * PÃ¡gina principal de Buzón (correo interno @mywed360.com)
 * Incluye: Sidebar de carpetas, lista de correos, visor del correo y modal para redactar.
 * Email backend:
 *  - GET  /getMailgunEvents  -> lista de eventos (funciÃ³n Cloud)
 *  - POST /sendEmail        -> envÃ­a correo (funciÃ³n Cloud)
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

  const [userId, setUserId] = useState(null);
  const [customFolders, setCustomFolders] = useState([]);

  const fetchEmails = useCallback(async () => {
    if (!myEmail) return;
    setLoading(true);
    setError(null);
    try {
      const mails = await getMails(folder === "sent" ? "sent" : "inbox");
      if (Array.isArray(mails)) {
        setEmails(mails);
      } else {
        console.warn("Respuesta inesperada de getMails", mails);
        setEmails([]);
      }
    } catch (err) {
      console.error("Error cargando correos:", err);
      setError("No se pudieron cargar los correos");
    } finally {
      setLoading(false);
    }
  }, [myEmail, folder]);

  // Obtener email del usuario en cuanto Firebase estÃ© listo
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      // 1ï¸âƒ£ Intentamos obtener el nombre de usuario personalizado
      const username = await getCurrentUsername();
      let resolvedEmail;

      if (username) {
        // Caso ideal: el usuario ya tiene nombre configurado â†’ nombre@mywed360.com
        resolvedEmail = `${username}@mywed360.com`;
        await initEmailService({
          uid: user.uid,
          emailUsername: username,
          myWed360Email: resolvedEmail,
          email: user.email,
        });
      } else {
        // Fallback: usamos el email autenticado (ej. foo@gmail.com)
        resolvedEmail = user.email;
        await initEmailService({
          uid: user.uid,
          email: user.email,
        });
      }

      // Guardamos el email resuelto para activar la carga de correos
      setUserId(user.uid);
      setMyEmail(resolvedEmail);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga inicial + polling (se reinicia al cambiar carpeta)
  useEffect(() => {
    if (!myEmail) return;
    fetchEmails();
    const id = setInterval(fetchEmails, 60000);
    return () => clearInterval(id);
  }, [fetchEmails, myEmail, folder]);

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

  const handleMarkRead = async (mail) => {
    try {
      await markAsRead(mail.id);
      // Actualizar lista localmente
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
      // Quitar de lista local
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
        setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, read: false } : m));
        setSelected(prev => prev && prev.id === mail.id ? { ...prev, read: false } : prev);
      }
    } catch (e) {
      console.warn("Error alternando leído", e);
    }
  };

  const handleMoveToFolder = (mail, folderId) => {
    try {
      if (!userId || !mail?.id || !folderId) return;
      const ok = assignEmailToFolder(userId, mail.id, folderId);
      if (ok) {
        console.log("Correo movido a carpeta");
      }
    } catch (e) {
      console.error("Error moviendo correo a carpeta", e);
    }
  };  // Filtro local por bÃºsqueda y chips
  const filteredEmails = useMemo(() => {
    const q = search.trim().toLowerCase();
    return emails
      .filter((m) => (onlyUnread ? !m.read : true))
      .filter((m) => (onlyWithAttachments ? (Array.isArray(m.attachments) && m.attachments.length > 0) : true))
      .filter((m) => {
        if (!q) return true;
        const haystack = `${m.subject || ''} ${m.body || ''} ${m.from || m.sender || ''}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [emails, search, onlyUnread, onlyWithAttachments]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Wizard para elegir nombre si es la primera vez */}
      <UsernameWizard />
      {/* BÃºsqueda y filtros rÃ¡pidos */}
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
        <aside className="w-48 border-r bg-gray-50 p-4">
          <nav className="space-y-2">
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "inbox"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFolder("inbox")}
            >
              ðŸ“¥ Recibidos
            </button>
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "sent"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFolder("sent")}
            >
              ðŸ“¤ Enviados
            </button>
          </nav>
        </aside>

        {/* Lista de correos */}
        <div className="w-80 border-r">
          <MailList
            emails={filteredEmails}
            onSelect={setSelected}
            selected={selected}
            loading={loading}
            emptyMessage={search || onlyUnread || onlyWithAttachments ? 'No hay correos que coincidan' : 'No hay correos'}
            onToggleRead={handleToggleRead}
            onDelete={handleDelete}
            folders={customFolders} userId={userId}
            onMoveToFolder={handleMoveToFolder}
\n            userId={userId}\n          />
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
            <MailViewer
              mail={selected}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onCompose={(initial) => { setComposeInitial(initial); setShowCompose(true); }}
\n              folders={customFolders}\n              onMoveToFolder={handleMoveToFolder}\n              userId={userId}\n            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Selecciona un correo para verlo aquí
            </div>
          )}
        </main>
      </div>

      {/* Modal de redactar */}
      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} from={myEmail} initial={composeInitial || {}} />
      )}
    </div>
  );
};

/**
 * Lista lateral de correos sencillos.
 */
const MailList = ({ emails, onSelect, selected, loading = false, emptyMessage = 'No hay correos', onToggleRead = () => {}, onDelete = () => {}, folders = [], onMoveToFolder = () => {}, userId = null }) => {
  const [visible, setVisible] = useState(30);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener('lovenda-email-tags', h);
    return () => window.removeEventListener('lovenda-email-tags', h);
  }, []);

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
    : emails.slice(0, visible).map((mail, idx) => (
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
              <Avatar email={mail.from || mail.sender} unread={!mail.read} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className={`truncate ${!mail.read ? 'font-semibold' : ''}`}>{mail.subject || '(Sin asunto)'}</div>
                  <div className="shrink-0 text-xs text-gray-500">{formatDateShort(mail.date)}</div>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span className="truncate">{mail.sender || mail.from}</span>
                  {Array.isArray(mail.attachments) && mail.attachments.length > 0 && <span title="Adjuntos">ðŸ“Ž</span>}
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
            {/* Acciones rÃ¡pidas al hover, dentro del item (scope correcto) */}
            <div className="absolute right-2 top-2 hidden gap-1 sm:flex sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover:opacity-100">
              <button title={mail.read ? 'Marcar No leído' : 'Marcar leído'} onClick={(e)=>{e.stopPropagation(); onToggleRead(mail);}} className="rounded border bg-white px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50">{mail.read ? 'No leído' : 'Leer'}</button>
              <button title="Eliminar" onClick={(e)=>{e.stopPropagation(); onDelete(mail);}} className="rounded border bg-white px-2 py-1 text-[11px] text-red-600 hover:bg-red-50">Borrar</button>
            </div>
            {/* MenÃº mÃ³vil */}
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
      {emails.length > visible && (
        <div className="p-3">
          <Button variant="ghost" onClick={() => setVisible(v => v + 30)}>Cargar más</Button>
        </div>
      )}
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
  const downloadAttachment = (att, i = 0) => {
    try {
      let url = att && (att.url || att.link);
      const name = (att && (att.filename || att.name)) || `adjunto-${i+1}`;
      if (!url && att && att.file) url = URL.createObjectURL(att.file);
      if (!url) return;
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
  const handleMark = () => {
    onMarkRead(mail);
  };

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
                <option value="">Mover a carpeta…</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button size="sm" variant="ghost" onClick={() => { try { const name = prompt('Nombre del tag'); if(!name) return; const all = getUserTags(userId||''); let tag = all.find(t => (t.name||'').toLowerCase() === name.toLowerCase()); if(!tag){ try { tag = createTag(userId||'', name); } catch(_){} } if(tag && tag.id){ try { addTagToEmail(userId||'', mail.id, tag.id); window.dispatchEvent(new Event('lovenda-email-tags')); } catch(_){} } } catch(_){} }}>+ Tag</Button>
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
      {Array.isArray(mail.attachments) && mail.attachments.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Adjuntos ({mail.attachments.length})</div>
            <Button size="sm" variant="ghost" onClick={() => { try { mail.attachments.forEach((att, i) => downloadAttachment(att, i)); } catch(e) { console.error('Descarga múltiple falló
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
const ComposeModal = ({ onClose, from, initial = {} }) => {
  const [to, setTo] = useState(initial.to || "");
  const [subject, setSubject] = useState(initial.subject || "");
  const [body, setBody] = useState(initial.body || "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await sendMail({ to, subject, body });
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

const Avatar = ({ email, unread }) => {
  const ch = (email || '?').trim()[0]?.toUpperCase() || '?';
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${unread ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
      <span className="text-xs font-semibold">{ch}</span>
    </div>
  );
};

const ChipToggle = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-2.5 py-1 text-xs ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
  >
    {label}
  </button>
);


















