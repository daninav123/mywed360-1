/**
 * Test E2E para verificar sincronización de categorías
 * Proveedores → Finanzas
 */

const { chromium } = require('playwright');

async function testCategorySync() {
  console.log('🧪 TEST E2E: Sincronización de Categorías\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturar logs de consola
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[useFinance]') || text.includes('[useWeddingCategories]') || text.includes('Migration')) {
      console.log('📝', text);
    }
  });
  
  try {
    // 1. Navegar a la app
    console.log('1️⃣ Navegando a http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 2. Verificar si hay sesión activa
    console.log('\n2️⃣ Verificando sesión...');
    const hasSession = await page.evaluate(() => {
      const profile = window.localStorage.getItem('MaLoveApp_user_profile');
      const wedding = window.localStorage.getItem('MaLoveApp_active_wedding');
      return { profile: !!profile, wedding: !!wedding };
    });
    
    console.log('   Sesión activa:', hasSession.profile && hasSession.wedding ? '✅' : '❌');
    
    if (!hasSession.profile || !hasSession.wedding) {
      console.log('⚠️ No hay sesión activa. Inicia sesión manualmente y vuelve a ejecutar el test.');
      await page.pause();
      return;
    }
    
    // 3. Leer datos de localStorage
    console.log('\n3️⃣ Leyendo datos de localStorage...');
    const localData = await page.evaluate(() => {
      const profile = JSON.parse(window.localStorage.getItem('MaLoveApp_user_profile') || '{}');
      const wedding = window.localStorage.getItem('MaLoveApp_active_wedding');
      return { userId: profile.uid, weddingId: wedding };
    });
    
    console.log('   UserId:', localData.userId);
    console.log('   WeddingId:', localData.weddingId);
    
    // 4. Verificar categorías en Firestore usando código de la página
    console.log('\n4️⃣ Verificando categorías en Firestore...');
    const firestoreData = await page.evaluate(async ({ userId, weddingId }) => {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      const db = window.__FIREBASE_DB__;
      
      if (!db) return { error: 'Firebase no disponible' };
      
      try {
        // Leer activeCategories de users/{uid}/weddings/{id}
        const userWeddingRef = doc(db, 'users', userId, 'weddings', weddingId);
        const userWeddingSnap = await getDoc(userWeddingRef);
        const activeCategories = userWeddingSnap.exists() ? userWeddingSnap.data()?.activeCategories || [] : [];
        
        // Leer wantedServices de weddings/{id}
        const mainWeddingRef = doc(db, 'weddings', weddingId);
        const mainWeddingSnap = await getDoc(mainWeddingRef);
        const wantedServices = mainWeddingSnap.exists() ? mainWeddingSnap.data()?.wantedServices || [] : [];
        const migrated = mainWeddingSnap.exists() ? mainWeddingSnap.data()?._autoMigrated || false : false;
        
        return {
          activeCategories,
          wantedServices,
          migrated,
          match: activeCategories.length > 0 && wantedServices.length === activeCategories.length
        };
      } catch (error) {
        return { error: error.message };
      }
    }, localData);
    
    console.log('   📋 activeCategories:', firestoreData.activeCategories);
    console.log('   📋 wantedServices:', firestoreData.wantedServices);
    console.log('   🔄 Migrado:', firestoreData.migrated ? '✅' : '❌');
    console.log('   ✓ Sincronizadas:', firestoreData.match ? '✅' : '❌');
    
    // 5. Navegar a Proveedores
    console.log('\n5️⃣ Navegando a Proveedores...');
    await page.goto('http://localhost:5173/proveedores', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // 6. Navegar a Finanzas
    console.log('\n6️⃣ Navegando a Finanzas...');
    await page.goto('http://localhost:5173/finance', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(5000); // Esperar a que useFinance se ejecute
    
    // 7. Verificar providerTemplates en memoria
    console.log('\n7️⃣ Verificando providerTemplates en useFinance...');
    const migrationLogs = logs.filter(log => 
      log.includes('[useFinance]') || log.includes('Migration') || log.includes('migr')
    );
    
    console.log('\n📊 LOGS DE MIGRACIÓN:');
    if (migrationLogs.length === 0) {
      console.log('   ⚠️ No se encontraron logs de migración');
    } else {
      migrationLogs.forEach(log => console.log('   ', log));
    }
    
    // 8. Verificar categorías de presupuesto en la UI
    console.log('\n8️⃣ Verificando categorías en UI de Finanzas...');
    const budgetCategories = await page.evaluate(() => {
      // Buscar elementos de categorías en el DOM
      const categoryElements = document.querySelectorAll('[data-category], .budget-category, [class*="category"]');
      return Array.from(categoryElements).map(el => el.textContent).slice(0, 10);
    });
    
    console.log('   Categorías visibles:', budgetCategories.length);
    budgetCategories.slice(0, 5).forEach(cat => console.log('   -', cat));
    
    // 9. Verificar de nuevo Firestore después de navegar
    console.log('\n9️⃣ Verificando Firestore después de navegar...');
    const firestoreDataAfter = await page.evaluate(async ({ userId, weddingId }) => {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      const db = window.__FIREBASE_DB__;
      
      if (!db) return { error: 'Firebase no disponible' };
      
      try {
        const mainWeddingRef = doc(db, 'weddings', weddingId);
        const mainWeddingSnap = await getDoc(mainWeddingRef);
        const wantedServices = mainWeddingSnap.exists() ? mainWeddingSnap.data()?.wantedServices || [] : [];
        const migrated = mainWeddingSnap.exists() ? mainWeddingSnap.data()?._autoMigrated || false : false;
        
        return { wantedServices, migrated };
      } catch (error) {
        return { error: error.message };
      }
    }, localData);
    
    console.log('   📋 wantedServices (después):', firestoreDataAfter.wantedServices);
    console.log('   🔄 Migrado (después):', firestoreDataAfter.migrated ? '✅' : '❌');
    
    // RESULTADO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DEL TEST');
    console.log('='.repeat(60));
    
    const before = firestoreData.wantedServices?.length || 0;
    const after = firestoreDataAfter.wantedServices?.length || 0;
    
    if (before === 0 && after > 0) {
      console.log('✅ MIGRACIÓN EXITOSA');
      console.log(`   Antes: ${before} categorías`);
      console.log(`   Después: ${after} categorías`);
    } else if (before > 0 && after > 0) {
      console.log('✅ YA ESTABA SINCRONIZADO');
      console.log(`   Categorías: ${after}`);
    } else if (before === 0 && after === 0) {
      console.log('❌ NO SE SINCRONIZÓ');
      console.log('   activeCategories:', firestoreData.activeCategories?.length || 0);
      console.log('   wantedServices:', 0);
    }
    
    console.log('\n💡 Revisa los logs de consola arriba para más detalles');
    
    await page.pause();
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  } finally {
    await browser.close();
  }
}

testCategorySync().catch(console.error);
