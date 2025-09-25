const fs = require('fs');
const path = require('path');

function walk(dir, out=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?|bak|md|css)$/i.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk('src');

const charMap = new Map([
  ['Ã¡','á'],['Ã©','é'],['Ã­','í'],['Ã³','ó'],['Ãº','ú'],
  ['Ã','Á'],['Ã‰','É'],['Ã�','Í'],['Ã“','Ó'],['Ãš','Ú'],
  ['Ã±','ñ'],['Ã‘','Ñ'],['Ã¼','ü'],['Ãœ','Ü'],
  ['Â¿','¿'],['Â¡','¡'],
  ['Ã—','×'],
  ['Ã‚Â¿','¿'],['Ã‚Â¡','¡'],
  // common punctuation
  ['Ã¢â‚¬â€œ','–'],['Ã¢â‚¬â€�','—'],['Ã¢â‚¬Ëœ','‘'],['Ã¢â‚¬â„¢','’'],['Ã¢â‚¬Å“','“'],['Ã¢â‚¬Â','”'],['Ã¢â‚¬Â¢','•']
]);

const wordPairs = [
  [/P[\?�]gina/g,'Página'],[/Buz[\?�]n/g,'Buzón'],[/funci[\?�]n/g,'función'],[/env[\?�]a/g,'envía'],
  [/le[\?�]do/g,'leído'],[/b[\?�]squeda/g,'búsqueda'],[/r[\?�]pidos/g,'rápidos'],[/aqu[\?�]/g,'aquí'],
  [/extra[\?�]do/g,'extraído'],[/sincronizaci[\?�]n/g,'sincronización'],[/categor[\?�]a/g,'categoría'],[/categor[\?�]as/g,'categorías'],
  [/Cr[\?�]tico/g,'Crítico'],[/cr[\?�]tico/g,'crítico'],[/Transacci[\?�]n/g,'Transacción'],[/Descripci[\?�]n/g,'Descripción'],
  [/Estimaci[\?�]n/g,'Estimación'],[/N[\?�]mero/g,'Número'],[/[�\?]ltimo/g,'Último'],[/[�\?]ltima/g,'Última'],
  [/M[\?�]todo/g,'Método'],[/Tel[\?�]fono/g,'Teléfono'],[/Informaci[\?�]n/g,'Información'],
  [/decoraci[\?�]n/g,'decoración'],[/iluminaci[\?�]n/g,'iluminación'],[/ambientaci[\?�]n/g,'ambientación'],[/papeler[\?�]a/g,'papelería'],
  [/m[\?�]sica/g,'música'],[/fotograf[\?�]a/g,'fotografía'],[/sesi[\?�]n/g,'sesión'],[/peluquer[\?�]a/g,'peluquería'],
  [/Gesti[\?�][^)\s]*n de Tareas/g,'Gestión de Tareas'],[/Nueva reuni[\?�]n/g,'Nueva reunión'],[/D[\?�]a de la boda/g,'Día de la boda'],
  [/Estad[\?�]sticas/g,'Estadísticas'],[/B[\?�]squedas/g,'Búsquedas']
];

let changed = [];
for (const f of files) {
  let buf = fs.readFileSync(f);
  let txt;
  try { txt = buf.toString('utf8'); } catch { continue; }
  const orig = txt;
  for (const [bad, good] of charMap.entries()) { if (txt.includes(bad)) txt = txt.split(bad).join(good); }
  for (const [re, good] of wordPairs) { txt = txt.replace(re, good); }
  // Fix currency symbol leftover patterns like (�) -> (€)
  txt = txt.replace(/\(�\)/g,'(€)').replace(/�/g,'');
  if (txt !== orig) { fs.writeFileSync(f, txt, 'utf8'); changed.push(f); }
}
console.log('Normalized additional files:', changed.length);
