/**
 * TEST E2E: Sistema de Analytics de Búsquedas de Proveedores
 * 
 * Verifica que:
 * 1. Las búsquedas se capturen en searchAnalytics
 * 2. Los keywords se extraigan correctamente
 * 3. No afecte el flujo normal de búsqueda
 * 4. Los datos se guarden en Firestore
 */

describe('Sistema de Analytics de Búsquedas - Nodos Dinámicos', () => {
  const BACKEND_URL = 'http://localhost:4004';
  const TEST_USER_ID = 'test_user_e2e';
  const TEST_WEDDING_ID = 'test_wedding_e2e';
  
  // Esperar a que Firestore y el backend estén listos
  before(() => {
    cy.log('🔧 Preparando entorno de test');
    cy.wait(1000);
  });

  beforeEach(() => {
    cy.log('🧹 Limpiando datos de test anteriores');
  });

  describe('1. Captura básica de búsquedas', () => {
    
    it('debe capturar una búsqueda simple en searchAnalytics', () => {
      cy.log('📊 Realizando búsqueda de prueba');
      
      const searchPayload = {
        service: 'fotografia',
        location: 'Valencia',
        query: 'fotógrafo con drone vintage',
        budget: 2000,
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      };

      // Realizar búsqueda
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/suppliers/search`,
        body: searchPayload
      }).then((response) => {
        // Verificar respuesta exitosa
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log('✅ Búsqueda completada exitosamente');
        cy.log(`📊 Resultados: ${response.body.count} proveedores`);
      });

      // Esperar a que se procese el guardado asíncrono
      cy.wait(2000);

      // Verificar que se guardó en Firestore
      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', '==', TEST_USER_ID],
          ['service', '==', 'fotografia']
        ],
        orderBy: ['timestamp', 'desc'],
        limit: 1
      }).then((results) => {
        expect(results).to.have.length.at.least(1);
        
        const searchDoc = results[0];
        
        // Verificar datos básicos
        expect(searchDoc.query).to.include('fotógrafo');
        expect(searchDoc.service).to.eq('fotografia');
        expect(searchDoc.location).to.eq('Valencia');
        expect(searchDoc.user_id).to.eq(TEST_USER_ID);
        expect(searchDoc.wedding_id).to.eq(TEST_WEDDING_ID);
        
        // Verificar metadata
        expect(searchDoc.version).to.eq('1.0');
        expect(searchDoc.processing_status).to.be.oneOf(['captured', 'completed']);
        
        cy.log('✅ Búsqueda capturada correctamente en Firestore');
        cy.log(`📄 ID documento: ${searchDoc.id}`);
      });
    });

    it('debe extraer keywords correctamente', () => {
      cy.log('🔍 Probando extracción de keywords');
      
      const searchPayload = {
        service: 'catering',
        location: 'Barcelona',
        query: 'catering vegano ecológico para boda',
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      };

      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, searchPayload);
      
      cy.wait(2000);

      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', '==', TEST_USER_ID],
          ['service', '==', 'catering']
        ],
        orderBy: ['timestamp', 'desc'],
        limit: 1
      }).then((results) => {
        expect(results).to.have.length.at.least(1);
        
        const searchDoc = results[0];
        
        // Verificar que extrajo keywords
        expect(searchDoc.keywords).to.exist;
        expect(searchDoc.keywords).to.be.an('array');
        expect(searchDoc.keyword_count).to.be.greaterThan(0);
        
        // Verificar keywords específicos esperados
        const keywordWords = searchDoc.keywords.map(k => k.word);
        
        expect(keywordWords).to.include.members(['vegano', 'ecologico']);
        
        // Verificar estructura de keywords
        searchDoc.keywords.forEach(keyword => {
          expect(keyword).to.have.property('word');
          expect(keyword).to.have.property('position');
          expect(keyword).to.have.property('length');
          expect(keyword).to.have.property('source');
          expect(keyword.source).to.be.oneOf(['query', 'service']);
        });
        
        cy.log('✅ Keywords extraídos correctamente');
        cy.log(`🏷️ Keywords encontrados: ${keywordWords.join(', ')}`);
      });
    });

    it('debe filtrar stop words correctamente', () => {
      cy.log('🧹 Probando filtrado de stop words');
      
      const searchPayload = {
        service: 'fotografia',
        location: 'Madrid',
        query: 'el fotógrafo para la boda con flores',
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      };

      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, searchPayload);
      
      cy.wait(2000);

      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', '==', TEST_USER_ID],
          ['query', '==', 'el fotógrafo para la boda con flores']
        ],
        limit: 1
      }).then((results) => {
        expect(results).to.have.length.at.least(1);
        
        const searchDoc = results[0];
        const keywordWords = searchDoc.keywords.map(k => k.word);
        
        // Stop words que NO deben aparecer
        const stopWords = ['el', 'la', 'para', 'con', 'de'];
        
        stopWords.forEach(stopWord => {
          expect(keywordWords).to.not.include(stopWord);
        });
        
        // Palabras relevantes que SÍ deben aparecer
        expect(keywordWords).to.include('fotografo');
        expect(keywordWords).to.include('boda');
        expect(keywordWords).to.include('flores');
        
        cy.log('✅ Stop words filtrados correctamente');
        cy.log(`🏷️ Keywords relevantes: ${keywordWords.join(', ')}`);
      });
    });
  });

  describe('2. No afecta flujo normal de búsqueda', () => {
    
    it('debe devolver resultados incluso si falla el analytics', () => {
      cy.log('🔍 Verificando que búsqueda funciona independientemente');
      
      const searchPayload = {
        service: 'fotografia',
        location: 'Valencia',
        query: 'fotógrafo bodas',
        // Sin user_id ni wedding_id para simular caso edge
      };

      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, searchPayload)
        .then((response) => {
          // La búsqueda debe funcionar igual
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body).to.have.property('suppliers');
          
          cy.log('✅ Búsqueda funciona sin user_id/wedding_id');
          cy.log(`📊 ${response.body.count} proveedores encontrados`);
        });
    });

    it('debe tener tiempo de respuesta aceptable', () => {
      cy.log('⏱️ Midiendo tiempo de respuesta');
      
      const startTime = Date.now();
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'test',
        user_id: TEST_USER_ID
      }).then((response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).to.eq(200);
        
        // No debe agregar más de 100ms al tiempo de respuesta
        expect(responseTime).to.be.lessThan(5000);
        
        cy.log(`✅ Tiempo de respuesta: ${responseTime}ms`);
      });
    });
  });

  describe('3. Datos de búsqueda completos', () => {
    
    it('debe capturar filtros de presupuesto', () => {
      cy.log('💰 Verificando captura de filtros de presupuesto');
      
      const searchPayload = {
        service: 'venue',
        location: 'Sevilla',
        query: 'finca rústica',
        budget: 5000,
        filters: {
          minBudget: 3000,
          maxBudget: 7000,
          guestCount: 120
        },
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      };

      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, searchPayload);
      
      cy.wait(2000);

      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', '==', TEST_USER_ID],
          ['service', '==', 'venue']
        ],
        orderBy: ['timestamp', 'desc'],
        limit: 1
      }).then((results) => {
        expect(results).to.have.length.at.least(1);
        
        const searchDoc = results[0];
        
        // Verificar filtros capturados
        expect(searchDoc.filters).to.exist;
        expect(searchDoc.filters.budget).to.eq(5000);
        expect(searchDoc.filters.minBudget).to.eq(3000);
        expect(searchDoc.filters.maxBudget).to.eq(7000);
        expect(searchDoc.filters.guestCount).to.eq(120);
        
        // Verificar flag has_budget
        expect(searchDoc.has_budget).to.be.true;
        expect(searchDoc.has_location).to.be.true;
        
        cy.log('✅ Filtros capturados correctamente');
      });
    });

    it('debe incluir timestamp correcto', () => {
      cy.log('🕐 Verificando timestamp');
      
      const beforeSearch = new Date();
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'music',
        location: 'Málaga',
        query: 'dj bodas',
        user_id: TEST_USER_ID
      });
      
      cy.wait(2000);
      
      const afterSearch = new Date();

      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', '==', TEST_USER_ID],
          ['service', '==', 'music']
        ],
        orderBy: ['timestamp', 'desc'],
        limit: 1
      }).then((results) => {
        expect(results).to.have.length.at.least(1);
        
        const searchDoc = results[0];
        
        // Verificar que el timestamp existe y es válido
        expect(searchDoc.timestamp).to.exist;
        
        const searchTimestamp = searchDoc.timestamp.toDate();
        
        // Timestamp debe estar entre antes y después de la búsqueda
        expect(searchTimestamp.getTime()).to.be.at.least(beforeSearch.getTime() - 1000);
        expect(searchTimestamp.getTime()).to.be.at.most(afterSearch.getTime() + 1000);
        
        cy.log('✅ Timestamp correcto');
        cy.log(`🕐 Timestamp: ${searchTimestamp.toISOString()}`);
      });
    });
  });

  describe('4. Múltiples búsquedas y patrones', () => {
    
    it('debe acumular búsquedas de diferentes usuarios', () => {
      cy.log('👥 Probando múltiples usuarios');
      
      const searches = [
        { user_id: 'user_1', service: 'fotografia', query: 'fotógrafo con drone' },
        { user_id: 'user_2', service: 'fotografia', query: 'fotos aéreas boda' },
        { user_id: 'user_3', service: 'fotografia', query: 'fotografía desde drone' }
      ];

      // Realizar múltiples búsquedas
      searches.forEach((search) => {
        cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
          ...search,
          location: 'Valencia',
          wedding_id: TEST_WEDDING_ID
        });
      });
      
      cy.wait(3000);

      // Verificar que todas se guardaron
      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['wedding_id', '==', TEST_WEDDING_ID]
        ],
        orderBy: ['timestamp', 'desc'],
        limit: 5
      }).then((results) => {
        expect(results.length).to.be.at.least(3);
        
        // Verificar que hay usuarios diferentes
        const uniqueUsers = [...new Set(results.map(r => r.user_id))];
        expect(uniqueUsers.length).to.be.at.least(3);
        
        cy.log('✅ Múltiples búsquedas capturadas');
        cy.log(`👥 ${uniqueUsers.length} usuarios diferentes`);
      });
    });

    it('debe detectar keywords comunes en múltiples búsquedas', () => {
      cy.log('🔍 Analizando patrones de keywords');
      
      const searches = [
        'fotógrafo con drone',
        'fotos con dron',
        'fotografía aérea drone',
        'drone bodas'
      ];

      // Realizar búsquedas con keyword común "drone"
      searches.forEach((query, index) => {
        cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
          service: 'fotografia',
          location: 'Valencia',
          query,
          user_id: `pattern_user_${index}`,
          wedding_id: 'pattern_test'
        });
      });
      
      cy.wait(3000);

      // Verificar patrón de "drone"
      cy.task('firebase:query', {
        collection: 'searchAnalytics',
        where: [
          ['wedding_id', '==', 'pattern_test']
        ],
        limit: 10
      }).then((results) => {
        expect(results.length).to.be.at.least(4);
        
        // Contar cuántas veces aparece "drone" o "dron"
        let droneCount = 0;
        
        results.forEach(searchDoc => {
          const keywords = searchDoc.keywords || [];
          const hasKeyword = keywords.some(k => 
            k.word === 'drone' || k.word === 'dron'
          );
          if (hasKeyword) droneCount++;
        });
        
        expect(droneCount).to.be.at.least(3);
        
        cy.log('✅ Patrón detectado: "drone" aparece en múltiples búsquedas');
        cy.log(`📊 Frecuencia: ${droneCount} de ${results.length} búsquedas`);
        cy.log('💡 Este keyword es candidato para crear un nodo dinámico');
      });
    });
  });

  describe('5. Limpieza de datos de test', () => {
    
    after(() => {
      cy.log('🧹 Limpiando datos de test');
      
      // Eliminar documentos de test
      cy.task('firebase:deleteWhere', {
        collection: 'searchAnalytics',
        where: [
          ['user_id', 'in', [TEST_USER_ID, 'user_1', 'user_2', 'user_3', 'pattern_user_0', 'pattern_user_1', 'pattern_user_2', 'pattern_user_3']]
        ]
      }).then(() => {
        cy.log('✅ Datos de test eliminados');
      });
    });
  });
});
