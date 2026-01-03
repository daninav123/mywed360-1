import { test } from '@playwright/test';

const TEST_USER = {
  email: 'danielnavarrocampos@icloud.com',
  password: 'admin123',
};

test('Debug: Ver contenido del Web Builder Dashboard', async ({ page }) => {
  console.log('\n📍 Login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.locator('button:has-text("Iniciar")').click();
  await page.waitForTimeout(3000);

  console.log('\n📍 Navegando al dashboard...');
  await page.goto('http://localhost:5173/wedding/web-builder-dashboard');
  await page.waitForTimeout(3000);

  // Tomar screenshot
  await page.screenshot({ path: 'test-results/dashboard-screenshot.png', fullPage: true });
  console.log('\n📸 Screenshot guardado');

  // Obtener todo el texto de la página
  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('\n📄 CONTENIDO DE LA PÁGINA:');
  console.log('═'.repeat(80));
  console.log(pageText);
  console.log('═'.repeat(80));

  // Buscar todos los botones
  const buttons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.map((btn) => ({
      text: btn.innerText,
      className: btn.className,
    }));
  });

  console.log('\n🔘 BOTONES ENCONTRADOS:');
  buttons.forEach((btn, i) => {
    console.log(`${i + 1}. "${btn.text}" (class: ${btn.className})`);
  });

  // Buscar enlaces
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map((a) => ({
      text: a.innerText,
      href: a.href,
    }));
  });

  console.log('\n🔗 ENLACES ENCONTRADOS:');
  links.forEach((link, i) => {
    console.log(`${i + 1}. "${link.text}" -> ${link.href}`);
  });

  // Ver si hay mensajes de error o vacío
  const hasError = pageText.includes('error') || pageText.includes('Error');
  const hasEmpty = pageText.includes('No tienes') || pageText.includes('Crea tu primera');

  console.log('\n🔍 ANÁLISIS:');
  console.log('- Tiene error:', hasError);
  console.log('- Está vacío:', hasEmpty);

  // Mantener abierto
  await page.waitForTimeout(10000);
});
