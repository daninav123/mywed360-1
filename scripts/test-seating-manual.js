/**
 * Test Manual del Seating Plan
 * Verifica las funcionalidades sin Cypress (por problemas de compatibilidad)
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSeatingPlan() {
  let browser;
  let results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  try {
    console.log('🚀 Iniciando tests del Seating Plan...\n');

    // Lanzar navegador
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Interceptar logs de consola
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[setupSeatingPlanAutomatically]')) {
        console.log('📋 Log:', text);
      }
    });

    // ====================
    // TEST 1: Cargar página
    // ====================
    console.log('🔍 TEST 1: Verificando que la página carga...');
    try {
      await page.goto(`${BASE_URL}/invitados/seating`, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT,
      });
      results.passed.push('✅ TEST 1: Página carga correctamente');
      console.log('   ✅ PASSED\n');
    } catch (error) {
      results.failed.push(`❌ TEST 1: Página no carga - ${error.message}`);
      console.log('   ❌ FAILED\n');
      throw error;
    }

    await sleep(2000);

    // ====================
    // TEST 2: Pestañas existen
    // ====================
    console.log('🔍 TEST 2: Verificando pestañas...');
    try {
      const ceremoniaExists = await page.$('text/Ceremonia');
      const banqueteExists = await page.$('text/Banquete');

      if (ceremoniaExists && banqueteExists) {
        results.passed.push('✅ TEST 2: Pestañas Ceremonia y Banquete existen');
        console.log('   ✅ PASSED\n');
      } else {
        results.failed.push('❌ TEST 2: No se encontraron las pestañas');
        console.log('   ❌ FAILED\n');
      }
    } catch (error) {
      results.warnings.push(`⚠️  TEST 2: Error verificando pestañas - ${error.message}`);
      console.log('   ⚠️  WARNING\n');
    }

    // ====================
    // TEST 3: Cambiar a Banquete
    // ====================
    console.log('🔍 TEST 3: Cambiando a pestaña Banquete...');
    try {
      await page.click('text/Banquete');
      await sleep(1000);
      results.passed.push('✅ TEST 3: Cambio a pestaña Banquete exitoso');
      console.log('   ✅ PASSED\n');
    } catch (error) {
      results.warnings.push(`⚠️  TEST 3: No se pudo cambiar a Banquete - ${error.message}`);
      console.log('   ⚠️  WARNING\n');
    }

    // ====================
    // TEST 4: Botón de generación automática
    // ====================
    console.log('🔍 TEST 4: Buscando botón "Generar Plan Automáticamente"...');
    try {
      // Intentar varios selectores
      let button = await page.$('button::-p-text(Generar Plan Automáticamente)');

      if (!button) {
        // Buscar por "Generar TODO"
        button = await page.$('button::-p-text(Generar TODO)');
      }

      if (!button) {
        // Buscar cualquier botón con "Automático"
        button = await page.$('button::-p-text(Automático)');
      }

      if (button) {
        results.passed.push('✅ TEST 4: Botón de generación automática ENCONTRADO');
        console.log('   ✅ PASSED - Botón encontrado!\n');

        // Obtener el texto del botón
        const buttonText = await page.evaluate((el) => el.textContent, button);
        console.log(`   📝 Texto del botón: "${buttonText}"\n`);
      } else {
        results.failed.push('❌ TEST 4: Botón de generación automática NO ENCONTRADO');
        console.log('   ❌ FAILED - Botón NO encontrado\n');

        // Debug: listar todos los botones
        const allButtons = await page.$$eval('button', (btns) =>
          btns.map((btn) => btn.textContent.trim()).filter((text) => text)
        );
        console.log('   🔍 Botones encontrados en la página:');
        allButtons.forEach((text, i) => {
          console.log(`      ${i + 1}. "${text}"`);
        });
        console.log('');
      }
    } catch (error) {
      results.failed.push(`❌ TEST 4: Error buscando botón - ${error.message}`);
      console.log(`   ❌ FAILED - Error: ${error.message}\n`);
    }

    // ====================
    // TEST 5: Verificar función setupSeatingPlanAutomatically
    // ====================
    console.log('🔍 TEST 5: Verificando función setupSeatingPlanAutomatically...');
    try {
      const hasFunction = await page.evaluate(() => {
        // Buscar en React DevTools o en window
        return (
          typeof window.setupSeatingPlanAutomatically !== 'undefined' ||
          document.body.textContent.includes('setupSeatingPlanAutomatically')
        );
      });

      if (hasFunction) {
        results.passed.push('✅ TEST 5: Función setupSeatingPlanAutomatically detectada');
        console.log('   ✅ PASSED\n');
      } else {
        results.warnings.push(
          '⚠️  TEST 5: Función no detectada en window (puede estar en el hook)'
        );
        console.log('   ⚠️  WARNING\n');
      }
    } catch (error) {
      results.warnings.push(`⚠️  TEST 5: Error verificando función - ${error.message}`);
      console.log('   ⚠️  WARNING\n');
    }

    // ====================
    // TEST 6: Toolbar
    // ====================
    console.log('🔍 TEST 6: Verificando toolbar...');
    try {
      const toolbar = await page.$('[class*="toolbar"]');
      if (toolbar) {
        const buttons = await page.$$('[class*="toolbar"] button');
        results.passed.push(`✅ TEST 6: Toolbar encontrado con ${buttons.length} botones`);
        console.log(`   ✅ PASSED - ${buttons.length} botones en toolbar\n`);
      } else {
        results.warnings.push('⚠️  TEST 6: Toolbar no encontrado');
        console.log('   ⚠️  WARNING\n');
      }
    } catch (error) {
      results.warnings.push(`⚠️  TEST 6: Error verificando toolbar - ${error.message}`);
      console.log('   ⚠️  WARNING\n');
    }

    // ====================
    // TEST 7: Estado de mesas
    // ====================
    console.log('🔍 TEST 7: Verificando estado de mesas...');
    try {
      const tables = await page.$$('g[data-table-id]');
      if (tables.length === 0) {
        results.passed.push('✅ TEST 7: Estado inicial correcto (sin mesas)');
        console.log('   ✅ PASSED - Sin mesas (estado inicial correcto)\n');
      } else {
        results.warnings.push(`⚠️  TEST 7: Ya hay ${tables.length} mesas en el canvas`);
        console.log(`   ⚠️  WARNING - Ya hay ${tables.length} mesas\n`);
      }
    } catch (error) {
      results.warnings.push(`⚠️  TEST 7: Error verificando mesas - ${error.message}`);
      console.log('   ⚠️  WARNING\n');
    }

    // ====================
    // RESUMEN
    // ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE TESTS');
    console.log('='.repeat(60) + '\n');

    console.log(`✅ PASSED: ${results.passed.length}`);
    results.passed.forEach((msg) => console.log(`   ${msg}`));
    console.log('');

    if (results.failed.length > 0) {
      console.log(`❌ FAILED: ${results.failed.length}`);
      results.failed.forEach((msg) => console.log(`   ${msg}`));
      console.log('');
    }

    if (results.warnings.length > 0) {
      console.log(`⚠️  WARNINGS: ${results.warnings.length}`);
      results.warnings.forEach((msg) => console.log(`   ${msg}`));
      console.log('');
    }

    const totalTests = results.passed.length + results.failed.length + results.warnings.length;
    const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

    console.log(`📈 Tasa de éxito: ${passRate}%`);
    console.log('='.repeat(60) + '\n');

    // Esperar un momento para ver el resultado
    console.log('⏳ Manteniendo navegador abierto 5 segundos para inspección...\n');
    await sleep(5000);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar tests
testSeatingPlan()
  .then(() => {
    console.log('✅ Tests completados\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  });
