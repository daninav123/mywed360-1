/* Content script injected into the host app pages (localhost:5173 / maloveapp.com)
   Bridges window.postMessage <-> extension background
*/
(function() {
  const EVENTS = {
    PING: 'MALOVEAPP_PING',
    PONG: 'MALOVEAPP_PONG',
    SEND_BATCH: 'MALOVEAPP_WHATSAPP_SEND_BATCH',
    RESULT: 'MALOVEAPP_WHATSAPP_RESULT',
  };

  console.log('[MaLoveApp Host CS] page registered successfully!');

  function onWindowMessage(ev) {
    try {
      const data = ev && ev.data;
      if (!data || data.source !== 'maloveapp' || !data.type) return;
      if (data.type === EVENTS.PING) {
        window.postMessage({ source: 'maloveapp', type: EVENTS.PONG, id: data.id }, '*');
        return;
      }
      if (data.type === EVENTS.SEND_BATCH) {
        const { id, items, options } = data;
        chrome.runtime.sendMessage({ type: 'START_BATCH', requestId: id, items, options }, (resp) => {
          // ACK opcional; el resultado final llegará como BATCH_DONE desde background
          if (chrome.runtime.lastError) {
            console.warn('[Host CS] START_BATCH error', chrome.runtime.lastError);
          }
        });
        return;
      }
      if (data.type === 'MALOVEAPP_WHATSAPP_BROADCAST') {
        const { id, numbers, message, options } = data;
        chrome.runtime.sendMessage({ type: 'START_BROADCAST', requestId: id, numbers, message, options }, (resp) => {
          if (chrome.runtime.lastError) {
            console.warn('[Host CS] START_BROADCAST error', chrome.runtime.lastError);
          }
        });
        return;
      }
    } catch (e) {
      console.warn('[Host CS] onWindowMessage error', e);
    }
  }

  window.addEventListener('message', onWindowMessage);

  chrome.runtime.onMessage.addListener((msg) => {
    try {
      if (!msg || !msg.type) return;
      if (msg.type === 'BATCH_DONE') {
        const { requestId, result } = msg;
        window.postMessage({ source: 'maloveapp', type: EVENTS.RESULT, id: requestId, result }, '*');
      }
      if (msg.type === 'BROADCAST_DONE') {
        const { requestId, result } = msg;
        window.postMessage({ source: 'maloveapp', type: EVENTS.RESULT, id: requestId, result }, '*');
      }
    } catch (e) {
      console.warn('[Host CS] onRuntimeMessage error', e);
    }
  });
})();
