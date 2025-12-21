/**
 * Script para verificar configuración de Mailgun y DNS
 */

import dns from 'dns';
import { promisify } from 'util';
import fetch from 'node-fetch';

const resolveTxt = promisify(dns.resolveTxt);
const resolveMx = promisify(dns.resolveMx);
const resolveCname = promisify(dns.resolveCname);

const MAILGUN_DOMAIN = 'mg.malove.app';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_EU_REGION = true;

async function checkDNS() {
  console.log('\n🔍 Verificando registros DNS para:', MAILGUN_DOMAIN);
  console.log('━'.repeat(60));

  // 1. Verificar registros MX
  try {
    console.log('\n📧 Registros MX:');
    const mx = await resolveMx(MAILGUN_DOMAIN);
    if (mx && mx.length > 0) {
      mx.forEach(record => {
        console.log(`   ✅ ${record.exchange} (priority: ${record.priority})`);
      });
    } else {
      console.log('   ❌ No hay registros MX configurados');
    }
  } catch (error) {
    console.log('   ❌ Error obteniendo MX:', error.code);
  }

  // 2. Verificar registros TXT (SPF, DKIM)
  try {
    console.log('\n📝 Registros TXT (SPF/DKIM):');
    const txt = await resolveTxt(MAILGUN_DOMAIN);
    if (txt && txt.length > 0) {
      txt.forEach(record => {
        const value = Array.isArray(record) ? record.join('') : record;
        if (value.includes('v=spf1')) {
          console.log(`   ✅ SPF: ${value.substring(0, 80)}...`);
        } else if (value.includes('k=rsa')) {
          console.log(`   ✅ DKIM: ${value.substring(0, 80)}...`);
        } else {
          console.log(`   ℹ️  ${value.substring(0, 80)}...`);
        }
      });
    } else {
      console.log('   ❌ No hay registros TXT configurados');
    }
  } catch (error) {
    console.log('   ❌ Error obteniendo TXT:', error.code);
  }

  // 3. Verificar CNAME de tracking
  try {
    console.log('\n🔗 Registro CNAME (tracking):');
    const trackingDomain = `email.${MAILGUN_DOMAIN}`;
    const cname = await resolveCname(trackingDomain);
    if (cname && cname.length > 0) {
      console.log(`   ✅ ${trackingDomain} -> ${cname[0]}`);
    } else {
      console.log(`   ⚠️  No hay CNAME configurado para ${trackingDomain}`);
    }
  } catch (error) {
    console.log(`   ⚠️  No hay CNAME configurado (opcional):`, error.code);
  }
}

async function checkMailgunAPI() {
  console.log('\n\n🔌 Verificando API de Mailgun');
  console.log('━'.repeat(60));

  const baseUrl = MAILGUN_EU_REGION 
    ? 'https://api.eu.mailgun.net/v3'
    : 'https://api.mailgun.net/v3';

  try {
    // Verificar dominio
    console.log('\n🌐 Estado del dominio:');
    const response = await fetch(`${baseUrl}/domains/${MAILGUN_DOMAIN}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Dominio: ${data.domain?.name || MAILGUN_DOMAIN}`);
      console.log(`   📊 Estado: ${data.domain?.state || 'unknown'}`);
      console.log(`   🔐 SMTP: ${data.domain?.smtp_login || 'N/A'}`);
      
      // Verificar estado de DNS en Mailgun
      if (data.domain?.state === 'active') {
        console.log('   ✅ Dominio ACTIVO - DNS correctamente configurado');
      } else if (data.domain?.state === 'unverified') {
        console.log('   ⚠️  Dominio NO VERIFICADO - Faltan registros DNS');
      } else {
        console.log(`   ⚠️  Estado: ${data.domain?.state}`);
      }
    } else {
      const error = await response.text();
      console.log('   ❌ Error consultando Mailgun:', response.status);
      console.log('   ', error.substring(0, 200));
    }
  } catch (error) {
    console.log('   ❌ Error conectando con Mailgun API:', error.message);
  }
}

async function testEmailSend() {
  console.log('\n\n📧 Test de envío de email');
  console.log('━'.repeat(60));

  const baseUrl = MAILGUN_EU_REGION 
    ? 'https://api.eu.mailgun.net/v3'
    : 'https://api.mailgun.net/v3';

  try {
    const formData = new URLSearchParams();
    formData.append('from', `MaLove Test <noreply@${MAILGUN_DOMAIN}>`);
    formData.append('to', 'test@example.com'); // Email de prueba
    formData.append('subject', 'Test de configuración MaLove');
    formData.append('text', 'Este es un email de prueba para verificar la configuración de Mailgun.');
    formData.append('o:testmode', 'yes'); // Modo test - no envía realmente

    const response = await fetch(`${baseUrl}/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API de envío funciona correctamente');
      console.log('   📨 Message ID:', data.id);
      console.log('   ℹ️  (Modo test - email no enviado realmente)');
    } else {
      const error = await response.text();
      console.log('   ❌ Error en API de envío:', response.status);
      console.log('   ', error);
    }
  } catch (error) {
    console.log('   ❌ Error probando envío:', error.message);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 DIAGNÓSTICO DE CONFIGURACIÓN DE EMAILS - MaLove App  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await checkDNS();
  await checkMailgunAPI();
  await testEmailSend();

  console.log('\n\n📋 RESUMEN Y RECOMENDACIONES');
  console.log('━'.repeat(60));
  console.log('\nSi ves errores DNS o dominio "unverified":');
  console.log('1. Ve a Mailgun Dashboard: https://app.mailgun.com/');
  console.log('2. Selecciona el dominio: mg.malove.app');
  console.log('3. Copia los registros DNS mostrados');
  console.log('4. Añádelos en tu proveedor DNS (GoDaddy, Cloudflare, etc)');
  console.log('5. Espera 24-48h para propagación');
  console.log('\nRegistros DNS necesarios:');
  console.log('   • MX records (para recibir emails)');
  console.log('   • TXT records (SPF y DKIM para autenticación)');
  console.log('   • CNAME record (opcional, para tracking)\n');
}

main();
