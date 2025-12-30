#!/usr/bin/env node
/**
 * Script de migración de categorías de música/sonido/iluminación
 * 
 * Migra proveedores de categorías antiguas a nuevas granulares:
 * - musica → musica-ceremonia / musica-cocktail / musica-fiesta / sonido-iluminacion
 * - iluminacion → sonido-iluminacion
 * - dj → dj (mantener)
 * 
 * USO:
 *   node backend/scripts/migrate-music-categories.js --dry-run    # Ver cambios sin aplicar
 *   node backend/scripts/migrate-music-categories.js --apply      # Aplicar cambios reales
 */

import { db } from '../db.js';

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

// Mapeo manual de proveedores conocidos (por nombre exacto)
const KNOWN_SUPPLIERS = {
  'resona': 'sonido-iluminacion',
  'resona events': 'sonido-iluminacion',
  'audioprobe': 'sonido-iluminacion',
  'gente de bien': 'sonido-iluminacion',
  'alkilaudio': 'sonido-iluminacion',
};

// Palabras clave para identificar empresas de producción técnica
const TECHNICAL_KEYWORDS = [
  'sonido', 'sound', 'audio', 'iluminacion', 'iluminación', 'lighting', 'luces',
  'produccion', 'producción', 'production', 'tecnica', 'técnica', 'technical',
  'eventos', 'events', 'audiovisual', 'equipo', 'equipment', 'alquiler', 'rental',
  'escenario', 'stage', 'pantallas', 'screens', 'sistemas', 'systems'
];

// Palabras clave para bandas/músicos
const BAND_KEYWORDS = [
  'banda', 'band', 'orquesta', 'orchestra', 'grupo', 'group', 'musicos', 'músicos',
  'musicians', 'versiones', 'covers', 'tributo', 'tribute'
];

// Palabras clave para música de ceremonia
const CEREMONY_KEYWORDS = [
  'ceremonia', 'ceremony', 'cuarteto', 'quartet', 'violin', 'violín', 'arpa', 'harp',
  'piano', 'gospel', 'coral', 'choir', 'organo', 'órgano', 'organ', 'clasica', 'clásica',
  'classical', 'strings', 'cuerdas'
];

// Palabras clave para música de cóctel
const COCKTAIL_KEYWORDS = [
  'cocktail', 'cóctel', 'jazz', 'acustica', 'acústica', 'acoustic', 'duo', 'dúo',
  'trio', 'bossa', 'lounge', 'chill', 'ambient'
];

/**
 * Analiza el perfil del proveedor para determinar su categoría apropiada
 */
