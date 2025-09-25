const fs = require("fs");
const path = require("path");
function walk(dir, out=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(json)$/i.test(entry.name)) out.push(p);
  }
  return out;
}
const base = path.join('src','i18n','locales');
if (!fs.existsSync(base)) { console.log('Locales dir not found, skipping'); process.exit(0); }
const files = walk(base).filter(f => /[\\/]es[\\/]/.test(f));
const charMap = new Map([
  ['Ã¡','á'],['Ã©','é'],['Ã­','í'],['Ã³','ó'],['Ãº','ú'],
  ['Ã','Á'],['Ã‰','É'],['Ã�','Í'],['Ã“','Ó'],['Ãš','Ú'],
  ['Ã±','ñ'],['Ã‘','Ñ'],['Ã¼','ü'],['Ãœ','Ü'],
  ['Â¿','¿'],['Â¡','¡']
]);
const wordPairs = [
  [/Ã‰xito|Exito/g,'Éxito'],[/AÃ±adir/g,'Añadir'],[/SÃ­/g,'Sí'],[/Correo electrÃ³nico|Correo electronico/g,'Correo electrónico'],
  [/DiseÃ±os/g,'Diseños'],[/ConfiguraciÃ³n/g,'Configuración'],[/Cerrar sesiÃ³n/g,'Cerrar sesión'],[/MÃ¡s/g,'Más'],[/MenÃº de usuario/g,'Menú de usuario'],
  [/Nueva TransacciÃ³n/g,'Nueva Transacción'],[/transacciÃ³n/g,'transacción'],[/categorÃ­as/g,'categorías'],[/categorÃ­a/g,'categoría'],
  [/Todos los dÃ­as/g,'Todos los días'],[/Ãšltimos 30 dÃ­as/g,'Últimos 30 días'],[/Ãšltimos 90 dÃ­as/g,'Últimos 90 días']
];
let changed = [];
for (const f of files) {
  let txt = fs.readFileSync(f,'utf8');
  const orig = txt;
  for (const [bad, good] of charMap.entries()) txt = txt.split(bad).join(good);
  for (const [re, good] of wordPairs) txt = txt.replace(re, good);
  let ok = true; try { JSON.parse(txt); } catch (e) { ok = false; }
  if (!ok) { txt = txt.replace(/�/g,''); try { JSON.parse(txt); ok = true; } catch {}
  }
  if (!ok) { console.warn('JSON parse failed for', f); continue; }
  if (txt !== orig) { fs.writeFileSync(f, txt, 'utf8'); changed.push(f); }
}
console.log('Normalized i18n es files:', changed.length);
