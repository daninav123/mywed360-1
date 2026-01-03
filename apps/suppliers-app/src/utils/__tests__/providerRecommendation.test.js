import { recommendBestProvider } from '../../utils/providerRecommendation';

describe('recommendBestProvider', () => {
  const baseProviders = [
    {
      id: 'a',
      name: 'Proveedor A',
      service: 'Fotografía',
      tags: ['documental', 'natural'],
      intelligentScore: { score: 82 },
      presupuesto: 1800,
      assignedBudget: 2000,
      email: 'a@example.com',
    },
    {
      id: 'b',
      name: 'Proveedor B',
      service: 'Fotografía',
      tags: ['boho', 'playa'],
      intelligentScore: { score: 85 },
      presupuesto: 2600,
      assignedBudget: 2000,
      email: 'b@example.com',
    },
    {
      id: 'c',
      name: 'Proveedor C',
      service: 'Fotografía',
      tags: ['documental', 'playa'],
      aiMatch: 78,
      presupuesto: 1900,
      assignedBudget: 2000,
      email: 'c@example.com',
    },
  ];

  it('prioriza proveedores dentro del presupuesto y con coincidencias técnicas', () => {
    const recommendation = recommendBestProvider(baseProviders, {
      wantedServices: ['Fotografía'],
      requiredTags: ['documental'],
      preferences: {},
    });

    expect(recommendation).not.toBeNull();
    expect(recommendation.providerId).toBe('a');
    const orderedIds = recommendation.ordered.map((row) => row.id);
    expect(orderedIds).toEqual(['a', 'c', 'b']);
  });

  it('tolera ausencia de requisitos devolviendo la mayor puntuación base', () => {
    const recommendation = recommendBestProvider(baseProviders, {});
    expect(recommendation.providerId).toBe('a');
  });

  it('devuelve null si no hay proveedores válidos', () => {
    expect(recommendBestProvider([], {})).toBeNull();
  });
});