function analyzeSupplierCategory(supplier) {
  const data = supplier.data();
  const name = (data.name || data.profile?.name || '').toLowerCase();
  const description = (data.business?.description || data.description || '').toLowerCase();
  const tags = (data.tags || []).map(t => t.toLowerCase()).join(' ');
  const category = (data.category || '').toLowerCase();
  
  const fullText = `${name} ${description} ${tags}`.toLowerCase();
  
  // 0. Verificar mapeo manual de proveedores conocidos
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  
  // Buscar coincidencia exacta o parcial
  let knownCategory = KNOWN_SUPPLIERS[normalizedName];
  
  // Si no hay coincidencia exacta, buscar si el nombre contiene alguna key conocida
  if (!knownCategory) {
    for (const [knownName, category] of Object.entries(KNOWN_SUPPLIERS)) {
      if (normalizedName.includes(knownName) || knownName.includes(normalizedName)) {
        knownCategory = category;
        break;
      }
    }
  }
  
  if (knownCategory) {
    return {
      currentCategory: category,
      suggestedCategory: knownCategory,
      confidence: 'high',
      reason: `proveedor conocido: "${normalizedName}" → ${knownCategory}`,
      details: {
        technicalMatches: 0,
        bandMatches: 0,
        ceremonyMatches: 0,
        cocktailMatches: 0
      }
    };
  }
  
  // Contar coincidencias por tipo
  const technicalMatches = TECHNICAL_KEYWORDS.filter(kw => fullText.includes(kw)).length;
  const bandMatches = BAND_KEYWORDS.filter(kw => fullText.includes(kw)).length;
  const ceremonyMatches = CEREMONY_KEYWORDS.filter(kw => fullText.includes(kw)).length;
  const cocktailMatches = COCKTAIL_KEYWORDS.filter(kw => fullText.includes(kw)).length;
  
  // Decisión de categoría
  let newCategory = null;
  let confidence = 'low';
  let reason = '';
  
  // 1. Empresas técnicas (sonido/iluminación)
  if (technicalMatches >= 2) {
    newCategory = 'sonido-iluminacion';
    confidence = technicalMatches >= 4 ? 'high' : 'medium';
    reason = `${technicalMatches} palabras clave técnicas`;
  }
  // 2. Música ceremonia
  else if (ceremonyMatches >= 2) {
    newCategory = 'musica-ceremonia';
    confidence = ceremonyMatches >= 3 ? 'high' : 'medium';
    reason = `${ceremonyMatches} palabras clave de ceremonia`;
  }
  // 3. Música cóctel
  else if (cocktailMatches >= 2) {
    newCategory = 'musica-cocktail';
    confidence = cocktailMatches >= 3 ? 'high' : 'medium';
    reason = `${cocktailMatches} palabras clave de cóctel`;
  }
  // 4. Bandas/música fiesta
  else if (bandMatches >= 2) {
    newCategory = 'musica-fiesta';
    confidence = bandMatches >= 3 ? 'high' : 'medium';
    reason = `${bandMatches} palabras clave de banda`;
  }
  // 5. Categoría iluminacion antigua → producción técnica
  else if (category === 'iluminacion') {
    newCategory = 'sonido-iluminacion';
    confidence = 'high';
    reason = 'categoría iluminacion → sonido-iluminacion';
  }
  // 6. Sin coincidencias claras - mantener genérico o manual
  else {
    newCategory = null; // Requiere revisión manual
    confidence = 'none';
    reason = 'sin coincidencias claras - revisar manualmente';
  }
  
  return {
    currentCategory: category,
    suggestedCategory: newCategory,
    confidence,
    reason,
    details: {
      technicalMatches,
      bandMatches,
      ceremonyMatches,
      cocktailMatches
    }
  };
}

