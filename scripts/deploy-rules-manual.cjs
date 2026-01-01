#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('📋 Para desplegar las reglas de Firestore manualmente:\n');
  console.log('1️⃣  Abre esta URL en tu navegador:');
  console.log('   https://console.firebase.google.com/project/planivia-98c77/firestore/rules\n');
  
  console.log('2️⃣  Copia y pega las reglas que se muestran a continuación:\n');
  console.log('─'.repeat(80));
  
  const rulesPath = path.join(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  console.log(rulesContent);
  
  console.log('─'.repeat(80));
  console.log('\n3️⃣  Haz clic en "Publicar" en la consola de Firebase\n');
  console.log('✅ Las reglas incluyen acceso público para RSVP (craft-webs-rsvp)\n');
}

main();
