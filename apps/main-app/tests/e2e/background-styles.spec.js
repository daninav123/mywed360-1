import { test, expect } from '@playwright/test';

/**
 * Test E2E para verificar que los fondos funcionan correctamente
 */

test.describe('Sistema de Fondos de Página', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al builder (ajusta la URL según tu setup)
    await page.goto('http://localhost:5173/web-builder-craft');

    // Esperar a que cargue
    await page.waitForTimeout(2000);
  });

  test('Debe mostrar el panel de Estilos Globales', async ({ page }) => {
    // Click en botón de Personalizar
    const estilosBtn = page.locator('text=✨ Personalizar');

    // Verificar que existe
    await expect(estilosBtn).toBeVisible();

    console.log('✅ Botón de Personalizar encontrado');

    // Click
    await estilosBtn.click();
    await page.waitForTimeout(500);

    // Verificar que el panel se abre
    const fondoTitle = page.locator('text=🖼️ Fondo de Página');
    await expect(fondoTitle).toBeVisible();

    console.log('✅ Panel de Estilos Globales abierto');
  });

  test('Debe cambiar a tipo Gradiente y aplicarlo', async ({ page }) => {
    // Abrir panel
    await page.locator('text=✨ Personalizar').click();
    await page.waitForTimeout(500);

    // Scroll al panel de fondos
    await page.evaluate(() => {
      const panel = document.querySelector('.overflow-y-auto');
      if (panel) panel.scrollTop = 500;
    });
    await page.waitForTimeout(300);

    // Click en botón de Gradiente
    const gradienteBtn = page.locator('button:has-text("🌈 Gradiente")');

    console.log('🔍 Buscando botón de Gradiente...');
    const count = await gradienteBtn.count();
    console.log(`📊 Encontrados ${count} botones de Gradiente`);

    await gradienteBtn.click();
    await page.waitForTimeout(500);

    console.log('✅ Click en botón Gradiente');

    // Verificar que se muestra la sección de gradientes
    const gradientesSection = page.locator('text=Gradientes Predefinidos');
    await expect(gradientesSection).toBeVisible();

    console.log('✅ Sección de gradientes visible');

    // Click en un gradiente predefinido (Atardecer)
    const atardecerBtn = page.locator('button:has-text("Atardecer")').first();
    await atardecerBtn.click();
    await page.waitForTimeout(500);

    console.log('✅ Click en gradiente Atardecer');

    // Verificar que el tema se actualiza
    await page.waitForTimeout(1000);

    // Obtener el estado del tema desde la consola
    const temaState = await page.evaluate(() => {
      // Intentar obtener el tema del estado de React
      const rootElement = document.querySelector('[data-cy="canvas-root"]');
      if (!rootElement) return { error: 'Canvas root no encontrado' };

      const styles = window.getComputedStyle(rootElement);
      const bgImage = styles.backgroundImage;

      return {
        hasRoot: !!rootElement,
        backgroundImage: bgImage,
        backgroundColor: styles.backgroundColor,
        children: rootElement.children.length,
      };
    });

    console.log('📋 Estado del canvas:', JSON.stringify(temaState, null, 2));

    // Buscar el div de fondo con el gradiente
    const backgroundDiv = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return null;

      // Buscar el div hijo que tiene position: absolute
      const children = Array.from(canvas.children);
      const bgDiv = children.find((child) => {
        const style = window.getComputedStyle(child);
        return style.position === 'absolute' && style.zIndex === '0';
      });

      if (!bgDiv) return { error: 'Div de fondo no encontrado', childrenCount: children.length };

      const styles = window.getComputedStyle(bgDiv);
      return {
        found: true,
        backgroundImage: styles.backgroundImage,
        position: styles.position,
        zIndex: styles.zIndex,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height,
      };
    });

    console.log('🎨 Estado del div de fondo:', JSON.stringify(backgroundDiv, null, 2));

    // Verificación
    if (backgroundDiv?.found && backgroundDiv.backgroundImage !== 'none') {
      console.log('✅ ¡Gradiente aplicado correctamente!');
    } else {
      console.log('❌ El gradiente NO se aplicó correctamente');
      console.log('❌ Detalles:', backgroundDiv);
    }
  });

  test('Debe cambiar a tipo Patrón y aplicarlo', async ({ page }) => {
    // Abrir panel
    await page.locator('text=✨ Personalizar').click();
    await page.waitForTimeout(500);

    // Scroll al panel de fondos
    await page.evaluate(() => {
      const panel = document.querySelector('.overflow-y-auto');
      if (panel) panel.scrollTop = 500;
    });
    await page.waitForTimeout(300);

    // Click en botón de Patrón
    const patronBtn = page.locator('button:has-text("📐 Patrón")');
    await patronBtn.click();
    await page.waitForTimeout(500);

    console.log('✅ Click en botón Patrón');

    // Click en un patrón (Puntos)
    const puntosBtn = page.locator('button:has-text("Puntos")').first();
    await puntosBtn.click();
    await page.waitForTimeout(500);

    console.log('✅ Click en patrón Puntos');

    // Verificar que se aplica
    await page.waitForTimeout(1000);

    const backgroundDiv = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return { error: 'Canvas no encontrado' };

      const children = Array.from(canvas.children);
      const bgDiv = children.find((child) => {
        const style = window.getComputedStyle(child);
        return style.position === 'absolute';
      });

      if (!bgDiv) return { error: 'Div de fondo no encontrado' };

      const styles = window.getComputedStyle(bgDiv);
      return {
        found: true,
        backgroundImage: styles.backgroundImage,
        backgroundRepeat: styles.backgroundRepeat,
      };
    });

    console.log('📐 Estado del patrón:', JSON.stringify(backgroundDiv, null, 2));

    if (backgroundDiv?.found && backgroundDiv.backgroundImage.includes('data:image/svg')) {
      console.log('✅ ¡Patrón aplicado correctamente!');
    } else {
      console.log('❌ El patrón NO se aplicó correctamente');
    }
  });

  test('Debug: Ver estructura completa del DOM', async ({ page }) => {
    await page.waitForTimeout(2000);

    const domStructure = await page.evaluate(() => {
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      if (!canvas) return { error: 'Canvas no encontrado' };

      const getElementInfo = (el) => {
        const styles = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          class: el.className,
          children: el.children.length,
          styles: {
            position: styles.position,
            zIndex: styles.zIndex,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage !== 'none' ? 'tiene imagen' : 'none',
            width: styles.width,
            height: styles.height,
          },
        };
      };

      return {
        canvas: getElementInfo(canvas),
        children: Array.from(canvas.children).map(getElementInfo),
      };
    });

    console.log('🏗️ ESTRUCTURA DEL DOM:');
    console.log(JSON.stringify(domStructure, null, 2));
  });

  test('Debug: Ver estado del tema en React', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Inyectar un listener para capturar el estado
    const temaInfo = await page.evaluate(() => {
      // Buscar el componente raíz de React
      const rootDiv = document.querySelector('#root');
      if (!rootDiv) return { error: 'Root no encontrado' };

      // Intentar obtener las CSS variables
      const canvas = document.querySelector('[data-cy="canvas-root"]');
      const parent = canvas?.parentElement?.parentElement;

      if (!parent) return { error: 'Parent no encontrado' };

      const styles = window.getComputedStyle(parent);

      return {
        cssVariables: {
          colorPrimario: styles.getPropertyValue('--color-primario'),
          colorFondo: styles.getPropertyValue('--color-fondo'),
          fuenteTitulo: styles.getPropertyValue('--fuente-titulo'),
        },
      };
    });

    console.log('⚛️ ESTADO DEL TEMA (CSS Variables):');
    console.log(JSON.stringify(temaInfo, null, 2));
  });
});
