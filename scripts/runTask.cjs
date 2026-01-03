'use strict';
// Wrapper CJS para ejecutar el runTask (ESM) en entornos sin type: module
require('dotenv/config');
(async () => {
  try {
    await import('./runTask.js');
  } catch (e) {
    console.error('[runTask.cjs] Failed to import ESM runTask.js:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
