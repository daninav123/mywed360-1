#!/usr/bin/env node

/**
 * Script para verificar el estado de todas las API keys
 * Uso: node scripts/check-api-keys-status.js
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// APIs a verificar
const APIS = [
  {
    name: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    prefix: 'sk-proj-',
    testUrl: 'https://api.openai.com/v1/models',
    critical: true,
  },
  {
    name: 'Tavily',
    envVar: 'TAVILY_API_KEY',
    prefix: 'tvly-',
    testUrl: 'https://api.tavily.com/search',
    critical: true,
  },
  {
    name: 'Stripe (Secret)',
    envVar: 'STRIPE_SECRET_KEY',
    prefix: 'sk_',
    testUrl: 'https://api.stripe.com/v1/charges',
    critical: true,
  },
  {
    name: 'Stripe (Publishable)',
    envVar: 'STRIPE_PUBLISHABLE_KEY',
    prefix: 'pk_',
    testUrl: null,
    critical: false,
  },
  {
    name: 'Mailgun',
    envVar: 'MAILGUN_API_KEY',
    prefix: null,
    testUrl: null,
    critical: false,
  },
  {
    name: 'Firebase',
    envVar: 'FIREBASE_API_KEY',
    prefix: null,
    testUrl: null,
    critical: false,
  },
  {
    name: 'Twilio',
    envVar: 'TWILIO_AUTH_TOKEN',
    prefix: null,
    testUrl: null,
    critical: false,
  },
  {
    name: 'Google Places',
    envVar: 'GOOGLE_PLACES_API_KEY',
    prefix: 'AIza',
    testUrl: null,
    critical: false,
  },
];

async function testApiKey(api) {
  const key = process.env[api.envVar];

  if (!key) {
    return {
      status: 'missing',
      message: `❌ NO CONFIGURADA`,
      critical: api.critical,
    };
  }

  // Verificar prefijo
  if (api.prefix && !key.startsWith(api.prefix)) {
    return {
      status: 'invalid',
      message: `⚠️ FORMATO INVÁLIDO (esperado: ${api.prefix}...)`,
      critical: api.critical,
    };
  }

  // Si hay URL de test, intentar validar
  if (api.testUrl) {
    try {
      const response = await fetch(api.testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.status === 401 || response.status === 403) {
        return {
          status: 'invalid',
          message: `❌ INVÁLIDA O EXPIRADA (${response.status})`,
          critical: api.critical,
        };
      }

      if (response.ok) {
        return {
          status: 'valid',
          message: `✅ VÁLIDA`,
          critical: api.critical,
        };
      }

      return {
        status: 'unknown',
        message: `⚠️ ESTADO DESCONOCIDO (${response.status})`,
        critical: api.critical,
      };
    } catch (error) {
      return {
        status: 'error',
        message: `⚠️ ERROR AL VERIFICAR: ${error.message}`,
        critical: api.critical,
      };
    }
  }

  // Si no hay URL de test, asumir que está configurada
  return {
    status: 'configured',
    message: `✅ CONFIGURADA`,
    critical: api.critical,
  };
}

async function main() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  VERIFICACIÓN DE API KEYS - MaLoveApp${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const results = [];
  let criticalErrors = 0;
  let warnings = 0;

  for (const api of APIS) {
    process.stdout.write(`Verificando ${api.name}... `);
    const result = await testApiKey(api);
    results.push({ api, result });

    let statusColor = colors.green;
    if (result.status === 'missing' || result.status === 'invalid') {
      statusColor = colors.red;
      if (result.critical) criticalErrors++;
      else warnings++;
    } else if (result.status === 'error' || result.status === 'unknown') {
      statusColor = colors.yellow;
      warnings++;
    }

    console.log(`${statusColor}${result.message}${colors.reset}`);
  }

  // Resumen
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}RESUMEN${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const valid = results.filter((r) => r.result.status === 'valid').length;
  const configured = results.filter((r) => r.result.status === 'configured').length;
  const missing = results.filter((r) => r.result.status === 'missing').length;
  const invalid = results.filter((r) => r.result.status === 'invalid').length;

  console.log(`Total de APIs: ${results.length}`);
  console.log(`${colors.green}✅ Válidas: ${valid}${colors.reset}`);
  console.log(`${colors.green}✅ Configuradas: ${configured}${colors.reset}`);
  console.log(`${colors.yellow}⚠️ Faltantes: ${missing}${colors.reset}`);
  console.log(`${colors.red}❌ Inválidas: ${invalid}${colors.reset}`);

  // Recomendaciones
  if (criticalErrors > 0 || missing > 0) {
    console.log(`\n${colors.red}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.red}⚠️ ACCIONES REQUERIDAS${colors.reset}`);
    console.log(`${colors.red}═══════════════════════════════════════════════════════${colors.reset}\n`);

    for (const { api, result } of results) {
      if (result.status === 'missing' || result.status === 'invalid') {
        console.log(`${colors.red}${api.name}:${colors.reset}`);
        console.log(`  1. Ir a: ${getApiUrl(api.name)}`);
        console.log(`  2. Crear/renovar API key`);
        console.log(`  3. Actualizar en .env: ${api.envVar}=YOUR_KEY`);
        console.log(`  4. Reiniciar servicios\n`);
      }
    }
  }

  // Exit code
  if (criticalErrors > 0) {
    console.log(`${colors.red}❌ ERRORES CRÍTICOS ENCONTRADOS${colors.reset}\n`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`${colors.yellow}⚠️ ADVERTENCIAS ENCONTRADAS${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ TODAS LAS API KEYS ESTÁN CONFIGURADAS${colors.reset}\n`);
    process.exit(0);
  }
}

function getApiUrl(apiName) {
  const urls = {
    'OpenAI': 'https://platform.openai.com/account/api-keys',
    'Tavily': 'https://tavily.com/api',
    'Stripe (Secret)': 'https://dashboard.stripe.com/apikeys',
    'Stripe (Publishable)': 'https://dashboard.stripe.com/apikeys',
    'Mailgun': 'https://app.mailgun.com/app/account/security/api_keys',
    'Firebase': 'https://console.firebase.google.com',
    'Twilio': 'https://www.twilio.com/console/account/keys',
    'Google Places': 'https://console.cloud.google.com/apis/credentials',
  };
  return urls[apiName] || 'https://console.cloud.google.com';
}

main().catch(console.error);
