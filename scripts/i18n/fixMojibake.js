#!/usr/bin/env node
/**
 * Script para corregir mojibake en archivos i18n
 * Problema: Los archivos JSON tienen caracteres corruptos (�) donde deberían estar á, é, í, ó, ú, ñ, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../../src/i18n/locales');

// Mapeo de caracteres mal codificados → caracteres correctos
const mojibakeMap = {
  // Vocales con tilde
  '\u00c1': 'Á', '\u00e1': 'á',
  '\u00c9': 'É', '\u00e9': 'é',
  '\u00cd': 'Í', '\u00ed': 'í',
  '\u00d3': 'Ó', '\u00f3': 'ó',
  '\u00da': 'Ú', '\u00fa': 'ú',
  
  // Ñ
  '\u00d1': 'Ñ', '\u00f1': 'ñ',
  
  // Vocales con diéresis
  '\u00dc': 'Ü', '\u00fc': 'ü',
  
  // Otros caracteres especiales
  '\u00a1': '¡',
  '\u00bf': '¿',
  '\u00e7': 'ç',
  '\u00c7': 'Ç',
  
  // Carácter de reemplazo Unicode
  '\ufffd': '?',  // Reemplazar con ? para identificar manualmente
  '�': '?',
};

// Patrones comunes de mojibake español
const spanishPatterns = [
  { pattern: /xito/g, replacement: 'Éxito' },
  { pattern: /Aadir/g, replacement: 'Añadir' },
  { pattern: /aadir/g, replacement: 'añadir' },
  { pattern: /S\b/g, replacement: 'Sí' },
  { pattern: /electrnico/g, replacement: 'electrónico' },
  { pattern: /Configuracin/g, replacement: 'Configuración' },
  { pattern: /configuracin/g, replacement: 'configuración' },
  { pattern: /sesin/g, replacement: 'sesión' },
  { pattern: /Ms\b/g, replacement: 'Más' },
  { pattern: /ms\b/g, replacement: 'más' },
  { pattern: /Men\b/g, replacement: 'Menú' },
  { pattern: /men\b/g, replacement: 'menú' },
  { pattern: /Transaccin/g, replacement: 'Transacción' },
  { pattern: /transaccin/g, replacement: 'transacción' },
  { pattern: /categora/g, replacement: 'categoría' },
  { pattern: /Categora/g, replacement: 'Categoría' },
  { pattern: /das\b/g, replacement: 'días' },
  { pattern: /Da\b/g, replacement: 'Día' },
  { pattern: /ltimos/g, replacement: 'Últimos' },
  { pattern: /ltimas/g, replacement: 'Últimas' },
  { pattern: /descripcin/g, replacement: 'descripción' },
  { pattern: /Descripcin/g, replacement: 'Descripción' },
  { pattern: /opcin/g, replacement: 'opción' },
  { pattern: /Opcin/g, replacement: 'Opción' },
  { pattern: /funcin/g, replacement: 'función' },
  { pattern: /Funcin/g, replacement: 'Función' },
  { pattern: /informacin/g, replacement: 'información' },
  { pattern: /Informacin/g, replacement: 'Información' },
  { pattern: /nmero/g, replacement: 'número' },
  { pattern: /Nmero/g, replacement: 'Número' },
  { pattern: /telfono/g, replacement: 'teléfono' },
  { pattern: /Telfono/g, replacement: 'Teléfono' },
  { pattern: /pgina/g, replacement: 'página' },
  { pattern: /Pgina/g, replacement: 'Página' },
  { pattern: /Bsqueda/g, replacement: 'Búsqueda' },
  { pattern: /bsqueda/g, replacement: 'búsqueda' },
  { pattern: /disponible\b/g, replacement: 'disponible' },
  { pattern: /dificil/g, replacement: 'difícil' },
  { pattern: /Difcil/g, replacement: 'Difícil' },
  { pattern: /fcil/g, replacement: 'fácil' },
  { pattern: /Fcil/g, replacement: 'Fácil' },
  { pattern: /til/g, replacement: 'útil' },
  { pattern: /til\b/g, replacement: 'útil' },
  { pattern: /invlido/g, replacement: 'inválido' },
  { pattern: /Invlido/g, replacement: 'Inválido' },
  { pattern: /vlido/g, replacement: 'válido' },
  { pattern: /Vlido/g, replacement: 'Válido' },
  { pattern: /rpido/g, replacement: 'rápido' },
  { pattern: /Rpido/g, replacement: 'Rápido' },
  { pattern: /prximo/g, replacement: 'próximo' },
  { pattern: /Prximo/g, replacement: 'Próximo' },
  { pattern: /cambiar/g, replacement: 'cambiar' },
  { pattern: /Diseos/g, replacement: 'Diseños' },
  { pattern: /diseos/g, replacement: 'diseños' },
  { pattern: /opcines/g, replacement: 'opciones' },
  { pattern: /Seleccin/g, replacement: 'Selección' },
  { pattern: /seleccin/g, replacement: 'selección' },
  { pattern: /notificacin/g, replacement: 'notificación' },
  { pattern: /Notificacin/g, replacement: 'Notificación' },
  { pattern: /actualizacin/g, replacement: 'actualización' },
  { pattern: /Actualizacin/g, replacement: 'Actualización' },
  { pattern: /estadsticas/g, replacement: 'estadísticas' },
  { pattern: /Estadsticas/g, replacement: 'Estadísticas' },
];

function fixMojibake(text) {
  let fixed = text;
  
  // Primero aplicar el mapeo de caracteres
  for (const [bad, good] of Object.entries(mojibakeMap)) {
    fixed = fixed.split(bad).join(good);
  }
  
  // Luego aplicar patrones específicos del español
  for (const { pattern, replacement } of spanishPatterns) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixMojibake(content);
    
    if (content !== fixed) {
      // Contar diferencias
      const originalMojibake = (content.match(/[����]/g) || []).length;
      const fixedMojibake = (fixed.match(/[����]/g) || []).length;
      
      // Guardar backup
      const backupPath = filePath + '.bak';
      fs.writeFileSync(backupPath, content, 'utf8');
      
      // Guardar archivo corregido
      fs.writeFileSync(filePath, fixed, 'utf8');
      
      console.log(`✅ ${path.basename(filePath)}: Corregidos ${originalMojibake - fixedMojibake} caracteres`);
      return true;
    } else {
      console.log(`✓ ${path.basename(filePath)}: Sin problemas`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error en ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  let totalFixed = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      totalFixed += processDirectory(fullPath);
    } else if (item.endsWith('.json')) {
      if (processFile(fullPath)) {
        totalFixed++;
      }
    }
  }
  
  return totalFixed;
}

console.log('🔧 Iniciando corrección de mojibake en archivos i18n...\n');

if (!fs.existsSync(localesDir)) {
  console.error(`❌ Directorio no encontrado: ${localesDir}`);
  process.exit(1);
}

const totalFixed = processDirectory(localesDir);

console.log('\n' + '='.repeat(60));
console.log(`✅ Corrección completada: ${totalFixed} archivos modificados`);
console.log('💾 Backups guardados con extensión .bak');
console.log('='.repeat(60));
