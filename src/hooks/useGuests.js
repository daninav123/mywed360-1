import { useState, useEffect, useCallback, useMemo } from 'react';
import { post as apiPost } from '../services/apiClient';
import { useWedding } from '../context/WeddingContext';
import useWeddingCollection from './useWeddingCollection';
import { subscribeSyncState, getSyncState } from '../services/SyncService';
import { sendText as sendWhatsAppText, toE164 as toE164Frontend, waDeeplink, getProviderStatus } from '../services/whatsappService';
import { renderInviteMessage } from '../services/MessageTemplateService';
import wh from '../utils/whDebug';

import { ensureExtensionAvailable, sendBatchMessages, sendBroadcastMessages } from '../services/whatsappBridge';

/**
 * Hook personalizado para gestión optimizada de invitados
 * Centraliza toda la lógica de invitados con performance mejorada
 */
const useGuests = () => {
  // Manejo seguro del contexto de bodas
  let activeWedding;
  try {
    const weddingContext = useWedding();
    activeWedding = weddingContext?.activeWedding;
  } catch (error) {
    console.error('Error accediendo al contexto de bodas en useGuests:', error);
    activeWedding = null;
  }
  
  // Datos de ejemplo para desarrollo (solo si VITE_ALLOW_SAMPLE_GUESTS === 'true')
  const allowSamples = import.meta.env.VITE_ALLOW_SAMPLE_GUESTS === 'true';

  const sampleGuests = useMemo(() => {
    if (!allowSamples) return [];
    return [
    { 
      id: 1, 
      name: 'Ana García', 
      email: 'ana@example.com',
      phone: '123456789', 
      address: 'Calle Sol 1', 
      companion: 1, 
      table: '5', 
      response: 'Sí',
      status: 'confirmed',
      dietaryRestrictions: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: 'Luis Martínez', 
      email: 'luis@example.com',
      phone: '987654321', 
      address: 'Av. Luna 3', 
      companion: 0, 
      table: '', 
      response: 'Pendiente',
      status: 'pending',
      dietaryRestrictions: 'Vegetariano',
      notes: 'Llegará tarde a la ceremonia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  }, [allowSamples]);

  // Usar datos de ejemplo solo si no hay boda activa y está habilitado allowSamples
  const fallbackGuests = activeWedding ? [] : sampleGuests;
  
  // Debug: log para verificar activeWedding
  useEffect(() => {
    console.log('[useGuests] activeWedding:', activeWedding);
    console.log('[useGuests] fallbackGuests length:', fallbackGuests.length);
  }, [activeWedding, fallbackGuests]);
  
  // Hook de colección con datos optimizados
  // Obtenemos loading de la colección y lo exponemos como isLoading
  const {
    data: guests,
    addItem,
    updateItem,
    deleteItem,
    loading: collectionLoading,
    error: collectionError,
    reload,
  } = useWeddingCollection('guests', activeWedding, fallbackGuests, { orderBy: { field: 'createdAt', direction: 'desc' } });

  // Alias legible para el resto del hook/componentes
  const isLoading = collectionLoading;

  // Estado de sincronización
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    table: '',
    group: ''
  });

  // Lista filtrada memoizada según filtros actuales
  const filteredGuests = useMemo(() => {
    try {
      const term = (filters.search || '').trim().toLowerCase();
      const status = String(filters.status || '').toLowerCase();
      const table = String(filters.table || '').trim();
      const group = String(filters.group || '').trim();
      return guests.filter((g) => {
        if (term) {
          const haystack = [g.name, g.email, g.phone, g.address, g.notes]
            .map((v) => (v ? String(v).toLowerCase() : ''))
            .join(' ');
          if (!haystack.includes(term)) return false;
        }
        if (status) {
          const s = String(g.status || '').toLowerCase();
          const r = String(g.response || '').toLowerCase();
          if (status === 'confirmed' && !(s === 'confirmed' || s === 'accepted' || r === 's' || r === 'sí' || r === 'si')) return false;
          if (status === 'declined' && !(s === 'declined' || s === 'rejected' || r === 'no')) return false;
          if (status === 'pending') {
            const isPending = !(s === 'confirmed' || s === 'accepted' || s === 'declined' || s === 'rejected') && r !== 's' && r !== 'sí' && r !== 'si' && r !== 'no';
            if (!isPending) return false;
          }
        }
        if (table) {
          if (String(g.table || '').trim() !== table) return false;
        }
        if (group) {
          if (String(g.group || g.companionGroupId || '').trim() !== group) return false;
        }
        return true;
      });
    } catch {
      return guests;
    }
  }, [guests, filters]);

  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // Sincronización con localStorage para compatibilidad
  useEffect(() => {
    try {
      localStorage.setItem('lovendaGuests', JSON.stringify(guests));
      
      // Emitir evento para componentes que escuchan cambios
      window.dispatchEvent(new CustomEvent('lovenda-guests-updated', {
        detail: { guests, count: guests.length }
      }));
    } catch (error) {
      console.error('Error sincronizando invitados:', error);
    }
  }, [guests]);

  // Funciones utilitarias memoizadas
  const utils = useMemo(() => ({
    normalize: (str = '') => str.trim().toLowerCase(),
    phoneClean: (str = '') => str.replace(/\s+/g, '').replace(/[^0-9+]/g, ''),
    getStatusLabel: (guest) => {
      if (guest.status) {
        if (guest.status === 'confirmed') return 'Sí';
        if (guest.status === 'declined') return 'No';
        return 'Pendiente';
      }
      return guest.response || 'Pendiente';
    }
  }), []);

  // Estadísticas memoizadas
  const stats = useMemo(() => {
    const totalCompanions = guests.reduce((sum, g) => 
      sum + (parseInt(g.companion, 10) || 0), 0
    );
    
    const withDietaryRestrictions = guests.filter(g => 
      g.dietaryRestrictions && g.dietaryRestrictions.trim()
    ).length;

    // Normalización de estados (UI/Backend)
    const c2 = guests.filter(g => {
      const s = String(g.status || '').toLowerCase();
      return s === 'confirmed' || s === 'accepted' || g.response === 'Sí' || g.response === 'S';
    }).length;
    const d2 = guests.filter(g => {
      const s = String(g.status || '').toLowerCase();
      return s === 'declined' || s === 'rejected' || g.response === 'No';
    }).length;
    const p2 = guests.filter(g => {
      const s = String(g.status || '').toLowerCase();
      if (s === 'confirmed' || s === 'accepted') return false;
      if (s === 'declined' || s === 'rejected') return false;
      return s === 'pending' || !s || g.response === 'Pendiente';
    }).length;

    return {
      total: guests.length,
      confirmed: c2,
      pending: p2,
      declined: d2,
      totalAttendees: c2 + totalCompanions,
      withDietaryRestrictions
    };
  }, [guests]);

  // Funciones de gestión de invitados
  const addGuest = useCallback(async (guestData) => {
    try {
      const newGuest = {
        companionGroupId: guestData.companionGroupId || '',
        ...guestData,
        id: guestData.id || `guest-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addItem(newGuest);
      return { success: true, guest: newGuest };
    } catch (error) {
      console.error('Error añadiendo invitado:', error);
      return { success: false, error: error.message };
    }
  }, [addItem]);

  const updateGuest = useCallback(async (guestId, updates) => {
    // Buscar guest original para detectar cambio de mesa
    const original = guests.find(g => g.id === guestId);
    const originalTable = original?.table || '';
    try {
      const updatedGuest = {
        ...updates,
        id: guestId,
        updatedAt: new Date().toISOString()
      };
      
      await updateItem(guestId, updatedGuest);

      // Si cambió la mesa y pertenece a un grupo, actualizar acompañantes
      if (updatedGuest.table !== originalTable && updatedGuest.companionGroupId) {
        const companions = guests.filter(g => g.companionGroupId === updatedGuest.companionGroupId && g.id !== guestId);
        if (companions.length) {
          for (const comp of companions) {
            await updateItem(comp.id, { table: updatedGuest.table, updatedAt: new Date().toISOString() });
          }
        }
      }
      return { success: true, guest: updatedGuest };
    } catch (error) {
      console.error('Error actualizando invitado:', error);
      return { success: false, error: error.message };
    }
  }, [updateItem]);

  const removeGuest = useCallback(async (guestId) => {
    try {
      await deleteItem(guestId);
      return { success: true };
    } catch (error) {
      console.error('Error eliminando invitado:', error);
      return { success: false, error: error.message };
    }
  }, [deleteItem]);

  // Funciones de invitación
  const inviteViaWhatsApp = useCallback(async (guest) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene número de teléfono');
      return;
    }

    let link = '';
    try {
      const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {}, { auth: true });
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch (err) {
      console.warn('No se pudo obtener enlace RSVP', err);
    }

    const text = link
      ? `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
      : `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
    const deeplink = waDeeplink(toE164Frontend(phone), text);
    window.open(deeplink, '_blank');
  }, [utils, activeWedding]);

  // Envío por deeplink (móvil personal) a una selección
  const inviteSelectedWhatsAppDeeplink = useCallback(async (selectedIds = [], customMessage) => {
    const setIds = new Set(selectedIds || []);
    const targets = guests.filter(g => setIds.has(g.id) && utils.phoneClean(g.phone));
    let opened = 0; for (const guest of targets) {
      try {
        let link = '';
        try {
          const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {}, { auth: true });
          if (resp.ok) { const json = await resp.json(); link = json.link; }
        } catch {}
        const message = customMessage && customMessage.trim() ? customMessage : (
          link
            ? `¡Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
            : `¡Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`
        );
        const phone = toE164Frontend(utils.phoneClean(guest.phone));
        const url = waDeeplink(phone, message);
        window.open(url, '_blank');
        opened++;

        await new Promise(r => setTimeout(r, 200));
      } catch {}
    }
    return { success: true, opened };
  }, [guests, utils, activeWedding]);

  // Envío a seleccionados usando la extensión (abre WhatsApp Web con mensajes preparados)
  const inviteSelectedWhatsAppViaExtension = useCallback(async (selectedIds = [], customMessage) => {
    const available = await ensureExtensionAvailable(1500);
    if (!available) {
      return { success: false, notAvailable: true };
    }
    const idSet = new Set(selectedIds || []);
    const targets = guests.filter(g => idSet.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      return { success: false, error: 'no-targets' };
    }

    const items = [];
    for (const guest of targets) {
      try {
        // Intentar generar enlace RSVP del backend (opcional)
        let link = '';
        try {
          const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {}, { auth: true });
          if (resp.ok) {
            const json = await resp.json();
            link = json.link || '';
          }
        } catch {}

        const msg = (customMessage && customMessage.trim())
          ? customMessage
          : (link
            ? `Hola ${guest.name || ''}! Nos encantaria contar contigo en nuestra boda. Confirma tu asistencia aqui: ${link}`
            : `Hola ${guest.name || ''}! Nos encantaria contar contigo en nuestra boda. Puedes confirmar tu asistencia?`);

        const phone = toE164Frontend(utils.phoneClean(guest.phone));
        if (!phone) continue;
        items.push({ to: phone, message: msg });
      } catch {}
    }

    // Enviar lote a la extensión (rate limit suave en la extensión)
    const result = await sendBatchMessages(items, { rateLimitMs: 400 });
    return { success: true, ...result, count: items.length };
  }, [guests, utils, activeWedding]);

  // Difusión (lista de difusión) — un solo mensaje para todos los seleccionados usando la extensión
  const inviteSelectedWhatsAppBroadcastViaExtension = useCallback(async (selectedIds = [], customMessage) => {
    const available = await ensureExtensionAvailable(1500);
    if (!available) {
      return { success: false, notAvailable: true };
    }
    const idSet = new Set(selectedIds || []);
    const targets = guests.filter(g => idSet.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con telefono valido');
      return { success: false, error: 'no-targets' };
    }
    const msg = (customMessage && customMessage.trim()) ? customMessage : 'Nos encantaria contar contigo en nuestra boda! Por favor, confirma tu asistencia.';
    const numbers = targets.map(g => toE164Frontend(utils.phoneClean(g.phone))).filter(Boolean);
    if (!numbers.length) return { success: false, error: 'no-valid-phones' };
    const result = await sendBroadcastMessages(numbers, msg, { cleanup: true, rateLimitMs: 400 });
    return { success: true, ...result, count: numbers.length };
  }, [guests, utils, activeWedding]);

    const available = await ensureExtensionAvailable(1500);
    if (!available) {
      return { success: false, notAvailable: true };
    }
    const idSet = new Set(selectedIds || []);
    const targets = guests.filter(g => idSet.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con teléfono válido');
      return { success: false, error: 'no-targets' };
    }
    const msg = (customMessage && customMessage.trim())
      ? customMessage
      : '¡Nos encantaría contar contigo en nuestra boda! Por favor, confirma tu asistencia.';
//
//    const numbers = targets
//      .map(g => toE164Frontend(utils.phoneClean(g.phone)))
//      .filter(Boolean);
//    if (!numbers.length) return { success: false, error: 'no-valid-phones' };
//    const result = await sendBroadcastMessages(numbers, msg, { cleanup: true, rateLimitMs: 400 });
//    return { success: true, ...result, count: numbers.length };
//  }, [guests, utils, activeWedding]);
//    }
//    
//    try {
//      const contacts = await navigator.contacts.select(
//        ['name', 'tel', 'email'], 
//        { multiple: true }
//      );
//      
//      const importedGuests = contacts.map(contact => ({
//        id: `imported-${Date.now()}-${Math.random()}`,
//        name: contact.name?.[0] || 'Sin nombre',
//        email: contact.email?.[0] || '',
//        phone: contact.tel?.[0] || '',
//        address: '',
//        companion: 0,
//        table: '',
//        response: 'Pendiente',
//        status: 'pending',
//        dietaryRestrictions: '',
//        notes: 'Importado desde contactos',
//        createdAt: new Date().toISOString(),
//        updatedAt: new Date().toISOString()
//      }));
//      
      // Añadir todos los invitados importados
//      for (const guest of importedGuests) {
//        await addGuest(guest);
//      }
//      
//      alert(`Se importaron ${importedGuests.length} contactos exitosamente`);
//    } catch (error) {
//      console.error('Error importando contactos:', error);
//      alert('Error al importar contactos');
//    }
//  }, [addGuest]);

  const exportToCSV = useCallback(() => {
    if (guests.length === 0) {
      alert('No hay invitados para exportar');
      return;
    }
    
    const headers = [
      'Nombre', 'Email', 'Teléfono', 'Dirección', 'Estado', 
      'Mesa', 'Acompañantes', 'Restricciones Dietéticas', 'Notas'
    ];
    
    const csvContent = [
      headers.join(','),
      ...guests.map(guest => [
        `"${guest.name || ''}"`,
        `"${guest.email || ''}"`,
        `"${guest.phone || ''}"`,
        `"${guest.address || ''}"`,
        `"${utils.getStatusLabel(guest)}"`,
        `"${guest.table || ''}"`,
        guest.companion || 0,
        `"${guest.dietaryRestrictions || ''}"`,
        `"${guest.notes || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `invitados-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [guests, utils]);

  // Funciones de filtrado
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', status: '', table: '', group: '' });
  }, []);

  return {
    // Datos
    guests,
    filteredGuests,
    stats,
    filters,
    syncStatus,
    isLoading,
    error: collectionError,
    reload,
    
    // Funciones de gestión
    addGuest,
    updateGuest,
    removeGuest,
    
    // Funciones de invitación
    inviteViaWhatsApp,
    inviteViaWhatsAppApi,
    bulkInviteWhatsAppApi,
    inviteSelectedWhatsAppDeeplink,
    inviteSelectedWhatsAppViaExtension,
    inviteSelectedWhatsAppBroadcastViaExtension,
    inviteSelectedWhatsAppApi,
    
    // Funciones de importación/exportación
    exportToCSV,
    
    // Funciones de filtrado
    updateFilters,
    clearFilters,
    
    // Utilidades
    utils
  };
};

export default useGuests;