async function migrateCategories() {
  console.log('\n🎵 MIGRACIÓN DE CATEGORÍAS MÚSICA/SONIDO/ILUMINACIÓN\n');
  console.log('='.repeat(70));
  
  if (!DRY_RUN && !APPLY) {
    console.log('\n⚠️  Debes especificar --dry-run o --apply\n');
    console.log('Uso:');
    console.log('  --dry-run    Ver cambios sin aplicar');
    console.log('  --apply      Aplicar cambios reales\n');
    process.exit(1);
  }
  
  const mode = DRY_RUN ? '🔍 MODO DRY-RUN (solo vista previa)' : '✅ MODO APPLY (cambios reales)';
  console.log(`\n${mode}\n`);
  console.log('='.repeat(70));
  
  try {
    // Buscar proveedores en categorías antiguas
    console.log('\n📊 Buscando proveedores en categorías antiguas...\n');
    
    const musicaSnapshot = await db.collection('suppliers')
      .where('category', '==', 'musica')
      .get();
    
    const iluminacionSnapshot = await db.collection('suppliers')
      .where('category', '==', 'iluminacion')
      .get();
    
    const allSuppliers = [...musicaSnapshot.docs, ...iluminacionSnapshot.docs];
    
    console.log(`✅ Encontrados ${allSuppliers.length} proveedores:`);
    console.log(`   - Música: ${musicaSnapshot.size}`);
    console.log(`   - Iluminación: ${iluminacionSnapshot.size}\n`);
    
    if (allSuppliers.length === 0) {
      console.log('ℹ️  No hay proveedores para migrar\n');
      process.exit(0);
    }
    
    // Analizar cada proveedor
    console.log('🔍 Analizando proveedores...\n');
    console.log('='.repeat(70));
    
    const migrations = {
      'sonido-iluminacion': [],
      'musica-ceremonia': [],
      'musica-cocktail': [],
      'musica-fiesta': [],
      'manual-review': []
    };
    
    for (const supplier of allSuppliers) {
      const analysis = analyzeSupplierCategory(supplier);
      const data = supplier.data();
      const name = data.name || data.profile?.name || 'Sin nombre';
      
      console.log(`\n📝 ${name}`);
      console.log(`   ID: ${supplier.id}`);
      console.log(`   Categoría actual: ${analysis.currentCategory}`);
      console.log(`   Categoría sugerida: ${analysis.suggestedCategory || 'REVISAR MANUALMENTE'}`);
      console.log(`   Confianza: ${analysis.confidence}`);
      console.log(`   Razón: ${analysis.reason}`);
      console.log(`   Matches: técnico=${analysis.details.technicalMatches}, banda=${analysis.details.bandMatches}, ceremonia=${analysis.details.ceremonyMatches}, cóctel=${analysis.details.cocktailMatches}`);
      
      if (analysis.suggestedCategory) {
        migrations[analysis.suggestedCategory].push({
          id: supplier.id,
          name,
          currentCategory: analysis.currentCategory,
          confidence: analysis.confidence
        });
      } else {
        migrations['manual-review'].push({
          id: supplier.id,
          name,
          currentCategory: analysis.currentCategory,
          reason: analysis.reason
        });
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMEN DE MIGRACIONES\n');
    
    Object.entries(migrations).forEach(([newCat, suppliers]) => {
      if (suppliers.length > 0) {
        const icon = newCat === 'manual-review' ? '⚠️' : '✅';
        console.log(`${icon} ${newCat}: ${suppliers.length} proveedores`);
        suppliers.forEach(s => {
          const conf = s.confidence ? ` (${s.confidence})` : '';
          console.log(`   - ${s.name}${conf}`);
        });
        console.log('');
      }
    });
    
    // Aplicar cambios si está en modo APPLY
    if (APPLY) {
      console.log('='.repeat(70));
      console.log('\n🚀 APLICANDO CAMBIOS...\n');
      
      const batch = db.batch();
      let updatedCount = 0;
      
      for (const [newCategory, suppliers] of Object.entries(migrations)) {
        if (newCategory === 'manual-review') continue; // Saltar revisión manual
        
        for (const supplier of suppliers) {
          const ref = db.collection('suppliers').doc(supplier.id);
          batch.update(ref, {
            category: newCategory,
            oldCategory: supplier.currentCategory, // Backup de categoría antigua
            migratedAt: new Date(),
            migrationConfidence: supplier.confidence
          });
          updatedCount++;
          console.log(`   ✅ ${supplier.name}: ${supplier.currentCategory} → ${newCategory}`);
        }
      }
      
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`\n✅ ${updatedCount} proveedores actualizados correctamente\n`);
      } else {
        console.log('\nℹ️  No hay proveedores para actualizar\n');
      }
      
      if (migrations['manual-review'].length > 0) {
        console.log('⚠️  ATENCIÓN: Los siguientes proveedores requieren revisión manual:\n');
        migrations['manual-review'].forEach(s => {
          console.log(`   - ${s.name} (${s.id})`);
          console.log(`     Razón: ${s.reason}\n`);
        });
      }
    } else {
      console.log('='.repeat(70));
      console.log('\nℹ️  Modo dry-run: no se aplicaron cambios');
      console.log('   Ejecuta con --apply para aplicar las migraciones\n');
    }
    
    console.log('='.repeat(70));
    console.log('\n✅ Proceso completado\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

migrateCategories();
