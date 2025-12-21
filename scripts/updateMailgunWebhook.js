#!/usr/bin/env node

/**
 * Script para actualizar automáticamente el webhook de Mailgun con la URL de ngrok
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../backend/.env') });

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_EU_REGION = process.env.MAILGUN_EU_REGION === 'true';

console.log('\n══════════════════════════════════════════════════════════');
console.log('  📧 ACTUALIZAR WEBHOOK DE MAILGUN');
console.log('══════════════════════════════════════════════════════════\n');

// Obtener URL de ngrok
const getNgrokUrl = async () => {
  try {
    const response = await axios.get('http://localhost:4040/api/tunnels', { timeout: 2000 });
    const tunnels = response.data.tunnels || [];
    const httpsTunnel = tunnels.find(t => t.proto === 'https');
    
    if (httpsTunnel && httpsTunnel.public_url) {
      return httpsTunnel.public_url;
    }
    
    console.log('❌ No se encontró túnel HTTPS de ngrok');
    return null;
  } catch (error) {
    console.log('❌ ngrok no está corriendo o no responde');
    console.log('   Ejecuta primero: node scripts/setupNgrok.js\n');
    return null;
  }
};

// Listar routes de Mailgun
const listRoutes = async () => {
  const baseUrl = MAILGUN_EU_REGION 
    ? 'https://api.eu.mailgun.net/v3'
    : 'https://api.mailgun.net/v3';

  try {
    const response = await axios.get(`${baseUrl}/routes`, {
      auth: {
        username: 'api',
        password: MAILGUN_API_KEY,
      },
    });

    return response.data.items || [];
  } catch (error) {
    console.log('❌ Error listando routes:', error.response?.data || error.message);
    return [];
  }
};

// Actualizar route de Mailgun
const updateRoute = async (routeId, ngrokUrl) => {
  const baseUrl = MAILGUN_EU_REGION 
    ? 'https://api.eu.mailgun.net/v3'
    : 'https://api.mailgun.net/v3';

  const webhookUrl = `${ngrokUrl}/api/inbound/mailgun`;

  try {
    const response = await axios.put(
      `${baseUrl}/routes/${routeId}`,
      new URLSearchParams({
        priority: '0',
        description: 'Forward emails to MaLoveApp webhook (ngrok)',
        expression: `match_recipient(".*@${MAILGUN_DOMAIN}")`,
        action: [
          `forward("${webhookUrl}")`,
          `store(notify="${webhookUrl}")`,
          'stop()'
        ].join('\n'),
      }),
      {
        auth: {
          username: 'api',
          password: MAILGUN_API_KEY,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log('❌ Error actualizando route:', error.response?.data || error.message);
    return null;
  }
};

// Main
const main = async () => {
  // 1. Obtener URL de ngrok
  console.log('🔍 Obteniendo URL de ngrok...\n');
  const ngrokUrl = await getNgrokUrl();
  
  if (!ngrokUrl) {
    console.log('💡 Inicia ngrok primero: node scripts/setupNgrok.js\n');
    process.exit(1);
  }
  
  console.log('✅ URL de ngrok obtenida:');
  console.log(`   ${ngrokUrl}\n`);
  
  // 2. Listar routes de Mailgun
  console.log('🔍 Buscando routes de Mailgun...\n');
  const routes = await listRoutes();
  
  if (routes.length === 0) {
    console.log('⚠️  No se encontraron routes en Mailgun');
    console.log('   Crea una route manualmente en:');
    console.log('   https://app.mailgun.com/app/receiving/routes\n');
    process.exit(1);
  }
  
  console.log(`✅ ${routes.length} route(s) encontrada(s):\n`);
  routes.forEach((route, idx) => {
    console.log(`   ${idx + 1}. ${route.description || 'Sin descripción'}`);
    console.log(`      ID: ${route.id}`);
    console.log(`      Expression: ${route.expression}`);
  });
  console.log('');
  
  // 3. Actualizar la primera route (o buscar la de MaLoveApp)
  const targetRoute = routes.find(r => 
    r.description?.includes('MaLoveApp') || 
    r.actions?.some(a => a.includes('inbound/mailgun'))
  ) || routes[0];
  
  console.log('🔧 Actualizando route:', targetRoute.description || targetRoute.id);
  console.log('');
  
  const webhookUrl = `${ngrokUrl}/api/inbound/mailgun`;
  const result = await updateRoute(targetRoute.id, ngrokUrl);
  
  if (!result) {
    console.log('❌ No se pudo actualizar la route\n');
    process.exit(1);
  }
  
  console.log('══════════════════════════════════════════════════════════');
  console.log('  ✅ WEBHOOK ACTUALIZADO CORRECTAMENTE');
  console.log('══════════════════════════════════════════════════════════\n');
  
  console.log('📋 WEBHOOK CONFIGURADO:');
  console.log(`   ${webhookUrl}\n`);
  
  console.log('✅ LISTO PARA RECIBIR EMAILS\n');
  
  console.log('🧪 PRUEBA:');
  console.log(`   Envía un email a: dani@${MAILGUN_DOMAIN}`);
  console.log('   Los emails serán procesados automáticamente\n');
  
  console.log('💡 MONITOREO:');
  console.log('   • Dashboard ngrok: http://localhost:4040');
  console.log('   • Logs backend: Verifica la terminal del backend\n');
  
  console.log('══════════════════════════════════════════════════════════\n');
};

main().catch(error => {
  console.log('\n❌ Error:', error.message);
  process.exit(1);
});
