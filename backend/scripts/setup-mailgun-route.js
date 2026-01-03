/**
 * Script para crear/actualizar Route en Mailgun para emails entrantes
 */

import mailgunJs from 'mailgun-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = process.env.MAILGUN_SENDING_DOMAIN || process.env.MAILGUN_DOMAIN;
const EU_REGION = process.env.MAILGUN_EU_REGION === 'true';

const NGROK_URL = process.argv[2];

if (!NGROK_URL) {
  console.error('❌ Uso: node setup-mailgun-route.js <ngrok-url>');
  console.error('   Ejemplo: node setup-mailgun-route.js https://abc123.ngrok.io');
  process.exit(1);
}

if (!API_KEY || !DOMAIN) {
  console.error('❌ Error: MAILGUN_API_KEY o MAILGUN_DOMAIN no configurados');
  process.exit(1);
}

const mg = mailgunJs({
  apiKey: API_KEY,
  domain: DOMAIN,
  host: EU_REGION ? 'api.eu.mailgun.net' : 'api.mailgun.com'
});

async function setupRoute() {
  try {
    console.log('🔧 Configurando Mailgun Route para emails entrantes\n');
    console.log('═'.repeat(60));
    console.log(`📧 Dominio: ${DOMAIN}`);
    console.log(`🌍 Región: ${EU_REGION ? 'EU' : 'US'}`);
    console.log(`🔗 Ngrok URL: ${NGROK_URL}`);
    console.log('═'.repeat(60));
    
    const webhookUrl = `${NGROK_URL}/api/inbound/mailgun`;
    
    // 1. Listar routes existentes
    console.log('\n1️⃣ Buscando routes existentes...');
    const routes = await mg.routes().list();
    
    // Buscar si ya existe una route para este dominio
    const existingRoute = routes.items?.find(r => 
      r.description?.includes('MaLoveApp Inbox') || 
      r.expression?.includes(`@${DOMAIN}`)
    );
    
    if (existingRoute) {
      console.log(`   ✅ Route existente encontrada: ${existingRoute.id}`);
      console.log(`   📝 Expresión: ${existingRoute.expression}`);
      
      // Actualizar la route existente
      console.log('\n2️⃣ Actualizando route...');
      await mg.routes(existingRoute.id).update({
        priority: 0,
        description: `MaLoveApp Inbox - ${DOMAIN}`,
        expression: `match_recipient(".*@${DOMAIN}")`,
        action: [`forward("${webhookUrl}")`, 'stop()']
      });
      
      console.log('   ✅ Route actualizada correctamente');
    } else {
      // Crear nueva route
      console.log('   ℹ️  No se encontró route existente');
      console.log('\n2️⃣ Creando nueva route...');
      
      const newRoute = await mg.routes().create({
        priority: 0,
        description: `MaLoveApp Inbox - ${DOMAIN}`,
        expression: `match_recipient(".*@${DOMAIN}")`,
        action: [`forward("${webhookUrl}")`, 'stop()']
      });
      
      console.log(`   ✅ Route creada: ${newRoute.route?.id || newRoute.id}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('═'.repeat(60));
    console.log('\n📋 Detalles de la configuración:');
    console.log(`   • Emails a: cualquier@${DOMAIN}`);
    console.log(`   • Se reenviarán a: ${webhookUrl}`);
    console.log(`   • Prioridad: 0 (máxima)`);
    
    console.log('\n🧪 Para probar:');
    console.log(`   1. Envía un email a: tu-alias@${DOMAIN}`);
    console.log(`   2. Verifica los logs del backend`);
    console.log(`   3. Recarga tu buzón en la app`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.statusCode) {
      console.error(`   Status: ${error.statusCode}`);
    }
    if (error.body) {
      console.error(`   Detalle: ${JSON.stringify(error.body, null, 2)}`);
    }
    process.exit(1);
  }
}

setupRoute();
