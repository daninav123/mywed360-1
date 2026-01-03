#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function deployFirestoreRules() {
  try {
    console.log('🚀 Desplegando reglas de Firestore...\n');

    const credentialsPath = path.join(__dirname, '../backend/serviceAccount.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;

    console.log(`📦 Proyecto: ${projectId}`);

    const rulesPath = path.join(__dirname, '../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    console.log('📝 Reglas cargadas');
    console.log(`📏 Tamaño: ${rulesContent.length} caracteres`);

    const auth = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase'
      ]
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    console.log('🔑 Token obtenido\n');

    // PASO 1: Test de las reglas
    console.log('🧪 Validando reglas...');
    const testUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}:test`;
    
    const testPayload = {
      source: {
        files: [{
          content: rulesContent,
          name: 'firestore.rules'
        }]
      }
    };

    const testResponse = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (!testResponse.ok) {
      const error = await testResponse.text();
      console.error('❌ Error validando reglas:', error);
      process.exit(1);
    }

    const testResult = await testResponse.json();
    
    if (testResult.issues && testResult.issues.length > 0) {
      console.error('❌ Las reglas tienen errores:');
      testResult.issues.forEach(issue => {
        console.error(`  - ${issue.description} (${issue.severity})`);
      });
      process.exit(1);
    }

    console.log('✅ Reglas válidas\n');

    // PASO 2: Crear ruleset
    console.log('📤 Creando ruleset...');
    const createUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
    
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ Error creando ruleset:', error);
      process.exit(1);
    }

    const ruleset = await createResponse.json();
    console.log(`✅ Ruleset creado: ${ruleset.name}\n`);

    // PASO 3: Desplegar
    console.log('🚀 Desplegando...');
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
    
    const releaseResponse = await fetch(releaseUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rulesetName: ruleset.name })
    });

    if (!releaseResponse.ok) {
      const error = await releaseResponse.text();
      console.error('❌ Error desplegando:', error);
      process.exit(1);
    }

    const release = await releaseResponse.json();

    console.log('\n✅ ¡Reglas desplegadas correctamente!');
    console.log(`📋 Release: ${release.name}`);
    console.log(`🕐 Actualizado: ${release.updateTime}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

deployFirestoreRules();
