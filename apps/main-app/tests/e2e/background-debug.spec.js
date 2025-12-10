import { test } from '@playwright/test';

test('Debug completo del sistema de fondos', async ({ page, context }) => {
  // Escuchar todos los console.log
  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));

  // Navegar
  await page.goto('http://localhost:5173/web-builder-craft');
  await page.waitForTimeout(3000);

  console.log('\n🔍 === PASO 1: Verificar estado inicial ===');
  await page.waitForTimeout(1000);

  console.log('\n🔍 === PASO 2: Abrir panel de personalizar ===');
  await page.locator('text=✨ Personalizar').click();
  await page.waitForTimeout(1000);

  console.log('\n🔍 === PASO 3: Scroll al panel de fondos ===');
  await page.evaluate(() => {
    const panel = document.querySelector('.overflow-y-auto');
    if (panel) panel.scrollTop = 1000;
  });
  await page.waitForTimeout(500);

  console.log('\n🔍 === PASO 4: Click en botón Gradiente ===');
  await page.locator('button:has-text("🌈 Gradiente")').click();
  await page.waitForTimeout(1000);

  console.log('\n🔍 === PASO 5: Click en gradiente Atardecer ===');
  await page.locator('button:has-text("Atardecer")').first().click();
  await page.waitForTimeout(2000);

  console.log('\n🔍 === PASO 6: Verificar resultado ===');

  console.log('\n✅ Test completado - revisa los logs del browser arriba');
});
