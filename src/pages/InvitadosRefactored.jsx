import { Cloud, CloudOff } from 'lucide-react';
import React, { useState } from 'react';

import GuestBulkGrid from '../components/guests/GuestBulkGrid';
import GuestFilters from '../components/guests/GuestFilters';
import GuestForm from '../components/guests/GuestForm';
import GuestList from '../components/guests/GuestList';
import Modal from '../components/Modal';
import useGuests from '../hooks/useGuests';
import useTranslations from '../hooks/useTranslations';

/**
 * Página de gestión de invitados completamente refactorizada
 * Arquitectura modular, optimizada y mantenible
 */
const InvitadosRefactored = () => {
  const { t } = useTranslations();

  // Hook personalizado para gestión de invitados
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
  } = useGuests();

  // Estados para modales
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

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

  // Manejar cancelación de modal
  const handleCancelModal = () => {
    setShowGuestModal(false);
    setEditingGuest(null);
  };

  // Alta masiva
  const handleBulkAdd = () => {
    setShowBulkModal(true);
  };

  const handleSaveBulk = async (guestRows) => {
    setIsBulkSaving(true);
    try {
      for (const row of guestRows) {
        await addGuest(row);
      }
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error guardando invitados masivos:', error);
      alert('Error inesperado al guardar invitados masivos');
    } finally {
      setIsBulkSaving(false);
    }
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
            <p className="text-gray-600 mt-1">Gestiona tu lista de invitados de forma eficiente</p>
          </div>

          {/* Indicador de sincronización */}
          <div className="flex items-center space-x-2">
            {syncStatus.isOnline ? (
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
          searchTerm={filters.search}
          statusFilter={filters.status}
          tableFilter={filters.table}
          onSearchChange={(value) => updateFilters({ search: value })}
          onStatusFilterChange={(value) => updateFilters({ status: value })}
          onTableFilterChange={(value) => updateFilters({ table: value })}
          onAddGuest={handleAddGuest}
          onBulkInvite={bulkInviteWhatsApp}
          onImportGuests={importFromContacts}
          onBulkAddGuests={handleBulkAdd}
          onExportGuests={exportToCSV}
          guestCount={guests.length}
          isLoading={isLoading}
        />

        {/* Lista de invitados */}
        <GuestList
          guests={guests}
          searchTerm={filters.search}
          statusFilter={filters.status}
          tableFilter={filters.table}
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
          <GuestForm
            guest={editingGuest}
            onSave={handleSaveGuest}
            onCancel={handleCancelModal}
            isLoading={isSaving}
          />
        </Modal>

        {/* Modal de alta masiva */}
        <Modal
          open={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          title="Alta masiva de invitados"
          size="xl"
        >
          <GuestBulkGrid
            onCancel={() => setShowBulkModal(false)}
            onSave={handleSaveBulk}
            isLoading={isBulkSaving}
          />
        </Modal>
      </div>
    </div>
  );
};

export default InvitadosRefactored;
