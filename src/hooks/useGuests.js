import { useState, useEffect, useCallback, useMemo } from 'react';

import useWeddingCollection from './useWeddingCollection';
import { useWedding } from '../context/WeddingContext';
import { guestSchema, guestUpdateSchema } from '../schemas/guest';
import { post as apiPost } from '../services/apiClient';
import { ensureExtensionAvailable, sendBatchMessages } from '../services/whatsappBridge';
import { toE164 as toE164Frontend, waDeeplink } from '../services/whatsappService';
import { renderInviteMessage } from '../services/MessageTemplateService';

const resolveMessageForGuest = (guest, baseMessage) => {
  const name = guest?.name || '';
  const template = typeof baseMessage === 'string' ? baseMessage.trim() : '';
  if (template) {
    return template.replace(/\{guestName\}/g, name);
  }
  return renderInviteMessage(name);
};

// Hook personalizado para gestión optimizada de invitados
const useGuests = () => {
  // Contexto de boda activa
  let activeWedding;
  try {
    const weddingContext = useWedding();
    activeWedding = weddingContext?.activeWedding;
  } catch (error) {
    console.error('Error accediendo al contexto de bodas en useGuests:', error);
    activeWedding = null;
  }

  // Datos de ejemplo (solo si VITE_ALLOW_SAMPLE_GUESTS === 'true' y no hay boda activa)
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
        updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      },
    ];
  }, [allowSamples]);

  const fallbackGuests = activeWedding ? [] : sampleGuests;

  // Colección guests de la boda activa
  const {
    data: guests,
    addItem,
    updateItem,
    deleteItem,
    loading: collectionLoading,
    error: collectionError,
    reload,
  } = useWeddingCollection('guests', activeWedding, fallbackGuests, {
    orderBy: { field: 'createdAt', direction: 'desc' },
  });

  const isLoading = collectionLoading;

  // Filtros
  const [filters, setFilters] = useState({ search: '', status: '', table: '', group: '' });

  const filteredGuests = useMemo(() => {
    try {
      const term = (filters.search || '').trim().toLowerCase();
      const status = String(filters.status || '').toLowerCase();
      const table = String(filters.table || '').trim();
      const group = String(filters.group || '').trim();
      const strip = (x = '') =>
        x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x;
      return guests.filter((g) => {
        if (term) {
          const haystack = [g.name, g.email, g.phone, g.address, g.notes]
            .map((v) => (v ? String(v).toLowerCase() : ''))
            .join(' ');
          if (!haystack.includes(term)) return false;
        }
        if (status) {
          const s = String(g.status || '').toLowerCase();
          const r = strip(
            String(g.response || '')
              .toLowerCase()
              .trim()
          );
          if (
            status === 'confirmed' &&
            !(s === 'confirmed' || s === 'accepted' || r === 's' || r === 'si' || r === 'sí')
          )
            return false;
          if (status === 'declined' && !(s === 'declined' || s === 'rejected' || r === 'no'))
            return false;
          if (status === 'pending') {
            const isPending =
              !(s === 'confirmed' || s === 'accepted' || s === 'declined' || s === 'rejected') &&
              !['s', 'si', 'sí', 'no'].includes(r);
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

  // Sincronización con localStorage para compatibilidad
  useEffect(() => {
    try {
      localStorage.setItem('mywed360Guests', JSON.stringify(guests));
      window.dispatchEvent(
        new CustomEvent('mywed360-guests-updated', { detail: { guests, count: guests.length } })
      );
    } catch (error) {
      console.error('Error sincronizando invitados:', error);
    }
  }, [guests]);

  // Utilidades
  const utils = useMemo(
    () => ({
      normalize: (str = '') => str.trim().toLowerCase(),
      phoneClean: (str = '') => str.replace(/\s+/g, '').replace(/[^0-9+]/g, ''),
      getStatusLabel: (guest) => {
        if (guest.status) {
          if (guest.status === 'confirmed') return 'Sí';
          if (guest.status === 'declined') return 'No';
          return 'Pendiente';
        }
        return guest.response || 'Pendiente';
      },
      normalizeStatus: (statusRaw = '', responseRaw = '') => {
        try {
          const strip = (x = '') =>
            x && x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x;
          const s = String(statusRaw || '').toLowerCase();
          const r = strip(String(responseRaw || '').toLowerCase().trim());
          if (s === 'confirmed' || s === 'accepted' || ['s', 'si', 'sí'].includes(r)) return 'confirmed';
          if (s === 'declined' || s === 'rejected' || r === 'no') return 'declined';
          return 'pending';
        } catch {
          return 'pending';
        }
      },
    }),
    []
  );

  // Estadísticas
  const stats = useMemo(() => {
    const totalCompanions = guests.reduce((sum, g) => sum + (parseInt(g.companion, 10) || 0), 0);
    const withDietaryRestrictions = guests.filter(
      (g) => g.dietaryRestrictions && g.dietaryRestrictions.trim()
    ).length;
    const c2 = guests.filter((g) => {
      const s = String(g.status || '').toLowerCase();
      const r = String(g.response || '').toLowerCase();
      return s === 'confirmed' || s === 'accepted' || r === 'sí' || r === 's';
    }).length;
    const d2 = guests.filter((g) => {
      const s = String(g.status || '').toLowerCase();
      const r = String(g.response || '').toLowerCase();
      return s === 'declined' || s === 'rejected' || r === 'no';
    }).length;
    const p2 = guests.filter((g) => {
      const s = String(g.status || '').toLowerCase();
      const r = String(g.response || '').toLowerCase();
      if (s === 'confirmed' || s === 'accepted') return false;
      if (s === 'declined' || s === 'rejected') return false;
      return s === 'pending' || !s || r === 'pendiente' || !r;
    }).length;
    return {
      total: guests.length,
      confirmed: c2,
      pending: p2,
      declined: d2,
      totalAttendees: c2 + totalCompanions,
      withDietaryRestrictions,
    };
  }, [guests]);

  // CRUD básico
  const addGuest = useCallback(
    async (guestData) => {
      try {
        const base = {
          companionGroupId: guestData.companionGroupId || '',
          ...guestData,
          id: guestData.id || `guest-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (base.phone) base.phone = utils.phoneClean(base.phone);
        // Normalizar estado coherente basado en status/response
        try {
          const sd = (s = '') =>
            s && s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
          const s = String(base.status || '').toLowerCase();
          const r = sd(String(base.response || '').toLowerCase().trim());
          if (s === 'confirmed' || s === 'accepted' || ['s', 'si', 'sí'].includes(r)) base.status = 'confirmed';
          else if (s === 'declined' || s === 'rejected' || r === 'no') base.status = 'declined';
          else base.status = 'pending';
        } catch {}
        const parsed = guestSchema.safeParse(base);
        if (!parsed.success) {
          return { success: false, error: parsed.error?.errors?.[0]?.message || 'Datos inválidos' };
        }
        const newGuest = parsed.data;
        await addItem(newGuest);
        return { success: true, guest: newGuest };
      } catch (error) {
        console.error('Error añadiendo invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [addItem]
  );

  const updateGuest = useCallback(
    async (guestId, updates) => {
      const original = guests.find((g) => g.id === guestId);
      const originalTable = original?.table || '';
      try {
        const patch = { ...updates, id: guestId, updatedAt: new Date().toISOString() };
        if (patch.phone) patch.phone = utils.phoneClean(patch.phone);
        // Normalizar estado coherente si se cambia status/response
        try {
          if (Object.prototype.hasOwnProperty.call(patch, 'status') || Object.prototype.hasOwnProperty.call(patch, 'response')) {
            const sd = (s = '') => (s && s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s);
            const s = String((patch.status ?? original?.status) || '').toLowerCase();
            const r = sd(String((patch.response ?? original?.response) || '').toLowerCase().trim());
            if (s === 'confirmed' || s === 'accepted' || ['s', 'si', 'sí'].includes(r)) patch.status = 'confirmed';
            else if (s === 'declined' || s === 'rejected' || r === 'no') patch.status = 'declined';
            else patch.status = 'pending';
          }
        } catch {}
        const parsed = guestUpdateSchema.safeParse(patch);
        if (!parsed.success) {
          return { success: false, error: parsed.error?.errors?.[0]?.message || 'Datos inválidos' };
        }
        const updatedGuest = parsed.data;
        await updateItem(guestId, updatedGuest);
        if (updatedGuest.table !== originalTable && updatedGuest.companionGroupId) {
          const companions = guests.filter(
            (g) => g.companionGroupId === updatedGuest.companionGroupId && g.id !== guestId
          );
          for (const comp of companions) {
            await updateItem(comp.id, {
              table: updatedGuest.table,
              updatedAt: new Date().toISOString(),
            });
          }
        }
        return { success: true, guest: updatedGuest };
      } catch (error) {
        console.error('Error actualizando invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [guests, updateItem]
  );

  const removeGuest = useCallback(
    async (guestId) => {
      try {
        await deleteItem(guestId);
        return { success: true };
      } catch (error) {
        console.error('Error eliminando invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [deleteItem]
  );

  // WhatsApp helpers
  const inviteViaWhatsApp = useCallback(
    async (guest) => {
      const phone = utils.phoneClean(guest.phone);
      if (!phone) {
        alert('El invitado no tiene número de teléfono');
        return;
      }
      let link = '';
      try {
        const resp = await apiPost(
          `/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`,
          {},
          { auth: true }
        );
        if (resp.ok) {
          const json = await resp.json();
          link = json.link || '';
        }
      } catch {}
      const text = link
        ? `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
        : `¡Hola ${guest.name}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
      const deeplink = waDeeplink(toE164Frontend(phone), text);
      window.open(deeplink, '_blank');
    },
    [utils, activeWedding]
  );

  const inviteSelectedWhatsAppDeeplink = useCallback(
    async (selectedIds = [], customMessage) => {
      const setIds = new Set(selectedIds || []);
      const targets = guests.filter((g) => setIds.has(g.id) && utils.phoneClean(g.phone));
      let opened = 0;
      for (const guest of targets) {
        try {
          let link = '';
          try {
            const resp = await apiPost(
              `/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`,
              {},
              { auth: true }
            );
            if (resp.ok) {
              const json = await resp.json();
              link = json.link || '';
            }
          } catch {}
          const message =
            customMessage && customMessage.trim()
              ? customMessage
              : link
                ? `¡Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
                : `¡Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
          const phone = toE164Frontend(utils.phoneClean(guest.phone));
          const url = waDeeplink(phone, message);
          window.open(url, '_blank');
          opened++;
          await new Promise((r) => setTimeout(r, 200));
        } catch {}
      }
      return { success: true, opened };
    },
    [guests, utils, activeWedding]
  );

  const inviteSelectedWhatsAppViaExtension = useCallback(
    async (selectedIds = [], customMessage) => {
      const available = await ensureExtensionAvailable(1500);
      if (!available) return { success: false, notAvailable: true };
      const idSet = new Set(selectedIds || []);
      const targets = guests.filter((g) => idSet.has(g.id) && utils.phoneClean(g.phone));
      if (targets.length === 0) return { success: false, error: 'no-targets' };
      const items = [];
      for (const guest of targets) {
        try {
          let link = '';
          try {
            const resp = await apiPost(
              `/api/guests/${activeWedding}/id/${guest.id}/rsvp-link`,
              {},
              { auth: true }
            );
            if (resp.ok) {
              const json = await resp.json();
              link = json.link || '';
            }
          } catch {}
          const msg =
            customMessage && customMessage.trim()
              ? customMessage
              : link
                ? `Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. Confirma tu asistencia aquí: ${link}`
                : `Hola ${guest.name || ''}! Nos encantaría contar contigo en nuestra boda. ¿Puedes confirmar tu asistencia?`;
          const phone = toE164Frontend(utils.phoneClean(guest.phone));
          if (!phone) continue;
          items.push({ to: phone, message: msg });
        } catch {}
      }
      const result = await sendBatchMessages(items, { rateLimitMs: 400 });
      return { success: true, ...result, count: items.length };
    },
    [guests, utils, activeWedding]
  );

  const inviteSelectedWhatsAppBroadcastViaExtension = useCallback(
    async (selectedIds = [], customMessage) => {
      // Implementación placeholder: usa mensajes individuales como fallback
      return inviteSelectedWhatsAppViaExtension(selectedIds, customMessage);
    },
    [inviteSelectedWhatsAppViaExtension]
  );

  // Variantes API/Email: placeholders seguros para mantener la API del hook
  const inviteViaWhatsAppApi = useCallback(
    async (guest, message) => {
      try {
        if (!guest?.phone) {
          return { success: false, error: 'no-phone' };
        }

        const to = utils.phoneClean(guest.phone);
        if (!to) {
          return { success: false, error: 'no-phone' };
        }

        const payload = {
          to,
          message: resolveMessageForGuest(guest, message),
          weddingId: activeWedding || undefined,
          guestId: guest.id || undefined,
          metadata: { guestName: guest.name || '' },
        };

        const resp = await apiPost(`/api/whatsapp/send`, payload, { auth: true });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok || json.success === false) {
          return { success: false, error: json.error || `HTTP ${resp.status}` };
        }
        return { success: true, result: json };
      } catch (e) {
        return { success: false, error: String(e?.message || e) };
      }
    },
    [activeWedding, utils],
  );

  const inviteSelectedWhatsAppApi = useCallback(
    async (selectedIds = [], baseMessage) => {
      try {
        if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
          return { success: false, error: 'no-selection' };
        }

        const idSet = new Set(selectedIds);
        const seen = new Set();
        const items = [];

        (guests || []).forEach((guest) => {
          if (!idSet.has(guest.id)) return;
          const cleaned = utils.phoneClean(guest.phone || '');
          if (!cleaned || seen.has(cleaned)) return;
          seen.add(cleaned);
          items.push({
            to: cleaned,
            message: resolveMessageForGuest(guest, baseMessage),
            guestId: guest.id,
            metadata: { guestName: guest.name || '' },
          });
        });

        if (!items.length) {
          return { success: false, error: 'no-targets' };
        }

        const payload = {
          weddingId: activeWedding || undefined,
          items,
        };

        const resp = await apiPost(`/api/whatsapp/send-batch`, payload, { auth: true });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok || json.success === false) {
          return { success: false, error: json.error || `HTTP ${resp.status}` };
        }

        return {
          success: true,
          ok: json.ok ?? items.length,
          fail: json.fail ?? 0,
          count: json.count ?? items.length,
          result: json,
        };
      } catch (e) {
        return { success: false, error: String(e?.message || e) };
      }
    },
    [guests, utils, activeWedding]
  );

  const bulkInviteWhatsApp = useCallback(async () => ({ success: true, count: 0 }), []);
  const bulkInviteWhatsAppApi = useCallback(async () => {
    try {
      const seen = new Set();
      const items = [];

      (guests || []).forEach((guest) => {
        const cleaned = utils.phoneClean(guest.phone || '');
        if (!cleaned || seen.has(cleaned)) return;
        seen.add(cleaned);
        items.push({
          to: cleaned,
          message: resolveMessageForGuest(guest),
          guestId: guest.id,
          metadata: { guestName: guest.name || '' },
        });
      });

      if (!items.length) {
        return { success: false, error: 'no-targets' };
      }

      const payload = { weddingId: activeWedding || undefined, items };
      const resp = await apiPost(`/api/whatsapp/send-batch`, payload, { auth: true });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json.success === false) {
        return { success: false, error: json.error || `HTTP ${resp.status}` };
      }

      return {
        success: true,
        count: json.count ?? items.length,
        ok: json.ok ?? items.length,
        fail: json.fail ?? 0,
        result: json,
      };
    } catch (e) {
      return { success: false, error: String(e?.message || e) };
    }
  }, [guests, utils, activeWedding]);
  const inviteViaEmail = useCallback(async () => ({ success: true }), []);
  const importFromContacts = useCallback(
    async () => ({ success: false, error: 'not-implemented' }),
    []
  );
  const inviteViaWhatsAppDeeplinkCustom = useCallback(
    async (guest, customMessage) => {
      const phone = utils.phoneClean(guest.phone);
      if (!phone) return { success: false, error: 'no-phone' };
      const text = customMessage?.trim() || `¡Hola ${guest.name || ''}!`;
      const deeplink = waDeeplink(toE164Frontend(phone), text);
      window.open(deeplink, '_blank');
      return { success: true };
    },
    [utils]
  );

  // Exportación CSV
  const exportToCSV = useCallback(() => {
    if (guests.length === 0) {
      alert('No hay invitados para exportar');
      return;
    }
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Dirección',
      'Estado',
      'Mesa',
      'Acompañantes',
      'Restricciones Dietéticas',
      'Notas',
    ];
    const csvContent = [
      headers.join(','),
      ...guests.map((guest) =>
        [
          `"${guest.name || ''}"`,
          `"${guest.email || ''}"`,
          `"${guest.phone || ''}"`,
          `"${guest.address || ''}"`,
          `"${utils.getStatusLabel(guest)}"`,
          `"${guest.table || ''}"`,
          guest.companion || 0,
          `"${guest.dietaryRestrictions || ''}"`,
          `"${guest.notes || ''}"`,
        ].join(',')
      ),
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

  // Filtros helpers
  const updateFilters = useCallback(
    (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters })),
    []
  );
  const clearFilters = useCallback(
    () => setFilters({ search: '', status: '', table: '', group: '' }),
    []
  );

  return {
    // Datos
    guests,
    filteredGuests,
    stats,
    filters,
    isLoading,
    error: collectionError,
    reload,

    // Gestión
    addGuest,
    updateGuest,
    removeGuest,

    // Invitaciones
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

    // Exportación
    exportToCSV,

    // Filtros
    updateFilters,
    clearFilters,

    // Utilidades
    utils,
  };
};

export default useGuests;

