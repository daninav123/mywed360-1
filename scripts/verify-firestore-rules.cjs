#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

async function verifyFirestoreRules() {
  try {
    console.log('🔍 Verificando reglas de Firestore...\n');

    const credentialsPath = path.join(__dirname, '../backend/serviceAccount.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;

    console.log(`📦 Proyecto: ${projectId}`);

    const auth = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/firebase'
      ]
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Obtener el release actual
    const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`;
    
    const response = await fetch(releaseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo release: ${response.status}`);
    }

    const release = await response.json();
    console.log('\n✅ Release actual:');
    console.log(`   Name: ${release.name}`);
    console.log(`   Ruleset: ${release.rulesetName}`);
    console.log(`   Updated: ${release.updateTime}`);

    // Obtener el contenido del ruleset
    const rulesetUrl = `https://firebaserules.googleapis.com/v1/${release.rulesetName}`;
    
    const rulesetResponse = await fetch(rulesetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`
      }
    });

    if (!rulesetResponse.ok) {
      throw new Error(`Error obteniendo ruleset: ${rulesetResponse.status}`);
    }

    const ruleset = await rulesetResponse.json();
    
    console.log('\n📝 Contenido de las reglas:');
    console.log('─'.repeat(80));
    console.log(ruleset.source.files[0].content);
    console.log('─'.repeat(80));

    // Verificar si contiene craft-webs
    const hasCraftWebs = ruleset.source.files[0].content.includes('craft-webs');
    
    if (hasCraftWebs) {
      console.log('\n✅ Las reglas para craft-webs están presentes');
    } else {
      console.log('\n❌ Las reglas para craft-webs NO están presentes');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

verifyFirestoreRules();
