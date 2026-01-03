#!/usr/bin/env node

/**
 * Script de diagnóstico del sistema de email
 * Verifica configuración, credenciales y conectividad
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../backend/.env') });

console.log('\n🔍 DIAGNÓSTICO DEL SISTEMA DE EMAIL\n');
console.log('═'.repeat(60));

// ============================================
// 1. VERIFICAR VARIABLES DE ENTORNO
// ============================================
console.log('\n📋 1. VARIABLES DE ENTORNO');
console.log('─'.repeat(60));

const requiredVars = [
  'MAILGUN_API_KEY',
  'MAILGUN_DOMAIN',
  'MAILGUN_SIGNING_KEY',
];

const optionalVars = [
  'MAILGUN_EU_REGION',
  'MAILGUN_WEBHOOK_SIGNING_KEY',
  'MAILGUN_WEBHOOK_IP_ALLOWLIST',
];

let envErrors = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const maskedValue = varName.includes('KEY') 
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${varName}: ${maskedValue}`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADO`);
    envErrors++;
  }
});

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: No configurado (opcional)`);
  }
});

if (envErrors > 0) {
  console.log(`\n❌ Faltan ${envErrors} variables de entorno requeridas`);
} else {
  console.log('\n✅ Todas las variables requeridas están configuradas');
}

// ============================================
// 2. VERIFICAR CONECTIVIDAD CON MAILGUN
// ============================================
console.log('\n📡 2. CONECTIVIDAD CON MAILGUN API');
console.log('─'.repeat(60));

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_EU_REGION = process.env.MAILGUN_EU_REGION === 'true';

const mailgunBaseUrl = MAILGUN_EU_REGION
  ? 'https://api.eu.mailgun.net/v3'
  : 'https://api.mailgun.net/v3';

if (MAILGUN_API_KEY && MAILGUN_DOMAIN) {
  try {
    const response = await axios.get(
      `${mailgunBaseUrl}/${MAILGUN_DOMAIN}`,
      {
        auth: {
          username: 'api',
          password: MAILGUN_API_KEY,
        },
      }
    );

    console.log('✅ Conexión exitosa con Mailgun API');
    console.log(`   Dominio: ${response.data.domain?.name || MAILGUN_DOMAIN}`);
    console.log(`   Estado: ${response.data.domain?.state || 'unknown'}`);
    console.log(`   Región: ${MAILGUN_EU_REGION ? 'EU' : 'US'}`);
  } catch (error) {
    console.log('❌ Error conectando con Mailgun API');
    console.log(`   Código: ${error.response?.status || 'unknown'}`);
    console.log(`   Mensaje: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.status === 401) {
      console.log('   💡 Verifica que MAILGUN_API_KEY sea correcta');
    }
    if (error.response?.status === 404) {
      console.log('   💡 Verifica que MAILGUN_DOMAIN esté agregado en Mailgun');
    }
  }
} else {
  console.log('⚠️  Saltando verificación (credenciales no configuradas)');
}

// ============================================
// 3. VERIFICAR BACKEND
// ============================================
console.log('\n🖥️  3. BACKEND LOCAL');
console.log('─'.repeat(60));

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://localhost:4004';

try {
  const response = await axios.get(`${BACKEND_URL}/health`, {
    timeout: 5000,
  });

  console.log('✅ Backend respondiendo correctamente');
  console.log(`   URL: ${BACKEND_URL}`);
  console.log(`   Status: ${response.status}`);
} catch (error) {
  console.log('❌ Backend no responde');
  console.log(`   URL: ${BACKEND_URL}`);
  console.log(`   Error: ${error.message}`);
  console.log('   💡 Asegúrate de que el backend esté corriendo: cd backend && npm run dev');
}

// ============================================
// 4. VERIFICAR ENDPOINT DE WEBHOOK
// ============================================
console.log('\n🔗 4. ENDPOINT DE WEBHOOK');
console.log('─'.repeat(60));

try {
  const response = await axios.post(
    `${BACKEND_URL}/api/inbound/mailgun`,
    {
      sender: 'test@example.com',
      recipient: 'test@malove.app',
      subject: 'Diagnostic Test',
      'body-plain': 'This is a diagnostic test',
      timestamp: Math.floor(Date.now() / 1000),
      token: 'diagnostic-test-token',
      signature: 'test-signature',
    },
    {
      timeout: 5000,
      validateStatus: () => true, // Aceptar cualquier status
    }
  );

  if (response.status === 200) {
    console.log('✅ Webhook endpoint respondiendo (sin verificación de firma)');
  } else if (response.status === 403) {
    console.log('✅ Webhook endpoint protegido correctamente (firma requerida)');
  } else {
    console.log(`⚠️  Webhook endpoint responde con status ${response.status}`);
  }
  console.log(`   URL: ${BACKEND_URL}/api/inbound/mailgun`);
} catch (error) {
  console.log('❌ Error verificando webhook endpoint');
  console.log(`   Error: ${error.message}`);
}

// ============================================
// 5. VERIFICAR FIRESTORE
// ============================================
console.log('\n🗄️  5. FIRESTORE (Firebase)');
console.log('─'.repeat(60));

try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    'C:\\Users\\Administrator\\Downloads\\serviceAccount.json';
  
  const { existsSync } = await import('fs');
  
  if (existsSync(serviceAccountPath)) {
    console.log('✅ serviceAccount.json encontrado');
    console.log(`   Path: ${serviceAccountPath}`);
  } else {
    console.log('❌ serviceAccount.json no encontrado');
    console.log(`   Path esperado: ${serviceAccountPath}`);
    console.log('   💡 Descarga las credenciales desde Firebase Console');
  }
} catch (error) {
  console.log('⚠️  Error verificando Firestore');
  console.log(`   Error: ${error.message}`);
}

// ============================================
// RESUMEN
// ============================================
console.log('\n' + '═'.repeat(60));
console.log('\n📊 RESUMEN\n');

const allGood = envErrors === 0;

if (allGood) {
  console.log('✅ Sistema de email configurado correctamente\n');
  console.log('📝 PRÓXIMOS PASOS:\n');
  console.log('1. Configurar Routes en Mailgun Dashboard');
  console.log('   URL: https://app.mailgun.com/app/sending/domains/' + MAILGUN_DOMAIN + '/routes');
  console.log('\n2. Agregar ruta para recepción:');
  console.log('   Match: match_recipient(".*@' + MAILGUN_DOMAIN + '")');
  console.log('   Forward: ' + BACKEND_URL + '/api/inbound/mailgun');
  console.log('\n3. Verificar DNS records en Mailgun Dashboard');
  console.log('\n4. Probar envío de email desde la app');
  console.log('\n📖 Documentación completa: docs/MAILGUN-CONFIGURACION-COMPLETA.md');
} else {
  console.log('❌ Se encontraron problemas de configuración\n');
  console.log('💡 ACCIONES REQUERIDAS:\n');
  console.log('1. Configura las variables de entorno faltantes en backend/.env');
  console.log('2. Reinicia el backend: cd backend && npm run dev');
  console.log('3. Ejecuta este script nuevamente: node scripts/diagnosticEmail.js');
  console.log('\n📖 Guía de configuración: docs/MAILGUN-CONFIGURACION-COMPLETA.md');
}

console.log('\n' + '═'.repeat(60) + '\n');

process.exit(envErrors > 0 ? 1 : 0);
