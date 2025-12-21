// Lazy metrics helper for Prometheus
// Safe to use even if prom-client is not installed (no-ops)

let prom = null;
let registry = null;
const counters = new Map();
const histograms = new Map();

async function ensure() {
  if (prom && registry) return true;
  try {
    const mod = await import('prom-client');
    prom = mod.default || mod;
    registry = new prom.Registry();
    if (process.env.NODE_ENV !== 'test') {
      prom.collectDefaultMetrics({ register: registry });
    }
    return true;
  } catch (e) {
    // prom-client not available; metrics disabled
    prom = null;
    registry = null;
    return false;
  }
}

export async function getOrCreateCounter(name, help = 'counter', labelNames = []) {
  const ok = await ensure();
  if (!ok) return null;
  if (counters.has(name)) return counters.get(name);
  const c = new prom.Counter({ name, help, labelNames, registers: [registry] });
  counters.set(name, c);
  return c;
}

export async function getOrCreateHistogram(name, help = 'histogram', labelNames = [], buckets = [0.05, 0.1, 0.2, 0.5, 1, 2]) {
  const ok = await ensure();
  if (!ok) return null;
  if (histograms.has(name)) return histograms.get(name);
  const h = new prom.Histogram({ name, help, labelNames, buckets, registers: [registry] });
  histograms.set(name, h);
  return h;
}

export async function incCounter(name, labelsObj = {}, value = 1, help = 'counter', labelNames = []) {
  const c = await getOrCreateCounter(name, help, labelNames);
  if (!c) return;
  c.labels(labelsObj).inc(value);
}

export async function getRegistry() {
  await ensure();
  return registry;
}
