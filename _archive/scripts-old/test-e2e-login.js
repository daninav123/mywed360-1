// Test E2E completo del flujo de login de proveedor
import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5175';
const BACKEND_URL = 'http://localhost:4004';
const EMAIL = 'resona@icloud.com';
const PASSWORD = 'test123';
const SUPPLIER_ID = 'z0BAVOrrub8xQvUtHIOw';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testE2E() {
  console.log('\n🧪 TEST E2E - Login Proveedor ReSona\n');
  console.log('='.repeat(70));
  
  let browser;
  let page;
  
  try {
    // 1. Verificar Backend
    console.log('\n1️⃣  Verificando Backend...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (!healthData.ok) {
      throw new Error('Backend no responde correctamente');
    }
    console.log('   ✅ Backend OK');

    // 2. Probar API de Login
    console.log('\n2️⃣  Probando API de Login...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/supplier-dashboard/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.success) {
      throw new Error(`Login API falló: ${JSON.stringify(loginData)}`);
    }
    console.log('   ✅ Login API OK');
    console.log('   Token:', loginData.token.substring(0, 50) + '...');
    console.log('   Supplier:', loginData.supplier.name);

    // 3. Abrir navegador
    console.log('\n3️⃣  Abriendo navegador...');
    browser = await puppeteer.launch({
      headless: false, // Visible para debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    page = await browser.newPage();
    
    // Capturar logs de consola
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('error') || text.includes('Error') || text.includes('❌')) {
        console.log('   🔴 Console:', text);
      }
    });
    
    // Capturar errores
    page.on('pageerror', error => {
      console.log('   🔴 Page Error:', error.message);
    });
    
    // Capturar requests fallidos
    page.on('requestfailed', request => {
      console.log('   🔴 Request Failed:', request.url());
    });
    
    console.log('   ✅ Navegador abierto');

    // 4. Navegar a Login
    console.log('\n4️⃣  Navegando a página de login...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });
    console.log('   ✅ Página cargada');
    console.log('   URL actual:', page.url());

    // 5. Verificar que el formulario existe
    console.log('\n5️⃣  Verificando formulario de login...');
    
    const hasEmailInput = await page.$('input[type="email"]') !== null;
    const hasPasswordInput = await page.$('input[type="password"]') !== null;
    const hasSubmitButton = await page.$('button[type="submit"]') !== null;
    
    if (!hasEmailInput) throw new Error('No se encontró input de email');
    if (!hasPasswordInput) throw new Error('No se encontró input de password');
    if (!hasSubmitButton) throw new Error('No se encontró botón de submit');
    
    console.log('   ✅ Formulario encontrado');

    // 6. Llenar formulario
    console.log('\n6️⃣  Llenando formulario...');
    
    await page.type('input[type="email"]', EMAIL);
    console.log('   ✅ Email introducido');
    
    await page.type('input[type="password"]', PASSWORD);
    console.log('   ✅ Password introducida');

    // 7. Capturar network requests
    const networkRequests = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        networkRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // 8. Submit
    console.log('\n7️⃣  Haciendo submit...');
    
    // Click en el botón
    await page.click('button[type="submit"]');
    console.log('   ✅ Click en submit');
    
    // Esperar a que se procese el login
    await sleep(3000);
    
    console.log('\n8️⃣  Verificando resultado del submit...');

    // 9. Verificar requests de red
    console.log('\n   📡 Peticiones de red capturadas:');
    networkRequests.forEach(req => {
      console.log(`      ${req.status} ${req.statusText} - ${req.url}`);
    });
    
    const loginRequest = networkRequests.find(r => r.url.includes('/auth/login'));
    if (!loginRequest) {
      console.log('   ❌ NO se encontró petición de login');
      console.log('   💡 El formulario NO envió la petición al backend');
    } else {
      console.log(`   ✅ Petición de login: ${loginRequest.status}`);
    }

    // 10. Verificar localStorage
    console.log('\n9️⃣  Verificando localStorage...');
    
    const token = await page.evaluate(() => localStorage.getItem('supplier_token'));
    const supplierId = await page.evaluate(() => localStorage.getItem('supplier_id'));
    
    if (token) {
      console.log('   ✅ Token guardado:', token.substring(0, 50) + '...');
    } else {
      console.log('   ❌ NO hay token en localStorage');
    }
    
    if (supplierId) {
      console.log('   ✅ Supplier ID:', supplierId);
    } else {
      console.log('   ❌ NO hay supplier ID en localStorage');
    }

    // 11. Verificar URL actual
    console.log('\n🔟 Verificando URL actual...');
    const currentUrl = page.url();
    console.log('   URL actual:', currentUrl);
    
    if (currentUrl.includes('/dashboard/')) {
      console.log('   ✅ Redirigido al dashboard correctamente');
    } else if (currentUrl.includes('/login')) {
      console.log('   ❌ Sigue en login - NO se redirigió');
    } else {
      console.log('   ⚠️  URL inesperada:', currentUrl);
    }

    // 12. Verificar contenido de la página
    console.log('\n1️⃣1️⃣  Verificando contenido de la página...');
    
    const pageTitle = await page.title();
    console.log('   Título:', pageTitle);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    if (bodyText.includes('Dashboard') || bodyText.includes('ReSona')) {
      console.log('   ✅ Dashboard cargado');
    } else if (bodyText.includes('Login') || bodyText.includes('Iniciar sesión')) {
      console.log('   ❌ Sigue mostrando login');
    } else {
      console.log('   ⚠️  Contenido inesperado');
      console.log('   Texto (primeros 200 chars):', bodyText.substring(0, 200));
    }

    // 13. Logs de consola relevantes
    console.log('\n1️⃣2️⃣  Logs de consola relevantes:');
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('Auth') || 
      log.includes('login') || 
      log.includes('token') ||
      log.includes('navigate') ||
      log.includes('Error') ||
      log.includes('error')
    );
    
    if (relevantLogs.length > 0) {
      relevantLogs.slice(-10).forEach(log => {
        console.log('   📝', log);
      });
    } else {
      console.log('   (No hay logs relevantes)');
    }

    // 14. Esperar un poco para ver el resultado
    console.log('\n⏳ Esperando 5 segundos para que puedas ver el resultado...');
    await sleep(5000);

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMEN:\n');
    console.log(`✅ Backend: ${healthData.ok ? 'OK' : 'FAIL'}`);
    console.log(`✅ Login API: ${loginData.success ? 'OK' : 'FAIL'}`);
    console.log(`${loginRequest ? '✅' : '❌'} Petición login frontend: ${loginRequest ? 'ENVIADA' : 'NO ENVIADA'}`);
    console.log(`${token ? '✅' : '❌'} Token en localStorage: ${token ? 'SÍ' : 'NO'}`);
    console.log(`${currentUrl.includes('/dashboard/') ? '✅' : '❌'} Redirigido a dashboard: ${currentUrl.includes('/dashboard/') ? 'SÍ' : 'NO'}`);
    
    console.log('\n' + '='.repeat(70));

    if (token && currentUrl.includes('/dashboard/')) {
      console.log('\n🎉 ¡TEST E2E EXITOSO! El login funciona correctamente.\n');
    } else {
      console.log('\n❌ TEST E2E FALLÓ. Problemas detectados:\n');
      
      if (!loginRequest) {
        console.log('   ⚠️  El formulario NO envió la petición al backend');
        console.log('   💡 Posible problema: JavaScript error o validación bloqueando submit');
      }
      
      if (!token) {
        console.log('   ⚠️  No se guardó el token en localStorage');
        console.log('   💡 Posible problema: Login API no respondió correctamente');
      }
      
      if (!currentUrl.includes('/dashboard/')) {
        console.log('   ⚠️  No se redirigió al dashboard');
        console.log('   💡 Posible problema: navigate() no funcionó o AuthProvider bloqueando');
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ ERROR EN TEST E2E:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('\n🔒 Cerrando navegador en 3 segundos...');
      await sleep(3000);
      await browser.close();
    }
  }
}

// Ejecutar test
testE2E().catch(console.error);
