/**
 * Script para detectar cadenas hardcodeadas que deberían usar i18n
 * Uso: node scripts/i18n/detectHardcodedStrings.js [ruta]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patrones a buscar (cadenas en español que deberían estar traducidas)
const PATTERNS = [
  // Palabras comunes en español
  /['"`](Inicio|Tareas|Finanzas|Invitados|Proveedores|Protocolo|Diseños|Email|Más|Perfil|Bodas|Admin)['"` ]/gi,
  // Acciones comunes
  /['"`](Guardar|Cancelar|Editar|Eliminar|Crear|Añadir|Buscar|Filtrar|Exportar|Importar)['"` ]/gi,
  // Mensajes
  /['"`](Error|Éxito|Advertencia|Información|Cargando|No se pudo)['"` ]/gi,
  // Etiquetas de formulario
  /['"`](Nombre|Apellido|Email|Teléfono|Dirección|Fecha|Descripción|Comentarios)['"` ]/gi,
];

// Extensiones de archivo a analizar
const EXTENSIONS = ['.jsx', '.js', '.tsx', '.ts'];

// Archivos/directorios a ignorar
const IGNORE = [
  'node_modules',
  'build',
  'dist',
  '.git',
  'coverage',
  'locales',
  'i18n',
  '.test.',
  '.spec.',
  'detectHardcodedStrings.js',
];

let totalFiles = 0;
let totalMatches = 0;
const results = [];

/**
 * Verifica si una ruta debe ser ignorada
 */
function shouldIgnore(filePath) {
  return IGNORE.some((pattern) => filePath.includes(pattern));
}

/**
 * Analiza un archivo en busca de cadenas hardcodeadas
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      // Ignorar líneas de comentarios
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

      PATTERNS.forEach((pattern) => {
        const found = line.match(pattern);
        if (found) {
          found.forEach((match) => {
            // Verificar que no sea una clave i18n (no tiene puntos)
            const cleanMatch = match.replace(/['"` ]/g, '');
            if (!cleanMatch.includes('.') && !line.includes('t(')) {
              matches.push({
                line: index + 1,
                content: line.trim(),
                match: cleanMatch,
              });
            }
          });
        }
      });
    });

    if (matches.length > 0) {
      totalMatches += matches.length;
      results.push({
        file: path.relative(process.cwd(), filePath),
        matches,
      });
    }

    totalFiles++;
  } catch (error) {
    console.error(`Error analizando ${filePath}:`, error.message);
  }
}

/**
 * Recorre recursivamente un directorio
 */
function walkDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (shouldIgnore(filePath)) return;

    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (EXTENSIONS.some((ext) => filePath.endsWith(ext))) {
      analyzeFile(filePath);
    }
  });
}

// Main
const targetPath = process.argv[2] || path.join(__dirname, '../../src');

console.log('🔍 Buscando cadenas hardcodeadas que deberían usar i18n...\n');
console.log(`📁 Analizando: ${targetPath}\n`);

walkDirectory(targetPath);

console.log(`\n✅ Análisis completo:`);
console.log(`   - Archivos analizados: ${totalFiles}`);
console.log(`   - Coincidencias encontradas: ${totalMatches}\n`);

if (results.length > 0) {
  console.log('📋 Archivos con cadenas hardcodeadas:\n');
  results.forEach(({ file, matches }) => {
    console.log(`\n📄 ${file} (${matches.length} coincidencias)`);
    matches.slice(0, 5).forEach((match) => {
      console.log(`   Línea ${match.line}: "${match.match}"`);
      console.log(`   └─ ${match.content.substring(0, 80)}...`);
    });
    if (matches.length > 5) {
      console.log(`   ... y ${matches.length - 5} más`);
    }
  });

  // Guardar resultados en JSON
  const outputPath = path.join(__dirname, 'hardcoded-strings-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Reporte completo guardado en: ${outputPath}`);
} else {
  console.log('✨ No se encontraron cadenas hardcodeadas sospechosas');
}

console.log(
  '\n💡 Tip: Usa el modo debug i18n (🔍 en el selector de idioma) para encontrar claves faltantes en tiempo real'
);
