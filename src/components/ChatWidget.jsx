import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { MessageSquare } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import Spinner from './Spinner';
import { useAuth } from '../hooks/useAuth';
import { useWedding } from '../context/WeddingContext';
import useTranslations from '../hooks/useTranslations';
import {
  EVENT_STYLE_OPTIONS,
  GUEST_COUNT_OPTIONS,
  FORMALITY_OPTIONS,
  CEREMONY_TYPE_OPTIONS,
} from '../config/eventStyles';
import { post as apiPost } from '../services/apiClient';
import { getBackendBase } from '../utils/backendBase';

// --- Modo debug opcional ---
// Actívalo desde la consola con: (window.mywed360Debug || window.lovendaDebug) = true
const chatDebug = (...args) => {
  if (typeof window !== 'undefined' && (window.mywed360Debug || window.lovendaDebug)) {
    // eslint-disable-next-line no-console
    console.debug('[ChatWidget]', ...args);
  }
};

// --- Configuración de memoria conversacional ---
const MAX_MESSAGES = 50; // Cuántos mensajes â€œfrescosâ€ mantener en memoria corta
const SHORT_HISTORY = 6; // Cuántos mensajes recientes se envían a la IA
const IS_CYPRESS_E2E = typeof window !== 'undefined' && !!window.Cypress;

