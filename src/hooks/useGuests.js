import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import useWeddingCollection from './useWeddingCollection';
import useActiveWeddingInfo from './useActiveWeddingInfo';
import { useWedding } from '../context/WeddingContext';
import { guestSchema, guestUpdateSchema } from '../schemas/guest';
import { post as apiPost } from '../services/apiClient';
import { ensureExtensionAvailable, sendBatchMessages } from '../services/whatsappBridge';
import { toE164 as toE164Frontend, waDeeplink } from '../services/whatsappService';
import { renderInviteMessage, getInviteTemplate } from '../services/MessageTemplateService';
import { sendMail } from '../services/emailService';

const applyPlaceholders = (template = '', context = {}) => {
  const guestName = context.guestName || '';
  const coupleName = context.coupleName || 'nuestra boda';
  return template
    .replace(/\{guestName\}/g, guestName)
    .replace(/\{coupleName\}/g, coupleName);
};

const resolveMessageForGuest = (guest, baseMessage, context = {}) => {
  const name = guest?.name || '';
  const template = typeof baseMessage === 'string' ? baseMessage.trim() : '';
  const ctx = { ...context, guestName: name };
  if (template) {
    return applyPlaceholders(template, ctx);
  }
  return renderInviteMessage(name, context);
};

// Hook personalizado para gestión optimizada de invitados
const useGuests = () => {
  // Contexto de boda activa
  let activeWedding;
  let weddingsList = [];
  try {
    const weddingContext = useWedding();
    activeWedding = weddingContext?.activeWedding;
    weddingsList = Array.isArray(weddingContext?.weddings) ? weddingContext.weddings : [];
  } catch (error) {
    console.error('Error accediendo al contexto de bodas en useGuests:', error);
    activeWedding = null;
    weddingsList = [];
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
  const seatingSyncLockRef = useRef(false);

  const broadcastSeatingSync = useCallback((detail = {}) => {
    try {
      window.dispatchEvent(
        new CustomEvent('mywed360-seating-sync', {
          detail: {
            source: 'guests',
            timestamp: Date.now(),
            ...detail,
          },
        })
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[useGuests] broadcastSeatingSync error', error);
      }
    }
  }, []);
  const { info: activeWeddingInfo } = useActiveWeddingInfo();

  const coupleName = useMemo(() => {
    try {
      const info = activeWeddingInfo?.weddingInfo || {};
      const weddingRecord = (weddingsList || []).find((w) => w.id === activeWedding) || {};
      let p1 = '';
      let p2 = '';
      const coupleRaw =
        info.coupleName ||
        weddingRecord.coupleName ||
        weddingRecord.name ||
        info.brideAndGroom ||
        weddingRecord.brideAndGroom ||
        info.nombrePareja ||
        '';
      if (coupleRaw) {
        const parts = String(coupleRaw)
          .trim()
          .split(/\s*&\s*|\s+y\s+/i);
        p1 = (parts[0] || '').trim();
        p2 = (parts[1] || '').trim();
      } else if (info.bride || info.groom || weddingRecord.bride || weddingRecord.groom) {
        p1 = String(info.bride || weddingRecord.bride || '').trim();
        p2 = String(info.groom || weddingRecord.groom || '').trim();
      }
      if (p1 && p2) return `${p1} y ${p2}`;
      return p1 || p2 || 'nuestra boda';
    } catch {
      return 'nuestra boda';
    }
  }, [activeWedding, activeWeddingInfo, weddingsList]);

  const weddingDateLabel = useMemo(() => {
    try {
      const info = activeWeddingInfo?.weddingInfo || {};
      const weddingRecord = (weddingsList || []).find((w) => w.id === activeWedding) || {};
      const raw =
        info.weddingDate ||
        info.date ||
        weddingRecord.weddingDate ||
        weddingRecord.date ||
        info.ceremonyDate ||
        weddingRecord.ceremonyDate ||
        null;
      if (!raw) return '';
      const toDate = (value) => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'string' || typeof value === 'number') {
          const d = new Date(value);
          return Number.isNaN(d.getTime()) ? null : d;
        }
        if (value.seconds) {
          const d = new Date(value.seconds * 1000);
          return Number.isNaN(d.getTime()) ? null : d;
        }
        return null;
      };
      const date = toDate(raw);
      if (!date) return String(raw);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [activeWedding, activeWeddingInfo, weddingsList]);

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
  const [filters, setFilters] = useState({ search: '', status: '', table: '' });

  const filteredGuests = useMemo(() => {
    try {
      const term = (filters.search || '').trim().toLowerCase();
      const status = String(filters.status || '').toLowerCase();
      const table = String(filters.table || '').trim();
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
          group: guestData.table || guestData.group || '',
          companionType: guestData.companionType || 'none',
          id: guestData.id || `guest-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          checkedIn: !!guestData.checkedIn,
          checkedInAt: guestData.checkedIn
            ? guestData.checkedInAt || new Date().toISOString()
            : null,
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
        if (!seatingSyncLockRef.current) {
          broadcastSeatingSync({ guest: newGuest });
        }
        return { success: true, guest: newGuest };
      } catch (error) {
        console.error('Error añadiendo invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [addItem, broadcastSeatingSync]
 );

  const updateGuest = useCallback(
    async (guestId, updates) => {
      const original = guests.find((g) => g.id === guestId);
      const originalTable = original?.table || '';
      try {
        const patch = { ...updates, id: guestId, updatedAt: new Date().toISOString() };
        if (Object.prototype.hasOwnProperty.call(patch, 'table')) {
          patch.group = patch.table || '';
        }
        if (
          Object.prototype.hasOwnProperty.call(patch, 'companionType') &&
          (patch.companionType === undefined || patch.companionType === null)
        ) {
          patch.companionType = 'none';
        }
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
        const mergedGuest = { ...(original || {}), ...updatedGuest };
        if (!seatingSyncLockRef.current) {
          broadcastSeatingSync({ guest: mergedGuest });
        }
        if (updatedGuest.table !== originalTable && updatedGuest.companionGroupId) {
          const companions = guests.filter(
            (g) => g.companionGroupId === updatedGuest.companionGroupId && g.id !== guestId
          );
          for (const comp of companions) {
            await updateItem(comp.id, {
              table: updatedGuest.table,
              group: updatedGuest.table || '',
              updatedAt: new Date().toISOString(),
            });
            if (!seatingSyncLockRef.current) {
              broadcastSeatingSync({
                guest: {
                  ...comp,
                  table: updatedGuest.table,
                  group: updatedGuest.table || '',
                },
              });
            }
          }
        }
        return { success: true, guest: updatedGuest };
      } catch (error) {
        console.error('Error actualizando invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [broadcastSeatingSync, guests, updateItem]
 );

  const removeGuest = useCallback(
    async (guestId) => {
      try {
        await deleteItem(guestId);
        if (!seatingSyncLockRef.current) {
          broadcastSeatingSync({ removed: true, guestId });
        }
        return { success: true };
      } catch (error) {
        console.error('Error eliminando invitado:', error);
        return { success: false, error: error.message };
      }
    },
    [broadcastSeatingSync, deleteItem]
  );

  useEffect(() => {
    const handler = (event) => {
      try {
        const detail = event?.detail || {};
        if (detail.source !== 'seating') return;
        const payloadGuest = detail.guest;
        if (payloadGuest && payloadGuest.id) {
          seatingSyncLockRef.current = true;
          updateGuest(payloadGuest.id, {
            table: payloadGuest.table || '',
            companionGroupId: payloadGuest.companionGroupId || '',
          }).finally(() => {
            seatingSyncLockRef.current = false;
          });
        }
        if (detail.removed && detail.guestId) {
          seatingSyncLockRef.current = true;
          removeGuest(detail.guestId).finally(() => {
            seatingSyncLockRef.current = false;
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useGuests] seating sync handler error', err);
        }
      }
    };
    window.addEventListener('mywed360-seating-sync', handler);
    return () => window.removeEventListener('mywed360-seating-sync', handler);
  }, [removeGuest, updateGuest]);

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
    async (guest, message, options = {}) => {
      try {
        if (!guest?.phone) {
          return { success: false, error: 'no-phone' };
        }

        const to = utils.phoneClean(guest.phone);
        if (!to) {
          return { success: false, error: 'no-phone' };
        }

        const {
          coupleName = '',
          assetUrl,
          deliveryChannel = 'whatsapp',
          metadata = {},
          type = 'direct_invite',
        } = options || {};
        const rendered = resolveMessageForGuest(guest, message, { coupleName });
        if (coupleName && !rendered.toLowerCase().includes(coupleName.toLowerCase())) {
          return { success: false, error: 'missing-couple-signature' };
        }

        const payload = {
          to,
          message: rendered,
          weddingId: activeWedding || undefined,
          guestId: guest.id || undefined,
          deliveryChannel,
          assetUrl: assetUrl || undefined,
          metadata: {
            guestName: guest.name || '',
            type,
            deliveryChannel,
            ...metadata,
          },
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
    async (selectedIds = [], baseMessage, options = {}) => {
      try {
        if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
          return { success: false, error: 'no-selection' };
        }

        const idSet = new Set(selectedIds);
        const seen = new Set();
        const items = [];
        const {
          coupleName = '',
          assetUrl,
          deliveryChannel = 'whatsapp',
          metadata = {},
          type = 'bulk_invite',
        } = options || {};
        let missingSignature = false;

        (guests || []).forEach((guest) => {
          if (!idSet.has(guest.id)) return;
          const cleaned = utils.phoneClean(guest.phone || '');
          if (!cleaned || seen.has(cleaned)) return;
          seen.add(cleaned);
          const message = resolveMessageForGuest(guest, baseMessage, { coupleName });
          if (coupleName && !message.toLowerCase().includes(coupleName.toLowerCase())) {
            missingSignature = true;
          }
          items.push({
            to: cleaned,
            message,
            guestId: guest.id,
            assetUrl: assetUrl || guest.whatsappAssetUrl || undefined,
            deliveryChannel,
            metadata: {
              guestName: guest.name || '',
              type,
              deliveryChannel,
              ...metadata,
            },
          });
        });

        if (!items.length) {
          return { success: false, error: 'no-targets' };
        }
        if (missingSignature) {
          return { success: false, error: 'missing-couple-signature' };
        }

        const payload = {
          weddingId: activeWedding || undefined,
          deliveryChannel,
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
  const bulkInviteWhatsAppApi = useCallback(async (options = {}) => {
    try {
      const seen = new Set();
      const items = [];
      const {
        coupleName = '',
        baseMessage,
        assetUrl,
        deliveryChannel = 'whatsapp',
        metadata = {},
        type = 'formal_invite',
        targetIds,
      } = options || {};
      const idSet = targetIds ? new Set(targetIds) : null;
      let missingSignature = false;

      (guests || []).forEach((guest) => {
        if (idSet && !idSet.has(guest.id)) return;
        const cleaned = utils.phoneClean(guest.phone || '');
        if (!cleaned || seen.has(cleaned)) return;
        seen.add(cleaned);
        const message = resolveMessageForGuest(guest, baseMessage, { coupleName });
        if (coupleName && !message.toLowerCase().includes(coupleName.toLowerCase())) {
          missingSignature = true;
        }
        items.push({
          to: cleaned,
          message,
          guestId: guest.id,
          assetUrl: assetUrl || guest.whatsappAssetUrl || undefined,
          deliveryChannel,
          metadata: {
            guestName: guest.name || '',
            type,
            deliveryChannel,
            ...metadata,
          },
        });
      });

      if (!items.length) {
        return { success: false, error: 'no-targets' };
      }
      if (missingSignature) {
        return { success: false, error: 'missing-couple-signature' };
      }

      const payload = {
        weddingId: activeWedding || undefined,
        deliveryChannel,
        items,
      };
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
  const inviteViaEmail = useCallback(
    async (guest, overrides = {}) => {
      try {
        const target = guest || overrides.guest;
        if (!target || !target.email) {
          return { success: false, error: 'no-email' };
        }
        const templateSubject =
          overrides.subject || 'Invitación a la boda de {coupleName}';
        const subject = templateSubject.replace('{coupleName}', coupleName);
        const renderedBody = renderInviteMessage(target.name || '', {
          coupleName,
        });
        const extraParagraphs = [];
        if (weddingDateLabel) {
          extraParagraphs.push(`Fecha: ${weddingDateLabel}`);
        }
        if (overrides.extraMessage) {
          extraParagraphs.push(overrides.extraMessage);
        }
        const htmlBody =
          (overrides.body || '')
            .trim()
            .replace('{guestName}', target.name || '') ||
          [
            `<p>${renderedBody}</p>`,
            ...extraParagraphs.map((text) => `<p>${text}</p>`),
          ]
            .filter(Boolean)
            .join('\n');
        const attachments = [];
        const assetUrl = overrides.assetUrl || target.whatsappAssetUrl;
        if (assetUrl) {
          attachments.push({
            name: overrides.assetName || `Invitacion-${target.name || 'invitado'}.pdf`,
            url: assetUrl,
            type: 'application/pdf',
          });
        }
        const result = await sendMail({
          to: target.email,
          subject,
          body: htmlBody || getInviteTemplate(),
          attachments,
        });
        if (result?.success === false) {
          return { success: false, error: result.error || 'send-email-failed' };
        }
        if (target.id) {
          await updateGuest(target.id, {
            deliveryChannel: 'email',
            deliveryStatus: 'email_sent',
          });
        }
        return { success: true, result };
      } catch (error) {
        return { success: false, error: error?.message || 'send-email-failed' };
      }
    },
    [coupleName, updateGuest, weddingDateLabel]
  );
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

  // Filtros helpers
  const updateFilters = useCallback(
    (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters })),
    []
 );
  const clearFilters = useCallback(() => setFilters({ search: '', status: '', table: '' }), []);

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

    // Filtros
    updateFilters,
    clearFilters,

    // Utilidades
    utils,
  };
};

export default useGuests;






