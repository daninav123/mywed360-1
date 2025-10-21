/**
 * Script de verificación de configuración de Mailgun
 * Prueba que las variables de entorno y servicios estén correctamente configurados
 */

const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('\n🔍 Verificando configuración de Mailgun...\n');

// 1. Verificar variables de entorno del frontend
console.log('📋 Variables de Entorno del Frontend:');
console.log('  VITE_MAILGUN_DOMAIN:', process.env.VITE_MAILGUN_DOMAIN || '❌ NO DEFINIDA');
console.log('  VITE_MAILGUN_SENDING_DOMAIN:', process.env.VITE_MAILGUN_SENDING_DOMAIN || '❌ NO DEFINIDA');
console.log('  VITE_MAILGUN_EU_REGION:', process.env.VITE_MAILGUN_EU_REGION || '❌ NO DEFINIDA');
console.log('  VITE_MAILGUN_API_KEY:', process.env.VITE_MAILGUN_API_KEY ? '✅ Definida (oculta)' : '❌ NO DEFINIDA');

// 2. Verificar variables de entorno del backend
console.log('\n📋 Variables de Entorno del Backend:');
console.log('  MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '❌ NO DEFINIDA');
console.log('  MAILGUN_SENDING_DOMAIN:', process.env.MAILGUN_SENDING_DOMAIN || '❌ NO DEFINIDA');
console.log('  MAILGUN_EU_REGION:', process.env.MAILGUN_EU_REGION || '❌ NO DEFINIDA');
console.log('  MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Definida (oculta)' : '❌ NO DEFINIDA');
console.log('  MAILGUN_SIGNING_KEY:', process.env.MAILGUN_SIGNING_KEY ? '✅ Definida (oculta)' : '❌ NO DEFINIDA');

// 3. Verificar valores esperados
console.log('\n✅ Verificación de Valores:');
const frontendDomain = process.env.VITE_MAILGUN_DOMAIN;
const frontendSending = process.env.VITE_MAILGUN_SENDING_DOMAIN;
const backendDomain = process.env.MAILGUN_DOMAIN;
const backendSending = process.env.MAILGUN_SENDING_DOMAIN;

let errors = 0;

if (frontendDomain !== 'malove.app') {
  console.log('  ❌ VITE_MAILGUN_DOMAIN debe ser "malove.app", actual:', frontendDomain);
  errors++;
} else {
  console.log('  ✅ VITE_MAILGUN_DOMAIN correcto: malove.app');
}

if (frontendSending !== 'mg.malove.app') {
  console.log('  ❌ VITE_MAILGUN_SENDING_DOMAIN debe ser "mg.malove.app", actual:', frontendSending);
  errors++;
} else {
  console.log('  ✅ VITE_MAILGUN_SENDING_DOMAIN correcto: mg.malove.app');
}

if (backendDomain !== 'malove.app') {
  console.log('  ❌ MAILGUN_DOMAIN debe ser "malove.app", actual:', backendDomain);
  errors++;
} else {
  console.log('  ✅ MAILGUN_DOMAIN correcto: malove.app');
}

if (backendSending !== 'mg.malove.app') {
  console.log('  ❌ MAILGUN_SENDING_DOMAIN debe ser "mg.malove.app", actual:', backendSending);
  errors++;
} else {
  console.log('  ✅ MAILGUN_SENDING_DOMAIN correcto: mg.malove.app');
}

// 4. Verificar backend corriendo
console.log('\n🔌 Verificando Backend...');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4004,
  path: '/api/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('  ✅ Backend corriendo en http://localhost:4004');
  } else {
    console.log('  ⚠️  Backend respondió con código:', res.statusCode);
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(60));
  if (errors === 0) {
    console.log('✅ CONFIGURACIÓN DE MAILGUN CORRECTA');
    console.log('   Dominio verificado: mg.malove.app');
    console.log('   Backend: http://localhost:4004');
    process.exit(0);
  } else {
    console.log('❌ CONFIGURACIÓN INCORRECTA');
    console.log(`   Errores encontrados: ${errors}`);
    console.log('   Revisa el archivo .env en la raíz del proyecto');
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.log('  ❌ Backend NO está corriendo');
  console.log('     Error:', error.message);
  console.log('     Inicia el backend con: npm start');
  
  console.log('\n' + '='.repeat(60));
  if (errors === 0) {
    console.log('⚠️  CONFIGURACIÓN CORRECTA PERO BACKEND DETENIDO');
    console.log('   Variables de entorno: OK');
    console.log('   Backend: Necesita iniciarse');
    process.exit(1);
  } else {
    console.log('❌ CONFIGURACIÓN INCORRECTA Y BACKEND DETENIDO');
    process.exit(1);
  }
});

req.on('timeout', () => {
  console.log('  ❌ Timeout al conectar con el backend');
  req.destroy();
});

req.end();
