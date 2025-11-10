/*
  Compat migration (legacy: lovenda/mywed360 -> maloveapp).
  - Migrates localStorage keys on load (one-shot, idempotent)
  - Mirrors CustomEvents both ways to keep old/new listeners working
*/

(function setupCompat() {
  if (typeof window === 'undefined') return;

  try {
    // 1) LocalStorage migration (prefix replacement) + write-through
    const ls = window.localStorage;
    if (ls && typeof ls.getItem === 'function') {
      // Patch setItem/removeItem to write-through both prefixes when target is 'lovenda*'
      try {
        const origSet = ls.setItem.bind(ls);
        const origRemove = ls.removeItem.bind(ls);
        const mapPrefix = (key) =>
          key
            .replace(/^lovenda([._-])/, 'mywed360$1')
            .replace(/^lovenda/, 'maloveapp');
        ls.setItem = function (key, value) {
          try { origSet(key, value); } catch {}
          try {
            if (/^lovenda/i.test(String(key))) {
              const newKey = mapPrefix(String(key));
              if (newKey !== key) origSet(newKey, value);
            }
          } catch {}
        };
        ls.removeItem = function (key) {
          try { origRemove(key); } catch {}
          try {
            if (/^lovenda/i.test(String(key))) {
              const newKey = mapPrefix(String(key));
              if (newKey !== key) origRemove(newKey);
            }
          } catch {}
        };
      } catch {}

      const keys = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k) keys.push(k);
      }
      const seen = new Set(keys);
      const mapPrefix = (key) =>
        key
          .replace(/^lovenda([._-])/, 'mywed360$1') // maloveapp_ maloveapp- lovenda.
          .replace(/^lovenda/, 'maloveapp'); // lovendaSomething -> mywed360Something

      for (const key of keys) {
        if (/^lovenda/i.test(key)) {
          const newKey = mapPrefix(key);
          if (!seen.has(newKey)) {
            try {
              const val = ls.getItem(key);
              if (val != null) {
                ls.setItem(newKey, val);
              }
            } catch {}
          }
        }
      }
    }
  } catch {}

  try {
    // 2) Event mirroring (dispatch compatibility both ways)
    const origDispatch = window.dispatchEvent.bind(window);

    const mirrorType = (type) => {
      // lovenda* -> mywed360*
      if (/^lovenda[_.-]?/i.test(type)) {
        return type.replace(/^lovenda/i, 'maloveapp');
      }
      // mywed360* -> lovenda*
      if (/^mywed360[_.-]?/i.test(type)) {
        return type.replace(/^mywed360/i, 'maloveapp');
      }
      return null;
    };

    window.dispatchEvent = function compatDispatch(evt) {
      try {
        const type = evt && evt.type ? String(evt.type) : '';
        const mirrored = mirrorType(type);
        // Dispatch original first
        const res = origDispatch(evt);
        // Then best-effort mirror, but avoid re-mirroring mirrors
        if (mirrored && !evt.__compatMirrored) {
          let clone;
          try {
            if (typeof CustomEvent !== 'undefined' && evt instanceof CustomEvent) {
              clone = new CustomEvent(mirrored, {
                detail: evt.detail,
                bubbles: evt.bubbles,
                cancelable: evt.cancelable,
                composed: evt.composed,
              });
            } else {
              clone = new Event(mirrored, { bubbles: evt.bubbles, cancelable: evt.cancelable, composed: evt.composed });
            }
            // mark mirror to avoid loops
            Object.defineProperty(clone, '__compatMirrored', { value: true, enumerable: false });
            origDispatch(clone);
          } catch { /* ignore */ }
        }
        return res;
      } catch {
        return origDispatch(evt);
      }
    };
  } catch {}
})();
