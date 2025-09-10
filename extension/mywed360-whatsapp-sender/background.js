/* Background service worker for MyWed360 WhatsApp Sender */
const REQUESTS = new Map(); // requestId -> { tabId }

function ensureWhatsAppTab(callback) {
  try {
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn('[bg] query error', chrome.runtime.lastError);
      }
      let tab = tabs && tabs[0];
      if (tab) {
        // Focus the tab
        chrome.tabs.update(tab.id, { active: true }, () => callback && callback(tab));
        return;
      }
      // Create a new tab
      chrome.tabs.create({ url: 'https://web.whatsapp.com/', active: true }, (newTab) => {
        if (!newTab) return callback && callback(null);
        const onUpdated = (tabId, info) => {
          if (tabId === newTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onUpdated);
            callback && callback(newTab);
          }
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
      });
    });
  } catch (e) {
    console.warn('[bg] ensureWhatsAppTab error', e);
    callback && callback(null);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return; 
  if (msg.type === 'START_BATCH') {
    const { requestId, items, options } = msg;
    ensureWhatsAppTab((waTab) => {
      if (!waTab) {
        sendResponse && sendResponse({ ok: false, error: 'wa-tab-failed' });
        return;
      }
      REQUESTS.set(requestId, { tabId: sender.tab.id });
      // Forward to WA content script
      chrome.tabs.sendMessage(waTab.id, { type: 'PROCESS_BATCH', requestId, items, options }, (resp) => {
        // resp may be undefined if no content script yet; we'll rely on BATCH_DONE later
      });
      sendResponse && sendResponse({ ok: true, started: items?.length || 0 });
    });
    return true; // async
  }
  if (msg.type === 'START_BROADCAST') {
    const { requestId, numbers, message, options } = msg;
    ensureWhatsAppTab((waTab) => {
      if (!waTab) {
        sendResponse && sendResponse({ ok: false, error: 'wa-tab-failed' });
        return;
      }
      REQUESTS.set(requestId, { tabId: sender.tab.id });
      chrome.tabs.sendMessage(waTab.id, { type: 'PROCESS_BROADCAST', requestId, numbers, message, options }, () => {
        // no-op
      });
      sendResponse && sendResponse({ ok: true, count: numbers?.length || 0 });
    });
    return true;
  }
  if (msg.type === 'BATCH_PROGRESS') {
    // Optional: we could relay progress back if desired
    return;
  }
  if (msg.type === 'BATCH_DONE') {
    const { requestId, result } = msg;
    const entry = REQUESTS.get(requestId);
    if (entry && entry.tabId) {
      try {
        chrome.tabs.sendMessage(entry.tabId, { type: 'BATCH_DONE', requestId, result });
      } catch (e) {}
    }
    REQUESTS.delete(requestId);
    return;
  }
  if (msg.type === 'BROADCAST_DONE') {
    const { requestId, result } = msg;
    const entry = REQUESTS.get(requestId);
    if (entry && entry.tabId) {
      try {
        chrome.tabs.sendMessage(entry.tabId, { type: 'BROADCAST_DONE', requestId, result });
      } catch (e) {}
    }
    REQUESTS.delete(requestId);
    return;
  }
});
