#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Mapeo exhaustivo - orden es importante
const wordMap = {
  // Palabras largas primero
  'sincronizacin': 'sincronización',
  'Sincronizacin': 'Sincronización',
  'electrnico': 'electrónico',
  'Electrnico': 'Electrónico',
  'Configuracin': 'Configuración',
  'configuracin': 'configuración',
  'Transaccin': 'Transacción',
  'transaccin': 'transacción',
  'descripcin': 'descripción',
  'Descripcin': 'Descripción',
  'informacin': 'información',
  'Informacin': 'Información',
  'notificacin': 'notificación',
  'Notificacin': 'Notificación',
  'actualizacin': 'actualización',
  'Actualizacin': 'Actualización',
  'estadsticas': 'estadísticas',
  'Estadsticas': 'Estadísticas',
  'estadstica': 'estadística',
  'Estadstica': 'Estadística',
  'categoras': 'categorías',
  'Categoras': 'Categorías',
  'categora': 'categoría',
  'Categora': 'Categoría',
  'prximos': 'próximos',
  'prximas': 'próximas',
  'Anlisis': 'Análisis',
  'anlisis': 'análisis',
  'Gestin': 'Gestión',
  'gestin': 'gestión',
  'conexin': 'conexión',
  'Conexin': 'Conexión',
  'ltimos': 'Últimos',
  'ltimas': 'Últimas',
  'ltimo': 'Último',
  'ltima': 'Última',
  'Diseos': 'Diseños',
  'diseos': 'diseños',
  'diseo': 'diseño',
  'Diseo': 'Diseño',
  'telfono': 'teléfono',
  'Telfono': 'Teléfono',
  'trminos': 'términos',
  'trmino': 'término',
  'Trminos': 'Términos',
  'Trmino': 'Término',
  'cdigos': 'códigos',
  'cdigo': 'código',
  'Cdigos': 'Códigos',
  'Cdigo': 'Código',
  'mtodos': 'métodos',
  'mtodo': 'método',
  'Mtodos': 'Métodos',
  'Mtodo': 'Método',
  'accines': 'acciones',
  'accin': 'acción',
  'Accines': 'Acciones',
  'Accin': 'Acción',
  'funcin': 'función',
  'Funcin': 'Función',
  'opcines': 'opciones',
  'opcin': 'opción',
  'Opcines': 'Opciones',
  'Opcin': 'Opción',
  'sesines': 'sesiones',
  'sesin': 'sesión',
  'Sesines': 'Sesiones',
  'Sesin': 'Sesión',
  'pgina': 'página',
  'pginas': 'páginas',
  'Pgina': 'Página',
  'Pginas': 'Páginas',
  'nmero': 'número',
  'nmeros': 'números',
  'Nmero': 'Número',
  'Nmeros': 'Números',
  'difcil': 'difícil',
  'Difcil': 'Difícil',
  'invlido': 'inválido',
  'Invlido': 'Inválido',
  'vlido': 'válido',
  'Vlido': 'Válido',
  'rpido': 'rápido',
  'Rpido': 'Rápido',
  'prximo': 'próximo',
  'prxima': 'próxima',
  'Prximo': 'Próximo',
  'Prxima': 'Próxima',
  'Aadir': 'Añadir',
  'aadir': 'añadir',
  'aadiendo': 'añadiendo',
  'Aadiendo': 'Añadiendo',
  'cunto': 'cuánto',
  'Cunto': 'Cuánto',
  'dnde': 'dónde',
  'Dnde': 'Dónde',
  'cundo': 'cuándo',
  'Cundo': 'Cuándo',
  'cmo': 'cómo',
  'Cmo': 'Cómo',
  'qu': 'qué',
  'Qu': 'Qué',
  'quin': 'quién',
  'quines': 'quiénes',
  'Quin': 'Quién',
  'Quines': 'Quiénes',
  'cul': 'cuál',
  'cules': 'cuáles',
  'Cul': 'Cuál',
  'Cules': 'Cuáles',
  'fcil': 'fácil',
  'Fcil': 'Fácil',
  'xito': 'Éxito',
};

// Palabras solo cuando están solas (con límites claros)
const standaloneWords = {
  'Ms': 'Más',
  'ms': 'más',
  'Men': 'Menú',
  'men': 'menú',
  'mens': 'menús',
  'Mens': 'Menús',
  'das': 'días',
  'Da': 'Día',
  'da': 'día',
  'S': 'Sí',
  'til': 'útil',
  'Til': 'Útil',
};

function fixValue(val) {
  if (typeof val !== 'string') return val;
  let fixed = val;
  
  // Reemplazos generales
  for (const [bad, good] of Object.entries(wordMap)) {
    fixed = fixed.split(bad).join(good);
  }
  
  // Reemplazos standalone (solo palabras completas o al final de texto)
  for (const [bad, good] of Object.entries(standaloneWords)) {
    // Reemplazar si está sola o seguida de espacio, coma, punto, etc
    fixed = fixed.replace(new RegExp(`\\b${bad}\\b`, 'g'), good);
    // También al final de string
    if (fixed.endsWith(bad)) {
      fixed = fixed.slice(0, -bad.length) + good;
    }
  }
  
  return fixed;
}

function fixObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(fixObject);
  
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = fixValue(value);
    } else if (typeof value === 'object') {
      result[key] = fixObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function proc(dir) {
  let c = 0;
  for (const it of fs.readdirSync(dir)) {
    const p = path.join(dir, it);
    if (fs.statSync(p).isDirectory()) {
      c += proc(p);
    } else if (it.endsWith('.json') && !it.includes('.bak')) {
      try {
        const txt = fs.readFileSync(p, 'utf8');
        const json = JSON.parse(txt);
        const fixed = fixObject(json);
        const fixedStr = JSON.stringify(fixed, null, 2) + '\n';
        
        if (txt !== fixedStr) {
          fs.writeFileSync(p + '.bak-json', txt, 'utf8');
          fs.writeFileSync(p, fixedStr, 'utf8');
          console.log(`✅ ${path.relative(process.cwd(), p)}`);
          c++;
        }
      } catch (e) {
        console.error(`❌ ${p}: ${e.message}`);
      }
    }
  }
  return c;
}

const locDir = path.resolve(__dirname, 'src/i18n/locales');
console.log('🔧 Corrección JSON de mojibake...\n');
const tot = proc(locDir);
console.log(`\n✅ ${tot} archivos corregidos`);
