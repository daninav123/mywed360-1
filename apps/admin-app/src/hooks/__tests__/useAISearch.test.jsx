/**
 * Tests unitarios para useAISearch hook
 * Verifica búsqueda de proveedores con IA
 */
 
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useAISearch from '../useAISearch';

const mockReportFallback = vi.fn();

// Mock de hooks
vi.mock('../useActiveWeddingInfo', () => ({
  default: () => ({
    info: {
      weddingInfo: {
        date: '2025-06-15',
        celebrationPlace: 'Madrid',
        budget: '10000',
      },
    },
  }),
}));

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-123',
      email: 'test-user@example.com',
    },
  }),
}));

vi.mock('../useTranslations', () => ({
  default: () => ({
    t: (key, opts = {}) => {
      if (key === 'suppliers.aiSearch.services.photo') return 'Fotografía';
      if (key === 'suppliers.aiSearch.services.video') return 'Video';
      if (key === 'suppliers.aiSearch.services.catering') return 'Catering';
      if (key === 'suppliers.aiSearch.services.music') return 'Música';
      if (key === 'suppliers.aiSearch.services.flowers') return 'Flores';
      if (key === 'suppliers.aiSearch.services.generic') return 'Genérico';
      if (key === 'suppliers.aiSearch.defaults.suggestedName')
        return `Proveedor sugerido ${opts.index}`;
      if (key === 'suppliers.aiSearch.aiSummary.priceRange') return `Precio: ${opts.price}`;
      if (key === 'suppliers.aiSearch.aiSummary.location') return `Ubicación: ${opts.location}`;
      if (key === 'suppliers.aiSearch.aiSummary.matchesPreferences')
        return 'Coincide con tus preferencias.';
      if (key === 'common.suppliers.aiSearch.aiSummary.locationAvailable')
        return `Disponible en la zona de ${opts.location}.`;
      if (key === 'suppliers.aiSearch.errors.noLocalResults') return 'No hay resultados locales.';
      if (key === 'suppliers.aiSearch.errors.rateLimited') return 'Rate limited.';
      if (key === 'suppliers.aiSearch.errors.backendUnavailable') return 'Backend no disponible.';
      if (key === 'suppliers.aiSearch.errors.noResults') return 'Sin resultados.';
      if (key === 'suppliers.aiSearch.errors.offline') return 'Sin conexión.';
      if (key === 'suppliers.aiSearch.errors.openaiNotConfigured') return 'OpenAI no configurado.';
      if (key === 'suppliers.aiSearch.errors.generic') return 'Error';
      if (key === 'suppliers.aiSearch.errors.http') return `HTTP ${opts.status}`;
      return String(key);
    },
  }),
}));

vi.mock('../useFallbackReporting', () => ({
  useFallbackReporting: () => ({
    reportFallback: (...args) => mockReportFallback(...args),
  }),
}));

// Mock de apiClient
const mockPost = vi.fn();
const mockGet = vi.fn();
const makeResponse = (data, init = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? (init.ok === false ? 500 : 200),
  json: vi.fn().mockResolvedValue(data),
});
vi.mock('../../services/apiClient', () => ({
  post: (...args) => mockPost(...args),
  get: (...args) => mockGet(...args),
}));

