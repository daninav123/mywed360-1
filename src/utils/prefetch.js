// Lightweight prefetch helper with network-aware guard and memoization
const prefetched = new Set();

function canPrefetch() {
  try {
    const nav = navigator;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      if (conn.saveData) return false;
      const slow = ['slow-2g', '2g'];
      if (slow.includes(conn.effectiveType)) return false;
    }
  } catch {}
  return document.visibilityState !== 'hidden';
}

export function prefetchModule(key, loader, opts) {
  if (!canPrefetch()) return;
  if (!key || typeof loader !== 'function') return;
  if (prefetched.has(key)) return;
  const run = () => {
    try { loader().catch(() => {}); } catch {}
    prefetched.add(key);
  };
  const delay = (opts && typeof opts.delay === 'number') ? opts.delay : 0;
  const schedule = () => {
    try {
      const ric = window.requestIdleCallback;
      ric ? ric(run, { timeout: 2000 }) : setTimeout(run, 0);
    } catch {
      setTimeout(run, 0);
    }
  };
  if (delay > 0) setTimeout(schedule, delay); else schedule();
}
