#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Desplegando reglas de Firestore...\n');

try {
  // Ruta al archivo de credenciales
  const credentialsPath = path.join(__dirname, '../backend/serviceAccount.json');
  
  // Verificar que existe el archivo
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('No se encontró el archivo serviceAccount.json');
  }

  // Leer el project ID
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const projectId = credentials.project_id;
  
  console.log(`📦 Proyecto: ${projectId}`);
  console.log('📝 Desplegando reglas...\n');

  // Configurar variable de entorno y ejecutar deploy
  const env = {
    ...process.env,
    GOOGLE_APPLICATION_CREDENTIALS: credentialsPath
  };

  const result = execSync(
    `firebase deploy --only firestore:rules --project ${projectId} --token "$(gcloud auth print-access-token)" || firebase deploy --only firestore:rules --project ${projectId}`,
    {
      cwd: path.join(__dirname, '..'),
      env: env,
      stdio: 'inherit'
    }
  );

  console.log('\n✅ Reglas desplegadas correctamente');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\n💡 Intentando método alternativo con gcloud...\n');
  
  try {
    const credentialsPath = path.join(__dirname, '../backend/serviceAccount.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;
    
    // Activar la cuenta de servicio
    execSync(
      `gcloud auth activate-service-account --key-file="${credentialsPath}"`,
      { stdio: 'inherit' }
    );
    
    // Configurar el proyecto
    execSync(
      `gcloud config set project ${projectId}`,
      { stdio: 'inherit' }
    );
    
    // Desplegar
    execSync(
      `firebase deploy --only firestore:rules --project ${projectId}`,
      {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      }
    );
    
    console.log('\n✅ Reglas desplegadas correctamente (método alternativo)');
    
  } catch (altError) {
    console.error('\n❌ Error en método alternativo:', altError.message);
    process.exit(1);
  }
}
