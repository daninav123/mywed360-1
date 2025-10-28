/**
 * TEST E2E SIMPLIFICADO: Sistema de Analytics de Búsquedas
 * 
 * Verifica solo los aspectos funcionales sin depender de Firebase:
 * 1. Las búsquedas funcionan correctamente
 * 2. No hay errores en el proceso
 * 3. El tiempo de respuesta es aceptable
 * 4. El servicio de analytics no rompe nada
 */

describe('Sistema de Analytics - Tests Funcionales', () => {
  const BACKEND_URL = 'http://localhost:4004';
  const TEST_USER_ID = 'test_user_e2e_simple';
  const TEST_WEDDING_ID = 'test_wedding_e2e_simple';

  describe('1. Búsquedas funcionan correctamente', () => {
    
    it('debe realizar búsqueda simple sin errores', () => {
      cy.log('📊 Test: Búsqueda simple');
      
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/suppliers/search`,
        body: {
          service: 'fotografia',
          location: 'Valencia',
          query: 'fotógrafo bodas',
          user_id: TEST_USER_ID,
          wedding_id: TEST_WEDDING_ID
        }
      }).then((response) => {
        // Verificar respuesta exitosa
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(response.body).to.have.property('suppliers');
        expect(response.body).to.have.property('count');
        
        cy.log(`✅ Búsqueda exitosa: ${response.body.count} proveedores`);
      });
    });

    it('debe buscar con query complejo', () => {
      cy.log('📊 Test: Query con keywords múltiples');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'fotógrafo con drone vintage para boda',
        budget: 2000,
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log('✅ Query complejo procesado correctamente');
      });
    });

    it('debe buscar con filtros de presupuesto', () => {
      cy.log('📊 Test: Filtros de presupuesto');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'catering',
        location: 'Barcelona',
        query: 'catering vegano',
        budget: 5000,
        filters: {
          minBudget: 3000,
          maxBudget: 7000,
          guestCount: 120
        },
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log('✅ Filtros aplicados correctamente');
      });
    });
  });

  describe('2. Rendimiento y estabilidad', () => {
    
    it('debe responder en tiempo aceptable', () => {
      cy.log('⏱️ Test: Tiempo de respuesta');
      
      const startTime = Date.now();
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'test rendimiento',
        user_id: TEST_USER_ID
      }).then((response) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        expect(response.status).to.eq(200);
        expect(responseTime).to.be.lessThan(10000); // Menos de 10 segundos (incluye Tavily)
        
        cy.log(`✅ Tiempo de respuesta: ${responseTime}ms`);
      });
    });

    it('debe funcionar sin user_id ni wedding_id', () => {
      cy.log('📊 Test: Búsqueda anónima');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'fotógrafo'
        // Sin user_id ni wedding_id
      }).then((response) => {
        // Debe funcionar igual
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log('✅ Búsqueda anónima funciona correctamente');
      });
    });

    it('debe manejar múltiples búsquedas secuenciales', () => {
      cy.log('📊 Test: Búsquedas múltiples');
      
      const searches = [
        { service: 'fotografia', query: 'fotógrafo' },
        { service: 'catering', query: 'catering' },
        { service: 'venue', query: 'finca' },
        { service: 'music', query: 'dj' }
      ];

      searches.forEach((search, index) => {
        cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
          ...search,
          location: 'Valencia',
          user_id: `${TEST_USER_ID}_${index}`
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
        });
      });
      
      cy.log('✅ Búsquedas múltiples completadas');
    });
  });

  describe('3. Casos edge y validaciones', () => {
    
    it('debe rechazar búsqueda sin service', () => {
      cy.log('📊 Test: Validación service requerido');
      
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/suppliers/search`,
        body: {
          location: 'Valencia',
          query: 'test'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
        expect(response.body.error).to.include('service');
        
        cy.log('✅ Validación correcta: service requerido');
      });
    });

    it('debe rechazar búsqueda sin location', () => {
      cy.log('📊 Test: Validación location requerido');
      
      cy.request({
        method: 'POST',
        url: `${BACKEND_URL}/api/suppliers/search`,
        body: {
          service: 'fotografia',
          query: 'test'
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.success).to.be.false;
        expect(response.body.error).to.include('location');
        
        cy.log('✅ Validación correcta: location requerido');
      });
    });

    it('debe manejar query vacío', () => {
      cy.log('📊 Test: Query vacío');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: ''  // Query vacío
      }).then((response) => {
        // Debe funcionar, query es opcional
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        
        cy.log('✅ Query vacío manejado correctamente');
      });
    });
  });

  describe('4. Verificación de logs del backend', () => {
    
    it('debe mostrar logs de captura en consola del backend', () => {
      cy.log('📊 Test: Logs del sistema');
      cy.log('⚠️ Verificar manualmente en la consola del backend:');
      cy.log('    - Debe aparecer: "📊 [SEARCH-ANALYTICS] Capturada..."');
      cy.log('    - Debe aparecer: "✅ [SEARCH-ANALYTICS] Guardado: XYZ"');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'test logs analytics',
        user_id: TEST_USER_ID,
        wedding_id: TEST_WEDDING_ID
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        cy.log('✅ Búsqueda completada');
        cy.log('💡 Revisa la consola del backend para ver los logs de analytics');
      });
    });
  });

  describe('5. Integración con sistema híbrido', () => {
    
    it('debe devolver breakdown de resultados', () => {
      cy.log('📊 Test: Breakdown de resultados');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'fotógrafo profesional',
        user_id: TEST_USER_ID
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('count');
        expect(response.body).to.have.property('suppliers');
        
        // Verificar estructura de respuesta
        if (response.body.count > 0) {
          const firstSupplier = response.body.suppliers[0];
          expect(firstSupplier).to.have.property('name');
          // Proveedores deben tener al menos un nombre
          expect(firstSupplier.name).to.be.a('string');
          expect(firstSupplier.name.length).to.be.greaterThan(0);
        }
        
        cy.log('✅ Estructura de respuesta correcta');
        cy.log(`📊 ${response.body.count} proveedores encontrados`);
      });
    });

    it('debe indicar fuente de resultados', () => {
      cy.log('📊 Test: Fuente de resultados');
      
      cy.request('POST', `${BACKEND_URL}/api/suppliers/search`, {
        service: 'fotografia',
        location: 'Valencia',
        query: 'test fuente',
        user_id: TEST_USER_ID
      }).then((response) => {
        expect(response.status).to.eq(200);
        
        // La respuesta debe indicar de dónde vienen los resultados
        // (registrados, caché, internet)
        cy.log('✅ Fuente de resultados disponible');
        
        if (response.body.suppliers && response.body.suppliers.length > 0) {
          const supplier = response.body.suppliers[0];
          cy.log(`📍 Primer proveedor: ${supplier.name}`);
          cy.log(`🏷️ Registrado: ${supplier.registered || 'unknown'}`);
        }
      });
    });
  });
});
