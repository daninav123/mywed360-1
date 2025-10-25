#!/usr/bin/env node
/**
 * Script v3 - Replace directo sin regex
 */

const fs = require('fs');
const path = require('path');

// Mapeo directo (ordenado por longitud para evitar reemplazos parciales)
const replacements = [
  // Palabras largas primero
  ['electrnico', 'electrónico'],
  ['Electrnico', 'Electrónico'],
  ['Configuracin', 'Configuración'],
  ['configuracin', 'configuración'],
  ['Transaccin', 'Transacción'],
  ['transaccin', 'transacción'],
  ['descripcin', 'descripción'],
  ['Descripcin', 'Descripción'],
  ['informacin', 'información'],
  ['Informacin', 'Información'],
  ['notificacin', 'notificación'],
  ['Notificacin', 'Notificación'],
  ['actualizacin', 'actualización'],
  ['Actualizacin', 'Actualización'],
  ['estadsticas', 'estadísticas'],
  ['Estadsticas', 'Estadísticas'],
  ['estadstica', 'estadística'],
  ['Estadstica', 'Estadística'],
  ['videografa', 'videografía'],
  ['Videografa', 'Videografía'],
  ['fotografa', 'fotografía'],
  ['Fotografa', 'Fotografía'],
  ['decoracin', 'decoración'],
  ['Decoracin', 'Decoración'],
  ['celebracin', 'celebración'],
  ['Celebracin', 'Celebración'],
  ['invitacines', 'invitaciones'],
  ['Invitacines', 'Invitaciones'],
  ['invitacin', 'invitación'],
  ['Invitacin', 'Invitación'],
  ['confirmacin', 'confirmación'],
  ['Confirmacin', 'Confirmación'],
  ['ubicacin', 'ubicación'],
  ['Ubicacin', 'Ubicación'],
  ['direccin', 'dirección'],
  ['Direccin', 'Dirección'],
  ['organizacin', 'organización'],
  ['Organizacin', 'Organización'],
  ['planificacin', 'planificación'],
  ['Planificacin', 'Planificación'],
  ['exportacin', 'exportación'],
  ['Exportacin', 'Exportación'],
  ['importacin', 'importación'],
  ['Importacin', 'Importación'],
  ['publicacin', 'publicación'],
  ['Publicacin', 'Publicación'],
  ['comunicacin', 'comunicación'],
  ['Comunicacin', 'Comunicación'],
  ['visualizacin', 'visualización'],
  ['Visualizacin', 'Visualización'],
  ['eliminacin', 'eliminación'],
  ['Eliminacin', 'Eliminación'],
  ['modificacin', 'modificación'],
  ['Modificacin', 'Modificación'],
  ['Seleccin', 'Selección'],
  ['seleccin', 'selección'],
  ['operacines', 'operaciones'],
  ['Operacines', 'Operaciones'],
  ['operacin', 'operación'],
  ['Operacin', 'Operación'],
  ['relacines', 'relaciones'],
  ['Relacines', 'Relaciones'],
  ['relacin', 'relación'],
  ['Relacin', 'Relación'],
  ['solucines', 'soluciones'],
  ['Solucines', 'Soluciones'],
  ['solucin', 'solución'],
  ['Solucin', 'Solución'],
  ['reunines', 'reuniones'],
  ['Reunines', 'Reuniones'],
  ['reunin', 'reunión'],
  ['Reunin', 'Reunión'],
  ['versines', 'versiones'],
  ['Versines', 'Versiones'],
  ['versin', 'versión'],
  ['Versin', 'Versión'],
  ['opcines', 'opciones'],
  ['Opcines', 'Opciones'],
  ['categoras', 'categorías'],
  ['Categoras', 'Categorías'],
  ['categora', 'categoría'],
  ['Categora', 'Categoría'],
  ['ltimos', 'Últimos'],
  ['ltimas', 'Últimas'],
  ['ltimo', 'Último'],
  ['ltima', 'Última'],
  ['Diseos', 'Diseños'],
  ['diseos', 'diseños'],
  ['diseo', 'diseño'],
  ['Diseo', 'Diseño'],
  ['Bsqueda', 'Búsqueda'],
  ['bsqueda', 'búsqueda'],
  ['telfono', 'teléfono'],
  ['Telfono', 'Teléfono'],
  ['trminos', 'términos'],
  ['Trminos', 'Términos'],
  ['trmino', 'término'],
  ['Trmino', 'Término'],
  ['cdigos', 'códigos'],
  ['Cdigos', 'Códigos'],
  ['cdigo', 'código'],
  ['Cdigo', 'Código'],
  ['dlares', 'dólares'],
  ['Dlares', 'Dólares'],
  ['mtodos', 'métodos'],
  ['Mtodos', 'Métodos'],
  ['mtodo', 'método'],
  ['Mtodo', 'Método'],
  ['creacin', 'creación'],
  ['Creacin', 'Creación'],
  ['generacin', 'generación'],
  ['Generacin', 'Generación'],
  ['adicin', 'adición'],
  ['Adicin', 'Adición'],
  ['edicin', 'edición'],
  ['Edicin', 'Edición'],
  ['accines', 'acciones'],
  ['Accines', 'Acciones'],
  ['accin', 'acción'],
  ['Accin', 'Acción'],
  ['funcin', 'función'],
  ['Funcin', 'Función'],
  ['opcin', 'opción'],
  ['Opcin', 'Opción'],
  ['sesin', 'sesión'],
  ['Sesin', 'Sesión'],
  ['msica', 'música'],
  ['Msica', 'Música'],
  ['pgina', 'página'],
  ['Pgina', 'Página'],
  ['nmero', 'número'],
  ['Nmero', 'Número'],
  ['perodo', 'período'],
  ['Perodo', 'Período'],
  ['crdito', 'crédito'],
  ['Crdito', 'Crédito'],
  ['dbito', 'débito'],
  ['Dbito', 'Débito'],
  ['dlar', 'dólar'],
  ['Dlar', 'Dólar'],
  ['difcil', 'difícil'],
  ['Difcil', 'Difícil'],
  ['invlido', 'inválido'],
  ['Invlido', 'Inválido'],
  ['vlido', 'válido'],
  ['Vlido', 'Válido'],
  ['rpido', 'rápido'],
  ['Rpido', 'Rápido'],
  ['prximo', 'próximo'],
  ['Prximo', 'Próximo'],
  ['Aadir', 'Añadir'],
  ['aadir', 'añadir'],
  ['xito', 'Éxito'],
  ['fcil', 'fácil'],
  ['Fcil', 'Fácil'],
  ['das', 'días'],
  ['Men', 'Menú'],
  ['men', 'menú'],
  ['Ms', 'Más'],
  ['ms', 'más'],
  ['til', 'útil'],
  ['Til', 'Útil'],
  ['Da', 'Día'],
  ['da', 'día'],
  ['S', 'Sí'],
];

function fixText(text) {
  let fixed = text;
  for (const [bad, good] of replacements) {
    fixed = fixed.split(bad).join(good);
  }
  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixText(content);
    
    if (content !== fixed) {
      // Backup
      fs.writeFileSync(filePath + '.bak2', content, 'utf8');
      
      // Guardar corregido
      fs.writeFileSync(filePath, fixed, 'utf8');
      
      console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`❌ ${filePath}:`, error.message);
    return 0;
  }
}

function processDir(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      count += processDir(fullPath);
    } else if (item.endsWith('.json') && !item.includes('.bak')) {
      count += processFile(fullPath);
    }
  }
  
  return count;
}

const localesDir = path.resolve(__dirname, '../../src/i18n/locales');
console.log('🔧 Corrigiendo mojibake i18n v3...\n');

const total = processDir(localesDir);

console.log(`\n✅ ${total} archivos corregidos`);
