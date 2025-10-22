// Test de carga de variables de entorno
console.log('🔍 Verificando carga de .env en backend...\n');

// Simular el mismo proceso que index.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const secretEnvPath = '/etc/secrets/app.env';
const rootDir = process.cwd();
const envPath = path.resolve(rootDir, '.env');
const envLocalPath = path.resolve(rootDir, '.env.local');

console.log('📁 Rutas de archivos .env:');
console.log('  Secret:', secretEnvPath, fs.existsSync(secretEnvPath) ? '✅' : '❌');
console.log('  .env:', envPath, fs.existsSync(envPath) ? '✅' : '❌');
console.log('  .env.local:', envLocalPath, fs.existsSync(envLocalPath) ? '✅' : '❌');
console.log('');

if (fs.existsSync(secretEnvPath)) {
  dotenv.config({ path: secretEnvPath, override: false });
  console.log('✅ Variables cargadas desde secret file');
}
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('✅ Variables cargadas desde .env');
}
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
  console.log('✅ Variables cargadas desde .env.local');
}

console.log('');
console.log('📊 Variables de OpenAI después de cargar:');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.slice(0, 20)}...` : '❌ NO DEFINIDA');
console.log('  OPENAI_PROJECT_ID:', process.env.OPENAI_PROJECT_ID || '❌ NO DEFINIDA');
console.log('  VITE_OPENAI_API_KEY:', process.env.VITE_OPENAI_API_KEY ? `${process.env.VITE_OPENAI_API_KEY.slice(0, 20)}...` : '❌ NO DEFINIDA');
console.log('');

// Ahora probar OpenAI
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const projectId = process.env.OPENAI_PROJECT_ID || process.env.VITE_OPENAI_PROJECT_ID || '';

console.log('🧪 Intentando inicializar OpenAI...');
console.log('  API Key para usar:', apiKey ? `${apiKey.slice(0, 20)}...` : '❌ VACÍA');
console.log('  Project ID para usar:', projectId || '❌ VACÍO');
console.log('');

if (!apiKey) {
  console.error('❌ ERROR: No hay API key disponible');
  process.exit(1);
}

try {
  const openai = new OpenAI({
    apiKey,
    project: projectId || undefined,
  });
  
  console.log('✅ Cliente OpenAI inicializado');
  console.log('');
  console.log('🚀 Probando llamada real a OpenAI...');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Di solo "OK"' }],
    max_tokens: 5,
  });
  
  console.log('✅ Respuesta de OpenAI:', completion.choices[0].message.content);
  console.log('');
  console.log('🎉 TODO FUNCIONA - El backend puede usar OpenAI correctamente');
  
} catch (error) {
  console.error('❌ ERROR al llamar a OpenAI:');
  console.error('  Código:', error.code);
  console.error('  Mensaje:', error.message);
  console.error('  Status:', error.status);
  process.exit(1);
}
