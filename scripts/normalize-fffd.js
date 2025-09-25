const fs = require('fs');
const path = require('path');

function walk(dir, out=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk('src');
const pairs = [
  ['P�gina', 'Página'], ['Buz�n', 'Buzón'], ['funci�n', 'función'], ['env�a', 'envía'],
  ['detecci�n', 'detección'], ['le�do', 'leído'], ['b�squeda', 'búsqueda'], ['r�pidos', 'rápidos'],
  ['aqu�', 'aquí'], ['extra�do', 'extraído'], ['sincronizaci�n', 'sincronización'],
  ['categor�a', 'categoría'], ['categor�as', 'categorías'], ['Cr�tico', 'Crítico'], ['cr�tico', 'crítico'],
  ['Transacci�n', 'Transacción'], ['transacci�n', 'transacción'], ['Descripci�n', 'Descripción'], ['descripci�n', 'descripción'],
  ['N�mero', 'Número'], ['Configuraci�n', 'Configuración'], ['Estimaci�n', 'Estimación'],
  ['B�squedas', 'Búsquedas'], ['Estad�sticas', 'Estadísticas'], ['�ltimo', 'Último'], ['�ltima', 'Última'],
  ['No le�do', 'No leído'], ['Marcar le�do', 'Marcar leído'], ['verlo aqu�', 'verlo aquí'],
];

let count=0;
for (const f of files) {
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const orig = txt;
  for (const [bad, good] of pairs) {
    if (txt.includes(bad)) txt = txt.split(bad).join(good);
  }
  if (txt !== orig) { fs.writeFileSync(f, txt, 'utf8'); count++; }
}
console.log('Fixed replacement-char words in files:', count);
