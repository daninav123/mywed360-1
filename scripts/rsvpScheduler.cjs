'use strict';
// Wrapper CJS para ejecutar el scheduler ESM en entornos sin type: module
require('dotenv/config');
(async () => {
  try {
    await import('./rsvpScheduler.js');
  } catch (e) {
    console.error('[rsvpScheduler.cjs] Failed to import ESM scheduler:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
