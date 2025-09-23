import React, { useState, useEffect, useCallback } from 'react';

import EmailDetail from './EmailDetail';
import EmailList from './EmailList';
import { useAuth } from '../../../hooks/useAuth';
import { useEmailMonitoring } from '../../../hooks/useEmailMonitoring';
import { post as apiPost } from '../../../services/apiClient';
import EmailService, { setAuthContext } from '../../../services/emailService';
import EmailComposer from '../EmailComposer';
// (duplicated import removed)

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
    setAuthContext(authContext);
  }, [authContext]);

  // Estados para datos de emails
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folder, setFolder] = useState('inbox'); // 'inbox' | 'sent'
  const [inboxCounts, setInboxCounts] = useState({ total: 0, unread: 0 });
  const [sentCounts, setSentCounts] = useState({ total: 0, unread: 0 });
  const [analyzing, setAnalyzing] = useState(false);

  // Cargar emails al montar el componente
  const refreshEmails = useCallback(async (targetFolder = folder) => {
    try {
      setLoading(true);
      const res = await EmailService.getMails(targetFolder);

      if (Array.isArray(res)) {
        setEmails(res);
        setError(null);
      } else if (res && typeof res === 'object') {
        // El servicio devolviÃ³ un objeto con error o estructura inesperada
        console.warn('EmailService devolviÃ³ estructura no esperada:', res);
        setEmails([]);
        setError(res.error || 'No se pudieron cargar los emails');
      } else {
        // Valor totalmente inesperado
        setEmails([]);
        setError('Respuesta de EmailService no vÃ¡lida');
      }
    } catch (err) {
      console.error('Error cargando emails:', err);
      setError('No se pudieron cargar los emails');
    } finally {
      setLoading(false);
    }
  }, [folder]);

  // Contadores por carpeta
  const refreshCounts = useCallback(async () => {
    try {
      const [inboxList, sentList] = await Promise.all([
        EmailService.getMails('inbox').catch(() => []),
        EmailService.getMails('sent').catch(() => []),
      ]);
      const i = Array.isArray(inboxList) ? inboxList : [];
      const s = Array.isArray(sentList) ? sentList : [];
      setInboxCounts({ total: i.length, unread: i.filter((m) => !m.read).length });
      setSentCounts({ total: s.length, unread: s.filter((m) => !m.read).length });
    } catch {}
  }, []);

  // Inicializar EmailService al tener usuario y refrescar lista
  useEffect(() => {
    let cancelled = false;
    const initAndLoad = async () => {
      if (user && user.email) {
        try {
          await EmailService.initEmailService({ email: user.email, ...user });
          if (!cancelled) {
            await Promise.all([refreshEmails(folder), refreshCounts()]);
          }
        } catch (err) {
          console.error('Error inicializando EmailService:', err);
          setError('Error inicializando servicio de email');
        }
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

  // Eliminar email
  const deleteEmail = useCallback(async (emailId) => {
    try {
      await EmailService.deleteMail(emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      try { await refreshCounts(); } catch {}
    } catch (err) {
      console.error('Error eliminando email:', err);
      throw err;
    }
  }, [refreshCounts]);

  // Estados locales
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [composerInitial, setComposerInitial] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, read, unread
  const [viewMode, setViewMode] = useState('list'); // list, detail

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

  const handleEmailDelete = useCallback(
    async (emailId) => {
      try {
        await deleteEmail(emailId);
        if (selectedEmailId === emailId) {
          setSelectedEmailId(null);
          setViewMode('list');
        }
      } catch (error) {
        console.error('Error al eliminar email:', error);
      }
    },
    [deleteEmail, selectedEmailId, safeEmails]
  );

  const handleBackToList = useCallback(() => {
    setSelectedEmailId(null);
    setViewMode('list');
  }, []);

  const handleSendEmail = useCallback(
    async (emailData) => {
      try {
        // âœ… Usar EmailService directamente sin safeRender para evitar Promise rendering
        const result = await EmailService.sendEmail(emailData);

        if (result && result.success) {
          setShowComposer(false);
          await refreshEmails(); // Refrescar lista tras envío\n          try { await refreshCounts(); } catch {}

          // Track operation si estÃ¡ disponible
          if (trackOperation) {
            trackOperation('email_sent', { success: true });
          }
        }
      } catch (error) {
        console.error('Error al enviar email:', error);
        if (trackOperation) {
          trackOperation('email_sent', { success: false, error: error.message });
        }
      }
    },
    [refreshEmails, refreshCounts, trackOperation]
  );

  // Estados de carga y error
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando emails...</p>
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
      <div className="bg-white p-4 border-b shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">{folder === 'inbox' ? 'Recibidos' : 'Enviados'}</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowComposer(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                âœ‰ï¸ Nuevo Email
              </button>
              <button
                onClick={refreshEmails}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Actualizar"
              >
                ðŸ”„
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="unread">No leÃ­dos</option>
              <option value="read">LeÃ­dos</option>
            </select>
          </div>

          {user?.email && (
            <p className="text-sm text-gray-600 mt-2">
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
                      console.log(`[IA] Análisis backend desactivado (VITE_ENABLE_EMAIL_ANALYZE!=1). Usar panel por-email.`);
                    }
                  } catch (e) {
                    console.error('Error analizando correos', e);
                  } finally {
                    setAnalyzing(false);
                  }
                }}
                className={`mt-2 px-3 py-2 text-xs border rounded ${analyzing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                title="Analizar correos (IA) - sólo en desarrollo"
                disabled={analyzing}
              >
                {analyzing ? 'Analizando…' : 'Analizar IA (carpeta actual)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-60 border-r bg-white p-4">
          <nav className="space-y-2">
            <button
              className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === 'inbox' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => { setSelectedEmailId(null); setFolder('inbox'); }}
            >
              <span>Recibidos</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-blue-600 text-white">
                {inboxCounts.unread > 0 ? `${inboxCounts.unread}/${inboxCounts.total}` : inboxCounts.total}
              </span>
            </button>
            <button
              className={`w-full flex items-center justify-between rounded px-3 py-2 text-left text-sm ${
                folder === 'sent' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => { setSelectedEmailId(null); setFolder('sent'); }}
            >
              <span>Enviados</span>
              <span className="text-xs rounded-full px-2 py-0.5 bg-gray-700 text-white">
                {sentCounts.total}
              </span>
            </button>
          </nav>
        </aside>

        {/* Lista y detalle lado a lado */}
        <div className="flex-1 grid grid-cols-2 gap-0">
          <div className="border-r overflow-hidden">
            <EmailList
              emails={filteredEmails}
              onSelectEmail={handleEmailSelect}
              onDeleteEmail={handleEmailDelete}
              selectedEmailId={selectedEmailId}
              loading={loading}
              currentFolder={folder}
            />
          </div>
          <div className="overflow-auto">
            {selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                userId={user?.uid}
                onBack={handleBackToList}
                onDelete={() => handleEmailDelete(selectedEmail.id)}
                onReply={() => {
                  const subj = selectedEmail?.subject ? `Re: ${selectedEmail.subject}` : 'Re:';
                  const to = selectedEmail?.from || '';
                  const quoted = `\n\n---- Mensaje original ----\nDe: ${selectedEmail?.from || ''}\nFecha: ${selectedEmail?.date || ''}\nAsunto: ${selectedEmail?.subject || ''}\n\n${selectedEmail?.body || ''}`;
                  setComposerInitial({ to, subject: subj, body: quoted });
                  setShowComposer(true);
                }}
                onForward={() => {
                  const subj = selectedEmail?.subject ? `Fwd: ${selectedEmail.subject}` : 'Fwd:';
                  const quoted = `\n\n---- Mensaje reenviado ----\nDe: ${selectedEmail?.from || ''}\nFecha: ${selectedEmail?.date || ''}\nAsunto: ${selectedEmail?.subject || ''}\n\n${selectedEmail?.body || ''}`;
                  setComposerInitial({ to: '', subject: subj, body: quoted });
                  setShowComposer(true);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Selecciona un correo para verlo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer modal */}
      {showComposer && (
        <EmailComposer
          onSend={handleSendEmail}
          onClose={() => setShowComposer(false)}
          initialValues={composerInitial}
        />
      )}
    </div>
  );
};

export default InboxContainer;



