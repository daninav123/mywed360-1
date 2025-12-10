#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function deployFirestoreRules() {
  try {
    console.log('🚀 Desplegando reglas de Firestore vía API...\n');

    // Cargar credenciales
    const credentialsPath = path.join(__dirname, '../backend/serviceAccount.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;

    console.log(`📦 Proyecto: ${projectId}`);

    // Leer el archivo de reglas
    const rulesPath = path.join(__dirname, '../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    console.log('📝 Reglas cargadas');

    // Autenticación con Google Auth
    const auth = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase',
        'https://www.googleapis.com/auth/datastore'
      ]
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    console.log('🔑 Token de acceso obtenido');

    // Crear el ruleset
    const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
    
    const rulesetPayload = {
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent
          }
        ]
      }
    };

    console.log('📤 Creando ruleset...');
    console.log('📋 Primeros 500 chars del contenido:', rulesContent.substring(0, 500));
    console.log('📋 Últimos 500 chars del contenido:', rulesContent.substring(rulesContent.length - 500));

    const createResponse = await fetch(createRulesetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rulesetPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('\n📋 Detalles del error:');
      console.log('URL:', createRulesetUrl);
      console.log('Status:', createResponse.status);
      console.log('Response:', errorText);
      throw new Error(`Error creando ruleset: ${createResponse.status} - ${errorText}`);
    }

    const ruleset = await createResponse.json();
    const rulesetName = ruleset.name;

    console.log(`✅ Ruleset creado: ${rulesetName}`);

    // Desplegar el ruleset  
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
    
    // El payload debe tener solo el nombre del ruleset en release.rulesetName
    const releasePayload = {
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName
      }
    };

    console.log('🚀 Desplegando ruleset...');

    const releaseResponse = await fetch(releaseUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(releasePayload)
    });

    if (!releaseResponse.ok) {
      const errorText = await releaseResponse.text();
      throw new Error(`Error desplegando ruleset: ${releaseResponse.status} - ${errorText}`);
    }

    const release = await releaseResponse.json();

    console.log('\n✅ Reglas de Firestore desplegadas correctamente!');
    console.log(`📋 Release: ${release.name}`);
    console.log(`🕐 Actualizado: ${release.updateTime}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

deployFirestoreRules();