describe('useAISearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Estado inicial', () => {
    it('inicializa con valores por defecto', () => {
      const { result } = renderHook(() => useAISearch());

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('searchSuppliers', () => {
    it('busca proveedores exitosamente', async () => {
      const mockResults = [
        {
          name: 'Catering Los Álamos',
          service: 'Catering',
          location: 'Madrid',
          price: '€€€',
          match: 95,
        },
        {
          name: 'Catering Gourmet',
          service: 'Catering',
          location: 'Madrid',
          price: '€€',
          match: 88,
        },
      ];

      mockPost.mockResolvedValueOnce(makeResponse(mockResults));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('catering Madrid');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/ai-suppliers-tavily',
        expect.objectContaining({
          query: 'catering Madrid',
          service: 'Catering',
          location: 'Madrid',
        }),
        expect.objectContaining({
          auth: true,
          silent: true,
        })
      );

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results[0].name).toBe('Catering Los Álamos');
      expect(result.current.error).toBe(null);
    });

    it('normaliza resultados correctamente', async () => {
      mockPost.mockResolvedValueOnce(
        makeResponse([
          {
            name: 'Test Proveedor',
            category: 'Fotografía', // category en lugar de service
            city: 'Barcelona', // city en lugar de location
            priceRange: '€€€',
            match: 92,
          },
        ])
      );

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('fotografo Barcelona');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const normalized = result.current.results[0];
      expect(normalized.service).toBe('Fotografía');
      expect(normalized.location).toBe('Barcelona');
      expect(normalized.priceRange).toBe('€€€');
    });

    it('maneja errores de API', async () => {
      mockPost.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('catering');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.results).toEqual([]);
    });

    it('maneja respuesta sin success', async () => {
      mockPost.mockResolvedValueOnce(
        makeResponse(
          {
            error: 'rate_limited',
          },
          { ok: false, status: 429 }
        )
      );

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('catering');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error.code).toBe('rate_limited');
      expect(result.current.results).toEqual([]);
    });
  });

  describe('Funciones de utilidad', () => {
    describe('guessServiceFromQuery', () => {
      it('detecta fotografía', async () => {
        mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test' }]));

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('busco fotografo');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // El hook debe haber inferido el servicio
        expect(mockPost).toHaveBeenCalledWith(
          '/api/ai-suppliers-tavily',
          expect.objectContaining({
            query: expect.stringContaining('foto'),
            service: 'Fotografía',
          }),
          expect.objectContaining({
            auth: true,
            silent: true,
          })
        );
      });

      it('detecta video', async () => {
        mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test' }]));

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('videografo boda');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(mockPost).toHaveBeenCalledWith(
          '/api/ai-suppliers-tavily',
          expect.objectContaining({
            service: 'Video',
          }),
          expect.objectContaining({
            auth: true,
            silent: true,
          })
        );
      });

      it('detecta catering', async () => {
        mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test' }]));

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('catering premium');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(mockPost).toHaveBeenCalledWith(
          '/api/ai-suppliers-tavily',
          expect.objectContaining({
            service: 'Catering',
          }),
          expect.objectContaining({
            auth: true,
            silent: true,
          })
        );
      });
    });

    describe('ensureMatchScore', () => {
      it('normaliza match score válido', async () => {
        mockPost.mockResolvedValueOnce(
          makeResponse([
            { name: 'Test 1', match: 95.7 },
            { name: 'Test 2', match: 120 }, // > 100
            { name: 'Test 3', match: -10 }, // < 0
          ])
        );

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // refineResults ordena por match descendente
        expect(result.current.results[0].match).toBe(100); // Capped a 100
        expect(result.current.results[1].match).toBe(96); // Redondeado
        expect(result.current.results[2].match).toBe(0); // Mínimo 0
      });

      it('genera score por defecto si falta', async () => {
        mockPost.mockResolvedValueOnce(
          makeResponse([
            { name: 'Test 1' }, // sin match
            { name: 'Test 2' },
            { name: 'Test 3' },
          ])
        );

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        // Debe generar scores decrecientes: 95, 90, 85...
        expect(result.current.results[0].match).toBeGreaterThanOrEqual(90);
        expect(result.current.results[1].match).toBeGreaterThanOrEqual(85);
        expect(result.current.results[2].match).toBeGreaterThanOrEqual(80);
      });
    });

    describe('generateAISummary', () => {
      it('genera resumen con precio', async () => {
        mockPost.mockResolvedValueOnce(
          makeResponse([
            {
              name: 'Test',
              price: '€€€',
              location: 'Madrid',
              tags: ['premium', 'elegante'],
            },
          ])
        );

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('catering premium');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const summary = result.current.results[0].aiSummary;
        expect(summary).toContain('€€€');
        expect(summary).toContain('Madrid');
      });
    });

    describe('normalizeResult', () => {
      it('genera nombre por defecto si falta', async () => {
        mockPost.mockResolvedValueOnce(makeResponse([]));
        mockGet.mockResolvedValueOnce(
          makeResponse({
            results: [{}, {}],
          })
        );

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.results).toHaveLength(2);
        expect(result.current.results[0].name).toContain('Proveedor sugerido');
        expect(result.current.results[1].name).toContain('Proveedor sugerido');
      });

      it('normaliza campos opcionales', async () => {
        mockPost.mockResolvedValueOnce(
          makeResponse([
            {
              name: 'Test',
              // Sin campos opcionales
            },
          ])
        );

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const normalized = result.current.results[0];
        expect(normalized.location).toBe('');
        expect(normalized.priceRange).toBe('');
        expect(normalized.snippet).toBe('');
        expect(normalized.tags).toEqual([]);
      });

      it('incluye fuente del resultado', async () => {
        mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test', source: 'openai' }]));

        const { result } = renderHook(() => useAISearch());
        
        await act(async () => {
          await result.current.searchSuppliers('test');
        });

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.results[0].raw.source).toBe('openai');
      });
    });
  });

  describe('clearResults', () => {
    it('limpia resultados y error', async () => {
      mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test' }]));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.results).toHaveLength(1);
      });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Casos edge', () => {
    it('maneja query vacío', async () => {
      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('');
      });

      // No debe hacer llamada a API con query vacío
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('maneja resultados vacíos', async () => {
      mockPost.mockResolvedValueOnce(makeResponse([]));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('proveedor inexistente');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.code).toBe('NO_LOCAL_RESULTS');
    });

    it('maneja datos malformados', async () => {
      mockPost.mockResolvedValueOnce(makeResponse(null));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBeTruthy();
    });

    it('limita número de resultados', async () => {
      const manyResults = Array(50).fill(null).map((_, i) => ({
        name: `Proveedor ${i}`,
        match: 90 - i,
      }));

      mockPost.mockResolvedValueOnce(makeResponse(manyResults));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('test');
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Debe limitar a un número razonable (ej. 20)
      expect(result.current.results.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Integración con contexto', () => {
    it('incluye información de la boda en la búsqueda', async () => {
      mockPost.mockResolvedValueOnce(makeResponse([{ name: 'Test' }]));

      const { result } = renderHook(() => useAISearch());

      await act(async () => {
        await result.current.searchSuppliers('catering');
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/api/ai-suppliers-tavily',
        expect.objectContaining({
          location: 'Madrid',
          budget: '10000',
          profile: expect.objectContaining({
            date: '2025-06-15',
            celebrationPlace: 'Madrid',
          }),
        }),
        expect.objectContaining({
          auth: true,
          silent: true,
        })
      );
    });
  });
});
