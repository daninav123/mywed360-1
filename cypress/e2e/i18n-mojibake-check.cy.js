/**
 * Test E2E: Verificación de Mojibake e i18n
 * 
 * Comprueba que NO hay caracteres corruptos ni palabras sin acentos
 * en todas las páginas, modales y componentes del proyecto.
 * 
 * @author Sesión de Correcciones i18n
 * @date 2025-10-25
 */

describe('✅ Verificación i18n: Sin Mojibake ni Palabras Corruptas', () => {
  
  // Configuración
  const testUser = {
    email: 'test@maloveapp.com',
    password: 'TestPassword123!'
  };

  // Patrones de mojibake a detectar
  const mojibakePatterns = [
    /�/g,                    // Carácter de reemplazo Unicode
    /\uFFFD/g,               // Carácter de reemplazo
    /&#\d+;/g,               // Entidades HTML sin decodificar
    /&[a-z]+;(?![a-z])/gi,   // Entidades como &aacute; sin procesar
  ];

  // Palabras corruptas comunes (SIN acento cuando DEBERÍAN tenerlo)
  const palabrasCorruptas = [
    'xito',           // Debe ser "Éxito"
    'Aadir',          // Debe ser "Añadir"
    'electrnico',     // Debe ser "electrónico"
    'Diseos',         // Debe ser "Diseños"
    'Configuracin',   // Debe ser "Configuración"
    'sesin',          // Debe ser "sesión"
    'Men de',         // Debe ser "Menú de"
    'Ms opciones',    // Debe ser "Más opciones"
    'Transaccin',     // Debe ser "Transacción"
    'categora',       // Debe ser "categoría"
    'das',            // Debe ser "días"
    'ltimos',         // Debe ser "Últimos"
    'Anlisis',        // Debe ser "Análisis"
    'Gestin',         // Debe ser "Gestión"
    'sincronizacin',  // Debe ser "sincronización"
    'conexin',        // Debe ser "conexión"
    'descripcin',     // Debe ser "descripción"
    'informacin',     // Debe ser "información"
    'notificacin',    // Debe ser "notificación"
    'nmero',          // Debe ser "número"
    'telfono',        // Debe ser "teléfono"
    'bsqueda',        // Debe ser "búsqueda"
    'difcil',         // Debe ser "difícil"
    'fcil',           // Debe ser "fácil"
    'til',            // Debe ser "útil"
    'rpido',          // Debe ser "rápido"
    'prximo',         // Debe ser "próximo"
  ];

  // Palabras que DEBEN aparecer correctamente
  const palabrasCorrectas = [
    'Éxito',
    'Añadir',
    'Sí',
    'electrónico',
    'Diseños',
    'Configuración',
    'sesión',
    'Menú',
    'Más',
    'días',
    'Últimos',
    'Análisis',
    'Gestión',
    'sincronización',
    'conexión',
  ];

  /**
   * Verifica que el contenido de la página no tenga mojibake
   */
  function checkNoMojibake() {
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      
      // Verificar caracteres mojibake
      mojibakePatterns.forEach((pattern) => {
        const matches = bodyText.match(pattern);
        if (matches) {
          throw new Error(`❌ Mojibake detectado: ${matches.slice(0, 5).join(', ')}`);
        }
      });

      // Verificar palabras corruptas
      palabrasCorruptas.forEach((palabra) => {
        if (bodyText.includes(palabra)) {
          throw new Error(`❌ Palabra corrupta detectada: "${palabra}" (falta acento o letra)`);
        }
      });

      cy.log('✅ Sin mojibake detectado');
    });
  }

  /**
   * Verifica que aparezcan palabras correctas con acentos
   */
  function checkCorrectWords(expectedWords = palabrasCorrectas) {
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const foundWords = expectedWords.filter(word => bodyText.includes(word));
      
      if (foundWords.length > 0) {
        cy.log(`✅ Palabras correctas encontradas: ${foundWords.slice(0, 5).join(', ')}`);
      }
    });
  }

  before(() => {
    // Login previo
    cy.visit('/');
    cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.contains('button', /iniciar|entrar/i).click();
    cy.url().should('include', '/dashboard', { timeout: 15000 });
  });

  describe('📄 Páginas Principales', () => {
    
    it('Dashboard: Sin mojibake', () => {
      cy.visit('/dashboard');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Más', 'Última', 'Análisis']);
    });

    it('Invitados: Sin mojibake', () => {
      cy.visit('/invitados');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Añadir', 'búsqueda', 'Configuración']);
    });

    it('Finanzas: Sin mojibake', () => {
      cy.visit('/finanzas');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Transacción', 'categoría', 'Análisis', 'días']);
    });

    it('Proveedores: Sin mojibake', () => {
      cy.visit('/proveedores');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['búsqueda', 'Añadir']);
    });

    it('Email: Sin mojibake', () => {
      cy.visit('/email');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['electrónico', 'sincronización']);
    });

    it('Seating Plan: Sin mojibake', () => {
      cy.visit('/seating');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Configuración', 'Diseños']);
    });

    it('Protocol: Sin mojibake', () => {
      cy.visit('/protocolo');
      cy.wait(1000);
      checkNoMojibake();
    });

    it('Tareas: Sin mojibake', () => {
      cy.visit('/tareas');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Añadir']);
    });

    it('Web de Boda: Sin mojibake', () => {
      cy.visit('/web');
      cy.wait(1000);
      checkNoMojibake();
      checkCorrectWords(['Diseños', 'Configuración']);
    });

    it('Momentos: Sin mojibake', () => {
      cy.visit('/momentos');
      cy.wait(1000);
      checkNoMojibake();
    });
  });

  describe('🔧 Modales y Componentes', () => {
    
    it('Modal Configuración: Sin mojibake', () => {
      cy.visit('/dashboard');
      cy.wait(500);
      
      // Abrir menú de usuario
      cy.get('[data-testid="user-menu"], [aria-label*="usuario"], button:contains("Menú")').first().click({ force: true });
      cy.wait(300);
      
      checkNoMojibake();
      checkCorrectWords(['Configuración', 'sesión']);
    });

    it('Modal Añadir Invitado: Sin mojibake', () => {
      cy.visit('/invitados');
      cy.wait(500);
      
      // Buscar botón "Añadir invitado"
      cy.get('button').contains(/añadir|nuevo invitado/i).first().click({ force: true });
      cy.wait(300);
      
      checkNoMojibake();
      checkCorrectWords(['Añadir', 'teléfono', 'dirección']);
    });

    it('Modal Nueva Transacción: Sin mojibake', () => {
      cy.visit('/finanzas');
      cy.wait(500);
      
      // Buscar botón "Nueva Transacción"
      cy.get('button').contains(/nueva|añadir/i).first().click({ force: true });
      cy.wait(300);
      
      checkNoMojibake();
      checkCorrectWords(['Transacción', 'categoría', 'descripción']);
    });

    it('Tabs de Finanzas: Sin mojibake', () => {
      cy.visit('/finanzas');
      cy.wait(500);
      
      // Verificar tabs
      const tabs = ['Resumen', 'Transacciones', 'Presupuesto', 'Análisis'];
      tabs.forEach(tab => {
        cy.get('button, [role="tab"]').contains(tab, { matchCase: false }).should('exist');
      });
      
      checkNoMojibake();
    });

    it('Navegación Principal: Sin mojibake', () => {
      cy.visit('/dashboard');
      cy.wait(500);
      
      // Verificar elementos de navegación
      const navItems = ['Invitados', 'Finanzas', 'Diseños', 'Más'];
      navItems.forEach(item => {
        cy.get('nav, [role="navigation"]').contains(item, { matchCase: false });
      });
      
      checkNoMojibake();
    });
  });

  describe('📝 Formularios y Inputs', () => {
    
    it('Formulario Invitados: Placeholders sin mojibake', () => {
      cy.visit('/invitados');
      cy.wait(500);
      
      cy.get('button').contains(/añadir|nuevo/i).first().click({ force: true });
      cy.wait(300);
      
      // Verificar placeholders
      cy.get('input[placeholder], textarea[placeholder]').each(($el) => {
        const placeholder = $el.attr('placeholder');
        
        // Verificar que no tenga mojibake
        mojibakePatterns.forEach((pattern) => {
          expect(placeholder).not.to.match(pattern);
        });
        
        // Verificar palabras corruptas
        palabrasCorruptas.forEach((palabra) => {
          expect(placeholder).not.to.include(palabra);
        });
      });
    });

    it('Formulario Finanzas: Labels sin mojibake', () => {
      cy.visit('/finanzas');
      cy.wait(500);
      
      cy.get('button').contains(/nueva|añadir/i).first().click({ force: true });
      cy.wait(300);
      
      // Verificar labels
      cy.get('label').each(($label) => {
        const labelText = $label.text();
        
        // Verificar que no tenga mojibake
        mojibakePatterns.forEach((pattern) => {
          expect(labelText).not.to.match(pattern);
        });
        
        // Verificar palabras corruptas comunes
        ['descripcin', 'categora', 'transaccin'].forEach((palabra) => {
          expect(labelText.toLowerCase()).not.to.include(palabra);
        });
      });
    });
  });

  describe('🔔 Notificaciones y Mensajes', () => {
    
    it('Mensajes de Éxito: Sin mojibake', () => {
      cy.visit('/dashboard');
      cy.wait(500);
      
      // Buscar mensajes de éxito (toast, alert, etc.)
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        
        // Si aparece "xito" está mal, debe ser "Éxito"
        expect(bodyText).not.to.include('xito');
        
        // Si aparece la palabra éxito, debe estar bien escrita
        if (bodyText.toLowerCase().includes('éxito') || bodyText.toLowerCase().includes('exitoso')) {
          cy.log('✅ Mensajes de éxito encontrados correctamente');
        }
      });
    });

    it('Mensajes de Error: Sin mojibake', () => {
      cy.get('body').then(($body) => {
        const bodyText = $body.text();
        
        // Palabras comunes en errores
        const errorWords = ['conexin', 'informacin', 'vlido', 'invlido'];
        errorWords.forEach((word) => {
          expect(bodyText).not.to.include(word);
        });
      });
    });
  });

  describe('🌐 Verificación Global', () => {
    
    it('Scan completo de todas las páginas visitadas', () => {
      const pages = [
        '/dashboard',
        '/invitados',
        '/finanzas',
        '/proveedores',
        '/email',
        '/seating',
        '/protocolo',
        '/tareas',
        '/web',
        '/momentos',
      ];

      const results = {
        pagesChecked: 0,
        mojibakeFound: [],
        corruptWordsFound: [],
        correctWordsFound: [],
      };

      pages.forEach((page) => {
        cy.visit(page);
        cy.wait(1000);
        
        cy.get('body').then(($body) => {
          const bodyText = $body.text();
          results.pagesChecked++;
          
          // Check mojibake
          mojibakePatterns.forEach((pattern) => {
            const matches = bodyText.match(pattern);
            if (matches) {
              results.mojibakeFound.push({ page, matches: matches.slice(0, 3) });
            }
          });
          
          // Check corrupt words
          palabrasCorruptas.forEach((word) => {
            if (bodyText.includes(word)) {
              results.corruptWordsFound.push({ page, word });
            }
          });
          
          // Check correct words
          palabrasCorrectas.forEach((word) => {
            if (bodyText.includes(word)) {
              results.correctWordsFound.push(word);
            }
          });
        });
      });

      // Resultado final
      cy.wrap(results).then((res) => {
        cy.log(`📊 Resumen: ${res.pagesChecked} páginas verificadas`);
        cy.log(`✅ Palabras correctas únicas: ${[...new Set(res.correctWordsFound)].length}`);
        
        if (res.mojibakeFound.length > 0) {
          throw new Error(`❌ Mojibake encontrado en: ${JSON.stringify(res.mojibakeFound, null, 2)}`);
        }
        
        if (res.corruptWordsFound.length > 0) {
          throw new Error(`❌ Palabras corruptas encontradas: ${JSON.stringify(res.corruptWordsFound, null, 2)}`);
        }
        
        cy.log('🎉 ¡TODO CORRECTO! Sin mojibake ni palabras corruptas');
      });
    });
  });

  describe('📱 Verificación Responsive', () => {
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach((viewport) => {
      it(`${viewport.name}: Sin mojibake en navegación`, () => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/dashboard');
        cy.wait(1000);
        
        checkNoMojibake();
        
        cy.log(`✅ ${viewport.name} verificado`);
      });
    });
  });
});
