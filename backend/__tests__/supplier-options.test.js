const request = require('supertest');
const { db } = require('../config/firebase');

describe('Supplier Options API', () => {
  let authToken;
  let testUserId = 'test-user-123';

  beforeAll(async () => {
    // Mock auth token
    authToken = 'test-token';
  });

  afterEach(async () => {
    // Limpiar datos de test
    const suggestions = await db.collection('supplier_option_suggestions')
      .where('suggestedBy.userId', '==', testUserId)
      .get();
    
    const batch = db.batch();
    suggestions.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  describe('POST /api/supplier-options/suggest', () => {
    it('debería crear una nueva sugerencia', async () => {
      const suggestion = {
        category: 'fotografia',
        categoryName: 'Fotografía',
        optionLabel: 'Vídeo en cámara lenta',
        description: 'Para capturar momentos especiales'
      };

      const response = await request(app)
        .post('/api/supplier-options/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send(suggestion);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestionId).toBeDefined();
    });

    it('debería rechazar sugerencia sin categoría', async () => {
      const suggestion = {
        optionLabel: 'Test opción'
      };

      const response = await request(app)
        .post('/api/supplier-options/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send(suggestion);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('debería respetar el límite de 3 sugerencias por día', async () => {
      const suggestion = {
        category: 'fotografia',
        categoryName: 'Fotografía',
        optionLabel: 'Test'
      };

      // Crear 3 sugerencias
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/supplier-options/suggest')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...suggestion, optionLabel: `Test ${i}` });
      }

      // La 4ta debería fallar
      const response = await request(app)
        .post('/api/supplier-options/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...suggestion, optionLabel: 'Test 4' });

      expect(response.status).toBe(429);
    });
  });

  describe('GET /api/supplier-options/dynamic/:category', () => {
    it('debería retornar opciones dinámicas para una categoría', async () => {
      const response = await request(app)
        .get('/api/supplier-options/dynamic/fotografia');

      expect(response.status).toBe(200);
      expect(response.body.dynamicOptions).toBeDefined();
    });

    it('debería retornar objeto vacío si no hay opciones', async () => {
      const response = await request(app)
        .get('/api/supplier-options/dynamic/categoria-inexistente');

      expect(response.status).toBe(200);
      expect(response.body.dynamicOptions).toEqual({});
    });
  });
});

describe('AI Validation Service', () => {
  const { validateSupplierOption } = require('../services/aiOptionValidation');

  it('debería validar una sugerencia correctamente', async () => {
    const suggestion = {
      category: 'fotografia',
      categoryName: 'Fotografía',
      optionLabel: 'Vídeo en cámara lenta',
      description: 'Para momentos especiales en slow motion'
    };

    const existingOptions = {
      drone: 'Dron para fotos aéreas',
      album: 'Álbum físico'
    };

    const result = await validateSupplierOption(suggestion, existingOptions);

    expect(result.success).toBe(true);
    expect(result.validation.score).toBeGreaterThanOrEqual(0);
    expect(result.validation.score).toBeLessThanOrEqual(100);
    expect(result.validation.suggestedKey).toBeDefined();
    expect(result.validation.suggestedLabel).toBeDefined();
  });

  it('debería detectar duplicados', async () => {
    const suggestion = {
      category: 'fotografia',
      categoryName: 'Fotografía',
      optionLabel: 'Dron',
      description: 'Fotos aéreas con dron'
    };

    const existingOptions = {
      drone: 'Dron para fotos aéreas'
    };

    const result = await validateSupplierOption(suggestion, existingOptions);

    expect(result.success).toBe(true);
    expect(result.validation.duplicate).toBe(true);
    expect(result.validation.duplicateOf).toBeDefined();
  });
});

describe('Process Suggestions Job', () => {
  const { processOptionSuggestions } = require('../jobs/processOptionSuggestions');

  it('debería procesar sugerencias pendientes', async () => {
    // Crear sugerencia de test
    await db.collection('supplier_option_suggestions').add({
      category: 'fotografia',
      optionLabel: 'Test option',
      description: 'Test',
      status: 'pending',
      suggestedBy: {
        userId: 'test-user',
        userName: 'Test',
        email: 'test@example.com'
      },
      metadata: {
        createdAt: new Date()
      }
    });

    const result = await processOptionSuggestions();

    expect(result.processed).toBeGreaterThanOrEqual(1);
    expect(typeof result.approved).toBe('number');
    expect(typeof result.rejected).toBe('number');
  });
});
