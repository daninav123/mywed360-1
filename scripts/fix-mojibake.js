#!/usr/bin/env node
/**
 * Fix encoding/mojibake issues in documentation (and optionally other roots).
 *
 * - Removes control characters (except \n/\r/\t)
 * - Normalizes common U+FFFD ("�") patterns using context-based heuristics
 * - Cleans decorative prefixes in Markdown headings/lists (outside code fences)
 *
 * Usage:
 *   node scripts/fix-mojibake.js                 # docs/ only
 *   node scripts/fix-mojibake.js --all           # docs + common repo roots
 *   node scripts/fix-mojibake.js --roots docs backend
 *   node scripts/fix-mojibake.js --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXT_WHITELIST = new Set([
  '.md',
  '.mdx',
  '.txt',
  '.json',
  '.yml',
  '.yaml',
  '.html',
  '.css',
  '.scss',
  '.csv',
]);

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.vscode',
  '.windsurf',
  '.turbo',
  '.cache',
]);

const DEFAULT_ROOTS_DOCS_ONLY = ['docs'];
const DEFAULT_ROOTS_ALL = ['docs', 'src', 'apps', 'backend', 'scripts', 'cypress', 'tests', 'tools', 'public'];

const CONTROL_CHARS_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f]/g;

function parseArgs(argv) {
  const args = {
    dryRun: false,
    roots: null,
    all: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '-n') args.dryRun = true;
    else if (a === '--all') args.all = true;
    else if (a === '--roots') {
      const list = argv[i + 1];
      if (!list) throw new Error('Missing value for --roots');
      args.roots = list.split(',').map((x) => x.trim()).filter(Boolean);
      i++;
    } else if (a === '--root') {
      const r = argv[i + 1];
      if (!r) throw new Error('Missing value for --root');
      args.roots = (args.roots || []).concat([r]);
      i++;
    }
  }

  return args;
}

function shouldProcess(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXT_WHITELIST.has(ext)) return false;
  const rel = path.relative(process.cwd(), filePath);
  const parts = rel.split(path.sep);
  if (parts.some((p) => SKIP_DIR_NAMES.has(p))) return false;
  return true;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR_NAMES.has(e.name)) continue;
      walk(full, out);
      continue;
    }
    if (!e.isFile()) continue;
    if (shouldProcess(full)) out.push(full);
  }
  return out;
}

function makeKey(prev, next) {
  return `${prev}\u0000${next}`;
}

const REPLACEMENT_BY_CONTEXT = new Map([
  // Most frequent: -ción/-sión/-ión endings
  [makeKey('i', 'n'), 'ó'],
  [makeKey('I', 'N'), 'Ó'],
  [makeKey('I', 'n'), 'Ó'],
  [makeKey('i', 'N'), 'ó'],

  // Arrow separators / UI breadcrumbs
  [makeKey(' ', ' '), '→'],

  // ñ between vowels
  [makeKey('a', 'a'), 'ñ'],
  [makeKey('a', 'o'), 'ñ'],
  [makeKey('e', 'a'), 'ñ'],
  [makeKey('e', 'o'), 'ñ'],
  [makeKey('A', 'a'), 'ñ'],

  // Common accented vowels by context
  [makeKey('m', 't'), 'á'], // automática
  [makeKey('m', 's'), 'á'], // más
  [makeKey('t', 'n'), 'á'], // están
  [makeKey('t', ' '), 'á'], // está
  [makeKey('r', ' '), 'á'], // mostrará
  [makeKey('r', 'p'), 'á'], // rápidas
  [makeKey('r', 's'), 'á'], // tendrás
  [makeKey('r', 'n'), 'á'], // podrán
  [makeKey('r', 'c'), 'á'], // práctico

  [makeKey('l', 'n'), 'í'], // líneas
  [makeKey('l', 'm'), 'í'], // límite
  [makeKey('L', 'n'), 'í'], // Líneas
  [makeKey('d', 'a'), 'í'], // día
  [makeKey('D', 'a'), 'í'], // Día
  [makeKey('u', 'a'), 'í'], // guía
  [makeKey('U', 'A'), 'Í'], // GUÍA
  [makeKey('v', 'a'), 'í'], // vía
  [makeKey('v', 'o'), 'í'], // envío
  [makeKey('u', ' '), 'í'], // aquí
  [makeKey('d', 'g'), 'í'], // dígitos
  [makeKey('c', 'f'), 'í'], // específicas
  [makeKey('S', 'n'), 'í'], // Síntomas
  [makeKey('m', 'n'), 'í'], // mínimo

  [makeKey('u', 's'), 'é'], // después
  [makeKey('U', 'S'), 'É'], // DESPUÉS
  [makeKey('l', 's'), 'é'], // inglés
  [makeKey('t', 'g'), 'é'], // estratégicas
  [makeKey('t', 'c'), 'é'], // técnico
  [makeKey('M', 't'), 'é'], // Métricas
  [makeKey('M', 'x'), 'é'], // México

  [makeKey('m', 'd'), 'ó'], // módulo
  [makeKey('c', 'd'), 'ó'], // código
  [makeKey('C', 'd'), 'ó'], // Código
  [makeKey('p', 's'), 'ó'], // propósito
  [makeKey('r', 'x'), 'ó'], // próximo
  [makeKey('R', 'X'), 'Ó'], // PRÓXIMOS
  [makeKey('c', 'c'), 'ó'], // cóctel
  [makeKey('l', 'g'), 'ó'], // lógica
  [makeKey('s', 'l'), 'ó'], // sólo

  [makeKey('g', 'n'), 'ú'], // según
  [makeKey('n', 'm'), 'ú'], // números
  [makeKey('n', 's'), 'ú'], // minúsculas
  [makeKey('y', 's'), 'ú'], // mayúsculas
  [makeKey('b', 's'), 'ú'], // búsqueda
  [makeKey('m', 'l'), 'ú'], // múltiples
  [makeKey('M', 'l'), 'ú'], // Múltiples
  [makeKey('p', 'b'), 'ú'], // público
  [makeKey('l', 't'), 'ú'], // último
  [makeKey('a', 'n'), 'ú'], // aún
  [makeKey('N', 'm'), 'ú'], // Números

  // Abbreviation "nº"
  [makeKey('n', ' '), 'º'],
]);

const EXPLICIT_REPLACEMENTS = [
  // Ambiguous contexts we prefer to disambiguate by whole word
  [/\bB\uFFFDbico\b/g, 'Básico'],
  [/\bb\uFFFDbico\b/g, 'básico'],
  [/\bB\uFFFDsqueda\b/g, 'Búsqueda'],
  [/\bb\uFFFDsqueda\b/g, 'búsqueda'],
  [/\uFFFDndice\b/g, 'Índice'],
  [/\uFFFDNDICE\b/g, 'ÍNDICE'],
  [/\bcat\uFFFDlogo\b/gi, (m) => (m[0] === 'C' ? 'Catálogo' : 'catálogo')],
  [/\bcat\uFFFDlogos\b/gi, (m) => (m[0] === 'C' ? 'Catálogos' : 'catálogos')],
  [/\b\uFFFDrea(s)?\b/gi, (_m, plural) => (plural ? 'áreas' : 'área')],
  [/\b\uFFFDltim(a|o)s?\b/gi, (m) => {
    const lower = m.toLowerCase();
    // Keep original casing of first letter (simple heuristic)
    const fixed = lower.replace(/\uFFFDltim/, 'últim');
    return m[0] === m[0].toUpperCase() ? fixed[0].toUpperCase() + fixed.slice(1) : fixed;
  }],
  [/\b\uFFFDtiles\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Útiles' : 'útiles')],
  [/\b\uFFFDxito\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Éxito' : 'éxito')],
];

function replaceUfffdByContext(text, unknownContexts) {
  if (!text.includes('\uFFFD')) return text;

  const chars = Array.from(text);
  const out = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch !== '\uFFFD') {
      out.push(ch);
      continue;
    }

    const prev = i > 0 ? chars[i - 1] : '';
    const next = i + 1 < chars.length ? chars[i + 1] : '';
    const key = makeKey(prev, next);
    const replacement = REPLACEMENT_BY_CONTEXT.get(key);

    if (replacement != null) {
      out.push(replacement);
      continue;
    }

    // Decorative garbage: drop when adjacent to markdown decoration / whitespace / control remnants.
    if (
      prev === '' ||
      next === '' ||
      prev === '=' ||
      prev === '<' ||
      prev === '>' ||
      next === '\n' ||
      next === '\r' ||
      next === '\t' ||
      next === '\u000f'
    ) {
      unknownContexts.set(key, (unknownContexts.get(key) || 0) + 1);
      continue;
    }

    // Fallback: keep readable text by dropping the replacement char.
    unknownContexts.set(key, (unknownContexts.get(key) || 0) + 1);
  }

  return out.join('');
}

function normalizeMarkdownOutsideCodeFences(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let inFence = false;

  for (const line of lines) {
    const fence = /^\s*```/.test(line);
    if (fence) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    let next = line;

    // Headings: strip garbage prefixes after "# "
    next = next.replace(/^(#{1,6}\s+)(?:[=<>]+|['"()]+|\uFFFD+)\s*/u, '$1');
    next = next.replace(/^(#{1,6}\s+)\s+/, '$1');

    // Lists: "- L ..." / "- S ..." / "1. ..." with leftover garbage
    next = next.replace(/^-\s*[LS]\s+/, '- ');
    next = next.replace(/^(\d+\.\s+)\uFFFD+\s*/u, '$1');
    next = next.replace(/^(\d+\.\s+)(?:[=<>]+|['"()]+)\s*/u, '$1');

    // Collapsing accidental double spaces produced by removals
    next = next.replace(/^(#{1,6}\s+)\s+/, '$1');
    next = next.replace(/^-\s+/, '- ');

    out.push(next);
  }

  return out.join('\n');
}

function fixText(text, ext, unknownContexts) {
  let out = text;

  // Remove BOM
  out = out.replace(/^\uFEFF/, '');

  // Normalize quote control chars found in some docs
  out = out.replace(/\u001c/g, '“').replace(/\u001d/g, '”');

  // Remove other control characters
  out = out.replace(CONTROL_CHARS_RE, '');

  // Apply explicit word fixes before contextual fix-ups
  for (const [re, replacement] of EXPLICIT_REPLACEMENTS) {
    out = out.replace(re, replacement);
  }

  // Contextual U+FFFD replacement
  out = replaceUfffdByContext(out, unknownContexts);

  // Markdown-only cleanup (outside code fences)
  if (ext === '.md' || ext === '.mdx') {
    out = normalizeMarkdownOutsideCodeFences(out);
  }

  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const roots = args.roots || (args.all ? DEFAULT_ROOTS_ALL : DEFAULT_ROOTS_DOCS_ONLY);

  const targets = [];
  for (const base of roots) {
    const abs = path.resolve(process.cwd(), base);
    if (!fs.existsSync(abs)) continue;
    walk(abs, targets);
  }

  let changed = 0;
  let touched = 0;
  let replacementBeforeTotal = 0;
  let replacementAfterTotal = 0;
  let controlBeforeTotal = 0;
  let controlAfterTotal = 0;
  const unknownContexts = new Map();

  for (const filePath of targets) {
    const ext = path.extname(filePath).toLowerCase();
    const raw = fs.readFileSync(filePath);
    let original;
    try {
      original = raw.toString('utf8');
    } catch {
      continue;
    }

    const replacementBefore = (original.match(/\uFFFD/g) || []).length;
    const controlBefore = (original.match(CONTROL_CHARS_RE) || []).length;
    if (!replacementBefore && !controlBefore) continue;

    const fixed = fixText(original, ext, unknownContexts);
    const replacementAfter = (fixed.match(/\uFFFD/g) || []).length;
    const controlAfter = (fixed.match(CONTROL_CHARS_RE) || []).length;

    replacementBeforeTotal += replacementBefore;
    replacementAfterTotal += replacementAfter;
    controlBeforeTotal += controlBefore;
    controlAfterTotal += controlAfter;
    touched++;

    if (fixed !== original) {
      if (!args.dryRun) fs.writeFileSync(filePath, fixed, 'utf8');
      changed++;
      console.log('Fixed', path.relative(process.cwd(), filePath), `U+FFFD ${replacementBefore}→${replacementAfter}`, `CTRL ${controlBefore}→${controlAfter}`);
    }
  }

  const unknownTop = Array.from(unknownContexts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k, v]) => ({ ctx: k.replace(/\u0000/g, ' | '), count: v }));

  console.log(
    JSON.stringify(
      {
        roots,
        filesScanned: targets.length,
        touched,
        changed,
        replacementBeforeTotal,
        replacementAfterTotal,
        controlBeforeTotal,
        controlAfterTotal,
        unknownContextsTop: unknownTop,
      },
      null,
      2
    )
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error(e?.stack || e);
    process.exit(1);
  }
}

