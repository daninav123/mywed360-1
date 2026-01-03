#!/usr/bin/env node
/**
 * Script v2 para corregir mojibake - Mapeo exhaustivo palabra por palabra
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo exhaustivo de palabras mal codificadas → palabras correctas
const wordMap = {
  // Línea 8
  'xito': 'Éxito',
  // Línea 13  
  'Aadir': 'Añadir',
  'aadir': 'añadir',
  // Línea 18
  'S': 'Sí',
  // Línea 34
  'electrnico': 'electrónico',
  'Electrnico': 'Electrónico',
  // Línea 36
  'Diseos': 'Diseños',
  'diseos': 'diseños',
  'diseo': 'diseño',
  'Diseo': 'Diseño',
  // Línea 41
  'Configuracin': 'Configuración',
  'configuracin': 'configuración',
  // Línea 42
  'sesin': 'sesión',
  'Sesin': 'Sesión',
  // Línea 43
  'Ms': 'Más',
  'ms': 'más',
  // Línea 48
  'Men': 'Menú',
  'men': 'menú',
  // Línea 53
  'Transaccin': 'Transacción',
  'transaccin': 'transacción',
  // Línea 60
  'categoras': 'categorías',
  'Categoras': 'Categorías',
  'categora': 'categoría',
  'Categora': 'Categoría',
  // Línea 62
  'das': 'días',
  'Da': 'Día',
  'da': 'día',
  // Línea 63-64
  'ltimos': 'Últimos',
  'ltimas': 'Últimas',
  'ltimo': 'Último',
  'ltima': 'Última',
  // Línea 76
  // Línea 89
  // Más palabras comunes
  'descripcin': 'descripción',
  'Descripcin': 'Descripción',
  'opcin': 'opción',
  'Opcin': 'Opción',
  'opcines': 'opciones',
  'Opcines': 'Opciones',
  'funcin': 'función',
  'Funcin': 'Función',
  'informacin': 'información',
  'Informacin': 'Información',
  'nmero': 'número',
  'Nmero': 'Número',
  'telfono': 'teléfono',
  'Telfono': 'Teléfono',
  'pgina': 'página',
  'Pgina': 'Página',
  'bsqueda': 'búsqueda',
  'Bsqueda': 'Búsqueda',
  'difcil': 'difícil',
  'Difcil': 'Difícil',
  'fcil': 'fácil',
  'Fcil': 'Fácil',
  'til': 'útil',
  'Til': 'Útil',
  'invlido': 'inválido',
  'Invlido': 'Inválido',
  'vlido': 'válido',
  'Vlido': 'Válido',
  'rpido': 'rápido',
  'Rpido': 'Rápido',
  'prximo': 'próximo',
  'Prximo': 'Próximo',
  'Seleccin': 'Selección',
  'seleccin': 'selección',
  'notificacin': 'notificación',
  'Notificacin': 'Notificación',
  'actualizacin': 'actualización',
  'Actualizacin': 'Actualización',
  'estadsticas': 'estadísticas',
  'Estadsticas': 'Estadísticas',
  'estadstica': 'estadística',
  'Estadstica': 'Estadística',
  'trmino': 'término',
  'Trmino': 'Término',
  'trminos': 'términos',
  'Trminos': 'Términos',
  'cdigo': 'código',
  'Cdigo': 'Código',
  'cdigos': 'códigos',
  'Cdigos': 'Códigos',
  'perodo': 'período',
  'Perodo': 'Período',
  'crdito': 'crédito',
  'Crdito': 'Crédito',
  'dbito': 'débito',
  'Dbito': 'Débito',
  'dlar': 'dólar',
  'Dlar': 'Dólar',
  'dlares': 'dólares',
  'Dlares': 'Dólares',
  'mtodo': 'método',
  'Mtodo': 'Método',
  'mtodos': 'métodos',
  'Mtodos': 'Métodos',
  'msica': 'música',
  'Msica': 'Música',
  'fotografa': 'fotografía',
  'Fotografa': 'Fotografía',
  'videografa': 'videografía',
  'Videografa': 'Videografía',
  'decoracin': 'decoración',
  'Decoracin': 'Decoración',
  'celebracin': 'celebración',
  'Celebracin': 'Celebración',
  'invitacin': 'invitación',
  'Invitacin': 'Invitación',
  'invitacines': 'invitaciones',
  'Invitacines': 'Invitaciones',
  'confirmacin': 'confirmación',
  'Confirmacin': 'Confirmación',
  'asistir': 'asistir',
  'Asistir': 'Asistir',
  'ubicacin': 'ubicación',
  'Ubicacin': 'Ubicación',
  'direccin': 'dirección',
  'Direccin': 'Dirección',
  'accin': 'acción',
  'Accin': 'Acción',
  'accines': 'acciones',
  'Accines': 'Acciones',
  'editar': 'editar',
  'Editar': 'Editar',
  'edicin': 'edición',
  'Edicin': 'Edición',
  'adicin': 'adición',
  'Adicin': 'Adición',
  'eliminacin': 'eliminación',
  'Eliminacin': 'Eliminación',
  'modificacin': 'modificación',
  'Modificacin': 'Modificación',
  'creacin': 'creación',
  'Creacin': 'Creación',
  'generacin': 'generación',
  'Generacin': 'Generación',
  'visualizacin': 'visualización',
  'Visualizacin': 'Visualización',
  'organizacin': 'organización',
  'Organizacin': 'Organización',
  'planificacin': 'planificación',
  'Planificacin': 'Planificación',
  'exportacin': 'exportación',
  'Exportacin': 'Exportación',
  'importacin': 'importación',
  'Importacin': 'Importación',
  'publicacin': 'publicación',
  'Publicacin': 'Publicación',
  'comunicacin': 'comunicación',
  'Comunicacin': 'Comunicación',
  'operacin': 'operación',
  'Operacin': 'Operación',
  'operacines': 'operaciones',
  'Operacines': 'Operaciones',
  'relacin': 'relación',
  'Relacin': 'Relación',
  'relacines': 'relaciones',
  'Relacines': 'Relaciones',
  'solucin': 'solución',
  'Solucin': 'Solución',
  'solucines': 'soluciones',
  'Solucines': 'Soluciones',
  'reunin': 'reunión',
  'Reunin': 'Reunión',
  'reunines': 'reuniones',
  'Reunines': 'Reuniones',
  'versin': 'versión',
  'Versin': 'Versión',
  'versines': 'versiones',
  'Versines': 'Versiones',
  'revisin': 'revisión',
  'Revisin': 'Revisión',
  'divisin': 'división',
  'Divisin': 'División',
  'decisin': 'decisión',
  'Decisin': 'Decisión',
  'precisin': 'precisión',
  'Precisin': 'Precisión',
  'provisin': 'provisión',
  'Provisin': 'Provisión',
  'televisin': 'televisión',
  'Televisin': 'Televisión',
  'supervisin': 'supervisión',
  'Supervisin': 'Supervisión',
  'cohesin': 'cohesión',
  'Cohesin': 'Cohesión',
  'adhesin': 'adhesión',
  'Adhesin': 'Adhesión',
  'explosin': 'explosión',
  'Explosin': 'Explosión',
  'confusin': 'confusión',
  'Confusin': 'Confusión',
  'difusin': 'difusión',
  'Difusin': 'Difusión',
  'fusin': 'fusión',
  'Fusin': 'Fusión',
  'ilusin': 'ilusión',
  'Ilusin': 'Ilusión',
  'inclusin': 'inclusión',
  'Inclusin': 'Inclusión',
  'exclusin': 'exclusión',
  'Exclusin': 'Exclusión',
  'conclusin': 'conclusión',
  'Conclusin': 'Conclusión',
  'extensin': 'extensión',
  'Extensin': 'Extensión',
  'dimensin': 'dimensión',
  'Dimensin': 'Dimensión',
  'tensin': 'tensión',
  'Tensin': 'Tensión',
  'suspensin': 'suspensión',
  'Suspensin': 'Suspensión',
  'compresin': 'compresión',
  'Compresin': 'Compresión',
  'expresin': 'expresión',
  'Expresin': 'Expresión',
  'impresin': 'impresión',
  'Impresin': 'Impresión',
  'depresin': 'depresión',
  'Depresin': 'Depresión',
  'agresin': 'agresión',
  'Agresin': 'Agresión',
  'progresin': 'progresión',
  'Progresin': 'Progresión',
  'regresin': 'regresión',
  'Regresin': 'Regresión',
  'digresin': 'digresión',
  'Digresin': 'Digresión',
  'obsesin': 'obsesión',
  'Obsesin': 'Obsesión',
  'sesin': 'sesión',
  'Sesin': 'Sesión',
  'sesines': 'sesiones',
  'Sesines': 'Sesiones',
  'pasin': 'pasión',
  'Pasin': 'Pasión',
  'pasines': 'pasiones',
  'Pasines': 'Pasiones',
  'invasin': 'invasión',
  'Invasin': 'Invasión',
  'evasin': 'evasión',
  'Evasin': 'Evasión',
  'ocasin': 'ocasión',
  'Ocasin': 'Ocasión',
  'ocasines': 'ocasiones',
  'Ocasines': 'Ocasiones',
  'persuasin': 'persuasión',
  'Persuasin': 'Persuasión',
};

function fixText(text) {
  let fixed = text;
  
  // Ordenar por longitud descendente para evitar reemplazos parciales
  const sortedWords = Object.entries(wordMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [bad, good] of sortedWords) {
    // Usar replace global pero con límites de palabra
    const regex = new RegExp(`\\b${bad}\\b`, 'g');
    fixed = fixed.replace(regex, good);
  }
  
  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixText(content);
    
    if (content !== fixed) {
      // Backup
      fs.writeFileSync(filePath + '.bak', content, 'utf8');
      
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
    } else if (item.endsWith('.json') && !item.endsWith('.bak')) {
      count += processFile(fullPath);
    }
  }
  
  return count;
}

const localesDir = path.resolve(__dirname, '../../src/i18n/locales');
console.log('🔧 Corrigiendo mojibake i18n...\n');

const total = processDir(localesDir);

console.log(`\n✅ ${total} archivos corregidos`);
