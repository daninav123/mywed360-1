#!/usr/bin/env node
/**
 * Script para ejecutar tests de Firestore con el emulador
 * Uso: node scripts/test-with-emulator.js [--specs=pattern]
 */

import { spawn } from 'child_process';

const args = process.argv.slice(2);
const specsArg = args.find(arg => arg.startsWith('--specs='));
const specs = specsArg ? specsArg.split('=')[1] : 'src/__tests__/firestore.rules*.test.js';

console.log('🔥 Iniciando emulador de Firestore...\n');

// Iniciar emulador en background
const emulator = spawn('npx', ['firebase', 'emulators:start', '--only', 'firestore'], {
  shell: true,
  stdio: 'pipe'
});

let emulatorReady = false;

emulator.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Detectar cuando el emulador está listo
  if (output.includes('All emulators ready') || output.includes('firestore: Serving')) {
    if (!emulatorReady) {
      emulatorReady = true;
      runTests();
    }
  }
});

emulator.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

function runTests() {
  console.log('\n✅ Emulador listo. Ejecutando tests...\n');
  
  const env = {
    ...process.env,
    FIRESTORE_EMULATOR_HOST: 'localhost:8288',
    FIRESTORE_RULES_TESTS: 'true'
  };
  
  const testCommand = specs ? `-- ${specs}` : '';
  const vitest = spawn('npm', ['run', 'test:unit', testCommand], {
    shell: true,
    stdio: 'inherit',
    env
  });
  
  vitest.on('close', (code) => {
    console.log('\n🛑 Deteniendo emulador...\n');
    emulator.kill('SIGTERM');
    
    setTimeout(() => {
      process.exit(code);
    }, 1000);
  });
}

// Timeout de seguridad
setTimeout(() => {
  if (!emulatorReady) {
    console.error('\n❌ Timeout esperando emulador. Abortando...\n');
    emulator.kill('SIGTERM');
    process.exit(1);
  }
}, 30000);

// Cleanup en SIGINT
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interrumpido por usuario. Limpiando...\n');
  emulator.kill('SIGTERM');
  process.exit(130);
});
