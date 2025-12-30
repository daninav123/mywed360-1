/**
 * Script para verificar sugerencias en supplier_option_suggestions
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '../backend/serviceAccount.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function checkSuggestions() {
  try {
    console.log('\n🔍 VERIFICANDO SUGERENCIAS DE CROWDSOURCING\n');
    
    const suggestions = await db.collection('supplier_option_suggestions').get();
    
    console.log(`📊 Total sugerencias: ${suggestions.size}\n`);
    
    if (suggestions.empty) {
      console.log('⚠️  No hay sugerencias en la colección');
      console.log('   Añade opciones personalizadas desde la app para crear sugerencias\n');
      return;
    }
    
    const byStatus = {};
    
    suggestions.forEach(doc => {
      const data = doc.data();
      const status = data.status || 'unknown';
      
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push({
        id: doc.id,
        category: data.category,
        optionLabel: data.optionLabel,
        votes: data.votes || 0,
        createdAt: data.metadata?.createdAt?.toDate?.() || 'unknown'
      });
    });
    
    console.log('📋 SUGERENCIAS POR ESTADO:\n');
    
    Object.keys(byStatus).forEach(status => {
      const count = byStatus[status].length;
      console.log(`${status.toUpperCase()}: ${count} sugerencias`);
      
      byStatus[status].slice(0, 3).forEach((sug, idx) => {
        console.log(`  ${idx + 1}. [${sug.category}] "${sug.optionLabel}" (${sug.votes} votos)`);
      });
      
      if (byStatus[status].length > 3) {
        console.log(`  ... y ${byStatus[status].length - 3} más`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkSuggestions();
