import i18n from '../i18n';

const STORE_KEY = 'maloveapp_local_weddings';
export const LOCAL_WEDDINGS_EVENT = 'maloveapp:local-weddings-updated';

const getGlobal = () => {
  if (typeof window !== 'undefined') return window;
  if (typeof globalThis !== 'undefined') return globalThis;
  return undefined;
};

const readStore = () => {
  const global = getGlobal();
  if (!global || !global.localStorage) {
    return { users: {} };
  }
  try {
    const raw = global.localStorage.getItem(STORE_KEY);
    if (!raw) return { users: {} };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.users) {
      return parsed;
    }
  } catch (error) {
    console.warn('[localWeddingStore] readStore error', error);
  }
  return { users: {} };
};

const writeStore = (store) => {
  const global = getGlobal();
  if (!global || !global.localStorage) return;
  try {
    global.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    global.dispatchEvent?.(new CustomEvent(LOCAL_WEDDINGS_EVENT));
  } catch (error) {
    console.warn('[localWeddingStore] writeStore error', error);
  }
};

const ensureUserEntry = (store, uid) => {
  const userId = uid || 'anonymous';
  if (!store.users[userId]) {
    store.users[userId] = {
      weddings: [],
      activeWeddingId: '',
    };
  } else {
    const entry = store.users[userId];
    entry.weddings = Array.isArray(entry.weddings) ? entry.weddings : [];
    entry.activeWeddingId = entry.activeWeddingId || entry.weddings[0]?.id || '';
  }
  return store.users[userId];
};

const createDefaultWedding = (uid) => {
  const suffix = (uid || 'demo').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  const weddingId = `local-${suffix || 'demo'}-wedding`;
  const now = new Date();
  return {
    id: weddingId,
    name: i18n.t('common.boda_sin_titulo'),
    weddingDate: '',
    location: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    financeMain: {
      budget: { total: 0, categories: [] },
      settings: { alertThresholds: { warn: 75, danger: 90 } },
      contributions: null,
      aiAdvisor: null,
    },
  };
};

const mergeFinance = (current = {}, patch = {}) => {
  const nextBudget =
    patch.budget != null
      ? {
          ...current.budget,
          ...patch.budget,
          categories: Array.isArray(patch.budget.categories)
            ? patch.budget.categories
            : current.budget?.categories || [],
        }
      : current.budget;
  const nextSettings =
    patch.settings != null
      ? {
          ...current.settings,
          ...patch.settings,
          alertThresholds: {
            ...(current.settings?.alertThresholds || {}),
            ...(patch.settings?.alertThresholds || {}),
          },
        }
      : current.settings;
  return {
    ...current,
    ...patch,
    budget: nextBudget || { total: 0, categories: [] },
    settings: nextSettings || { alertThresholds: { warn: 75, danger: 90 } },
  };
};

export const loadLocalWeddings = (uid) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  return {
    weddings: entry.weddings.map((w) => ({ ...w })),
    activeWeddingId: entry.activeWeddingId || entry.weddings[0]?.id || '',
  };
};

export const ensureDefaultWeddingForUser = (uid) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  if (!entry.weddings.length) {
    const defaultWedding = createDefaultWedding(uid);
    entry.weddings.push(defaultWedding);
    entry.activeWeddingId = defaultWedding.id;
    writeStore(store);
  }
  return {
    weddings: entry.weddings.map((w) => ({ ...w })),
    activeWeddingId: entry.activeWeddingId || entry.weddings[0]?.id || '',
  };
};

export const upsertLocalWedding = (uid, wedding) => {
  if (!wedding || !wedding.id) return;
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  const idx = entry.weddings.findIndex((item) => item.id === wedding.id);
  const nextWedding = {
    ...entry.weddings[idx] /* undefined if idx -1 */,
    ...wedding,
    financeMain: mergeFinance(entry.weddings[idx]?.financeMain, wedding.financeMain),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    entry.weddings[idx] = nextWedding;
  } else {
    entry.weddings.push(nextWedding);
    if (!entry.activeWeddingId) {
      entry.activeWeddingId = nextWedding.id;
    }
  }
  writeStore(store);
};

export const setLocalActiveWedding = (uid, weddingId) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  entry.activeWeddingId = weddingId || entry.activeWeddingId || entry.weddings[0]?.id || 'i18n.t('common.writestorestore_export_const_updatelocalfinance_uid_weddingid')' };
  } else {
    store.users = {};
  }
  writeStore(store);
};

export const getLocalStoreKeys = () => ({
  store: STORE_KEY,
});
