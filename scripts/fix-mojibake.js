/* Mojibake fixer across the repo. Reinterprets Latin1->UTF8 when helpful and applies heuristic replacements. */
const fs = require('fs');
const path = require('path');

const EXT_WHITELIST = new Set([
  '.md', '.mdx', '.txt', '.js', '.jsx', '.ts', '.tsx', '.json', '.yml', '.yaml', '.html', '.css', '.scss', '.csv'
]);
const EXCLUDES = [
  /node_modules/, /dist\b/, /\\\.git\b/, /\\\.vscode\b/, /\\\.windsurf\b/, /scripts\\fix-mojibake\.js$/
];

// Typical mojibake markers (double-decoding, BOM, CP1252 leftovers)
const MOJI_PAT = /Ãƒ|Ã‚|Ã¢|Ã¯»¿|\uFFFD|©|±|³|º|¡|\u00AD|Ã’/;

function shouldProcess(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXT_WHITELIST.has(ext)) return false;
  const rel = path.relative(process.cwd(), file);
  if (EXCLUDES.some((rx) => rx.test(rel))) return false;
  return true;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDES.some((rx) => rx.test(full))) continue;
      walk(full, out);
    } else if (e.isFile()) {
      if (shouldProcess(full)) out.push(full);
    }
  }
  return out;
}

function fixText(text) {
  const before = (text.match(MOJI_PAT) || []).length;
  // Reinterpretation pass
  let best = Buffer.from(text, 'latin1').toString('utf8');

  // Straight swaps for common sequences
  const table = [
    // Accented letters
    ['ñ', 'ñ'], ['á', 'á'], ['é', 'é'], ['í', 'í'], ['ó', 'ó'], ['ú', 'ú'],
    ['Ãƒ', 'Á'], ['Ãƒ€°', 'Ã‰'], ['Ãƒ', 'Í'], ['Ãƒ€œ', 'Ã“'], ['ÃƒÅ¡', 'Ãš'], ['Ãƒ¼', 'Ã¼'],
    // Punctuation
    ['Ã‚¿', '¿'], ['Ã‚¡', '¡'], ['Ã‚°', '°'],
    // Smart quotes/dashes
    ['Ã¢‚¬Å“', '€œ'], ['Ã¢‚¬', '€'], ['Ã¢‚¬„¢', '€™'], ['Ã¢‚¬Ëœ', '€˜'], ['Ã¢‚¬€œ', '€“'], ['Ã¢‚¬€', '€”'],
  ];
  for (const [bad, good] of table) best = best.split(bad).join(good);

  // Contextual replacements for CP1252/CP850 leftovers only when inside words
  const between = (s, bad, good) => s.replace(new RegExp(`(\\p{L})${bad}(\\p{L})`, 'gu'), `$1${good}$2`);
  best = between(best, '©', 'é'); // Inglés -> Inglés
  best = between(best, '±', 'ñ'); // añadir -> añadir
  best = between(best, '³', 'ó'); // sección -> sección
  best = between(best, 'º', 'ú'); // Número -> Número
  best = between(best, '\u00AD', 'í'); // límite -> límite
  best = between(best, '¡', 'á'); // página -> página (keeps real ¡ when not between letters)

  // Fix stray 'Ã’' prefix artifacts (raÃ’íz -> raíz)
  best = best.replace(/Ã’¡/g, 'á')
             .replace(/Ã’a/g, 'á').replace(/Ã’e/g, 'é').replace(/Ã’i/g, 'í').replace(/Ã’o/g, 'ó').replace(/Ã’u/g, 'ú')
             .replace(/Ã’A/g, 'Á').replace(/Ã’E/g, 'Ã‰').replace(/Ã’I/g, 'Í').replace(/Ã’O/g, 'Ã“').replace(/Ã’U/g, 'Ãš');

  const after = (best.match(MOJI_PAT) || []).length;
  if (after < before || best !== text) return best;
  return text;
}

function main() {
  const roots = ['docs', 'src', 'backend', 'scripts', 'cypress', 'tests', 'tools', 'public'];
  const targets = [];
  for (const base of roots) if (fs.existsSync(base)) walk(base, targets);

  let changed = 0, beforeTotal = 0, afterTotal = 0, touched = 0;
  for (const file of targets) {
    const original = fs.readFileSync(file, 'utf8');
    const before = (original.match(MOJI_PAT) || []).length;
    if (!before) continue;
    const fixed = fixText(original);
    const after = (fixed.match(MOJI_PAT) || []).length;
    beforeTotal += before; afterTotal += after; touched++;
    if (fixed !== original && after <= before) {
      fs.writeFileSync(file, fixed, 'utf8');
      changed++;
      console.log('Fixed', path.relative(process.cwd(), file), `(${before} -> ${after})`);
    }
  }
  console.log(JSON.stringify({ filesScanned: targets.length, touched, changed, beforeTotal, afterTotal }, null, 2));
}

if (require.main === module) main();

