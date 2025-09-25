const fs = require('fs');
const file = 'src/i18n/locales/es/common.json';
let buf = fs.readFileSync(file);
let txt = buf.toString('utf8');
// Strip BOM if present
if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
const orig0 = txt;
const charMap = new Map([
  ['Ã¡','á'],['Ã©','é'],['Ã­','í'],['Ã³','ó'],['Ãº','ú'],
  ['Ã','Á'],['Ã‰','É'],['Ã�','Í'],['Ã“','Ó'],['Ãš','Ú'],
  ['Ã±','ñ'],['Ã‘','Ñ'],['Ã¼','ü'],['Ãœ','Ü'],
  ['Â¿','¿'],['Â¡','¡']
]);
for (const [bad, good] of charMap.entries()) txt = txt.split(bad).join(good);
const pairs = [
  ['�%xito','Éxito'],['A��adir','Añadir'],['S��','Sí'],['Correo electr��nico','Correo electrónico'],
  ['Dise��os','Diseños'],['Configuraci��n','Configuración'],['Cerrar sesi��n','Cerrar sesión'],['Mǭs','Más'],['Menǧ','Menú'],
  ['Transacci��n','Transacción'],['transacci��n','transacción'],['categor��as','categorías'],['categor��a','categoría'],
  ['d��as','días'],['�sltimos','Últimos'],['Gesti��n','Gestión'],['�sltima','Última'],
  ['Categor��a','Categoría'],['Descripci��n','Descripción'],['Conexi��n','Conexión'],
  ['Presupuesto por Categor��as','Presupuesto por Categorías'],['Monto (�','Monto (€'],['Person A (�','Person A (€'],['Person B (�','Person B (€'],['(�/month)','(€/month)'],
  [' electr��nico',' electrónico']
];
for (const [bad, good] of pairs) txt = txt.split(bad).join(good);
txt = txt.replace(/�+/g,'');
JSON.parse(txt);
fs.writeFileSync(file, txt, 'utf8');
console.log('common.json normalized OK');
