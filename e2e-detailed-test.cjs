const { chromium } = require('playwright');

async function runDetailedE2ETest() {
  console.log('🧪 Iniciando test E2E detallado con más información...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  
  // Capturar errores de consola con más detalles
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    
    if (type === 'error') {
      errors.push({
        type: 'console',
        text,
        url: location.url,
        line: location.lineNumber,
        column: location.columnNumber
      });
      console.log('❌ Console Error:', text);
      console.log('   Ubicación:', location.url, `línea ${location.lineNumber}:${location.columnNumber}`);
    }
  });
  
  // Capturar errores de página con stack trace
  page.on('pageerror', error => {
    errors.push({
      type: 'page',
      message: error.message,
      stack: error.stack
    });
    console.log('❌ Page Error:', error.message);
    console.log('   Stack:', error.stack);
  });
  
  // Capturar requests fallidos
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      const status = response.status();
      errors.push({
        type: 'http',
        url,
        status
      });
      console.log(`❌ HTTP ${status}: ${url}`);
    }
  });
  
  try {
    console.log('📍 Navegando a http://localhost:5173...');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Esperar más tiempo para capturar todos los errores
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'e2e-screenshot-detailed.png', fullPage: true });
    
  } catch (error) {
    console.log('❌ Error de navegación:', error.message);
    errors.push({ type: 'navigation', message: error.message });
  } finally {
    await browser.close();
    
    console.log('\n📊 RESUMEN DETALLADO:');
    console.log(`Total de errores: ${errors.length}\n`);
    
    if (errors.length > 0) {
      console.log('❌ ERRORES ENCONTRADOS:');
      errors.forEach((err, i) => {
        console.log(`\n${i + 1}. Tipo: ${err.type}`);
        if (err.text) console.log(`   Texto: ${err.text}`);
        if (err.message) console.log(`   Mensaje: ${err.message}`);
        if (err.url) console.log(`   URL: ${err.url}`);
        if (err.line) console.log(`   Línea: ${err.line}, Columna: ${err.column}`);
        if (err.stack) console.log(`   Stack: ${err.stack.substring(0, 200)}...`);
      });
      process.exit(1);
    } else {
      console.log('✅ No se encontraron errores');
      process.exit(0);
    }
  }
}

runDetailedE2ETest();
