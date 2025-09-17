import { useState, useEffect, useCallback, useMemo } from 'react';
import { post as apiPost } from '../services/apiClient';
import { useWedding } from '../context/WeddingContext';
import useWeddingCollection from './useWeddingCollection';
import { subscribeSyncState, getSyncState } from '../services/SyncService';
import { sendText as sendWhatsAppText, toE164 as toE164Frontend, waDeeplink } from '../services/whatsappService';
import { renderInviteMessage } from '../services/MessageTemplateService';
import wh from '../utils/whDebug';

import { ensureExtensionAvailable, sendBatchMessages, sendBroadcastMessages } from '../services/whatsappBridge';

/**
 * Hook personalizado para gestiÃ³n optimizada de invitados
 * Centraliza toda la lÃ³gica de invitados con performance mejorada
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
      name: 'Ana GarcÃ­a', 
      email: 'ana@example.com',
      phone: '123456789', 
      address: 'Calle Sol 1', 
      companion: 1, 
      table: '5', 
      response: 'SÃ­',
      status: 'confirmed',
      dietaryRestrictions: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: 'Luis MartÃ­nez', 
      email: 'luis@example.com',
      phone: '987654321', 
      address: 'Av. Luna 3', 
      companion: 0, 
      table: '', 
      response: 'Pendiente',
      status: 'pending',
      dietaryRestrictions: 'Vegetariano',
      notes: 'LlegarÃ¡ tarde a la ceremonia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  }, [allowSamples]);

  // Usar datos de ejemplo solo si no hay boda activa y estÃ¡ habilitado allowSamples
  const fallbackGuests = activeWedding ? [] : sampleGuests;
  
  // Debug: log para verificar activeWedding
  useEffect(() => {
    console.log('[useGuests] activeWedding:', activeWedding);
    console.log('[useGuests] fallbackGuests length:', fallbackGuests.length);
  }, [activeWedding, fallbackGuests]);
  
  // Hook de colecciÃ³n con datos optimizados
  // Obtenemos loading de la colecciÃ³n y lo exponemos como isLoading
  const {
    data: guests,
    addItem,
    updateItem,
    deleteItem,
    loading: collectionLoading,
  } = useWeddingCollection('guests', activeWedding, fallbackGuests);

  // Alias legible para el resto del hook/componentes
  const isLoading = collectionLoading;

  // Estado de sincronizaciÃ³n
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    table: '',
    group: ''
  });

  // Suscribirse a cambios en el estado de sincronizaciÃ³n
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);

  // SincronizaciÃ³n con localStorage para compatibilidad
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
        if (guest.status === 'confirmed') return 'SÃ­';
        if (guest.status === 'declined') return 'No';
        return 'Pendiente';
      }
      return guest.response || 'Pendiente';
    }
  }), []);

  // EstadÃ­sticas memoizadas
  const stats = useMemo(() => {
    const totalCompanions = guests.reduce((sum, g) => 
      sum + (parseInt(g.companion, 10) || 0), 0
    );
    
    const withDietaryRestrictions = guests.filter(g => 
      g.dietaryRestrictions && g.dietaryRestrictions.trim()
    ).length;

    // NormalizaciÃ³n de estados (UI/Backend)
    const c2 = guests.filter(g => {
      const s = String(g.status || '').toLowerCase();
      return s === 'confirmed' || s === 'accepted' || g.response === 'SÃ­' || g.response === 'Sï¿½ï¿½';
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

  // Funciones de gestiÃ³n de invitados
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
      console.error('Error aÃ±adiendo invitado:', error);
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

      // Si cambiÃ³ la mesa y pertenece a un grupo, actualizar acompaÃ±antes
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

  // Funciones de invitaciÃ³n
  const inviteViaWhatsApp = useCallback(async (guest) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene nÃºmero de telÃ©fono');
      return;
    }

    let link = '';
    try {
      const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {});
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch (err) {
      console.warn('No se pudo obtener enlace RSVP', err);
    }

    const text = link
      ? `Â¡Hola ${guest.name}! Nos encantarÃ­a contar contigo en nuestra boda. Confirma tu asistencia aquÃ­: ${link}`
      : `Â¡Hola ${guest.name}! Nos encantarÃ­a contar contigo en nuestra boda. Â¿Puedes confirmar tu asistencia?`;
    const deeplink = waDeeplink(toE164Frontend(phone), text);
    window.open(deeplink, '_blank');
  }, [utils, activeWedding]);

  // EnvÃ­o por deeplink (mÃ³vil personal) a una selecciÃ³n
  const inviteSelectedWhatsAppDeeplink = useCallback(async (selectedIds = [], customMessage) => {
    const setIds = new Set(selectedIds || []);
    const targets = guests.filter(g => setIds.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con telÃ©fono vÃ¡lido');
      return { success: true, opened: 0 };
    }
    let opened = 0;
    for (const guest of targets) {
      try {
        let link = '';
        try {
          const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {});
          if (resp.ok) { const json = await resp.json(); link = json.link; }
        } catch {}
        const message = customMessage && customMessage.trim() ? customMessage : (
          link
            ? `Â¡Hola ${guest.name || ''}! Nos encantarÃ­a contar contigo en nuestra boda. Confirma tu asistencia aquÃ­: ${link}`
            : `Â¡Hola ${guest.name || ''}! Nos encantarÃ­a contar contigo en nuestra boda. Â¿Puedes confirmar tu asistencia?`
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

  // EnvÃ­o en una sola acciÃ³n usando extensiÃ³n (WhatsApp Web automation)
  const inviteSelectedWhatsAppViaExtension = useCallback(async (selectedIds = [], customMessage) => {
    const available = await ensureExtensionAvailable(1500);
    if (!available) {
      return { success: false, notAvailable: true };
    }
    const idSet = new Set(selectedIds || []);
    const targets = guests.filter(g => idSet.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con telÃ©fono vÃ¡lido');
      return { success: false, error: 'no-targets' };
    }
    // Construir items con RSVP link cuando sea posible
    const items = [];
    for (const g of targets) {
      // Generar enlace RSVP si es posible
      let link = '';
      try {
        const resp = await apiPost(`/api/guests/${activeWedding}/id/${g.id}/rsvp-link`, {});
        if (resp.ok) { const json = await resp.json(); link = json.link; }
      } catch {}
      const message = (customMessage && customMessage.trim())
        ? customMessage.trim()
        : (link
          ? `¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
          : `¡Hola ${g.name || ''}! Nos encantaría contar contigo en nuestra boda. Para confirmar, responde "Sí" o "No" a este mensaje. Después te preguntaremos acompañantes y alergias.`);
      const to = toE164Frontend(g.phone);
      if (to) items.push({ to, message, weddingId: activeWedding, guestId: g.id, metadata: { guestName: g.name || '', rsvpFlow: true } });
    }
    if (!items.length) {
      alert('Los seleccionados no tienen telÃ©fonos vÃ¡lidos');
      return { success: false, error: 'no-valid-phones' };
    }
    // Enviar lote a la extensiÃ³n (rate limit suave en la extensiÃ³n)
    const result = await sendBatchMessages(items, { rateLimitMs: 400 });
    return { success: true, ...result, count: items.length };
  }, [guests, utils, activeWedding]);

  // DifusiÃ³n (lista de difusiÃ³n) â€” un solo mensaje para todos los seleccionados usando la extensiÃ³n
  const inviteSelectedWhatsAppBroadcastViaExtension = useCallback(async (selectedIds = [], customMessage) => {
    const available = await ensureExtensionAvailable(1500);
    if (!available) {
      return { success: false, notAvailable: true };
    }
    const idSet = new Set(selectedIds || []);
    const targets = guests.filter(g => idSet.has(g.id) && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados seleccionados con telÃ©fono vÃ¡lido');
      return { success: false, error: 'no-targets' };
    }
    const msg = (customMessage && customMessage.trim())
      ? customMessage
      : 'Â¡Nos encantarÃ­a contar contigo en nuestra boda! Por favor, confirma tu asistencia.';
    const numbers = targets
      .map(g => toE164Frontend(utils.phoneClean(g.phone)))
      .filter(Boolean);
    if (!numbers.length) return { success: false, error: 'no-valid-phones' };
    const result = await sendBroadcastMessages(numbers, msg, { cleanup: true, rateLimitMs: 400 });
    return { success: true, ...result, count: numbers.length };
  }, [guests, utils]);

  // EnvÃ­o por API (nÃºmero de la app) â€” invitado individual (flujo conversacional RSVP)
  const inviteViaWhatsAppApi = useCallback(async (guest, customMessage) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene nÃºmero de telÃ©fono');
      return { success: false, error: 'No phone' };
    }

    // Mensaje diseÃ±ado para flujo conversacional sin enlaces
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
      // Registrar fecha de Ãºltimo envÃ­o
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
      const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {});
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch (err) {
      console.warn('No se pudo obtener enlace RSVP', err);
    }

    const subject = encodeURIComponent('InvitaciÃ³n a nuestra boda');
    const bodyLines = [
      `Hola ${guest.name},`,
      '',
      'Nos complace invitarte a nuestra boda y serÃ­a un honor contar con tu presencia.',
      link ? `Confirma tu asistencia haciendo clic aquÃ­: ${link}` : 'Por favor confirma tu asistencia respondiendo a este mensaje.',
      '',
      'Â¡Gracias!'
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.open(`mailto:${guest.email}?subject=${subject}&body=${body}`, '_blank');
  }, []);

  const bulkInviteWhatsApp = useCallback(async () => {
    // Recordatorios solo a pendientes
    const guestsWithPhone = guests.filter(g =>
      (g.status === 'pending' || g.response === 'Pendiente') && utils.phoneClean(g.phone));
    
    if (guestsWithPhone.length === 0) {
      alert('No hay invitados con nÃºmero de telÃ©fono');
      return;
    }
    
    // Eliminamos confirm para evitar cancelaciones inesperadas
    for (const guest of guestsWithPhone) {
      try {
        // Generar enlace RSVP si hay API disponible
        let rsvpLink = '';
        try {
          const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {});
          if (resp.ok) {
            const { link } = await resp.json();
            rsvpLink = link;
          }
        } catch (err) {
          console.warn('No se pudo generar enlace RSVP:', err);
        }
        
        const message = rsvpLink 
          ? `Â¡Hola ${guest.name}! Estamos encantados de invitarte a nuestra boda. Por favor confirma tu asistencia aquÃ­: ${rsvpLink}`
          : `Â¡Hola ${guest.name}! Nos encantarÃ­a contar contigo en nuestra boda. Â¿Puedes confirmar tu asistencia?`;
        
        const deeplink = waDeeplink(toE164Frontend(utils.phoneClean(guest.phone)), message);
        window.open(deeplink, '_blank');
        
        // Registrar fecha de recordatorio
        await updateItem(guest.id, { lastReminderAt: new Date().toISOString() });
        // PequeÃ±a pausa entre invitaciones
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error invitando a ${guest.name}:`, error);
      }
    }
  }, [guests, utils]);

  // EnvÃ­o por API (nÃºmero de la app) â€” masivo a pendientes
  const bulkInviteWhatsAppApi = useCallback(async () => {
    wh('Bulk API â€“ inicio');
    const targets = guests.filter(g => (g.status === 'pending' || g.response === 'Pendiente') && utils.phoneClean(g.phone));
    if (targets.length === 0) {
      alert('No hay invitados pendientes con nÃºmero de telÃ©fono');
      wh('Bulk API â€“ sin targets');
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
    wh('Bulk API â€“ fin', { ok, fail, total: targets.length });
    alert(`WhatsApp API â€“ EnvÃ­os completados. Ã‰xitos: ${ok}, Fallos: ${fail}`);
  }, [guests, utils, inviteViaWhatsAppApi]);

  // EnvÃ­o por API a una selecciÃ³n de invitados (selectedIds)
  const inviteSelectedWhatsAppApi = useCallback(async (selectedIds = [], customMessage) => {
    try {
      wh('Selected API â€“ inicio', { selectedIdsLength: (selectedIds || []).length });
      const setIds = new Set(selectedIds || []);
      const targets = guests.filter(g => setIds.has(g.id) && utils.phoneClean(g.phone));
      wh('Selected API â€“ targets', { count: targets.length });
      if (targets.length === 0) {
        alert('No hay invitados seleccionados con nÃºmero de telÃ©fono');
        wh('Selected API â€“ sin targets');
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
          wh('Selected API â€“ error invitado', { guestId: g?.id, error: String(err?.message || err) });
          fail++;
        }
      }
      wh('Selected API â€“ fin', { ok, fail });
      return { success: true, ok, fail };
    } catch (e) {
      wh('Selected API â€“ exception', { error: String(e?.message || e) });
      return { success: false, error: e?.message || 'error' };
    }
  }, [guests, utils, inviteViaWhatsAppApi]);

  // Deeplink personalizado con mensaje proporcionado (para modal)
  const inviteViaWhatsAppDeeplinkCustom = useCallback(async (guest, customMessage) => {
    const phone = utils.phoneClean(guest.phone);
    if (!phone) {
      alert('El invitado no tiene nÃºmero de telÃ©fono');
      return;
    }
    let link = '';
    try {
      const resp = await apiPost(`/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`, {});
      if (resp.ok) {
        const json = await resp.json();
        link = json.link;
      }
    } catch {}
    const message = customMessage && customMessage.trim() ? customMessage : (
      link
        ? `Â¡Hola ${guest.name}! Nos encantarÃ­a contar contigo en nuestra boda. Confirma tu asistencia aquÃ­: ${link}`
        : `Â¡Hola ${guest.name}! Nos encantarÃ­a contar contigo en nuestra boda. Â¿Puedes confirmar tu asistencia?`
    );
    const deeplink = waDeeplink(toE164Frontend(phone), message);
    window.open(deeplink, '_blank');
  }, [utils, activeWedding]);

  // Funciones de importaciÃ³n/exportaciÃ³n
  const importFromContacts = useCallback(async () => {
    if (!navigator.contacts || !navigator.contacts.select) {
      alert('La API de contactos no estÃ¡ disponible en este navegador');
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
      
      // AÃ±adir todos los invitados importados
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
      'Nombre', 'Email', 'TelÃ©fono', 'DirecciÃ³n', 'Estado', 
      'Mesa', 'AcompaÃ±antes', 'Restricciones DietÃ©ticas', 'Notas'
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
    
    // Funciones de gestiÃ³n
    addGuest,
    updateGuest,
    removeGuest,
    
    // Funciones de invitaciÃ³n
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
    
    // Funciones de importaciÃ³n/exportaciÃ³n
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


