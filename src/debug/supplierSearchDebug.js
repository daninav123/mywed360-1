import { useTranslations } from '../../hooks/useTranslations';
const MAX_EVENTS = 200;

const createState = () => ({
  const { t } = useTranslations();

  events: [],
  listeners: new Set(),
  verbose: false,
  lastResults: null,
});

const getState = () => {
  if (typeof window === 'undefined') {
    if (!globalThis.__MYWED_SUPPLIER_DEBUG__) {
      globalThis.__MYWED_SUPPLIER_DEBUG__ = createState();
    }
    return globalThis.__MYWED_SUPPLIER_DEBUG__;
  }
  if (!window.__MYWED_SUPPLIER_DEBUG__) {
    window.__MYWED_SUPPLIER_DEBUG__ = createState();
  }
  return window.__MYWED_SUPPLIER_DEBUG__;
};

const cloneSafe = (value, depth = 2) => {
  try {
    if (value == null) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (Array.isArray(value)) {
      if (depth <= 0) return `[Array(${value.length})]`;
      return value.slice(0, 20).map((item) => cloneSafe(item, depth - 1));
    }
    if (typeof value === 'object') {
      if (depth <= 0) return '[Object]';
      const entries = Object.entries(value)
        .slice(0, 20)
        .map(([key, val]) => [key, cloneSafe(val, depth - 1)]);
      return Object.fromEntries(entries);
    }
    return String(value);
  } catch (err) {
    return `[unserializable: ${err?.message || err}]`;
  }
};

const createConsoleApi = () => {
  const state = getState();
  return {
    history: () => [...state.events],
    last: () => state.events[state.events.length - 1] || null,
    clear: () => {
      state.events = [];
      console.info('[ai-suppliers] Historial de eventos limpiado.');
      return true;
    },
    watch: () => {
      state.verbose = true;
      console.info('[ai-suppliers] Modo verbose activado.');
      return true;
    },
    mute: () => {
      state.verbose = false;
      console.info('[ai-suppliers] Modo verbose desactivado.');
      return true;
    },
    on: (handler) => {
      if (typeof handler !== 'function') {
        console.warn('[ai-suppliers] on(handler) requiere una función.');
        return () => {};
      }
      state.listeners.add(handler);
      return () => state.listeners.delete(handler);
    },
    off: (handler) => {
      state.listeners.delete(handler);
    },
    summary: () => {
      const summary = state.events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {});
      console.table(summary);
      return summary;
    },
    lastResults: () => state.lastResults,
  };
};

const sanitizeResults = (results) =>
  Array.isArray(results)
    ? results.map((item) => ({
        id: item.id,
        name: item.name,
        link: item.link,
        source: item.source,
        match: item.match,
        service: item.service,
        location: item.location,
      }))
    : [];

const emitEvent = (type, payload) => {
  const state = getState();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload: cloneSafe(payload),
    timestamp: new Date().toISOString(),
  };
  state.events.push(entry);
  if (state.events.length > MAX_EVENTS) {
    state.events.splice(0, state.events.length - MAX_EVENTS);
  }
  if (state.verbose && typeof console !== 'undefined' && console.debug) {
    console.debug(`[ai-suppliers] ${type}`, entry.payload);
  }
  state.listeners.forEach((listener) => {
    try {
      listener(entry);
    } catch (err) {
      if (state.verbose && console?.warn) {
        console.warn('[ai-suppliers] listener error', err);
      }
    }
  });
  return entry;
};

export const supplierDebug = {
  log(type, payload) {
    if (typeof window === 'undefined' && typeof globalThis === 'undefined') return null;
    return emitEvent(type, payload);
  },
  recordResults(results, context = {}) {
    const state = getState();
    state.lastResults = {
      timestamp: new Date().toISOString(),
      context: cloneSafe(context, 3),
      results: sanitizeResults(results),
    };
    emitEvent('results:update', {
      context: state.lastResults.context,
      results: state.lastResults.results,
    });
  },
  registerConsoleCommands() {
    if (typeof window === 'undefined') return;
    window.mywed = window.mywed || {};
    const api = createConsoleApi();
    window.mywed.aiSearch = {
      history: api.history,
      last: api.last,
      clear: api.clear,
      watch: api.watch,
      mute: api.mute,
      on: api.on,
      off: api.off,
      summary: api.summary,
      lastResults: api.lastResults,
      log: (type, payload) => {
        console.warn(
          {t('common.mywedaisearchlog_esta_destinado_lectura_usa')}
        );
        return emitEvent(type, payload);
      },
    };
    if (console?.info) {
      console.info(
        '🛰️  Debug IA Proveedores listo. Usa mywed.aiSearch.history(), mywed.aiSearch.summary(), mywed.aiSearch.watch().'
      );
    }
  },
};

if (typeof window !== 'undefined') {
  supplierDebug.registerConsoleCommands();
}

export default supplierDebug;

