#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const replacements = [
  // Palabras largas primero
  ['sincronizacin', 'sincronización'], ['Sincronizacin', 'Sincronización'],
  ['electrnico', 'electrónico'], ['Electrnico', 'Electrónico'],
  ['Configuracin', 'Configuración'], ['configuracin', 'configuración'],
  ['Transaccin', 'Transacción'], ['transaccin', 'transacción'],
  ['descripcin', 'descripción'], ['Descripcin', 'Descripción'],
  ['informacin', 'información'], ['Informacin', 'Información'],
  ['notificacin', 'notificación'], ['Notificacin', 'Notificación'],
  ['actualizacin', 'actualización'], ['Actualizacin', 'Actualización'],
  ['estadsticas', 'estadísticas'], ['Estadsticas', 'Estadísticas'],
  ['categoras', 'categorías'], ['Categoras', 'Categorías'],
  ['categora', 'categoría'], ['Categora', 'Categoría'],
  ['prximos', 'próximos'], ['prximas', 'próximas'],
  ['Anlisis', 'Análisis'], ['anlisis', 'análisis'],
  ['Gestin', 'Gestión'], ['gestin', 'gestión'],
  ['conexin', 'conexión'], ['Conexin', 'Conexión'],
  ['ltimos', 'Últimos'], ['ltimas', 'Últimas'],
  ['Diseos', 'Diseños'], ['diseos', 'diseños'], ['diseo', 'diseño'],
  ['telfono', 'teléfono'], ['Telfono', 'Teléfono'],
  ['trminos', 'términos'], ['trmino', 'término'],
  ['cdigos', 'códigos'], ['cdigo', 'código'],
  ['mtodos', 'métodos'], ['mtodo', 'método'],
  ['accines', 'acciones'], ['accin', 'acción'],
  ['funcin', 'función'], ['Funcin', 'Función'],
  ['opcin', 'opción'], ['Opcin', 'Opción'],
  ['sesin', 'sesión'], ['Sesin', 'Sesión'],
  ['pgina', 'página'], ['Pgina', 'Página'],
  ['nmero', 'número'], ['Nmero', 'Número'],
  ['difcil', 'difícil'], ['Difcil', 'Difícil'],
  ['invlido', 'inválido'], ['vlido', 'válido'],
  ['rpido', 'rápido'], ['Rpido', 'Rápido'],
  ['prximo', 'próximo'], ['Prximo', 'Próximo'],
  ['Aadir', 'Añadir'], ['aadir', 'añadir'],
  ['cunto', 'cuánto'], ['Cunto', 'Cuánto'],
  ['dnde', 'dónde'], ['Dnde', 'Dónde'],
  ['cundo', 'cuándo'], ['Cundo', 'Cuándo'],
  ['cmo', 'cómo'], ['Cmo', 'Cómo'],
  ['qu', 'qué'], ['Qu', 'Qué'],
  ['quin', 'quién'], ['Quin', 'Quién'],
  ['cul', 'cuál'], ['Cul', 'Cuál'],
  ['xito', 'Éxito'],
  ['fcil', 'fácil'], ['Fcil', 'Fácil'],
  ['das', 'días'], ['Men', 'Menú'], ['men', 'menú'],
  ['Ms', 'Más'], ['ms', 'más'],
  ['til', 'útil'], ['Da', 'Día'], ['da', 'día'],
  ['S', 'Sí'],
];

function fix(text) {
  let f = text;
  for (const [b, g] of replacements) f = f.split(b).join(g);
  return f;
}

function proc(dir) {
  let c = 0;
  for (const it of fs.readdirSync(dir)) {
    const p = path.join(dir, it);
    if (fs.statSync(p).isDirectory()) c += proc(p);
    else if (it.endsWith('.json') && !it.includes('.bak')) {
      const txt = fs.readFileSync(p, 'utf8');
      const ftxt = fix(txt);
      if (txt !== ftxt) {
        fs.writeFileSync(p + '.bak3', txt, 'utf8');
        fs.writeFileSync(p, ftxt, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), p)}`);
        c++;
      }
    }
  }
  return c;
}

const locDir = path.resolve(__dirname, 'src/i18n/locales');
console.log('🔧 Corrigiendo mojibake...\n');
const tot = proc(locDir);
console.log(`\n✅ ${tot} archivos corregidos`);
