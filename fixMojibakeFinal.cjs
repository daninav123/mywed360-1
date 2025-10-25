#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Reemplazos que son seguros (palabras largas/específicas)
const safeReplacements = [
  ['sincronizacin', 'sincronización'], ['Sincronizacin', 'Sincronización'],
  ['electrnico', 'electrónico'], ['Electrnico', 'Electrónico'],
  ['Configuracin', 'Configuración'], ['configuracin', 'configuración'],
  ['Transaccin', 'Transacción'], ['transaccin', 'transacción'],
  ['descripcin', 'descripción'], ['Descripcin', 'Descripción'],
  ['informacin', 'información'], ['Informacin', 'Información'],
  ['notificacin', 'notificación'], ['Notificacin', 'Notificación'],
  ['actualizacin', 'actualización'], ['Actualizacin', 'Actualización'],
  ['estadsticas', 'estadísticas'], ['Estadsticas', 'Estadísticas'],
  ['estadstica', 'estadística'], ['Estadstica', 'Estadística'],
  ['categoras', 'categorías'], ['Categoras', 'Categorías'],
  ['categora', 'categoría'], ['Categora', 'Categoría'],
  ['prximos', 'próximos'], ['prximas', 'próximas'],
  ['Anlisis', 'Análisis'], ['anlisis', 'análisis'],
  ['Gestin', 'Gestión'], ['gestin', 'gestión'],
  ['conexin', 'conexión'], ['Conexin', 'Conexión'],
  ['ltimos', 'Últimos'], ['ltimas', 'Últimas'],
  ['ltimo', 'Último'], ['ltima', 'Última'],
  ['Diseos', 'Diseños'], ['diseos', 'diseños'], ['diseo', 'diseño'],
  ['Diseo', 'Diseño'],
  ['telfono', 'teléfono'], ['Telfono', 'Teléfono'],
  ['trminos', 'términos'], ['trmino', 'término'],
  ['Trminos', 'Términos'], ['Trmino', 'Término'],
  ['cdigos', 'códigos'], ['cdigo', 'código'],
  ['Cdigos', 'Códigos'], ['Cdigo', 'Código'],
  ['mtodos', 'métodos'], ['mtodo', 'método'],
  ['Mtodos', 'Métodos'], ['Mtodo', 'Método'],
  ['accines', 'acciones'], ['accin', 'acción'],
  ['Accines', 'Acciones'], ['Accin', 'Acción'],
  ['funcin', 'función'], ['Funcin', 'Función'],
  ['opcines', 'opciones'], ['Opcines', 'Opciones'],
  ['opcin', 'opción'], ['Opcin', 'Opción'],
  ['sesines', 'sesiones'], ['Sesines', 'Sesiones'],
  ['sesin', 'sesión'], ['Sesin', 'Sesión'],
  ['pgina', 'página'], ['Pgina', 'Página'],
  ['pginas', 'páginas'], ['Pginas', 'Páginas'],
  ['nmero', 'número'], ['Nmero', 'Número'],
  ['nmeros', 'números'], ['Nmeros', 'Números'],
  ['difcil', 'difícil'], ['Difcil', 'Difícil'],
  ['invlido', 'inválido'], ['Invlido', 'Inválido'],
  ['vlido', 'válido'], ['Vlido', 'Válido'],
  ['rpido', 'rápido'], ['Rpido', 'Rápido'],
  ['prximo', 'próximo'], ['Prximo', 'Próximo'],
  ['prxima', 'próxima'], ['Prxima', 'Próxima'],
  ['Aadir', 'Añadir'], ['aadir', 'añadir'],
  ['aadiendo', 'añadiendo'], ['Aadiendo', 'Añadiendo'],
  ['cunto', 'cuánto'], ['Cunto', 'Cuánto'],
  ['dnde', 'dónde'], ['Dnde', 'Dónde'],
  ['cundo', 'cuándo'], ['Cundo', 'Cuándo'],
  ['cmo', 'cómo'], ['Cmo', 'Cómo'],
  ['qu', 'qué'], ['Qu', 'Qué'],
  ['quin', 'quién'], ['Quin', 'Quién'],
  ['quines', 'quiénes'], ['Quines', 'Quiénes'],
  ['cul', 'cuál'], ['Cul', 'Cuál'],
  ['cules', 'cuáles'], ['Cules', 'Cuáles'],
  ['fcil', 'fácil'], ['Fcil', 'Fácil'],
  ['Men', 'Menú'], ['men', 'menú'],
  ['mens', 'menús'], ['Mens', 'Menús'],
];

// Reemplazos que necesitan límites de palabra
const wordBoundaryReplacements = [
  ['xito', 'Éxito'],
  ['"Ms"', '"Más"'],  // Solo en valores JSON
  [': "Ms"', ': "Más"'],
  ['"ms"', '"más"'],
  [': "ms"', ': "más"'],
  ['"das"', '"días"'],
  [': "das"', ': "días"'],
  ['"Da"', '"Día"'],
  [': "Da"', ': "Día"'],
  ['"da"', '"día"'],
  [': "da"', ': "día"'],
  ['"S"', '"Sí"'],
  [': "S"', ': "Sí"'],
  ['"til"', '"útil"'],
  [': "til"', ': "útil"'],
];

function fix(text) {
  let f = text;
  
  // Primero reemplazos seguros
  for (const [b, g] of safeReplacements) {
    f = f.split(b).join(g);
  }
  
  // Luego reemplazos con límites de palabra (solo en contexto JSON)
  for (const [b, g] of wordBoundaryReplacements) {
    f = f.split(b).join(g);
  }
  
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
        fs.writeFileSync(p + '.bak-final', txt, 'utf8');
        fs.writeFileSync(p, ftxt, 'utf8');
        console.log(`✅ ${path.relative(process.cwd(), p)}`);
        c++;
      }
    }
  }
  return c;
}

const locDir = path.resolve(__dirname, 'src/i18n/locales');
console.log('🔧 Corrección final de mojibake...\n');
const tot = proc(locDir);
console.log(`\n✅ ${tot} archivos corregidos`);
