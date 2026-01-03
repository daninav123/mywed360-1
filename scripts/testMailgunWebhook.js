#!/usr/bin/env node

/**
 * Script para probar el webhook de Mailgun localmente
 */

import axios from 'axios';
import FormData from 'form-data';

const BACKEND_URL = process.env.BACKEND_BASE_URL || 'http://localhost:4004';

console.log('\n🧪 PROBANDO WEBHOOK DE MAILGUN\n');
console.log('═'.repeat(60));

const testWebhook = async () => {
  const form = new FormData();
  
  // Simular datos que Mailgun enviaría
  form.append('sender', 'test@example.com');
  form.append('recipient', 'dani@malove.app');
  form.append('subject', 'Test de Webhook');
  form.append('body-plain', 'Este es un email de prueba del webhook');
  form.append('timestamp', Math.floor(Date.now() / 1000).toString());
  form.append('token', 'test-token-' + Date.now());
  form.append('signature', 'test-signature');

  try {
    console.log('\n📤 Enviando POST a:', `${BACKEND_URL}/api/inbound/mailgun`);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/inbound/mailgun`,
      form,
      {
        headers: form.getHeaders(),
        validateStatus: () => true, // Aceptar cualquier status
      }
    );

    console.log('\n📥 RESPUESTA DEL WEBHOOK:');
    console.log('─'.repeat(60));
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 200) {
      console.log('\n✅ WEBHOOK FUNCIONANDO CORRECTAMENTE');
      console.log('   El backend puede recibir emails de Mailgun');
    } else if (response.status === 403) {
      console.log('\n⚠️  WEBHOOK PROTEGIDO (Esperado en producción)');
      console.log('   El backend requiere firma válida de Mailgun');
      console.log('   Esto es CORRECTO - solo acepta webhooks legítimos');
    } else {
      console.log('\n⚠️  Respuesta inesperada del webhook');
      console.log('   Status esperado: 200 o 403');
    }

  } catch (error) {
    console.log('\n❌ ERROR AL PROBAR WEBHOOK:');
    console.log('─'.repeat(60));
    
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend no está corriendo');
      console.log('   💡 Inicia el backend: cd backend && npm run dev');
    } else if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
};

// Verificar si el backend está corriendo
const checkBackend = async () => {
  try {
    console.log('\n🔍 Verificando backend...');
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 3000 });
    console.log('✅ Backend respondiendo en:', BACKEND_URL);
    return true;
  } catch (error) {
    console.log('❌ Backend no responde');
    console.log('   URL:', BACKEND_URL);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Inicia el backend: cd backend && npm run dev');
    }
    return false;
  }
};

// Ejecutar
(async () => {
  const backendOk = await checkBackend();
  
  if (backendOk) {
    await testWebhook();
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📋 PRÓXIMOS PASOS:\n');
  console.log('1. Si el webhook funciona (200 o 403), configura Routes en Mailgun');
  console.log('2. Ve a: https://app.mailgun.com/app/receiving/routes');
  console.log('3. Crea una route con:');
  console.log('   Match: match_recipient(".*@malove.app")');
  console.log('   Forward: https://mywed360-backend.onrender.com/api/inbound/mailgun');
  console.log('\n📖 Guía completa: docs/CONFIGURACION-ROUTES-MAILGUN.md\n');
  console.log('═'.repeat(60) + '\n');
})();
