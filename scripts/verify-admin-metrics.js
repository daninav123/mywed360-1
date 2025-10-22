#!/usr/bin/env node
/**
 * Script de verificación de rutas de métricas del panel de admin
 * Verifica que los endpoints estén disponibles y respondan correctamente
 */

import axios from 'axios';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4004';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const endpoints = [
  { method: 'GET', path: '/api/admin/metrics/errors?timeframe=day', desc: 'Lista de errores' },
  { method: 'GET', path: '/api/admin/metrics/errors/by-user?timeframe=day', desc: 'Errores por usuario' },
  { method: 'GET', path: '/api/admin/metrics/dashboard', desc: 'Dashboard de métricas' },
  { method: 'GET', path: '/api/admin/metrics/aggregate?timeframe=day', desc: 'Métricas agregadas' },
  { method: 'GET', path: '/api/admin/dashboard/overview', desc: 'Overview del dashboard' },
  { method: 'GET', path: '/api/admin/dashboard/metrics', desc: 'Métricas del dashboard' },
];

async function verifyEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  
  try {
    const config = {
      headers: {},
      validateStatus: () => true // Aceptar cualquier status
    };

    if (ADMIN_TOKEN) {
      config.headers.Authorization = `Bearer ${ADMIN_TOKEN}`;
    }

    const response = await axios({
      method: endpoint.method,
      url,
      ...config
    });

    const statusEmoji = response.status === 200 ? '✅' : 
                        response.status === 401 ? '🔐' :
                        response.status === 403 ? '🚫' : '❌';

    console.log(`${statusEmoji} [${response.status}] ${endpoint.method} ${endpoint.path}`);
    console.log(`   ${endpoint.desc}`);

    if (response.status === 401) {
      console.log('   ⚠️  Requiere autenticación - configura ADMIN_TOKEN');
    } else if (response.status === 403) {
      console.log('   ⚠️  IP bloqueada por allowlist o usuario no es admin');
    } else if (response.status !== 200) {
      console.log(`   ❌ Error: ${response.data?.error || response.statusText}`);
    } else {
      // Mostrar info de la respuesta si es exitosa
      const data = response.data;
      if (data.items) {
        console.log(`   📊 Items: ${data.items.length}`);
      }
      if (data.count !== undefined) {
        console.log(`   📈 Count: ${data.count}`);
      }
    }
    
    console.log('');
    return response.status;
  } catch (error) {
    console.log(`❌ ERROR ${endpoint.method} ${endpoint.path}`);
    console.log(`   ${endpoint.desc}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Servidor no está corriendo en', BASE_URL);
    } else {
      console.log(`   ❌ ${error.message}`);
    }
    console.log('');
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Verificación de Endpoints del Panel de Admin');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🔑 Token: ${ADMIN_TOKEN ? '✅ Configurado' : '❌ No configurado'}`);
  console.log('');
  console.log('📡 Verificando endpoints...');
  console.log('');

  const results = [];
  for (const endpoint of endpoints) {
    const status = await verifyEndpoint(endpoint);
    results.push({ endpoint, status });
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Resumen');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  const successful = results.filter(r => r.status === 200).length;
  const authRequired = results.filter(r => r.status === 401).length;
  const forbidden = results.filter(r => r.status === 403).length;
  const errors = results.filter(r => r.status && r.status >= 400 && r.status !== 401 && r.status !== 403).length;
  const unreachable = results.filter(r => r.status === null).length;

  console.log(`✅ Exitosos: ${successful}/${endpoints.length}`);
  if (authRequired > 0) {
    console.log(`🔐 Requieren autenticación: ${authRequired}`);
  }
  if (forbidden > 0) {
    console.log(`🚫 Bloqueados (403): ${forbidden}`);
  }
  if (errors > 0) {
    console.log(`❌ Errores: ${errors}`);
  }
  if (unreachable > 0) {
    console.log(`⚠️  No disponibles: ${unreachable}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  
  if (successful === endpoints.length) {
    console.log('✅ TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE');
  } else if (authRequired + forbidden === results.length - successful) {
    console.log('⚠️  ENDPOINTS DISPONIBLES - Requieren autenticación/permisos');
    console.log('');
    console.log('💡 Solución:');
    console.log('   1. Obtén un token de admin desde el login');
    console.log('   2. Ejecuta: ADMIN_TOKEN=<token> node scripts/verify-admin-metrics.js');
    console.log('   3. O verifica ADMIN_IP_ALLOWLIST en .env del backend');
  } else if (unreachable > 0) {
    console.log('❌ SERVIDOR NO DISPONIBLE');
    console.log('');
    console.log('💡 Solución:');
    console.log('   1. Inicia el backend: cd backend && npm start');
    console.log('   2. Verifica que esté en', BASE_URL);
  } else {
    console.log('⚠️  ALGUNOS ENDPOINTS TIENEN PROBLEMAS');
    console.log('');
    console.log('💡 Revisa los logs del servidor para más detalles');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  
  process.exit(successful === endpoints.length ? 0 : 1);
}

main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
