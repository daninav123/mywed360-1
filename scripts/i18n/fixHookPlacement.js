#!/usr/bin/env node

/**
 * Script para corregir la ubicacion incorrecta del hook useTranslations
 * que puede haberse colocado fuera de los componentes
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');

let filesFixed = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  
  // Patron: buscar linea suelta de useTranslations antes de la definicion del componente
  // Ejemplo:
  // export default function TaskList({
  //   const { t } = useTranslations();  <- MAL
  //   tasks,
  
  // Patron 1: Dentro de los parametros de la funcion
  const badPattern1 = /(export\s+default\s+function\s+\w+\s*\(\s*{)\s*const\s+{\s*t\s*}\s*=\s*useTranslations\(\);/g;
  if (badPattern1.test(content)) {
    // Eliminar la linea incorrecta
    content = content.replace(/^\s*const\s+{\s*t\s*}\s*=\s*useTranslations\(\);\s*$/gm, '');
    
    // Buscar la apertura del cuerpo de la funcion y añadir alli
    const bodyOpenRegex = /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{)/;
    if (bodyOpenRegex.test(content) && !content.includes('const { t } = useTranslations();')) {
      content = content.replace(bodyOpenRegex, '$1\n  const { t } = useTranslations();\n');
    }
  }
  
  // Patron 2: Despues de la declaracion de parametros pero antes del cuerpo
  const badPattern2 = /(export\s+default\s+function\s+\w+\s*\(\s*{\s*[^}]+}\s*\)\s*{)\s*\n\s*const\s+{\s*t\s*}\s*=\s*useTranslations\(\);/g;
  if (badPattern2.test(content)) {
    // Ya esta bien colocado, no hacer nada
  } else {
    // Buscar casos donde esta en una posicion extraña
    const lines = content.split('\n');
    const newLines = [];
    let fixed = false;
    let inFunctionParams = false;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detectar si estamos en parametros de funcion
      if (line.includes('export default function') || line.includes('export function') || line.includes('function')) {
        inFunctionParams = true;
      }
      
      // Contar llaves
      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;
      
      // Si encontramos useTranslations en un lugar raro
      if (line.trim() === 'const { t } = useTranslations();' && inFunctionParams && braceDepth === 0) {
        // Saltar esta linea, la añadiremos en el lugar correcto
        fixed = true;
        continue;
      }
      
      // Si encontramos la apertura del cuerpo de la funcion
      if (inFunctionParams && braceDepth === 1 && line.includes('{') && !line.includes('const { t }')) {
        newLines.push(line);
        // Añadir el hook aqui si no existe ya
        if (!content.includes('const { t } = useTranslations()') || fixed) {
          newLines.push('  const { t } = useTranslations();');
        }
        inFunctionParams = false;
        continue;
      }
      
      newLines.push(line);
    }
    
    if (fixed) {
      content = newLines.join('\n');
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${path.relative(process.cwd(), filePath)}`);
    filesFixed++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (!/\.jsx$/.test(entry.name)) continue;
      if (/\.(test|spec)\./.test(entry.name)) continue;
      
      fixFile(fullPath);
    }
  }
}

console.log('🔧 Corrigiendo ubicacion de hooks useTranslations...\n');
scanDirectory(SRC_DIR);
console.log(`\n✅ Archivos corregidos: ${filesFixed}\n`);
