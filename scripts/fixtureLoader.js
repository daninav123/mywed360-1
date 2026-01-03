#!/usr/bin/env node
/**
 * Fixture Loader - Sistema de carga de fixtures deterministas
 * 
 * Permite cargar fixtures JSON para tests E2E y scripts de seed
 * con datos consistentes y reproducibles.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = join(__dirname, '..', 'cypress', 'fixtures');

/**
 * Carga un archivo de fixture
 * @param {string} fixtureName - Nombre del archivo (ej: 'users.json')
 * @returns {Object} Datos del fixture parseados
 */
export function loadFixture(fixtureName) {
  try {
    const fixturePath = join(FIXTURES_DIR, fixtureName);
    const content = readFileSync(fixturePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error cargando fixture ${fixtureName}:`, error.message);
    throw error;
  }
}

/**
 * Carga múltiples fixtures
 * @param {string[]} fixtureNames - Array de nombres de fixtures
 * @returns {Object} Objeto con todas las fixtures cargadas
 */
export function loadFixtures(fixtureNames) {
  const fixtures = {};
  for (const name of fixtureNames) {
    const key = name.replace('.json', '');
    fixtures[key] = loadFixture(name);
  }
  return fixtures;
}

/**
 * Carga todos los fixtures estándar
 * @returns {Object} Objeto con todos los fixtures
 */
export function loadAllFixtures() {
  return loadFixtures([
    'users.json',
    'weddings.json',
    'guests.json',
    'seating.json',
    'finance.json',
    'tasks.json',
    'suppliers.json'
  ]);
}

/**
 * Valida que un fixture tenga la estructura esperada
 * @param {Object} fixture - Datos del fixture
 * @param {string[]} requiredKeys - Claves requeridas
 * @returns {boolean} true si es válido
 */
export function validateFixture(fixture, requiredKeys) {
  for (const key of requiredKeys) {
    if (!(key in fixture)) {
      console.error(`❌ Fixture inválido: falta clave '${key}'`);
      return false;
    }
  }
  return true;
}

// Si se ejecuta directamente, mostrar ayuda
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Fixture Loader');
  console.log('\nUso en tu script:');
  console.log('  import { loadFixture, loadAllFixtures } from "./fixtureLoader.js";');
  console.log('\n  const users = loadFixture("users.json");');
  console.log('  const all = loadAllFixtures();');
  console.log('\nFixtures disponibles:');
  console.log('  - users.json');
  console.log('  - weddings.json');
  console.log('  - guests.json');
  console.log('  - seating.json');
  console.log('  - finance.json');
  console.log('  - tasks.json');
  console.log('  - suppliers.json');
}
