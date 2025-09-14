import { useEffect, useState, useCallback, useMemo } from "react";
import UsernameWizard from "../components/UsernameWizard";
import useEmailUsername from "../hooks/useEmailUsername";
import Button from "../components/ui/Button";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { getMails, initEmailService, markAsRead, deleteMail, sendMail, markAsUnread } from "../services/emailService";
import { detectProviderResponse } from "../services/EmailTrackingService";
import { useWedding } from "../context/WeddingContext";
import useWeddingCollection from "../hooks/useWeddingCollection";
import EmailInsights from "../components/EmailInsights";
import sanitizeHtml from "../utils/sanitizeHtml";
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

  const [userId, setUserId] = useState(null);
  const [customFolders, setCustomFolders] = useState([]);
  // Proveedores de la boda activa para detección de respuestas
  const { activeWedding } = useWedding();
  const { data: providers } = useWeddingCollection('suppliers', activeWedding, []);

  const [activeCustomFolder, setActiveCustomFolder] = useState(null); // id carpeta
  const [activeTagId, setActiveTagId] = useState(null); // filtro etiqueta
  const [allTags, setAllTags] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const fetchEmails = useCallback(async () => {
    if (!myEmail) return;
    setLoading(true);
    setError(null);
    try {
      const fetchFolder = activeCustomFolder || activeTagId ? "all" : (folder === "sent" ? "sent" : "inbox");
      const mails = await getMails(fetchFolder);
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
  }, [myEmail, folder, activeCustomFolder, activeTagId]);

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
        try { await markAsUnread(mail.id); } catch {}
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
