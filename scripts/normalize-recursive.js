const fs = require('fs');
const path = require('path');

const exts = new Set(['.js', '.jsx', '.ts', '.tsx', '.md']);
function walk(dir, out=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

const files = walk('src');

const map = new Map([
  ['Ã¡', 'á'], ['Ã©', 'é'], ['Ã­', 'í'], ['Ã³', 'ó'], ['Ãº', 'ú'],
  ['Ã', 'Á'], ['Ã‰', 'É'], ['Ã�', 'Í'], ['Ã“', 'Ó'], ['Ãš', 'Ú'],
  ['Ã±', 'ñ'], ['Ã‘', 'Ñ'],
  ['Ã¼', 'ü'], ['Ãœ', 'Ü'],
  ['Â¿', '¿'], ['Â¡', '¡'],
  ['Ã‚Â¿', '¿'], ['Ã‚Â¡', '¡'],
  ['ÃƒÂ¡', 'á'], ['ÃƒÂ©', 'é'], ['ÃƒÂ­', 'í'], ['ÃƒÂ³', 'ó'], ['ÃƒÂº', 'ú'], ['ÃƒÂ±', 'ñ'],
  ['Ãƒâ€šÃ‚Â¿', '¿'], ['Ãƒâ€šÃ‚Â¡', '¡'],
  ['Ã…Â“', 'œ'], ['Ã…â€™', 'Œ'],
  ['Ã¢â‚¬â€œ', '–'], ['Ã¢â‚¬â€�', '—'], ['Ã¢â‚¬Ëœ', '‘'], ['Ã¢â‚¬â„¢', '’'], ['Ã¢â‚¬Å“', '“'], ['Ã¢â‚¬Â', '”'], ['Ã¢â‚¬Â¢', '•'],
  ['Ã¢â€ºÂ¢', '•'], ['Ã¢â€ºÂ', '”'], ['Ã¢â€ºÂœ', 'œ'], ['Ã¢â€ºÂ’', '’'], ['Ã¢â€ºÂ“', '“'],
  // Common Spanish words with combined artifacts
  ['GestiÃ³n', 'Gestión'], ['BÃºsqueda', 'Búsqueda'], ['AnÃ¡lisis', 'Análisis'], ['pÃ¡gina', 'página'], ['PÃ¡gina', 'Página'],
  ['BuzÃ³n', 'Buzón'], ['Ãºltima', 'última'], ['Ãºltimo', 'último'], ['aquÃ­', 'aquí'], ['conexiÃ³n', 'conexión'],
  ['mÃ©trica', 'métrica'], ['mÃ©tricas', 'métricas'], ['dÃ­a', 'día'], ['aÃ±o', 'año'], ['EspaÃ±a', 'España'],
]);

let changed = [];
for (const f of files) {
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const orig = txt;
  for (const [bad, good] of map.entries()) {
    if (txt.includes(bad)) txt = txt.split(bad).join(good);
  }
  // Also remove lone replacement char sequences if any
  if (txt !== orig) {
    fs.writeFileSync(f, txt, 'utf8');
    changed.push(f);
  }
}
console.log('Normalized (recursive) files count:', changed.length);
