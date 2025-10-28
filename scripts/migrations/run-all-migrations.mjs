// scripts/migrations/run-all-migrations.mjs
// Ejecuta todas las migraciones en orden

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const DRY_RUN = !process.argv.includes('--force');

const MIGRATIONS = [
  {
    name: 'Emails (mails → users/{uid}/emails)',
    script: 'scripts/migrations/01-migrate-mails.mjs',
    priority: 'CRÍTICA',
    emoji: '🔴'
  },
  {
    name: 'Eventos de Proveedores (supplier_events → suppliers/{id}/analytics)',
    script: 'scripts/migrations/02-migrate-supplier-events.mjs',
    priority: 'MEDIA',
    emoji: '🟡'
  },
  {
    name: 'System (payments, discounts → system/)',
    script: 'scripts/migrations/03-migrate-to-system.mjs',
    priority: 'BAJA',
    emoji: '🟢'
  }
];

function runMigration(migration) {
  const command = `node ${migration.script}${DRY_RUN ? '' : ' --force'}`;
  
  console.log(`\n${migration.emoji} Ejecutando: ${migration.name}`);
  console.log(`   Prioridad: ${migration.priority}`);
  console.log(`   Comando: ${command}\n`);
  console.log('═'.repeat(80));
  
  try {
    execSync(command, { stdio: 'inherit' });
    return { migration: migration.name, success: true };
  } catch (error) {
    console.error(`❌ Error en migración: ${migration.name}`);
    return { migration: migration.name, success: false, error: error.message };
  }
}

async function runAllMigrations() {
  console.log('🔄 EJECUTAR TODAS LAS MIGRACIONES\n');
  console.log('═'.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN (simulación de todas las migraciones)');
    console.log('   Para ejecutar realmente: --force\n');
  } else {
    console.log('🔥 MODO REAL - Ejecutando migraciones permanentes');
    console.log('   ⚠️  Asegúrate de tener un backup completo\n');
    
    // Esperar confirmación
    console.log('⏳ Iniciando en 5 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  const results = [];
  
  console.log('📋 ORDEN DE EJECUCIÓN:\n');
  MIGRATIONS.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.emoji} ${m.name} (${m.priority})`);
  });
  console.log('\n');
  
  // Ejecutar cada migración
  for (const migration of MIGRATIONS) {
    const result = runMigration(migration);
    results.push(result);
    
    if (!result.success) {
      console.log(`\n⚠️  DETENIENDO: La migración "${migration.name}" falló.`);
      console.log('   Revisa los logs anteriores para más detalles.\n');
      break;
    }
    
    console.log(`\n✅ Migración completada: ${migration.name}\n`);
    console.log('-'.repeat(80));
  }
  
  // Resumen
  console.log('\n═'.repeat(80));
  console.log('\n📊 RESUMEN FINAL\n');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.migration}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n   Total: ${successCount}/${totalCount} exitosas\n`);
  
  if (successCount === totalCount) {
    console.log('✅ TODAS LAS MIGRACIONES COMPLETADAS\n');
    
    if (!DRY_RUN) {
      console.log('⚠️  PRÓXIMOS PASOS:\n');
      console.log('1. ✅ Verificar datos en nuevas ubicaciones');
      console.log('2. ✅ Probar la aplicación completamente');
      console.log('3. ✅ Actualizar código para usar nuevas ubicaciones');
      console.log('4. ⚠️  Solo entonces, eliminar colecciones antiguas\n');
    } else {
      console.log('💡 TODO CORRECTO EN SIMULACIÓN\n');
      console.log('   Para ejecutar las migraciones reales:');
      console.log('   node scripts/migrations/run-all-migrations.mjs --force\n');
    }
  } else {
    console.log('❌ ALGUNAS MIGRACIONES FALLARON\n');
    console.log('   Revisa los logs y corrige los errores antes de continuar.\n');
  }
  
  console.log('═'.repeat(80));
  console.log('');
}

// Ejecutar
runAllMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
