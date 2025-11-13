const { chromium } = require('playwright');

async function runE2ETest() {
  console.log('🧪 Iniciando test E2E...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  
  // Capturar errores de consola
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });
  
  // Capturar errores de página
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });
  
  // Capturar requests fallidos
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      const status = response.status();
      errors.push(`HTTP ${status}: ${url}`);
      console.log(`❌ HTTP ${status}: ${url}`);
    }
  });
  
  try {
    console.log('📍 Navegando a http://localhost:5173...');
    const response = await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log(`✅ Página cargada: ${response.status()}\n`);
    
    // Esperar un poco para capturar errores
    await page.waitForTimeout(3000);
    
    // Intentar encontrar elementos básicos
    console.log('🔍 Verificando elementos de la página...');
    
    const title = await page.title();
    console.log(`📄 Título: ${title}`);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`📝 Contenido visible: ${bodyText.substring(0, 200)}...\n`);
    
    // Tomar screenshot
    await page.screenshot({ path: 'e2e-screenshot.png', fullPage: true });
    console.log('📸 Screenshot guardado en e2e-screenshot.png\n');
    
  } catch (error) {
    errors.push(`Navigation error: ${error.message}`);
    console.log('❌ Error de navegación:', error.message);
  } finally {
    await browser.close();
    
    console.log('\n📊 RESUMEN DEL TEST:');
    console.log(`Total de errores: ${errors.length}`);
    console.log(`Total de warnings: ${warnings.length}\n`);
    
    if (errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
      process.exit(1);
    } else {
      console.log('✅ No se encontraron errores críticos');
      process.exit(0);
    }
  }
}

runE2ETest();
