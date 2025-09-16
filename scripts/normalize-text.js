const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function countSuspects(str) {
  // Common mojibake markers from UTF-8 mis-decoding
  const re = /(Ã.|Â.|â.|�|��|ǟ|ǭ|Ǹ)/g;
  const m = str.match(re);
  return m ? m.length : 0;
}

const targetedPairs = [
  ['Comprobando�?�', 'Comprobando…'],
  ['Informaci��n', 'Información'],
  ['conexi��n', 'conexión'],
  ['Sincronizaci��n', 'Sincronización'],
  ['suscripci��n', 'suscripción'],
  ['Suscripci��n', 'Suscripción'],
  ['Mǧsica', 'Música'],
  ['GǸneros', 'Géneros'],
  ['clǭsica', 'clásica'],
  ['electr��nica', 'electrónica'],
  ['DǸcadas', 'Décadas'],
  ['Correo electr��nico', 'Correo electrónico'],
  ['Nǧmero', 'Número'],
  ['contrase��a', 'contraseña'],
  ['celebraci��n', 'celebración'],
  ['cr��ticos', 'críticos'],
  ['Invitaci��n', 'Invitación'],
  ['invitaci��n', 'invitación'],
  ['facturaci��n', 'facturación'],
  ['Direcci��n', 'Dirección'],
  ['Pa��s', 'País'],
  ['No se encontr��', 'No se encontró'],
  ['estǭ', 'está'],
  ['intǸntalo', 'inténtalo'],
];

const genericPairs = [
  // Spanish letters
  ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
  ['Ã±', 'ñ'], ['Ã‘', 'Ñ'], ['Ã¼', 'ü'], ['Ãœ', 'Ü'],
  // Punctuation and symbols
  ['Â¿', '¿'], ['Â¡', '¡'], ['Âº', 'º'], ['Âª', 'ª'], ['Â·', '·'],
  ['Â', ''], // stray ghost char
  ['â€“', '–'], ['â€”', '—'], ['â€˜', '‘'], ['â€™', '’'],
  ['â€œ', '“'], ['â€�', '”'], ['â€¢', '•'], ['â€¦', '…'], ['â‚¬', '€']
];

function fixContent(original) {
  let s = original;
  const before = countSuspects(s);
  if (before > 0) {
    try {
      const restored = Buffer.from(s, 'latin1').toString('utf8');
      if (countSuspects(restored) < before) s = restored;
    } catch {}
  }
  for (const [from, to] of genericPairs) if (s.includes(from)) s = s.split(from).join(to);
  for (const [from, to] of targetedPairs) if (s.includes(from)) s = s.split(from).join(to);
  return s;
}

function walk(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(p);
  }
  return out;
}

const inputDirs = process.argv.slice(2);
const targetDirs = inputDirs.length ? inputDirs : ['src'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.html', '.md'];
let changedCount = 0;
for (const relDir of targetDirs) {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir, EXTENSIONS);
  for (const f of files) {
    const orig = fs.readFileSync(f, 'utf8');
    const fixed = fixContent(orig);
    if (fixed !== orig) {
      fs.writeFileSync(f, fixed, { encoding: 'utf8' });
      changedCount++;
      console.log('normalized:', path.relative(ROOT, f));
    }
  }
}
console.log('done:', changedCount);

