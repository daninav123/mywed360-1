const FLAG_KEY = 'lovenda_stub_weddings_enabled';
const STORE_KEY = '__lovenda_stub_weddings_store__';
export const WEDDING_STUB_EVENT = 'lovenda:stub-weddings-updated';

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const defaultStore = () => ({ users: {} });

const getGlobal = () => (typeof window !== 'undefined' ? window : undefined);

const readStore = () => {
  const global = getGlobal();
  if (!global) return defaultStore();
  try {
    const raw = global.localStorage.getItem(STORE_KEY);
    const parsed = safeParse(raw);
    if (parsed && typeof parsed === 'object' && parsed.users && typeof parsed.users === 'object') {
      return parsed;
    }
  } catch (error) {
    console.warn('[weddingStubStore] readStore error', error);
  }
  return defaultStore();
};

const writeStore = (store) => {
  const global = getGlobal();
  if (!global) return;
  try {
    const payload = JSON.stringify(store);
    global.localStorage.setItem(STORE_KEY, payload);
    global.dispatchEvent(new CustomEvent(WEDDING_STUB_EVENT));
  } catch (error) {
    console.warn('[weddingStubStore] writeStore error', error);
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
    const current = store.users[userId];
    current.weddings = Array.isArray(current.weddings) ? current.weddings : [];
    current.activeWeddingId = current.activeWeddingId || '';
  }
  return store.users[userId];
};

export const isWeddingStubEnabled = () => {
  const global = getGlobal();
  if (!global) return false;
  if (global.__STUB_WEDDINGS__ === true) return true;
  try {
    return global.localStorage.getItem(FLAG_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setWeddingStubEnabled = (enabled) => {
  const global = getGlobal();
  if (!global) return;
  try {
    global.localStorage.setItem(FLAG_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.warn('[weddingStubStore] setWeddingStubEnabled error', error);
  }
};

export const getStubWeddingsForUser = (uid) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  return {
    weddings: entry.weddings.slice(),
    activeWeddingId: entry.activeWeddingId || (entry.weddings[0]?.id || ''),
  };
};

export const setStubWeddingsForUser = (uid, weddings, activeWeddingId) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  entry.weddings = Array.isArray(weddings) ? weddings.map((w) => ({ ...w })) : [];
  entry.activeWeddingId = activeWeddingId || entry.weddings[0]?.id || '';
  writeStore(store);
};

export const upsertStubWedding = (uid, wedding) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  const idx = entry.weddings.findIndex((item) => item.id === wedding.id);
  if (idx >= 0) {
    entry.weddings[idx] = { ...entry.weddings[idx], ...wedding };
  } else {
    entry.weddings.push({ ...wedding });
    if (!entry.activeWeddingId) {
      entry.activeWeddingId = wedding.id;
    }
  }
  writeStore(store);
  return wedding.id;
};

export const toggleStubWeddingActive = (uid, weddingId, nextActive = null) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  const index = entry.weddings.findIndex((item) => item.id === weddingId);
  if (index === -1) return null;
  const current = entry.weddings[index];
  const newActive =
    nextActive === null || typeof nextActive === 'undefined'
      ? !(current.active === false)
      : Boolean(nextActive);
  entry.weddings[index] = { ...current, active: newActive };
  writeStore(store);
  return entry.weddings[index];
};

export const setStubActiveWedding = (uid, weddingId) => {
  const store = readStore();
  const entry = ensureUserEntry(store, uid);
  entry.activeWeddingId = weddingId || entry.activeWeddingId || entry.weddings[0]?.id || '';
  writeStore(store);
};

export const getStubStoreKeys = () => ({
  flagKey: FLAG_KEY,
  storeKey: STORE_KEY,
});

