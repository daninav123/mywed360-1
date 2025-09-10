import React, { useState } from 'react';
import { Cloud, CloudOff } from 'lucide-react';
import Modal from '../components/Modal';
import GuestForm from '../components/guests/GuestForm';
import GuestList from '../components/guests/GuestList';
import GuestFilters from '../components/guests/GuestFilters';
import useGuests from '../hooks/useGuests';
import useTranslations from '../hooks/useTranslations';
import { useWedding } from '../context/WeddingContext';
import { useAuth } from '../hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import ContactsImporter from '../components/guests/ContactsImporter';
import GuestBulkGrid from '../components/guests/GuestBulkGrid';
import { Button } from '../components/ui';
import WhatsAppSender from '../components/whatsapp/WhatsAppSender';
import { toE164, schedule as scheduleWhats } from '../services/whatsappService';
import WhatsAppModal from '../components/whatsapp/WhatsAppModal';

/**
 * Página de gestión de invitados completamente refactorizada
 * Arquitectura modular, optimizada y mantenible
 * 
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Eliminado código legacy (597 líneas → 140 líneas)
 * - Arquitectura modular con componentes especializados
 * - Hook personalizado useGuests para lógica centralizada
 * - Memoización y optimización de re-renders
 * - Integración con sistema i18n
 * - UX mejorada con indicadores de estado
 */
