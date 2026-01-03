/**
 * Script para desplegar reglas de Firestore usando REST API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { JWT } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ID = 'lovenda-98c77';
const SERVICE_ACCOUNT_PATH = join(__dirname, '../../../variables entorno/backend/serviceAccount.json');
const RULES_PATH = join(__dirname, '../../firestore.rules');

async function getAccessToken() {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  
  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const token = await client.authorize();
  return token.access_token;
}

async function deployRules() {
  try {
    console.log('🔥 Desplegando reglas de Firestore...\n');
    
    // 1. Leer reglas
    console.log('📄 Leyendo firestore.rules...');
    const rulesContent = readFileSync(RULES_PATH, 'utf8');
    console.log(`   ✅ Reglas cargadas (${rulesContent.length} caracteres)\n`);
    
    // 2. Obtener token de acceso
    console.log('🔑 Obteniendo token de acceso...');
    const accessToken = await getAccessToken();
    console.log('   ✅ Token obtenido\n');
    
    // 3. Crear ruleset
    console.log('📤 Creando nuevo ruleset...');
    const createResponse = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: {
            files: [
              {
                name: 'firestore.rules',
                content: rulesContent
              }
            ]
          }
        })
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Error creando ruleset: ${createResponse.status} - ${error}`);
    }

    const rulesetData = await createResponse.json();
    const rulesetName = rulesetData.name;
    console.log(`   ✅ Ruleset creado: ${rulesetName}\n`);

    // 4. Desplegar ruleset a Firestore
    console.log('🚀 Desplegando ruleset a Firestore...');
    const releaseResponse = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          release: {
            name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
            rulesetName: rulesetName
          }
        })
      }
    );

    if (!releaseResponse.ok) {
      const error = await releaseResponse.text();
      throw new Error(`Error desplegando ruleset: ${releaseResponse.status} - ${error}`);
    }

    const releaseData = await releaseResponse.json();
    console.log('   ✅ Ruleset desplegado correctamente\n');

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ REGLAS DE FIRESTORE DESPLEGADAS CORRECTAMENTE     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Reglas añadidas:');
    console.log('   • Solicitudes de presupuesto (proveedores registrados)');
    console.log('   • Solicitudes de presupuesto (proveedores internet)');
    console.log('   • Lectura pública de proveedores\n');
    
    console.log('🎉 Ahora puedes solicitar presupuestos sin errores de permisos!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

deployRules();
