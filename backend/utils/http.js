import axios from 'axios';

const defaultTimeout = Number(process.env.AXIOS_TIMEOUT_MS || 10000);

const http = axios.create({
  timeout: defaultTimeout,
});

function isRetryable(err) {
  try {
    if (!err) return false;
    const code = (err && err.code) || '';
    if (['ECONNABORTED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT'].includes(code)) return true;
    const status = err?.response?.status;
    if (!status) return true; // network or CORS
    return status >= 500 || status === 429;
  } catch {
    return false;
  }
}

async function requestWithRetry(fn, opts = {}) {
  const max = Number(process.env.AXIOS_RETRY_COUNT ?? opts.retries ?? 2);
  const base = Number(process.env.AXIOS_RETRY_BACKOFF_MS ?? opts.backoffMs ?? 250);
  const factor = Number(process.env.AXIOS_RETRY_FACTOR ?? opts.factor ?? 2);
  const cap = Number(process.env.AXIOS_RETRY_BACKOFF_MAX_MS ?? opts.maxBackoffMs ?? 5000);
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= max || !isRetryable(err)) throw err;
      const wait = Math.min(base * Math.pow(factor, attempt), cap);
      await new Promise((r) => setTimeout(r, wait));
      attempt += 1;
    }
  }
}

export { http, requestWithRetry, isRetryable };

