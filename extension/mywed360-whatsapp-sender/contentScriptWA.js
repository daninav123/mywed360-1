/* Content script injected into https://web.whatsapp.com/* to automate sending messages in batch.
   It receives { type: 'PROCESS_BATCH', requestId, items, options } from background.
   Each item: { to: "+34123456789", message: "texto", meta?: any }
*/
(function() {
  const log = (...args) => console.log('[MyWed360 WA CS]', ...args);

  let busy = false;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'PROCESS_BATCH') {
      if (busy) { sendResponse && sendResponse({ ok: false, error: 'busy' }); return; }
      busy = true;
      const { requestId, items, options } = msg;
      (async () => {
        const result = await processBatch(items || [], options || {});
        busy = false;
        chrome.runtime.sendMessage({ type: 'BATCH_DONE', requestId, result });
      })();
      sendResponse && sendResponse({ ok: true });
      return true;
    }
    if (msg.type === 'PROCESS_BROADCAST') {
      if (busy) { sendResponse && sendResponse({ ok: false, error: 'busy' }); return; }
      busy = true;
      const { requestId, numbers, message, options } = msg;
      (async () => {
        const result = await processBroadcast(numbers || [], message || '', options || {});
        busy = false;
        chrome.runtime.sendMessage({ type: 'BROADCAST_DONE', requestId, result });
      })();
      sendResponse && sendResponse({ ok: true });
      return true;
    }
  });

  async function processBatch(items, options) {
    const rateLimit = Math.max(150, Math.floor(options.rateLimitMs || 400));
    let started = 0, sent = 0, failed = 0;
    for (const it of items) {
      try {
        started++;
        const ok = await sendOne(it.to, it.message);
        if (ok) sent++; else failed++;
      } catch (e) {
        failed++;
      }
      await sleep(rateLimit);
    }
    return { success: true, started, sent, failed };
  }

  async function sendOne(toE164, message) {
    try {
      const phone = String(toE164 || '').replace(/[^0-9+]/g, '').replace(/^\+/, '');
      if (!phone) return false;
      const target = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message || '')}&type=phone_number&app_absent=0`;
      // Navigate within the same SPA; WA will route and open the chat
      if (location.href !== target) {
        history.replaceState(null, '', target);
        // Trigger route processing by dispatching popstate/hashchange if needed
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        // Force reload route processing
        history.replaceState(null, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      // Wait for chat composer to be ready
      const composer = await waitForComposer(12000);
      if (!composer) return false;

      // If message box seems empty (sometimes text param not applied), insert it
      if (isComposerEmpty(composer) && message) {
        composer.focus();
        insertText(composer, message);
        await sleep(50);
      }

      // Click send button
      const sendBtn = await waitForSendButton(8000);
      if (!sendBtn) return false;
      sendBtn.click();
      // Wait a moment to ensure it gets queued
      await sleep(250);
      return true;
    } catch (e) {
      log('sendOne error', e);
      return false;
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function waitForComposer(timeoutMs = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // Typical selectors for composer
      // Try contenteditable in footer
      const candidates = Array.from(document.querySelectorAll('footer div[contenteditable="true"], div[contenteditable="true"][role="textbox"]'));
      const visible = candidates.find(isVisible);
      if (visible) return visible;
      await sleep(150);
    }
    return null;
  }

  function isComposerEmpty(el) {
    const text = (el.innerText || '').trim();
    return text.length === 0;
  }

  function insertText(el, text) {
    try {
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
    } catch (e) {
      // Fallback: set text content and dispatch input
      try {
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      } catch (_) {}
    }
  }

  async function waitForSendButton(timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // Stable data-icon selector
      let btn = document.querySelector('button span[data-icon="send"]');
      if (btn && btn.closest('button')) return btn.closest('button');
      // Alternative aria-label contains (localization may vary)
      btn = document.querySelector('button[aria-label*="Send" i], button[aria-label*="Enviar" i]');
      if (btn) return btn;
      await sleep(120);
    }
    return null;
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style && style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
  }

  async function processBroadcast(numbers, message, options) {
    try {
      const ok = await createBroadcastAndSend(numbers, message, options || {});
      if (ok) return { success: true, mode: 'broadcast', count: numbers.length };
      // fallback individual
      const rate = Math.max(150, Math.floor((options && options.rateLimitMs) || 400));
      let sent = 0, failed = 0;
      for (const num of numbers) {
        const one = await sendOne(num, message);
        if (one) sent++; else failed++;
        await sleep(rate);
      }
      return { success: true, mode: 'fallback_individual', sent, failed };
    } catch (e) {
      return { success: false, error: e.message || 'broadcast-error' };
    }
  }

  async function createBroadcastAndSend(numbers, message, options) {
    try {
      if (!Array.isArray(numbers) || numbers.length === 0 || !message) return false;
      if (!location.href.startsWith('https://web.whatsapp.com')) {
        location.href = 'https://web.whatsapp.com/';
        await sleep(1200);
      }
      // Abrir menú principal
      const menuBtn = await waitForSelector(['button[aria-label*="Menu" i]', 'button[aria-label*="Menú" i]'], 6000);
      if (!menuBtn) return false;
      menuBtn.click();
      await sleep(150);
      // Buscar opción Nueva difusión (evitar :contains/:has no estándar)
      let nb = null;
      const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"]'));
      nb = menuItems.find(el => {
        const tx = (el.textContent || '').toLowerCase();
        return tx.includes('new broadcast') || tx.includes('nueva difusión') || tx.includes('nueva lista de difusión');
      });
      if (!nb) {
        // fallback a aria-label
        nb = await waitForSelector(['div[role="menuitem"][aria-label*="New broadcast" i]'], 4000);
      }
      if (!nb) return false;
      nb.click();
      // Campo para añadir destinatarios
      const addField = await waitForSelector(['div[contenteditable="true"][role="textbox"]', 'input[type="text"]'], 8000);
      if (!addField) return false;
      for (const n of numbers) {
        addField.focus();
        insertText(addField, n);
        await sleep(250);
        // Enter para seleccionar
        try { document.execCommand('insertText', false, '\n'); } catch {}
        await sleep(250);
      }
      // Continuar/Crear lista
      const nextBtnCandidates = Array.from(document.querySelectorAll('button, div[role="button"]'));
      let nextBtn = nextBtnCandidates.find(el => {
        const tx = (el.textContent || '').toLowerCase();
        return (el.getAttribute('aria-disabled') === 'false') || tx.includes('crear') || tx.includes('ok') || tx.includes('siguiente');
      });
      if (!nextBtn) {
        nextBtn = await waitForSelector(['div[role="button"][aria-disabled="false"]', 'button[aria-label*="OK" i]', 'button[aria-label*="Crear" i]'], 6000);
      }
      if (!nextBtn) return false;
      nextBtn.click();
      const composer = await waitForComposer(12000);
      if (!composer) return false;
      if (isComposerEmpty(composer) && message) {
        composer.focus();
        insertText(composer, message);
        await sleep(80);
      }
      const sendBtn = await waitForSendButton(8000);
      if (!sendBtn) return false;
      sendBtn.click();
      await sleep(300);
      if (options && options.cleanup) {
        try { await deleteCurrentBroadcast(); } catch {}
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function deleteCurrentBroadcast() {
    const headerMenu = await waitForSelector(['header button[aria-label*="Menu" i]', 'header button[aria-label*="Menú" i]'], 4000);
    if (!headerMenu) return false;
    headerMenu.click();
    await sleep(120);
    let infoItem = null;
    const hdrItems = Array.from(document.querySelectorAll('div[role="menuitem"]'));
    infoItem = hdrItems.find(el => {
      const tx = (el.textContent || '').toLowerCase();
      return tx.includes('info de la lista') || tx.includes('list info') || tx.includes('information');
    });
    if (!infoItem) {
      infoItem = await waitForSelector(['div[role="menuitem"][aria-label*="List info" i]'], 3000);
    }
    if (!infoItem) return false;
    infoItem.click();
    await sleep(400);
    let deleteBtn = Array.from(document.querySelectorAll('button')).find(el => (el.textContent || '').toLowerCase().includes('eliminar'));
    if (!deleteBtn) deleteBtn = await waitForSelector(['button[aria-label*="Delete" i]'], 4000);
    if (!deleteBtn) return false;
    deleteBtn.click();
    await sleep(120);
    let confirm = Array.from(document.querySelectorAll('button')).find(el => (el.textContent || '').toLowerCase().includes('eliminar'));
    if (!confirm) confirm = await waitForSelector(['button[aria-label*="Delete" i]'], 4000);
    if (confirm) { confirm.click(); await sleep(300); }
    return true;
  }

  async function waitForSelector(selectors, timeoutMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el && isVisible(el)) return el;
        } catch {}
      }
      await sleep(120);
    }
    return null;
  }
})();
