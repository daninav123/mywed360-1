#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TIMEOUT_MS = 30000; // 30 segundos

console.log('🧪 Ejecutando tests unitarios con timeout de 30s...\n');

const testProcess = spawn('npm', ['run', 'test:unit'], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
});

const timeoutId = setTimeout(() => {
  console.error('\n❌ TIMEOUT: Los tests tardaron más de 30 segundos');
  console.error('⚠️  Matando proceso...');
  testProcess.kill('SIGTERM');

  setTimeout(() => {
    testProcess.kill('SIGKILL');
  }, 2000);
}, TIMEOUT_MS);

testProcess.on('close', (code) => {
  clearTimeout(timeoutId);
  if (code === 0) {
    console.log('\n✅ Tests completados exitosamente');
  } else if (code !== null) {
    console.error(`\n❌ Tests fallaron con código: ${code}`);
  }
  process.exit(code || 0);
});

testProcess.on('error', (err) => {
  clearTimeout(timeoutId);
  console.error('❌ Error ejecutando tests:', err);
  process.exit(1);
});
