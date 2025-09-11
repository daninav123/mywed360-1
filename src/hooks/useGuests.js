import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWedding } from '../context/WeddingContext';
import useWeddingCollection from './useWeddingCollection';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { sendText as sendWhatsAppText, toE164 as toE164Frontend, waDeeplink } from '../services/whatsappService';
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
  } = useWeddingCollection('guests', activeWedding, fallbackGuests);

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
    const confirmed = guests.filter(g => 
      g.status === 'confirmed' || g.response === 'Sí'
    ).length;
    
    const pending = guests.filter(g => 
      g.status === 'pending' || g.response === 'Pendiente'
    ).length;
    
    const declined = guests.filter(g => 
      g.status === 'declined' || g.response === 'No'
    ).length;
    
    const totalCompanions = guests.reduce((sum, g) => 
      sum + (parseInt(g.companion, 10) || 0), 0
    );
    
    const withDietaryRestrictions = guests.filter(g => 
      g.dietaryRestrictions && g.dietaryRestrictions.trim()
    ).length;

    return {
      total: guests.length,
      confirmed,
      pending,
      declined,
      totalAttendees: confirmed + totalCompanions,
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
      const resp = await fetch(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {
        method: 'POST'
      });
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
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con teléfono válido');
      return { success: true, opened: 0 };
    }
    let opened = 0;
    for (const guest of targets) {
      try {
        let link = '';
        try {
          const resp = await fetch(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, { method: 'POST' });
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

  // Envío en una sola acción usando extensión (WhatsApp Web automation)
  const inviteSelectedWhatsAppViaExtension = useCallback(async (selectedIds = [], customMessage) => {
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
    // Construir items con RSVP link cuando sea posible
    const items = [];
    for (const g of targets) {
      // Generar enlace RSVP si es posible
      let link = '';
      try {
        const resp = await fetch(`/api/guests/${activeWedding}/id/${g.id}/rsvp-link`, { method: 'POST' });
        if (resp.ok) { const json = await resp.json(); link = json.link; }
      } catch {}
      const msg = `¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. Para confirmar, responde "Sí" o "No" a este mensaje. Después te preguntaremos acompañantes y alergias.`;
      const to = toE164(g.phone);
      if (to) items.push({ to, message: msg, weddingId: activeWedding, guestId: g.id, metadata: { guestName: g.name || '', rsvpFlow: true } });
    }
    if (!items.length) {
      alert('Los seleccionados no tienen teléfonos válidos');
      return { success: false, error: 'no-valid-phones' };
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
      alert('No hay invitados seleccionados con teléfono válido');
      return { success: false, error: 'no-targets' };
    }
    const msg = (customMessage && customMessage.trim())
      ? customMessage
      : '¡Nos encantaría contar contigo en nuestra boda! Por favor, confirma tu asistencia.';
    const numbers = targets
      .map(g => toE164Frontend(utils.phoneClean(g.phone)))
      .filter(Boolean);
    if (!numbers.length) return { success: false, error: 'no-valid-phones' };
    const result = await sendBroadcastMessages(numbers, msg, { cleanup: true, rateLimitMs: 400 });
    return { success: true, ...result, count: numbers.length };
  }, [guests, utils]);

  // Envío por API (número de la app) — invitado individual (flujo conversacional RSVP)
  const inviteViaWhatsAppApi = useCallback(async (guest, customMessage) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene número de teléfono');
      return { success: false, error: 'No phone' };
    }

    // Mensaje diseñado para flujo conversacional sin enlaces
    const message = (customMessage && customMessage.trim())
      ? customMessage.trim()
      : renderInviteMessage(guest.name || '');

    const to = toE164Frontend(phone);
    const result = await sendWhatsAppText({
      to,
      message,
      weddingId: activeWedding,
      guestId: guest.id,
      metadata: { guestName: guest.name || '', rsvpFlow: true },
    });
    if (!result.success) {
      alert('Error enviando WhatsApp: ' + (result.error || 'desconocido'));
    } else {
      // Registrar fecha de último envío
      try { await updateItem(guest.id, { lastWhatsAppSentAt: new Date().toISOString() }); } catch {}
    }
    return result;
  }, [utils, activeWedding, updateItem]);

  const inviteViaEmail = useCallback(async (guest) => {
    if (!guest.email) {
      alert('El invitado no tiene email');
      return;
    }

    let link = '';
    try {
      const resp = await fetch(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {
        method: 'POST'
      });
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch (err) {
      console.warn('No se pudo obtener enlace RSVP', err);
    }

    const subject = encodeURIComponent('Invitación a nuestra boda');
    const bodyLines = [
      `Hola ${guest.name},`,
      '',
      'Nos complace invitarte a nuestra boda y sería un honor contar con tu presencia.',
      link ? `Confirma tu asistencia haciendo clic aquí: ${link}` : 'Por favor confirma tu asistencia respondiendo a este mensaje.',
      '',
      '¡Gracias!'
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`, '_blank');
  }, []);

  const bulkInviteWhatsApp = useCallback(async () => {
    // Recordatorios solo a pendientes
    const guestsWithPhone = guests.filter(g =>
      (g.status === 'pending' || g.response === 'Pendiente') && utils.phoneClean(g.phone));
    
    if (guestsWithPhone.length === 0) {
      alert('No hay invitados con número de teléfono');
      return;
    }
    
    // Eliminamos confirm para evitar cancelaciones inesperadas
    for (const guest of guestsWithPhone) {
      try {
        // Generar enlace RSVP si hay API disponible
        let rsvpLink = '';
        try {
          const resp = await fetch(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, { 
            method: 'POST' 
          });
          if (resp.ok) {
            const { link } = await resp.json();
            rsvpLink = link;
          }
        } catch (err) {
          console.warn('No se pudo generar enlace RSVP:', err);
        }
        
        const message = rsvpLink 
          ? `¡Hola ${guest.name}! Estamos encantados de invitarte a nuestra boda. Por favor confirma tu asistencia aquí: ${rsvpLink}`
          : `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
        
        const deeplink = waDeeplink(toE164Frontend(utils.phoneClean(guest.phone)), message);
        window.open(deeplink, '_blank');
        
        // Registrar fecha de recordatorio
        await updateItem(guest.id, { lastReminderAt: new Date().toISOString() });
        // Pequeña pausa entre invitaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error invitando a ${guest.name}:`, error);
      }
    }
  }, [guests, utils]);

  // Envío por API (número de la app) — masivo a pendientes
  const bulkInviteWhatsAppApi = useCallback(async () => {
    wh('Bulk API – inicio');
    const targets = guests.filter(g => (g.status === 'pending' || g.response === 'Pendiente') && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados pendientes con número de teléfono');
      wh('Bulk API – sin targets');
      return;
    }
    // Eliminamos confirm para evitar cancelaciones inesperadas
    let ok = 0, fail = 0;
    for (const g of targets) {
      try {
        const r = await inviteViaWhatsAppApi(g);
        if (r?.success) ok++; else fail++;
        await new Promise(r => setTimeout(r, 400));
      } catch { fail++; }
    }
    wh('Bulk API – fin', { ok, fail, total: targets.length });
    alert(`WhatsApp API – Envíos completados. Éxitos: ${ok}, Fallos: ${fail}`);
  }, [guests, utils, inviteViaWhatsAppApi]);

  // Envío por API a una selección de invitados (selectedIds)
  const inviteSelectedWhatsAppApi = useCallback(async (selectedIds = [], customMessage) => {
    try {
      wh('Selected API – inicio', { selectedIdsLength: (selectedIds || []).length });
      const setIds = new Set(selectedIds || []);
      const targets = guests.filter(g => setIds.has(g.id) && utils.phoneClean(g.phone));
      wh('Selected API – targets', { count: targets.length });
      if (targets.length === 0) {
        alert('No hay invitados seleccionados con número de teléfono');
        wh('Selected API – sin targets');
        return { success: true, ok: 0, fail: 0 };
      }
      // Eliminamos confirm para evitar cancelaciones inesperadas
      let ok = 0, fail = 0;
      for (const g of targets) {
        try {
          const r = await inviteViaWhatsAppApi(g, customMessage);
          if (r?.success) ok++; else fail++;
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          wh('Selected API – error invitado', { guestId: g?.id, error: String(err?.message || err) });
          fail++;
        }
      }
      wh('Selected API – fin', { ok, fail });
      return { success: true, ok, fail };
    } catch (e) {
      wh('Selected API – exception', { error: String(e?.message || e) });
      return { success: false, error: e?.message || 'error' };
    }
  }, [guests, utils, inviteViaWhatsAppApi]);

  // Deeplink personalizado con mensaje proporcionado (para modal)
  const inviteViaWhatsAppDeeplinkCustom = useCallback(async (guest, customMessage) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene número de teléfono');
      return;
    }
    let link = '';
    try {
      const resp = await fetch(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, { method: 'POST' });
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch {}
    const message = customMessage && customMessage.trim() ? customMessage : (
      link
        ? `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
        : `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`
    );
    const deeplink = waDeeplink(toE164Frontend(phone), message);
    window.open(deeplink, '_blank');
  }, [utils, activeWedding]);

  // Funciones de importación/exportación
  const importFromContacts = useCallback(async () => {
    if (!navigator.contacts || !navigator.contacts.select) {
      alert('La API de contactos no está disponible en este navegador');
      return;
    }
    
    try {
      const contacts = await navigator.contacts.select(
        ['name', 'tel', 'email'], 
        { multiple: true }
      );
      
      const importedGuests = contacts.map(contact => ({
        id: `imported-${Date.now()}-${Math.random()}`,
        name: contact.name?.[0] || 'Sin nombre',
        email: contact.email?.[0] || '',
        phone: contact.tel?.[0] || '',
        address: '',
        companion: 0,
        table: '',
        response: 'Pendiente',
        status: 'pending',
        dietaryRestrictions: '',
        notes: 'Importado desde contactos',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // Añadir todos los invitados importados
      for (const guest of importedGuests) {
        await addGuest(guest);
      }
      
      alert(`Se importaron ${importedGuests.length} contactos exitosamente`);
    } catch (error) {
      console.error('Error importando contactos:', error);
      alert('Error al importar contactos');
    }
  }, [addGuest]);

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
    setFilters({ search: '', status: '', table: '' });
  }, []);

  return {
    // Datos
    guests,
    stats,
    filters,
    syncStatus,
    isLoading,
    
    // Funciones de gestión
    addGuest,
    updateGuest,
    removeGuest,
    
    // Funciones de invitación
    inviteViaWhatsApp,
    inviteViaWhatsAppApi,
    inviteViaWhatsAppDeeplinkCustom,
    inviteViaEmail,
    bulkInviteWhatsApp,
    bulkInviteWhatsAppApi,
    inviteSelectedWhatsAppDeeplink,
    inviteSelectedWhatsAppViaExtension,
    inviteSelectedWhatsAppBroadcastViaExtension,
    inviteSelectedWhatsAppApi,
    
    // Funciones de importación/exportación
    importFromContacts,
    exportToCSV,
    
    // Funciones de filtrado
    updateFilters,
    clearFilters,
    
    // Utilidades
    utils
  };
};

export default useGuests;
