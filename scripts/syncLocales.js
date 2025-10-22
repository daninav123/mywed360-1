#!/usr/bin/env node
/**
 * Sync i18n locale files with EN as source of truth.
 * - Fills missing keys from EN
 * - Keeps existing translations when already present
 * - Applies curated fixes (currently Spanish-specific)
 *
 * Usage: node scripts/syncLocales.js            # sync all locales
 *        node scripts/syncLocales.js es es-MX   # sync only selected locales
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(process.cwd(), 'src/i18n/locales');
const BASE_LOCALE = 'en';
const TARGET_LOCALES =
  process.argv.slice(2).length > 0 ? process.argv.slice(2) : detectLocales();

function detectLocales() {
  return fs
    .readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== BASE_LOCALE)
    .map((entry) => entry.name);
}

function readJson(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, {
    encoding: 'utf8',
  });
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsonFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(entryPath);
    }
  }
  return out;
}

function fillMissing(target, source) {
  if (typeof source !== 'object' || source === null) {
    return target === undefined ? source : target;
  }
  const result = Array.isArray(source) ? [...(Array.isArray(target) ? target : [])] : { ...(target ?? {}) };
  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = target ? target[key] : undefined;
    result[key] = fillMissing(targetValue, sourceValue);
  }
  return result;
}

function ensurePath(data, dottedKey, value) {
  const parts = dottedKey.split('.');
  let node = data;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (i === parts.length - 1) {
      if (node[part] === undefined) {
        node[part] = value;
      }
    } else {
      if (typeof node[part] !== 'object' || node[part] === null) {
        node[part] = {};
      }
      node = node[part];
    }
  }
}

function applyCuratedFixes(locale, relFile, data) {
  if (!locale.startsWith('es') || relFile !== 'common.json') return;
  ensurePath(data, 'finance.budget.advisor', 'Asesor');
  ensurePath(data, 'finance.budget.advisorShort', 'IA');
  ensurePath(data, 'finance.budget.muteShort', 'Silenciar');
  ensurePath(data, 'finance.budget.exceeded', 'Excedido');
  ensurePath(data, 'finance.budget.perGuestHint', '≈ {{value}} / invitado ({{count}} eventos)');
  ensurePath(
    data,
    'finance.benchmarks.title',
    'Sugerencias de presupuesto basadas en bodas similares'
  );
  ensurePath(
    data,
    'finance.benchmarks.subtitle',
    'Basado en {{count}} presupuestos confirmados. Estimación promedio: {{average}} · Confianza: {{confidence}}.'
  );
  ensurePath(
    data,
    'finance.benchmarks.loading',
    'Calculando sugerencias de presupuesto…'
  );
  ensurePath(data, 'finance.benchmarks.applyMedian', 'Aplicar mediana (p50)');
  ensurePath(data, 'finance.benchmarks.applyP75', 'Aplicar percentil 75');
  ensurePath(data, 'finance.benchmarks.saveSnapshot', 'Guardar presupuesto');
  ensurePath(data, 'finance.cashflow.title', 'Cronograma de caja');
  ensurePath(data, 'finance.cashflow.subtitle', 'Pagos próximos y balance proyectado');
  ensurePath(data, 'finance.cashflow.remaining', 'Presupuesto restante');
  ensurePath(data, 'finance.cashflow.burnRate', 'Burn rate mensual');
  ensurePath(data, 'finance.cashflow.monthsToZero', '{{months}} meses hasta agotarlo');
  ensurePath(data, 'finance.cashflow.upcoming', 'Pagos próximos (45 días)');
  ensurePath(
    data,
    'finance.cashflow.noUpcoming',
    'Sin pagos pendientes en las próximas semanas.'
  );
  ensurePath(data, 'finance.cashflow.netTimeline', 'Flujo neto mensual (6 meses)');
  ensurePath(data, 'finance.cashflow.legend', 'Ingresos - Gastos');
  ensurePath(
    data,
    'finance.cashflow.noHistory',
    'Necesitamos más historial para calcular la tendencia.'
  );
  ensurePath(data, 'finance.cashflow.income', 'Ingresos');
  ensurePath(data, 'finance.cashflow.expense', 'Gastos');
  ensurePath(data, 'rsvp.budget.perGuestHint', '≈ {{value}} / invitado ({{count}} eventos)');
}

function syncLocale(relFile, baseDir, locale) {
  const basePath = path.join(baseDir, relFile);
  const targetPath = path.join(LOCALES_DIR, locale, relFile);
  const hasBase = fs.existsSync(basePath);
  if (!hasBase && !fs.existsSync(targetPath)) {
    return;
  }
  const baseData = hasBase ? readJson(basePath) : {};
  const currentData = fs.existsSync(targetPath) ? readJson(targetPath) : {};
  const merged = fillMissing(currentData, baseData);
  applyCuratedFixes(locale, relFile, merged);
  writeJson(targetPath, merged);
  console.log(`Synced ${locale}/${relFile}`);
}

function main() {
  const baseDir = path.join(LOCALES_DIR, BASE_LOCALE);
  const files = new Set(walkJsonFiles(baseDir).map((file) => path.relative(baseDir, file)));
  for (const locale of TARGET_LOCALES) {
    const localeDir = path.join(LOCALES_DIR, locale);
    walkJsonFiles(localeDir).forEach((file) => files.add(path.relative(localeDir, file)));
  }

  for (const relFile of files) {
    for (const locale of TARGET_LOCALES) {
      syncLocale(relFile, baseDir, locale);
    }
  }
}

main();
