#!/usr/bin/env node
/**
 * Script para ejecutar test E2E del buscador de proveedores IA
 * Limpia tokens, verifica backend y ejecuta test
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function checkBackend() {
  log.title('1️⃣ VERIFICANDO BACKEND');
  
  try {
    const response = await fetch('http://localhost:4004/api/health');
    if (response.ok) {
      log.success('Backend respondiendo en http://localhost:4004');
      const data = await response.json();
      if (data.openai) {
        log.success('OpenAI configurado');
      } else {
        log.warn('OpenAI puede no estar configurado');
      }
      return true;
    } else {
      log.error(`Backend respondió con status ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error('Backend no está corriendo en http://localhost:4004');
    log.info('Ejecuta: cd backend && npm run dev');
    return false;
  }
}

async function checkFrontend() {
  log.title('2️⃣ VERIFICANDO FRONTEND');
  
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      log.success('Frontend respondiendo en http://localhost:3000');
      return true;
    } else {
      log.error(`Frontend respondió con status ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error('Frontend no está corriendo en http://localhost:3000');
    log.info('Ejecuta: npm run dev');
    return false;
  }
}

function runCypressTest() {
  return new Promise((resolve, reject) => {
    log.title('3️⃣ EJECUTANDO TEST E2E');
    
    const cypressArgs = [
      'run',
      'cypress',
      'run',
      '--spec',
      'cypress/e2e/ai-supplier-search.cy.js',
      '--browser',
      'chrome',
      '--headed'
    ];

    log.info(`Comando: npm ${cypressArgs.join(' ')}`);
    
    const cypress = spawn('npm', cypressArgs, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    cypress.on('close', (code) => {
      if (code === 0) {
        log.success('Test completado exitosamente');
        resolve(true);
      } else {
        log.error(`Test falló con código ${code}`);
        resolve(false);
      }
    });

    cypress.on('error', (error) => {
      log.error(`Error ejecutando Cypress: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗
║  🤖 TEST E2E: BUSCADOR DE PROVEEDORES IA  ║
╚════════════════════════════════════════════╝${colors.reset}
  `);

  try {
    // Verificar backend
    const backendOk = await checkBackend();
    if (!backendOk) {
      log.error('Backend no disponible. Abortando test.');
      process.exit(1);
    }

    // Verificar frontend
    const frontendOk = await checkFrontend();
    if (!frontendOk) {
      log.error('Frontend no disponible. Abortando test.');
      process.exit(1);
    }

    // Ejecutar test
    const testOk = await runCypressTest();
    
    // Resumen
    log.title('📊 RESUMEN');
    console.log(`Backend:  ${backendOk ? '✅' : '❌'}`);
    console.log(`Frontend: ${frontendOk ? '✅' : '❌'}`);
    console.log(`Test E2E: ${testOk ? '✅' : '❌'}`);
    
    if (testOk) {
      log.success('Buscador de proveedores IA funcionando correctamente');
      process.exit(0);
    } else {
      log.error('Buscador de proveedores IA tiene errores');
      process.exit(1);
    }
  } catch (error) {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  }
}

main();
