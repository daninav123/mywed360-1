import { test, expect } from '@playwright/test';

test('MANUAL: Verificar cambio de tema inyectando código', async ({ page }) => {
  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(text);
    if (
      text.includes('MANUAL TEST') ||
      text.includes('Decoraciones') ||
      text.includes('HANDLE TEMA')
    ) {
      console.log('📋', text);
    }
  });

  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'danielnavarrocampos@icloud.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navegar DIRECTAMENTE al editor con URL completa
  console.log('🚀 Navegando al editor...');
  await page.goto(
    'http://localhost:5173/wedding/web-builder-craft?webId=web-9EstYa0T-1764819440584-5ea06i',
    {
      waitUntil: 'networkidle',
      timeout: 30000,
    }
  );

  console.log('⏳ Esperando 10 segundos para carga completa...');
  await page.waitForTimeout(10000);

  // Screenshot del estado actual
  await page.screenshot({ path: 'test-results/manual-01-editor-cargado.png', fullPage: true });
  console.log('📸 Screenshot tomado');

  // Verificar que el editor se cargó
  const editorPresent = await page.evaluate(() => {
    return !!document.querySelector('[data-cy="canvas-root"]');
  });
  console.log('✅ Editor presente:', editorPresent);

  if (!editorPresent) {
    console.log('❌ El editor NO se cargó. Abortando test.');
    return;
  }

  // Inyectar código para cambiar el tema manualmente
  console.log('💉 Inyectando cambio de tema...');

  const result = await page.evaluate(() => {
    console.log('🧪 MANUAL TEST: Buscando función onTemaChange...');

    // Buscar GlobalStylesPanel en el DOM
    const settingsPanel =
      document.querySelector('[class*="settings"]') ||
      document.querySelector('[class*="panel"]') ||
      document.body;

    console.log('📦 Settings panel encontrado:', !!settingsPanel);

    // Intentar encontrar React Fiber
    const reactKey = Object.keys(settingsPanel).find(
      (key) => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );

    console.log('⚛️ React key:', reactKey);

    if (reactKey) {
      let fiber = settingsPanel[reactKey];
      console.log('🔍 Buscando componentes React...');

      // Buscar el componente con onTemaChange
      let depth = 0;
      while (fiber && depth < 50) {
        if (fiber.memoizedProps?.onTemaChange) {
          console.log('✅ ENCONTRADO onTemaChange en fiber!');

          const currentTema = fiber.memoizedProps.tema;
          console.log('📝 Tema actual:', currentTema);

          // Crear nuevo tema con decoraciones modificadas
          const nuevoTema = {
            ...currentTema,
            decoraciones: {
              ...currentTema.decoraciones,
              petalos: true,
              flores: true,
            },
          };

          console.log('🎨 MANUAL TEST: Llamando onTemaChange con:', nuevoTema);
          fiber.memoizedProps.onTemaChange(nuevoTema);

          return {
            success: true,
            temaAntes: currentTema?.decoraciones,
            temaDespues: nuevoTema.decoraciones,
          };
        }

        fiber = fiber.return;
        depth++;
      }

      return { success: false, error: 'No se encontró onTemaChange' };
    }

    return { success: false, error: 'No se encontró React Fiber' };
  });

  console.log('📊 Resultado de inyección:', result);

  // Esperar a que se procese el cambio
  await page.waitForTimeout(3000);

  // Screenshot después del cambio
  await page.screenshot({ path: 'test-results/manual-02-tema-cambiado.png', fullPage: true });

  // Verificar logs
  const logsRelevantes = logs.filter(
    (log) =>
      log.includes('MANUAL TEST') ||
      log.includes('Decoraciones') ||
      log.includes('HANDLE TEMA') ||
      log.includes('ThemeProvider')
  );

  console.log('\n📊 LOGS CAPTURADOS:');
  logsRelevantes.forEach((log) => console.log('  -', log));

  // Resultado final
  if (result.success) {
    console.log('\n✅ TEST EXITOSO: Se pudo llamar onTemaChange');
    console.log('   Tema antes:', result.temaAntes);
    console.log('   Tema después:', result.temaDespues);

    const handleTemaLogs = logsRelevantes.filter((log) => log.includes('HANDLE TEMA'));
    if (handleTemaLogs.length > 0) {
      console.log('\n✅ handleTemaChange SÍ fue llamado');
    } else {
      console.log('\n❌ handleTemaChange NO fue llamado (problema en WebBuilderPageCraft)');
    }
  } else {
    console.log('\n❌ NO se pudo inyectar cambio:', result.error);
  }
});
