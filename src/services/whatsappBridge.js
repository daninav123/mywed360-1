import i18n from '../i18n';

// Puente para integrar con extensión de WhatsApp Web (una sola acción)
// La extensión debe inyectar un contentScript que escuche window.postMessage.
// Protocolo simple:
// - PING -> PONG
// - SEND_BATCH -> RESULT { ok: true, started, failed }

// Broadcast: numbers: Array<string E.164>, message: string
export function sendBroadcastMessages(numbers = [], message = '', options = {}) {
  return new Promise((resolve) => {
    try {
      if (!Array.isArray(numbers) || numbers.length === 0 || !message) {
        resolve({ success: false, error: 'invalid-args' });
        return;
      }
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const onMsg = (ev) => {
        const data = ev?.data || {};
        if (data && data.type === EVENTS.RESULT && data.id === id) {
          window.removeEventListener('message', onMsg);
          resolve(data.result || { success: true, count: numbers.length });
        }
      };
      window.addEventListener('message', onMsg);
      window.postMessage(
        { source: 'maloveapp', type: 'MALOVEAPP_WHATSAPP_BROADCAST', id, numbers, message, options },
        '*'
      );
      setTimeout(() => {
        try {
          window.removeEventListener('message', onMsg);
        } catch {}
        resolve({ success: true, noAck: true, count: numbers.length });
      }, 12000);
    } catch (e) {
      resolve({ success: false, error: e.message || 'error' });
    }
  });
}

const EVENTS = {
  PING: 'MALOVEAPP_PING',
  PONG: 'MALOVEAPP_PONG',
  SEND_BATCH: 'MALOVEAPP_WHATSAPP_SEND_BATCH',
  RESULT: 'MALOVEAPP_WHATSAPP_RESULT',
};

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ensureExtensionAvailable(timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const id = uuid();
      const onMsg = (ev) => {
        const data = ev?.data || {};
        if (data && data.type === EVENTS.PONG && data.id === id) {
          window.removeEventListener('message', onMsg);
          resolve(true);
        }
      };
      window.addEventListener('message', onMsg);
      window.postMessage({ source: 'maloveapp', type: EVENTS.PING, id }, '*');
      setTimeout(() => {
        try {
          window.removeEventListener('message', onMsg);
        } catch {}
        resolve(false);
      }, timeoutMs);
    } catch (_) {
      resolve(false);
    }
  });
}

// items: Array<{ to: string (E.164), message: string, meta?: any }>
// options: { rateLimitMs?: number, preview?: boolean }
export function sendBatchMessages(items = [], options = {}) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(items) || items.length === 0) {
      resolve({ success: false, error: 'empty-items' });
      return;
    }
    try {
      const id = uuid();
      const payload = { source: 'maloveapp', type: EVENTS.SEND_BATCH, id, items, options };
      const onMsg = (ev) => {
        const data = ev?.data || {};
        if (data && data.type === EVENTS.RESULT && data.id === id) {
          window.removeEventListener('message', onMsg);
          resolve(data.result || { success: true, started: items.length });
        }
      };
      window.addEventListener('message', onMsg);
      window.postMessage(payload, '*i18n.t('common.fallback_extension_responde_result_settimeout_try')message', onMsg);
        } catch {}
        resolve({ success: true, started: items.length, noAck: true });
      }, 8000);
    } catch (e) {
      reject(e);
    }
  });
}