// Función para normalizar texto de categoría: elimina acentos y convierte a mayúsculas
const normalizeCategory = (cat = 'OTROS') =>
  cat
    .normalize('NFD')
    .replace(/[^\w\s]|_/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
// Intenta adivinar la categoría en base al título/descripcion de la tarea
const guessCategory = (title = '') => {
  const t = title.toLowerCase();
  if (/lugar|finca|sal[oó]n/.test(t)) return 'LUGAR';
  if (/foto|fot[oó]graf/.test(t)) return 'FOTOGRAFO';
  if (/m[uú]sica|dj|banda/.test(t)) return 'MUSICA';
  if (/vestido|traje|vestuari|zapato/.test(t)) return 'VESTUARIO';
  if (/catering|banquete|men[uú]/.test(t)) return 'CATERING';
  return 'OTROS';
};

export default function ChatWidget() {
  if (IS_CYPRESS_E2E) return null;

  const { t, tVars, tPlural } = useTranslations();
  const { user: _user, getIdToken } = useAuth();
  const { activeWeddingData } = useWedding();
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem('chatOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chatMessages') || '[]');
    } catch {
      return [];
    }
  });
  const [summary, setSummary] = useState(() => {
    try {
      return localStorage.getItem('chatSummary') || '';
    } catch {
      return '';
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const eventContext = React.useMemo(() => {
    if (!activeWeddingData) return null;
    const profile = activeWeddingData.eventProfile || activeWeddingData.eventProfileSummary || {};
    const preferences = activeWeddingData.preferences || {};
    const findLabel = (options, value) => {
      if (!value) return null;
      const match = options.find((opt) => opt.value === value);
      return match ? match.label : value;
    };
    const styleValue = preferences.style || profile.style || null;
    return {
      weddingId: activeWeddingData.id || null,
      name: activeWeddingData.name || '',
      eventType: activeWeddingData.eventType || profile.eventType || 'boda',
      weddingDate: activeWeddingData.weddingDate || '',
      location: activeWeddingData.location || '',
      guestCountRange: profile.guestCountRange || null,
      guestCountLabel: findLabel(GUEST_COUNT_OPTIONS, profile.guestCountRange || null),
      formalityLevel: profile.formalityLevel || null,
      formalityLabel: findLabel(FORMALITY_OPTIONS, profile.formalityLevel || null),
      ceremonyType: profile.ceremonyType || null,
      ceremonyLabel: findLabel(CEREMONY_TYPE_OPTIONS, profile.ceremonyType || null),
      relatedEvents: Array.isArray(profile.relatedEvents) ? profile.relatedEvents : [],
      style: styleValue || null,
      styleLabel: findLabel(EVENT_STYLE_OPTIONS, styleValue || null),
    };
  }, [activeWeddingData]);

  const toggleImportant = (idx) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], important: !copy[idx].important };
      if (copy[idx].important) {
        try {
          const notes = JSON.parse(localStorage.getItem('importantNotes') || '[]');
          notes.push({ text: copy[idx].text, date: Date.now() });
          localStorage.setItem('importantNotes', JSON.stringify(notes));
          window.dispatchEvent(new Event('maloveapp-important-note'));
          toast.success(t('chat.noteMarked'));
        } catch {
          /* ignore */
        }
      }
      return copy;
    });
  };

  useEffect(() => {
    localStorage.setItem('chatOpen', JSON.stringify(open));
  }, [open]);

  // Persistir resumen entre sesiones
  useEffect(() => {
    localStorage.setItem('chatSummary', summary);
  }, [summary]);

  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // --- Utilidad para compactar mensajes y moverlos al resumen ---
  const compactMessages = (arr) => {
    if (arr.length <= MAX_MESSAGES) return arr;
    const excess = arr.length - MAX_MESSAGES;
    const toSummarize = arr.slice(0, excess);
    const rest = arr.slice(excess);
    const summaryPart = toSummarize
      .map((m) => `${m.from === 'user' ? t('chat.messages.user') : t('chat.messages.assistant')}: ${m.text}`)
      .join('\n');
    setSummary((prev) => (prev ? `${prev}\n${summaryPart}` : summaryPart));
    return rest;
  };

  // Parser local muy básico para comandos en español (fallback sin backend)
  /* eslint-disable no-useless-escape */
  const parseLocalCommands = (text) => {
    try {
      const t = String(text || '');
      const out = { commands: [], reply: '' };
      const has = (re) => re.test(t);

      // Reprogramar reuniones: "reprograma/mueve/cambia la reunión ... al 20/10 a las 11:00"
      if (has(/(reprogram|reagend|mueve|cambia|pospon|adelant)/i) && has(/reuni[oó]n|cita|llamada|meeting/i)) {
        const titleMatch =
          t.match(/reuni[oó]n\s+(?:de\s+|sobre\s+)?([^\n,.]+?)(?:\s+(?:al|para|el)\s+|\s+a\s+las|[\.,]|$)/i) ||
          t.match(/(?:sobre|para|con)\s+([^\n,.]+)(?:[\.,]|$)/i);
        const title = (titleMatch ? titleMatch[1] : '').trim();

        const now = new Date();
        let start = null;
        let end = null;
        const rel = t.match(/\b(hoy|ma(?:n|ñ)ana|pasado\s+ma(?:n|ñ)ana)\b.*?(?:a\s+las\s+)?(\d{1,2})(?::|h|\.|,)?(\d{2})?/i);
        if (rel) {
          const base = new Date();
          const kw = (rel[1] || '').toLowerCase();
          if (kw.includes('pasado')) base.setDate(base.getDate() + 2);
          else if (kw.includes('ma') && !kw.includes('pasado')) base.setDate(base.getDate() + 1);
          const hh = Math.max(0, Math.min(23, parseInt(rel[2], 10)));
          const mm = rel[3] ? Math.max(0, Math.min(59, parseInt(rel[3], 10))) : 0;
          base.setHours(hh, mm, 0, 0);
          start = base;
          end = new Date(base.getTime() + 60 * 60 * 1000);
        }
        const abs = t.match(/\bel\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?:\s+a\s+las\s+(\d{1,2})(?::|h|\.|,)?(\d{2})?)?/i) ||
                    t.match(/\bal\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?:\s+a\s+las\s+(\d{1,2})(?::|h|\.|,)?(\d{2})?)?/i);
        if (!start && abs) {
          const d = parseInt(abs[1], 10);
          const m = parseInt(abs[2], 10) - 1;
          const y = abs[3] ? parseInt(abs[3], 10) : now.getFullYear();
          const hh = abs[4] ? parseInt(abs[4], 10) : 10;
          const mm = abs[5] ? parseInt(abs[5], 10) : 0;
          const base = new Date(y < 100 ? 2000 + y : y, m, d, hh, mm, 0, 0);
          start = base;
          end = new Date(base.getTime() + 60 * 60 * 1000);
        }
        if (start) {
          out.commands.push({
            entity: 'meeting',
            action: 'update',
            payload: { title: title || 'Reunión', start: start.toISOString(), end: end.toISOString() },
          });
          out.reply = `Reunión${title ? ` "${title}"` : ''} reprogramada al ${start.toLocaleDateString('es-ES')} ${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`;
          return out;
        }
      }

      return null;
    } catch (_) {
      return null;
    }
  };
  /* eslint-enable no-useless-escape */

  const buildLocalFallbackResponse = (text = '', context = null) => {
    const lower = String(text || '').toLowerCase();
    const fallback = { extracted: {}, reply: '' };
    const baseKind =
      context?.eventType && context.eventType !== 'boda' ? t('chat.defaults.event') : t('chat.defaults.wedding');
    const styleLabel = context?.styleLabel || context?.style || '';
    const descriptorParts = [];
    if (styleLabel) descriptorParts.push(`de estilo ${styleLabel}`);
    if (context?.location) descriptorParts.push(`en ${context.location}`);
    const descriptor = descriptorParts.length ? ` ${descriptorParts.join(' ')}` : '';
    const subject = `tu ${baseKind}${descriptor}`.trim();
    const subjectDisplay = subject || t('chat.defaults.yourPlanning');

    if (!lower.trim()) {
      fallback.reply = tVars('chat.messages.emptyPrompt', { subject: subjectDisplay });
      return fallback;
    }

    if (/\b(hola|buen[oa]s|saludos)\b/i.test(lower)) {
      fallback.reply = tVars('chat.messages.greeting', { subject: subjectDisplay });
      return fallback;
    }

    if (lower.includes('proveedor') || lower.includes('fotogra') || lower.includes('catering')) {
      fallback.reply = tVars('chat.guides.suppliers', { subject: subjectDisplay });
      return fallback;
    }

    if (lower.includes('presupuesto') || lower.includes('gasto') || lower.includes('dinero')) {
      fallback.reply = tVars('chat.guides.finance', { subject: subjectDisplay });
      return fallback;
    }

    if (lower.includes('invitad') || lower.includes('rsvp')) {
      fallback.reply = tVars('chat.guides.guests', { subject: subjectDisplay });
      return fallback;
    }

    if (lower.includes('mesa') || lower.includes('seating')) {
      fallback.reply = tVars('chat.guides.seating', { subject: subjectDisplay });
      return fallback;
    }

    if (lower.includes('tarea') || lower.includes('pendiente')) {
      fallback.reply = tVars('chat.guides.tasks', { subject: subjectDisplay });
      return fallback;
    }

    fallback.reply = tVars('chat.messages.offlineMode', { subject: subjectDisplay });
    return fallback;
  };

  // Utilidad para aplicar comandos de la IA
  const applyCommands = async (commands = []) => {
    if (!commands.length) return;
    let meetings = JSON.parse(localStorage.getItem('mywed360Meetings') || '[]');
    let completed = JSON.parse(localStorage.getItem('tasksCompleted') || '{}');
    let changed = false;

    const findTaskIndex = (identifier) => {
      const idxById = meetings.findIndex((m) => m.id === identifier);
      if (idxById !== -1) return idxById;
      return meetings.findIndex((m) => m.title?.toLowerCase() === identifier?.toLowerCase());
    };

    commands.forEach(async (cmd) => {
      const { entity, action, payload = {} } = cmd;
      if (entity === 'task' || entity === 'meeting') {
        switch (action) {
          case 'add': {
            // asegurar id único
            const newId = payload.id || `ai-${Date.now()}`;
            const startDate = payload.start ? new Date(payload.start) : new Date();
            const endDate = payload.end ? new Date(payload.end) : startDate;
            meetings.push({
              id: newId,
              title: payload.title || payload.name || (entity === 'task' ? t('chat.defaults.task') : t('chat.defaults.meeting')),
              name: payload.title || payload.name || (entity === 'task' ? t('chat.defaults.task') : t('chat.defaults.meeting')),
              desc: payload.desc || '',
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              type: entity,
              category: normalizeCategory(
                payload.category || guessCategory(payload.title || payload.name || '')
              ),
            });
            // Persistir también en Firestore a través del puente de eventos
            try {
              const base = {
                id: newId,
                title: payload.title || payload.name || (entity === 'task' ? t('chat.defaults.task') : t('chat.defaults.meeting')),
                name: payload.title || payload.name || (entity === 'task' ? t('chat.defaults.task') : t('chat.defaults.meeting')),
                desc: payload.desc || '',
                start: startDate,
                end: endDate,
                type: entity,
                category: normalizeCategory(
                  payload.category || guessCategory(payload.title || payload.name || '')
                ),
              };
              const detail = entity === 'meeting' ? { meeting: base } : { task: base };
              window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail }));
            } catch (_) {}
            toast.success(entity === 'task' ? t('chat.commands.taskAdded') : t('chat.commands.meetingAdded'));
            changed = true;
            break;
          }
          case 'update':
          case 'edit':
          case 'editar':
          case 'modificar': {
            const idx = findTaskIndex(payload.id || payload.title);
            if (idx !== -1) {
              meetings[idx] = { ...meetings[idx], ...payload };
              // normalizar fechas si vienen en Date
              if (meetings[idx].start instanceof Date)
                meetings[idx].start = meetings[idx].start.toISOString();
              if (meetings[idx].end instanceof Date)
                meetings[idx].end = meetings[idx].end.toISOString();
              toast.success(t('chat.commands.taskUpdated'));
              // Bridge: update en Firestore
              try {
                const base = {
                  id: meetings[idx].id,
                  title: meetings[idx].title,
                  desc: meetings[idx].desc,
                  start: new Date(meetings[idx].start),
                  end: new Date(meetings[idx].end),
                  category: meetings[idx].category,
                };
                const detail = entity === 'meeting' ? { meeting: base, action: 'update' } : { task: base, action: 'update' };
                window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail }));
              } catch (_) {}
              changed = true;
            }
            break;
          }
          case 'delete':
          case 'remove': {
            const before = meetings.length;
            meetings = meetings.filter(
              (m) =>
                !(m.id === payload.id || m.title?.toLowerCase() === payload.title?.toLowerCase())
            );
            if (meetings.length < before) {
              toast.success(t('chat.commands.taskDeleted'));
              // Bridge: delete en Firestore
              try {
                const base = { id: payload.id || null, title: payload.title || '' };
                const detail = entity === 'meeting' ? { meeting: base, action: 'delete' } : { task: base, action: 'delete' };
                window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail }));
              } catch (_) {}
              changed = true;
            }
            break;
          }
          case 'complete':
          case 'done': {
            if (payload.done === false) break;
            const idx = findTaskIndex(payload.id || payload.title);
            if (idx !== -1) {
              completed[meetings[idx].id] = true;
              toast.success(t('chat.commands.taskCompleted'));
              // Bridge: complete en Firestore (tasksCompleted)
              try {
                const base = { id: meetings[idx].id, title: meetings[idx].title };
                const detail = entity === 'meeting' ? { meeting: base, action: 'complete' } : { task: base, action: 'complete' };
                window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail }));
              } catch (_) {}
              changed = true;
            }
            break;
          }
          default:
            break;
        }
      } else if (entity === 'guest') {
        // ----- GUESTS LOGIC -----
        let guests = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
        let changedG = false;
        const findGuestIdx = (identifier) => {
          const idxById = guests.findIndex((g) => g.id === identifier);
          if (idxById !== -1) return idxById;
          return guests.findIndex((g) => g.name?.toLowerCase() === identifier?.toLowerCase());
        };
        switch (action) {
          case 'add': {
            const newId = payload.id || `guest-${Date.now()}`;
            const guestObj = {
              id: newId,
              name: payload.name || t('chat.defaults.guest'),
              phone: payload.phone || '',
              address: payload.address || '',
              companion: payload.companion ?? payload.companions ?? 0,
              table: payload.table || '',
              response: payload.response || t('chat.defaults.pending'),
            };
            guests.push(guestObj);
            // Intentar persistir a Firestore vía puente de eventos
            try {
              window.dispatchEvent(
                new CustomEvent('maloveapp-guests', { detail: { guest: { ...guestObj } } })
              );
            } catch (_) {}
            toast.success(t('chat.commands.guestAdded'));
            changedG = true;
            break;
          }
          case 'update':
          case 'edit':
          case 'editar':
          case 'modificar': {
            const idx = findGuestIdx(payload.id || payload.name);
            if (idx !== -1) {
              guests[idx] = { ...guests[idx], ...payload };
              toast.success(t('chat.commands.guestUpdated'));
              // Bridge: update invitado
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-guests', { detail: { guest: { ...guests[idx] }, action: 'update' } })
                );
              } catch (_) {}
              changedG = true;
            }
            break;
          }
          case 'delete':
          case 'remove': {
            const before = guests.length;
            guests = guests.filter(
              (g) => !(g.id === payload.id || g.name?.toLowerCase() === payload.name?.toLowerCase())
            );
            if (guests.length < before) {
              toast.success(t('chat.commands.guestDeleted'));
              // Bridge: delete invitado
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-guests', { detail: { guest: { id: payload.id || null, name: payload.name || '' }, action: 'delete' } })
                );
              } catch (_) {}
              changedG = true;
            }
            break;
          }
          default:
            break;
        }
        if (changedG) {
          localStorage.setItem('mywed360Guests', JSON.stringify(guests));
          window.dispatchEvent(new Event('maloveapp-guests'));
        }
      } else if (
        entity === 'movement' ||
        entity === 'movimiento' ||
        entity === 'gasto' ||
        entity === 'ingreso'
      ) {
        // ----- MOVEMENTS LOGIC -----
        let movements = JSON.parse(localStorage.getItem('mywed360Movements') || '[]');
        let changedM = false;
        const findMovIdx = (identifier) => {
          const idxById = movements.findIndex((m) => m.id === identifier);
          if (idxById !== -1) return idxById;
          return movements.findIndex((m) => m.name?.toLowerCase() === identifier?.toLowerCase());
        };
        switch (action) {
          case 'add': {
            const newId = payload.id || `mov-${Date.now()}`;
            const mov = {
              id: newId,
              name: payload.concept || payload.name || t('chat.defaults.movement'),
              amount: Number(payload.amount) || 0,
              date: payload.date || new Date().toISOString().slice(0, 10),
              type: payload.type === 'income' ? 'income' : 'expense',
            };
            movements.push(mov);
            // Persistir vía puente de finanzas
            try {
              window.dispatchEvent(
                new CustomEvent('maloveapp-finance', { detail: { movement: { ...mov }, action: 'add' } })
              );
            } catch (_) {}
            toast.success(t('chat.commands.movementAdded'));
            changedM = true;
            break;
          }
          case 'update':
          case 'edit':
          case 'editar':
          case 'modificar': {
            const idx = findMovIdx(payload.id || payload.concept || payload.name);
            if (idx !== -1) {
              movements[idx] = { ...movements[idx], ...payload };
              toast.success(t('chat.commands.movementUpdated'));
              // Persistir vía puente de finanzas
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-finance', {
                    detail: { movement: { ...movements[idx] }, action: 'update' },
                  })
                );
              } catch (_) {}
              changedM = true;
            }
            break;
          }
          case 'delete':
          case 'remove': {
            const before = movements.length;
            movements = movements.filter(
              (m) =>
                !(
                  m.id === payload.id ||
                  m.name?.toLowerCase() === (payload.concept || payload.name)?.toLowerCase()
                )
            );
            if (movements.length < before) {
              toast.success(t('chat.commands.movementDeleted'));
              // Persistir vía puente de finanzas (delete)
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-finance', {
                    detail: {
                      movement: { id: payload.id || null, name: payload.concept || payload.name || '' },
                      action: 'delete',
                    },
                  })
                );
              } catch (_) {}
              changedM = true;
            }
            break;
          }
          default:
            break;
        }
        if (changedM) {
          localStorage.setItem('mywed360Movements', JSON.stringify(movements));
          window.dispatchEvent(new Event('maloveapp-movements'));
        }
      } else if (entity === 'supplier') {
        // ----- SUPPLIER LOGIC -----
        if (action === 'search') {
          const query = payload.query || payload.q || payload.keyword || payload.term || '';
          if (query) {
            try {
              // Resolver base del backend de forma unificada
      const baseFromEnv = (import.meta?.env?.VITE_BACKEND_BASE_URL || '').toString();
      const resolvedBase = (baseFromEnv || getBackendBase() || '').replace(/\/$/, '');
      const apiBase = resolvedBase || 'http://localhost:4004';
      const resp = await fetch(`${apiBase}/api/ai/search-suppliers?q=${encodeURIComponent(query)}`);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const dataS = await resp.json();
      if (Array.isArray(dataS.results) && dataS.results.length) {
        localStorage.setItem('mywed360Suppliers', JSON.stringify(dataS.results));
        window.dispatchEvent(new Event('maloveapp-suppliers'));
        toast.success(tVars('chat.commands.suppliersFound', { count: dataS.results.length }));
      } else {
        toast.info(t('chat.commands.suppliersNotFound'));
      }
    } catch (err) {
      toast.error(t('chat.commands.suppliersSearchError'));
    }
          }
        } else if (action === 'add') {
          const newId = payload.id || `sup-${Date.now()}`;
          const supplier = {
            id: newId,
            name: payload.name || payload.title || payload.provider || t('chat.defaults.supplier'),
            service: payload.service || payload.category || '',
            contact: payload.contact || '',
            email: payload.email || '',
            phone: payload.phone || '',
            link: payload.link || payload.website || payload.url || '',
            status: payload.status || t('common.status.new'),
            snippet: payload.snippet || payload.desc || '',
          };
          try {
            const stored = JSON.parse(localStorage.getItem('mywed360Suppliers') || '[]');
            localStorage.setItem('mywed360Suppliers', JSON.stringify([supplier, ...stored]));
            window.dispatchEvent(new Event('maloveapp-suppliers'));
          } catch {}
          try {
            window.dispatchEvent(
              new CustomEvent('maloveapp-suppliers', { detail: { supplier: { ...supplier }, action: 'add' } })
            );
          } catch {}
          toast.success(t('chat.commands.supplierAdded'));
        } else if (action === 'update' || action === 'edit' || action === 'editar' || action === 'modificar') {
          try {
            const stored = JSON.parse(localStorage.getItem('mywed360Suppliers') || '[]');
            const findIdx = (idOrName) => {
              const byId = stored.findIndex((s) => s.id === idOrName);
              if (byId !== -1) return byId;
              return stored.findIndex((s) => s.name?.toLowerCase() === String(idOrName || '').toLowerCase());
            };
            const idx = findIdx(payload.id || payload.name || payload.title || payload.provider);
            if (idx !== -1) {
              const updated = { ...stored[idx], ...payload };
              stored[idx] = updated;
              localStorage.setItem('mywed360Suppliers', JSON.stringify(stored));
              window.dispatchEvent(new Event('maloveapp-suppliers'));
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-suppliers', {
                    detail: { supplier: { ...updated }, action: 'update' },
                  })
                );
              } catch {}
              toast.success(t('chat.commands.supplierUpdated'));
            }
          } catch {}
        } else if (action === 'delete' || action === 'remove') {
          try {
            const stored = JSON.parse(localStorage.getItem('mywed360Suppliers') || '[]');
            const before = stored.length;
            const filtered = stored.filter(
              (s) => !(
                s.id === payload.id || s.name?.toLowerCase() === String(payload.name || payload.title || payload.provider || '').toLowerCase()
              )
            );
            if (filtered.length < before) {
              localStorage.setItem('mywed360Suppliers', JSON.stringify(filtered));
              window.dispatchEvent(new Event('maloveapp-suppliers'));
              try {
                window.dispatchEvent(
                  new CustomEvent('maloveapp-suppliers', {
                    detail: { supplier: { id: payload.id || null, name: payload.name || payload.title || payload.provider || '' }, action: 'delete' },
                  })
                );
              } catch {}
              toast.success(t('chat.commands.supplierDeleted'));
            }
          } catch {}
        }
      } else if (entity === 'table') {
        // ----- TABLE MOVE LOGIC -----
        let guests = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
        let changedT = false;
        const idx = guests.findIndex(
          (g) =>
            g.id === payload.guestId ||
            g.id === payload.guest ||
            g.name?.toLowerCase() ===
              (payload.guestName || payload.name || payload.guest)?.toLowerCase()
        );
        if (idx !== -1 && payload.table) {
          guests[idx].table = payload.table;
          toast.success(tVars('chat.commands.guestMoved', { table: payload.table }));
          changedT = true;
          // Bridge: update mesa
          try {
            window.dispatchEvent(
              new CustomEvent('maloveapp-guests', {
                detail: { guest: { ...guests[idx] }, action: 'update' },
              })
            );
          } catch (_) {}
        }
        if (changedT) {
          localStorage.setItem('mywed360Guests', JSON.stringify(guests));
          window.dispatchEvent(new Event('maloveapp-guests'));
        }
      } else if (entity === 'config') {
        // ----- CONFIG LOGIC -----
        let profile = {};
        try {
          profile = JSON.parse(localStorage.getItem('mywed360Profile') || '{}');
        } catch {
          profile = {};
        }
        profile = { ...profile };
        if (!profile.weddingInfo) profile.weddingInfo = {};
        // merge payload into weddingInfo at top level too (for generic)
        profile.weddingInfo = { ...profile.weddingInfo, ...payload };
        Object.assign(profile, payload.root || {});
        localStorage.setItem('mywed360Profile', JSON.stringify(profile));
        window.dispatchEvent(new Event('maloveapp-profile'));
        toast.success(t('chat.commands.configUpdated'));
      }
    });

    if (changed) {
      localStorage.setItem('mywed360Meetings', JSON.stringify(meetings));
      localStorage.setItem('tasksCompleted', JSON.stringify(completed));
      window.dispatchEvent(new Event('maloveapp-tasks'));
    }
  };

  const sendMessage = async () => {
    if (!input) return;
    const userMsg = { from: 'user', text: input };
    const currentMsgs = compactMessages([...messages, userMsg]);
    setMessages(currentMsgs);
    setInput('');
    setLoading(true);
    let timeoutId;
    try {
      // Parseo local rápido (reprogramar reunión) para mejor UX sin esperar backend
      const local = parseLocalCommands(input);
      if (local && local.commands && local.commands.length) {
        await applyCommands(local.commands);
        const botMsg = { from: 'bot', text: local.reply || t('chat.messages.changesApplied') };
        setMessages((prev) => compactMessages([...prev, botMsg]));
        setLoading(false);
        return;
      }

      // Obtener URL base del backend (centralizado en utils)
      const apiBase = getBackendBase();
      chatDebug('Usando backend en:', apiBase);

      const endpoint = `${apiBase.replace(/\/$/, '')}/api/ai/parse-dialog`;
      chatDebug('Llamando a la API IA en:', endpoint);
      toast.info(t('chat.connecting'), { autoClose: 2000 });
      const fetchStart = performance.now();

      const recent = currentMsgs
        .slice(-SHORT_HISTORY)
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
      const history = summary ? [{ role: 'system', content: summary }, ...recent] : recent;

      // Implementar timeout para evitar esperas indefinidas
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Timeout en la llamada a la API de IA');
        toast.error(t('chat.errors.timeout') + '. Reintentando con respuesta local...');
      }, 30000); // 30 segundos máximo para mejor UX

      // Obtener token de autenticación usando el sistema unificado
      const token = getIdToken ? await getIdToken() : null;
      if (!token) {
        throw new Error(t('chat.errors.noToken'));
      }

      const response = await apiPost(
        '/api/ai/parse-dialog',
        { text: input, history, context: eventContext },
        { auth: true }
      );

      clearTimeout(timeoutId);
      chatDebug('Duración petición IA:', (performance.now() - fetchStart).toFixed(0), 'ms');

      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        let backendFallback = null;
        try {
          backendFallback = await response.clone().json();
        } catch (_) {}
        const localFallback = buildLocalFallbackResponse(input, eventContext);
        data = {
          extracted: backendFallback?.extracted || localFallback.extracted,
          reply: backendFallback?.reply || localFallback.reply,
          error: backendFallback?.error || `http_${response.status}`,
          details: backendFallback?.details || backendFallback?.message || null,
        };
        console.warn(
          '[ChatWidget] Backend IA respondió',
          response.status,
          response.statusText,
          data.error || '(sin detalle)'
        );
        toast.warn(t('chat.messages.offlineTemporary'), { autoClose: 2500 });
      }

      // Flag para registrar si se aplicó al menos una acción
      let _anyAction = false;

      // Debug: Log completo de la respuesta del backend
      console.log('ðŸ¤– Respuesta completa del backend IA:', data);
      chatDebug('Respuesta del backend:', JSON.stringify(data, null, 2));

      // --- Procesar comandos si existen ---
      if (data.extracted?.commands?.length) {
        await applyCommands(data.extracted.commands);
        _anyAction = true;
      }

      // --- Persistir invitados extraídos ---
      if (data.extracted?.guests?.length) {
        const stored = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
        let nextId = stored.length ? Math.max(...stored.map((g) => g.id)) + 1 : 1;
        const mapped = data.extracted.guests.map((g) => ({
          id: nextId++,
          name: g.name || 'Invitado',
          phone: g.phone || '',
          address: g.address || '',
          companion: g.companions || 0,
          table: g.table || '',
          response: 'Pendiente',
        }));
        const updated = [...stored, ...mapped];
        localStorage.setItem('mywed360Guests', JSON.stringify(updated));
        window.dispatchEvent(new Event('maloveapp-guests'));
        toast.success(tPlural('chat.plurals.guestsAdded', mapped.length));
      }

      // --- Persistir tareas extraídas ---
      if (data.extracted?.tasks?.length) {
        const storedMeetings = JSON.parse(localStorage.getItem('mywed360Meetings') || '[]');
        let nextId = storedMeetings.length ? Date.now() : Date.now();
        const mappedT = data.extracted.tasks.map((t) => {
          // Priorizar campo "due" (ISO), luego date/start/end si vienen de la IA
          const dueIso = t.due || t.date || t.start || t.end;
          const startDate = dueIso ? new Date(dueIso) : new Date();
          const endDate = t.end ? new Date(t.end) : startDate;
          return {
            id: `ai-${nextId++}`,
            title: t.title || t.name || 'Tarea',
            name: t.title || t.name || 'Tarea',
            desc: t.desc || '',
            start: startDate,
            end: endDate,
            type: 'meeting',
            category: normalizeCategory(t.category || 'OTROS'),
          };
        });
        const updatedM = [...storedMeetings, ...mappedT];
        localStorage.setItem('mywed360Meetings', JSON.stringify(updatedM));
        window.dispatchEvent(new Event('maloveapp-tasks'));
        window.dispatchEvent(new Event('maloveapp-meetings'));
        // Disparar eventos detallados para persistir en Firestore
        try {
          mappedT.forEach((task) =>
            window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail: { task } }))
          );
        } catch (_) {}
        toast.success(tPlural('chat.plurals.tasksAdded', mappedT.length));
      }

      // --- Persistir reuniones extraídas ---
      if (data.extracted?.meetings?.length) {
        const storedMeetings = JSON.parse(localStorage.getItem('mywed360Meetings') || '[]');
        let nextId = Date.now();
        const mappedR = data.extracted.meetings.map((r) => {
          const startIso = r.start || r.date || r.when || r.begin;
          const endIso = r.end || r.until || startIso;
          const startDate = startIso ? new Date(startIso) : new Date();
          const endDate = endIso ? new Date(endIso) : startDate;
          return {
            id: `ai-${nextId++}`,
            title: r.title || r.name || 'Reunión',
            name: r.title || r.name || 'Reunión',
            desc: r.desc || r.description || '',
            start: startDate,
            end: endDate,
            type: 'meeting',
            category: normalizeCategory(r.category || 'OTROS'),
          };
        });
        const updatedR = [...storedMeetings, ...mappedR];
        localStorage.setItem('mywed360Meetings', JSON.stringify(updatedR));
        window.dispatchEvent(new Event('maloveapp-tasks'));
        window.dispatchEvent(new Event('maloveapp-meetings'));
        // Disparar eventos detallados para el bridge
        try {
          mappedR.forEach((meeting) =>
            window.dispatchEvent(new CustomEvent('maloveapp-tasks', { detail: { meeting } }))
          );
        } catch (_) {}
        toast.success(tPlural('chat.plurals.meetingsAdded', mappedR.length));
      }

      // --- Persistir movimientos extraídos ---
      const extMovs = data.extracted?.movements || data.extracted?.budgetMovements;
      if (extMovs?.length) {
        const storedMov = JSON.parse(localStorage.getItem('mywed360Movements') || '[]');
        let nextId = storedMov.length ? Date.now() : Date.now();
        const mappedMov = extMovs.map((m) => ({
          id: `mov-${nextId++}`,
          name: m.concept || m.name || 'Movimiento',
          amount: Number(m.amount) || 0,
          date: m.date || new Date().toISOString().slice(0, 10),
          type: m.type === 'income' ? 'income' : 'expense',
        }));
        const updatedMov = [...storedMov, ...mappedMov];
        localStorage.setItem('mywed360Movements', JSON.stringify(updatedMov));
        window.dispatchEvent(new Event('maloveapp-movements'));
        // Disparar eventos detallados para persistencia
        try {
          mappedMov.forEach((movement) =>
            window.dispatchEvent(
              new CustomEvent('maloveapp-finance', { detail: { movement, action: 'add' } })
            )
          );
        } catch (_) {}
        toast.success(tPlural('chat.plurals.movementsAdded', mappedMov.length));
      }
      let text;
      // Manejar respuesta del backend (exitosa o con error)
      if (data.error && data.reply) {
        text = data.reply;
        console.warn('Backend AI error:', data.error, data.details);
      } else if (data.reply) {
        text = data.reply;
      } else if (data.extracted && Object.keys(data.extracted).length) {
        text = t('chat.messages.dataExtracted') + ':\n' + JSON.stringify(data.extracted, null, 2);
      } else if (data.error) {
        text = 'Error: ' + data.error;
        console.error('Backend AI error:', data.error, data.details);
      } else {
        text = t('chat.messages.noDataExtracted');
      }
      const botMsg = { from: 'bot', text };
      setMessages((prev) => compactMessages([...prev, botMsg]));
    } catch (error) {
      console.error('Error en chat de IA:', error);
      // Respuesta de emergencia local cuando falla la conexión con el backend
      let errMsg;
      if (
        error.name === 'AbortError' ||
        error.message.includes('Timeout') ||
        error.message.includes('abort')
      ) {
        console.error('Timeout en la llamada a la API de IA:', error.message);
        errMsg = {
          from: 'assistant',
          text: t('chat.messages.connectionIssue'),
        };
        toast.error(t('chat.errors.timeout'), { autoClose: 3000 });
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('Error de red en la llamada a la API de IA:', error.message);
        errMsg = {
          from: 'system',
          text: t('chat.messages.connectionError'),
        };
        toast.error(t('chat.errors.connection'), { autoClose: 3000 });
      } else {
        console.error('Error genérico en la API de IA:', error.message);
        errMsg = { from: 'system', text: tVars('chat.messages.genericError', { error: error.message }) };
        toast.error(t('chat.errors.communication'), { autoClose: 3000 });
      }

      const fallback = buildLocalFallbackResponse(input, eventContext);
      if (fallback.reply) {
        const baseText = errMsg?.text ? `${errMsg.text}\n\n${fallback.reply}` : fallback.reply;
        errMsg = { from: errMsg?.from || 'assistant', text: baseText };
      }

      setMessages((prev) => [...prev, errMsg]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col overflow-hidden z-50">
          <div className="bg-blue-600 text-white p-2 flex items-center">
            <MessageSquare className="mr-2" /> {t('chat.title')}
          </div>
          <div className="flex-1 p-2 overflow-y-auto relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <Spinner />
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : 'text-left'}`}>
                <span className="inline-block p-2 rounded bg-gray-200 mr-1">{m.text}</span>
                <button
                  onClick={() => toggleImportant(i)}
                  className="align-middle"
                  title={m.important ? t('chat.markedImportant') : t('chat.markImportant')}
                >
                  <Star
                    size={16}
                    className={m.important ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="p-2 flex">
            <input
              aria-label={t('chat.sendMessage')}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 border rounded px-2 py-1"
              placeholder={t('chat.messagePlaceholder')}
            />
            <motion.button
              onClick={sendMessage}
              aria-label={t('chat.sendMessage')}
              className="ml-2 bg-blue-600 text-white px-3 rounded"
              disabled={loading}
            >
              {t('chat.send')}
            </motion.button>
          </div>
        </div>
      )}
      <motion.button
        onClick={() => setOpen(!open)}
        aria-label={open ? t('chat.close') : t('chat.open')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50"
      >
        <MessageSquare />
      </motion.button>
    </>
  );
}
