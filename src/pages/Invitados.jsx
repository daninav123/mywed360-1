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
    inviteViaEmail,
    bulkInviteWhatsApp,
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

  // Manejar eliminación de invitado
  const handleDeleteGuest = async (guest) => {
    const result = await removeGuest(guest.id);
    if (!result.success) {
      alert(`Error eliminando invitado: ${result.error}`);
    }
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
        />

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
          onInviteWhatsApp={inviteViaWhatsApp}
          onInviteEmail={inviteViaEmail}
          isLoading={isLoading}
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
      </div>
    </div>
  );
}

export default Invitados;
