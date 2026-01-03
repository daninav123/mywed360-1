/**
 * Script para limpiar caché de Vite
 * Soluciona problemas de imports y HMR
 */

import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const cacheDirs = [
  join(projectRoot, 'node_modules', '.vite'),
  join(projectRoot, '.vite'),
  join(projectRoot, 'dist'),
];

async function clearCache() {
  console.log('🧹 Limpiando caché de Vite...\n');

  for (const dir of cacheDirs) {
    if (existsSync(dir)) {
      try {
        await rm(dir, { recursive: true, force: true });
        console.log(`✓ Eliminado: ${dir}`);
      } catch (error) {
        console.error(`✗ Error eliminando ${dir}:`, error.message);
      }
    } else {
      console.log(`○ No existe: ${dir}`);
    }
  }

  console.log('\n✅ Caché limpiada. Reinicia el servidor Vite (npm run dev)');
}

clearCache();
