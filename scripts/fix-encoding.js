/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const DEFAULT_EXTS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.scss'
]);

// Reemplazos comunes de mojibake y tipografía
const REPLACEMENTS = [
  // Tipografía / símbolos
  ['â€“', '–'], ['â€”', '—'], ['â€˜', '‘'], ['â€™', '’'],
  ['â€œ', '“'], ['â€�', '”'], ['â€¦', '…'], ['â€¢', '•'],
  ['â‚¬', '€'], ['Â·', '·'], ['Â¡', '¡'], ['Â¿', '¿'],
  ['Â', ''],

  // Minúsculas
  ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
  ['Ã±', 'ñ'], ['Ã¼', 'ü'], ['Ã§', 'ç'],
  ['Ã ', 'à'], ['Ã¨', 'è'], ['Ã¬', 'ì'], ['Ã²', 'ò'], ['Ã¹', 'ù'],

  // Mayúsculas
  ['Ã�', 'Á'], ['Ã‰', 'É'], ['Ã�', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'],
  ['Ã‘', 'Ñ'], ['Ãœ', 'Ü'],

  // Palabras españolas frecuentes dañadas (fallbacks)
  ['Gesti��n', 'Gestión'], ['gesti��n', 'gestión'],
  ['conexi��n', 'conexión'], ['Conexi��n', 'Conexión'],
  ['Transacci��n', 'Transacción'], ['transacci��n', 'transacción'],
  ['Categor��a', 'Categoría'], ['categor��a', 'categoría'],
  ['Categor��as', 'Categorías'], ['categor��as', 'categorías'],
  ['An��lisis', 'Análisis'], ['an��lisis', 'análisis'],
  ['Descripci��n', 'Descripción'], ['descripci��n', 'descripción'],
  ['BÃºsqueda', 'Búsqueda'], ['bÃºsqueda', 'búsqueda'],
  ['NÃºmero', 'Número'], ['nÃºmero', 'número'],
  // Glifos de control/reemplazo comunes a limpiar
  ['\u001f', ''], ['\u001e', ''], ['\u001d', ''], ['\u001c', ''], ['\u001b', ''],
  ['\u0000', ''], ['\u0007', ''],
];

function applyReplacements(text) {
  let out = text;
  for (const [bad, good] of REPLACEMENTS) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  // Limpia caracteres de reemplazo visibles
  out = out.replace(/[�]/g, '');
  return out;
}

function shouldProcess(file, includeExts) {
  const ext = path.extname(file);
  return includeExts.has(ext);
}

function* walk(dir, ignore = new Set(['node_modules', '.git', 'dist', 'coverage'])) {
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of ents) {
    if (ignore.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p, ignore);
    else yield p;
  }
}

function fixFile(file, opts) {
  const before = fs.readFileSync(file, 'utf8');
  const after = applyReplacements(before);
  if (before !== after) {
    if (!opts.dryRun) {
      try { fs.copyFileSync(file, `${file}.bak`); } catch {}
      fs.writeFileSync(file, after, 'utf8');
      console.log(`[fix] ${file}`);
    } else {
      console.log(`[dry] ${file}`);
    }
    return 1;
  }
  return 0;
}

function main() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, paths: [], exts: new Set(DEFAULT_EXTS) };

  for (const a of args) {
    if (a === '--dry') opts.dryRun = true;
    else if (a.startsWith('--exts=')) {
      const list = a.slice('--exts='.length).split(',').map(s => s.trim());
      opts.exts = new Set(list.map(x => (x.startsWith('.') ? x : `.${x}`)));
    } else {
      opts.paths.push(a);
    }
  }
  if (opts.paths.length === 0) opts.paths = ['src'];

  let changed = 0;
  for (const base of opts.paths) {
    if (!fs.existsSync(base)) continue;
    const stat = fs.statSync(base);
    if (stat.isFile()) {
      if (shouldProcess(base, opts.exts)) changed += fixFile(base, opts);
    } else if (stat.isDirectory()) {
      for (const file of walk(base)) {
        if (!shouldProcess(file, opts.exts)) continue;
        changed += fixFile(file, opts);
      }
    }
  }
  console.log(`\nHecho. Archivos modificados: ${changed}${opts.dryRun ? ' (dry-run)' : ''}`);
}

if (require.main === module) main();

