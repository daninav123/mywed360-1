/* Content script injected into the host app pages (localhost:5173 / mywed360.com)
   Bridges window.postMessage <-> extension background
*/
(function() {
  const EVENTS = {
    PING: 'MYWED360_PING',
    PONG: 'MYWED360_PONG',
    SEND_BATCH: 'MYWED360_WHATSAPP_SEND_BATCH',
    RESULT: 'MYWED360_WHATSAPP_RESULT',
  };

  console.log('[MyWed360 Host CS] page registered successfully!');

  function onWindowMessage(ev) {
    try {
      const data = ev && ev.data;
      if (!data || data.source !== 'mywed360' || !data.type) return;
      if (data.type === EVENTS.PING) {
        window.postMessage({ source: 'mywed360', type: EVENTS.PONG, id: data.id }, '*');
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
      if (data.type === 'MYWED360_WHATSAPP_BROADCAST') {
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
        window.postMessage({ source: 'mywed360', type: EVENTS.RESULT, id: requestId, result }, '*');
      }
      if (msg.type === 'BROADCAST_DONE') {
        const { requestId, result } = msg;
        window.postMessage({ source: 'mywed360', type: EVENTS.RESULT, id: requestId, result }, '*');
      }
    } catch (e) {
      console.warn('[Host CS] onRuntimeMessage error', e);
    }
  });
})();