function Invitados() {
  // Estados para modales
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showWhatsModal, setShowWhatsModal] = useState(false);
  const [showWhatsBatch, setShowWhatsBatch] = useState(false);
  const [whatsGuest, setWhatsGuest] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Hooks reales
  const { t } = useTranslations();
  const { currentUser } = useAuth();
  const { weddings, activeWedding } = useWedding();
    
  // Datos provenientes de Firebase mediante hooks
  const {
    guests,
    stats,
    filters,
    syncStatus,
    isLoading,
    addGuest,
    updateGuest,
    removeGuest,
    inviteViaWhatsApp,
    inviteViaWhatsAppApi,
    inviteViaWhatsAppDeeplinkCustom,
    inviteSelectedWhatsAppApi,
    inviteSelectedWhatsAppDeeplink,
    inviteSelectedWhatsAppViaExtension,
    inviteSelectedWhatsAppBroadcastViaExtension,
    inviteViaEmail,
    bulkInviteWhatsApp,
    bulkInviteWhatsAppApi,
    importFromContacts,
    exportToCSV,
    updateFilters,
    utils
  } = useGuests();
                          
  // Manejar apertura de modal para nuevo invitado
  const handleAddGuest = () => {
    setEditingGuest(null);
    setShowGuestModal(true);
  };

  // Manejar apertura de modal para editar invitado
  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setShowGuestModal(true);
  };

  // Manejar guardado de invitado (nuevo o editado)
  const handleSaveGuest = async (guestData) => {
    setIsSaving(true);
    
    try {
      let result;
      if (editingGuest) {
        result = await updateGuest(editingGuest.id, guestData);
      } else {
        result = await addGuest(guestData);
      }
      
      if (result.success) {
        setShowGuestModal(false);
        setEditingGuest(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error guardando invitado:', error);
      alert('Error inesperado al guardar el invitado');
    } finally {
      setIsSaving(false);
    }
  };

  // Difusión (lista de difusión vía extensión)
  const handleSendSelectedBroadcast = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Invitados] handleSendSelectedBroadcast click', { selectedCount: selectedIds.length });
      if (!selectedIds.length) { alert('No hay invitados seleccionados'); return; }
      const custom = window.prompt('Mensaje de difusión (se enviará una sola vez a una lista de difusión). Ten en cuenta que solo lo recibirán quienes tengan tu número guardado en contactos.', '');
      const r = await inviteSelectedWhatsAppBroadcastViaExtension(selectedIds, custom || undefined);
      if (r?.notAvailable) {
        const doFallback = window.confirm('No se detectó la extensión para difusión. ¿Quieres intentar el envío individual (una sola acción) en su lugar?');
        if (doFallback) {
          const rb = await inviteSelectedWhatsAppViaExtension(selectedIds, custom || undefined);
          if (rb?.success && !rb?.notAvailable) {
            alert(`Envío iniciado para ${rb?.count || selectedIds.length} invitado(s).`);
          } else {
            alert('No se pudo iniciar el envío (extensión no disponible).');
          }
        }
        return;
      }
      if (r?.success) {
        if (r?.mode === 'broadcast') alert(`Difusión enviada a ${r?.count || 0} destinatarios.`);
        else if (r?.mode === 'fallback_individual') alert(`Envío individual fallback. Éxitos: ${r?.sent || 0}, Fallos: ${r?.failed || 0}`);
        return;
      }
      alert('No se pudo completar la difusión: ' + (r?.error || 'desconocido'));
    } catch (e) {
      console.warn('Error en difusión (Móvil):', e);
      alert('Error en la difusión');
    }
  };

  // Manejar eliminación de invitado
  const handleDeleteGuest = async (guest) => {
    const result = await removeGuest(guest.id);
    if (!result.success) {
      alert(`Error eliminando invitado: ${result.error}`);
    }
  };

  // Abrir modal de envío masivo WhatsApp
  const openWhatsBatch = () => setShowWhatsBatch(true);
  const closeWhatsBatch = () => setShowWhatsBatch(false);

  // Selección múltiple
  const handleToggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };
  const handleToggleSelectAll = (ids, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) ids.forEach((id) => set.add(id)); else ids.forEach((id) => set.delete(id));
      return Array.from(set);
    });
  };

  // Enviar API a seleccionados
  const handleSendSelectedApi = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Invitados] handleSendSelectedApi click', { selectedCount: selectedIds.length });
      if (!selectedIds.length) {
        alert('No hay invitados seleccionados');
        return;
      }
      const res = await inviteSelectedWhatsAppApi(selectedIds);
      if (import.meta.env.DEV) console.log('[Invitados] handleSendSelectedApi result', res);
      if (res?.cancelled) { alert('Acción cancelada'); return; }
      if (res?.error && !res?.success) { alert('Error enviando a seleccionados: ' + res.error); return; }
      if (res?.success) { alert(`Envío completado. Éxitos: ${res?.ok || 0}, Fallos: ${res?.fail || 0}`); return; }
      alert('No se pudo iniciar el envío por API');
    } catch (e) {
      console.warn('Error envío seleccionados (API):', e);
      alert('Error enviando a seleccionados');
    }
  };

  // Enviar por móvil personal (preferir "una sola acción" vía extensión)
  const handleSendSelectedMobile = async () => {
    try {
      if (import.meta.env.DEV) console.log('[Invitados] handleSendSelectedMobile click', { selectedCount: selectedIds.length });
      if (!selectedIds.length) {
        alert('No hay invitados seleccionados');
        return;
      }
      const custom = window.prompt('Mensaje personalizado (opcional). Si lo dejas en blanco, se usará un mensaje por defecto con enlace RSVP cuando sea posible:', '');
      // 1) Intentar envío en una sola acción usando extensión (WhatsApp Web automation)
      try {
        const r = await inviteSelectedWhatsAppViaExtension(selectedIds, custom || undefined);
        if (r?.success && !r?.notAvailable) {
          alert(`Envío iniciado en WhatsApp Web para ${r?.count || selectedIds.length} invitado(s).`);
          return;
        }
        if (r?.notAvailable) {
          // 2) Fallback opcional: abrir chats en pestañas (no recomendado para >50)
          const doFallback = window.confirm('No se detectó la extensión para enviar en una sola acción. ¿Quieres abrir los chats en pestañas como alternativa?');
          if (doFallback) {
            const fr = await inviteSelectedWhatsAppDeeplink(selectedIds, custom || undefined);
            if (fr?.success) alert(`Se abrieron ${fr?.opened || 0} chats en WhatsApp`);
          }
          return;
        }
        // Si no es success y tampoco es notAvailable, informar del error
        alert('No se pudo iniciar el envío en una sola acción: ' + (r?.error || 'desconocido'));
        return;
      } catch (e) {
        console.warn('Extensión WhatsApp Web no disponible o falló, usando fallback:', e);
        const fr = await inviteSelectedWhatsAppDeeplink(selectedIds, custom || undefined);
        if (fr?.success) alert(`Se abrieron ${fr?.opened || 0} chats en WhatsApp`);
        return;
      }
    } catch (e) {
      console.warn('Error envío seleccionados (Móvil):', e);
      alert('Error enviando a seleccionados (Móvil)');
    }
  };

  // Programar API para seleccionados (simple prompt)
  const handleScheduleSelected = async () => {
    try {
      if (!selectedIds.length) {
        alert('No hay invitados seleccionados');
        return;
      }
      const whenStr = window.prompt('Fecha y hora (local) para programar (YYYY-MM-DD HH:mm):', '2025-09-10 10:00');
      if (!whenStr) return;
      const whenIso = new Date(whenStr.replace(' ', 'T')).toISOString();
      // Construir items: to (E.164), message (con RSVP si es posible)
      const idSet = new Set(selectedIds);
      const targets = (guests || []).filter(g => idSet.has(g.id) && g.phone);
      const items = [];
      for (const g of targets) {
        // Generar enlace RSVP si es posible
        let link = '';
        try {
          const resp = await fetch(`/api/guests/${activeWedding}/id/${g.id}/rsvp-link`, { method: 'POST' });
          if (resp.ok) { const json = await resp.json(); link = json.link; }
        } catch {}
        const msg = link
          ? `¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
          : `¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
        const to = toE164(g.phone);
        if (to) items.push({ to, message: msg, weddingId: activeWedding, guestId: g.id, metadata: { guestName: g.name || '', rsvpFlow: true } });
      }
      if (!items.length) { alert('Los seleccionados no tienen teléfonos válidos'); return; }
      const result = await scheduleWhats(items, whenIso);
      if (result?.success) {
        alert(`Programados ${items.length} envíos para ${whenIso}`);
      } else {
        alert('Error programando envíos: ' + (result?.error || 'desconocido'));
      }
    } catch (e) {
      console.warn('Error programando envíos:', e);
      alert('Error programando envíos');
    }
  };

  // Abrir modal de WhatsApp para un invitado concreto
  const openWhatsModalForGuest = (guest) => {
    try {
      setWhatsGuest(guest || null);
      setShowWhatsModal(true);
    } catch (e) {
      console.warn('No se pudo abrir el modal de WhatsApp:', e);
    }
  };

  const handleCloseWhatsModal = () => {
    setShowWhatsModal(false);
    setWhatsGuest(null);
  };

  // Importar contactos seleccionados
  const handleImportedGuests = async (importedGuests) => {
    try {
      if (!importedGuests || importedGuests.length === 0) return;
      // Deduplicación por email/teléfono
      const existingEmails = new Set((guests || []).map(g => utils.normalize(g?.email || '')));
      const existingPhones = new Set((guests || []).map(g => utils.phoneClean(g?.phone || '')));

      let added = 0;
      let skipped = 0;
      for (const guest of importedGuests) {
        const emailKey = utils.normalize(guest?.email || '');
        const phoneKey = utils.phoneClean(guest?.phone || '');
        if ((emailKey && existingEmails.has(emailKey)) || (phoneKey && existingPhones.has(phoneKey))) {
          skipped++;
          continue;
        }
        await addGuest({
          companionGroupId: guest?.companionGroupId || '',
          ...guest,
        });
        if (emailKey) existingEmails.add(emailKey);
        if (phoneKey) existingPhones.add(phoneKey);
        added++;
      }
      alert(`${added} invitados importados correctamente${skipped ? `, ${skipped} duplicados omitidos` : ''}`);
      setShowGuestModal(false);
    } catch (error) {
      console.error('Error importando invitados:', error);
      alert('Ocurrió un error al importar los invitados');
    }
  };

  // Abrir alta masiva
  const handleOpenBulkAdd = () => setShowBulkModal(true);

  // Guardar alta masiva desde grid
  const handleBulkSave = async (rows) => {
    try {
      if (!rows || rows.length === 0) {
        setShowBulkModal(false);
        return;
      }
      const existingEmails = new Set((guests || []).map(g => utils.normalize(g?.email || '')));
      const existingPhones = new Set((guests || []).map(g => utils.phoneClean(g?.phone || '')));

      let added = 0;
      let skipped = 0;
      for (const r of rows) {
        const emailKey = utils.normalize(r?.email || '');
        const phoneKey = utils.phoneClean(r?.phone || '');
        if ((emailKey && existingEmails.has(emailKey)) || (phoneKey && existingPhones.has(phoneKey))) {
          skipped++;
          continue;
        }
        const payload = {
          name: r?.name || '',
          email: r?.email || '',
          phone: r?.phone || '',
          address: r?.address || '',
          companion: parseInt(r?.companion, 10) || parseInt(r?.companions, 10) || 0,
          companionType: (parseInt(r?.companions, 10) || parseInt(r?.companion, 10) || 0) > 0 ? 'plus_one' : 'none',
          companionGroupId: '',
          table: r?.table || '',
          response: 'Pendiente',
          status: 'pending',
          dietaryRestrictions: r?.dietaryRestrictions || '',
          notes: r?.notes || 'Alta masiva',
        };
        await addGuest(payload);
        if (emailKey) existingEmails.add(emailKey);
        if (phoneKey) existingPhones.add(phoneKey);
        added++;
      }
      alert(`${added} invitados añadidos${skipped ? `, ${skipped} duplicados omitidos` : ''}`);
      setShowBulkModal(false);
    } catch (err) {
      console.error('Error en alta masiva:', err);
      alert('Ocurrió un error al procesar la alta masiva');
    }
  };

  const handleCancelBulkModal = () => setShowBulkModal(false);

  // Abrir/cerrar resumen RSVP
  const handleOpenRsvpSummary = () => setShowRsvpModal(true);
  const handleCloseRsvpSummary = () => setShowRsvpModal(false);

  // Imprimir PDF simple (nombre completo y mesa) para confirmados
  const handlePrintRsvpPdf = () => {
    try {
      const confirmedGuests = (guests || [])
        .filter(g => g.status === 'confirmed' || g.response === 'Sí')
        .map(g => ({ name: g.name || '', table: g.table || '' }));

      // Ordenar por mesa y nombre
      confirmedGuests.sort((a, b) => {
        const ta = String(a.table || '').toLowerCase();
        const tb = String(b.table || '').toLowerCase();
        if (ta === tb) return (a.name || '').localeCompare(b.name || '');
        return ta.localeCompare(tb);
      });

      const win = window.open('', '_blank');
      if (!win) return;
      const title = 'Listado confirmados - Nombre y Mesa';
      const date = new Date().toLocaleString();

      const rowsHtml = confirmedGuests.map((g, idx) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${idx + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${g.name}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align:center;">${g.table || '-'}</td>
        </tr>
      `).join('');

      const html = `<!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <style>
              body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111827; }
              h1 { font-size: 18px; margin: 0; }
              .sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
              thead th { text-align: left; border-bottom: 2px solid #111827; padding: 6px 8px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div style="display:flex; justify-content: space-between; align-items: baseline;">
              <div>
                <h1>${title}</h1>
                <div class="sub">Generado: ${date}</div>
              </div>
              <div class="no-print">
                <button onclick="window.print()" style="padding:6px 10px; border:1px solid #e5e7eb; background:#fff; cursor:pointer;">Imprimir / Guardar PDF</button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre completo</th>
                  <th style="text-align:center;">Mesa</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
      // Opcional: lanzar print automático tras cargar
      win.onload = () => {
        try { win.print(); } catch (_) {}
      };
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('No se pudo generar el documento de impresión');
    }
  };

  // Manejar cancelación de modal
  const handleCancelModal = () => {
    setShowGuestModal(false);
    setEditingGuest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con indicador de sincronización */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('guests.guestList')}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tu lista de invitados de forma eficiente
            </p>
          </div>
          
          {/* Indicador de sincronización */}
          <div className="flex items-center space-x-2">
            {syncStatus?.isOnline ? (
              <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Cloud size={16} className="mr-2" />
                <span className="text-sm font-medium">Sincronizado</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                <CloudOff size={16} className="mr-2" />
                <span className="text-sm font-medium">Sin conexión</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtros y acciones */}
        <GuestFilters
          searchTerm={filters?.search || ''}
          statusFilter={filters?.status || ''}
          tableFilter={filters?.table || ''}
          onSearchChange={(value) => updateFilters({ search: value })}
          onStatusFilterChange={(value) => updateFilters({ status: value })}
          onTableFilterChange={(value) => updateFilters({ table: value })}
          onAddGuest={handleAddGuest}
          onBulkInvite={bulkInviteWhatsApp}
          onImportGuests={importFromContacts}
          onBulkAddGuests={handleOpenBulkAdd}
          onExportGuests={exportToCSV}
          onOpenRsvpSummary={handleOpenRsvpSummary}
          guestCount={(guests?.length) || 0}
          isLoading={isLoading}
          selectedCount={selectedIds.length}
          onSendSelectedApi={handleSendSelectedApi}
          onSendSelectedMobile={handleSendSelectedMobile}
          onSendSelectedBroadcast={handleSendSelectedBroadcast}
          onScheduleSelected={handleScheduleSelected}
          />

        {/* Botón envío masivo WhatsApp */}
        <div className="flex justify-end">
          <Button onClick={openWhatsBatch}>WhatsApp masivo</Button>
        </div>

        {/* Debug info para verificar estado */}
        {import.meta.env.DEV && (
          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <strong>Debug Info:</strong><br/>
            - activeWedding: {activeWedding || 'null'}<br/>
            - weddings count: {weddings?.length || 0}<br/>
            - guests count: {guests?.length || 0}<br/>
            - isLoading: {isLoading ? 'true' : 'false'}<br/>
            - Firebase Auth: {window.auth?.currentUser?.email || 'No autenticado'}<br/>
            - Usuario Context: {currentUser ? JSON.stringify({uid: currentUser.uid, email: currentUser.email}) : 'null'}<br/>
            - Ruta Firestore: weddings/{activeWedding || 'null'}/guests<br/>
            <button 
              onClick={() => {
                import('../firebaseConfig').then(({ auth }) => {
                  import('firebase/auth').then(({ signInWithEmailAndPassword }) => {
                    signInWithEmailAndPassword(auth, 'danielnavarrocampos@icloud.com', 'password123')
                      .then(() => console.log('Login manual exitoso'))
                      .catch(err => console.error('Login manual falló:', err));
                  });
                });
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Login Manual
            </button>
          </div>
        )}

        {/* Fallback temporal: sin bodas visibles para el usuario */}
        {(!isLoading && Array.isArray(weddings) && weddings.length === 0) && (
          <div className="text-sm text-gray-600">
            {activeWedding
              ? 'No se encontraron bodas asociadas a tu cuenta o no tienes permisos sobre la boda activa. Si el problema persiste, recarga la página o contacta con soporte.'
              : 'No se encontraron bodas asociadas a tu cuenta. Crea o selecciona una boda para gestionar invitados.'}
          </div>
        )}

        {/* Lista de invitados */}
        <GuestList
          guests={guests || []}
          searchTerm={filters?.search || ''}
          statusFilter={filters?.status || ''}
          tableFilter={filters?.table || ''}
          onEdit={handleEditGuest}
          onDelete={handleDeleteGuest}
          onInviteWhatsApp={openWhatsModalForGuest}
          onInviteEmail={inviteViaEmail}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
        />

        {/* Modal de formulario de invitado */}
        <Modal
          open={showGuestModal}
          onClose={handleCancelModal}
          title={editingGuest ? 'Editar Invitado' : 'Añadir Invitado'}
          size="lg"
        >
          {editingGuest ? (
            <GuestForm
              guest={editingGuest}
              onSave={handleSaveGuest}
              onCancel={handleCancelModal}
              isLoading={isSaving}
            />
          ) : (
            <Tabs defaultValue="manual">
              <TabsList className="flex space-x-6 border-b mb-4">
                <TabsTrigger value="manual" className="pb-2">Manual</TabsTrigger>
                <TabsTrigger value="import" className="pb-2">Desde contactos</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <GuestForm
                  guest={null}
                  onSave={handleSaveGuest}
                  onCancel={handleCancelModal}
                  isLoading={isSaving}
                />
              </TabsContent>
              <TabsContent value="import" className="pt-2">
                <ContactsImporter onImported={handleImportedGuests} />
                <p className="text-xs text-gray-500 mt-3">
                  Selecciona los contactos de tu agenda y se añadirán como invitados.
                </p>
              </TabsContent>
            </Tabs>
          )}
        </Modal>

        {/* Modal de alta masiva */}
        <Modal
          open={showBulkModal}
          onClose={handleCancelBulkModal}
          title="Alta masiva de invitados"
          size="lg"
        >
          <GuestBulkGrid
            onCancel={handleCancelBulkModal}
            onSave={handleBulkSave}
            isLoading={isSaving}
          />
        </Modal>

        {/* Modal Resumen RSVP */}
        <Modal
          open={showRsvpModal}
          onClose={handleCloseRsvpSummary}
          title="Resumen RSVP"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{stats?.total || 0}</div>
                <div className="text-sm text-gray-600">Total invitados</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
                <div className="text-sm text-gray-600">Confirmados</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{stats?.declined || 0}</div>
                <div className="text-sm text-gray-600">Rechazados</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="px-4 py-3 border-b font-medium">Confirmados (Nombre y Mesa)</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-center">Mesa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(guests || [])
                      .filter(g => g.status === 'confirmed' || g.response === 'Sí')
                      .sort((a, b) => String(a.table || '').localeCompare(String(b.table || '')) || String(a.name || '').localeCompare(String(b.name || '')))
                      .map(g => (
                        <tr key={g.id} className="border-t">
                          <td className="px-3 py-2">{g.name}</td>
                          <td className="px-3 py-2 text-center">{g.table || '-'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseRsvpSummary}>Cerrar</Button>
              <Button onClick={handlePrintRsvpPdf}>Imprimir / PDF</Button>
            </div>
          </div>
        </Modal>

        {/* Modal envío masivo WhatsApp */}
        <WhatsAppSender
          open={showWhatsBatch}
          onClose={closeWhatsBatch}
          guests={guests || []}
          weddingId={activeWedding}
          onBatchCreated={(res)=>{
            alert(`Lote creado con ${res.items?.length || 0} mensajes`);
          }}
        />

        {/* Modal WhatsApp con dos pestañas (móvil personal / API) */}
        <WhatsAppModal
          open={showWhatsModal}
          onClose={handleCloseWhatsModal}
          guest={whatsGuest}
          defaultMessage={whatsGuest ? `¡Hola ${whatsGuest.name || ''}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?` : ''}
          onSendDeeplink={async (g, msg) => {
            try { await inviteViaWhatsAppDeeplinkCustom(g, msg); } catch {}
          }}
          onSendApi={async (g, msg) => {
            try {
              const r = await inviteViaWhatsAppApi(g, msg);
              if (r?.success) setShowWhatsModal(false);
            } catch {}
          }}
          onSendApiBulk={async () => {
            try { await bulkInviteWhatsAppApi(); } catch {}
          }}
        />
      </div>
    </div>
  );
}

export default Invitados;
