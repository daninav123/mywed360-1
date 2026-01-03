import { describe, expect, it } from 'vitest';
import {
  buildConsistencyReport,
  computeStyleWeights,
  detectStyleConflicts,
  normalizePreference,
  CONTRAST_LEVELS,
} from '../../services/StyleConsistencyService';

const basePreference = {
  id: 'core-lighting',
  idea: 'Instalación lumínica minimalista',
  nivelContraste: CONTRAST_LEVELS.COMPLEMENTA,
  weight: 0,
};

const contrastPreference = {
  id: 'circus-speakeasy',
  idea: 'Speakeasy circo vintage',
  nivelContraste: CONTRAST_LEVELS.CONTRASTE_CONTROLADO,
  zonaAplicacion: 'sala-speakeasy',
  relacionaConStyle: 'after_party',
  weight: 0.22,
};

describe('StyleConsistencyService', () => {
  it('normaliza preferencias con valores por defecto', () => {
    const normalized = normalizePreference({
      idea: 'Show futurista',
      nivelContraste: CONTRAST_LEVELS.FULL_CONTRASTE,
    });

    expect(normalized.weight).toBeGreaterThan(0);
    expect(normalized.id).toContain('Show futurista');
    expect(normalized.zonaAplicacion).toBeNull();
  });

  it('calcula pesos de estilo respetando el límite', () => {
    const { weights } = buildConsistencyReport(
      [basePreference, contrastPreference],
      { contrastLimit: 0.3 },
    );

    expect(weights.coreStyleWeight).toBeCloseTo(0.78, 2);
    expect(weights.contrastWeight).toBeCloseTo(0.22, 2);
    expect(weights.limit).toBe(0.3);
  });

  it('detecta conflictos cuando falta zona o relación', () => {
    const conflicts = detectStyleConflicts([
      {
        id: 'missing-zone',
        idea: 'Toro mecánico en banquete',
        nivelContraste: CONTRAST_LEVELS.CONTRASTE_CONTROLADO,
        relacionaConStyle: null,
        zonaAplicacion: null,
      },
    ]);

    expect(conflicts).toHaveLength(2);
    const types = conflicts.map((c) => c.type);
    expect(types).toContain('missing_zone');
    expect(types).toContain('missing_relation');
  });

  it('marca exceso de contraste cuando supera el límite', () => {
    const weights = computeStyleWeights(
      [
        { ...contrastPreference, weight: 0.3 },
        { ...contrastPreference, id: 'second', weight: 0.2 },
      ],
      { contrastLimit: 0.35 },
    );
    const conflicts = detectStyleConflicts([], weights, { contrastLimit: 0.35 });

    expect(conflicts).toEqual([
      expect.objectContaining({ type: 'limit_exceeded' }),
    ]);
  });

  it('integra en un reporte completo', () => {
    const { weights, conflicts } = buildConsistencyReport([
      basePreference,
      contrastPreference,
      {
        id: 'needs-review',
        idea: 'After-party urbano',
        nivelContraste: CONTRAST_LEVELS.CONTRASTE_CONTROLADO,
        zonaAplicacion: null,
        relacionaConStyle: null,
        requiresReview: true,
      },
    ]);

    expect(weights.contrastWeight).toBeGreaterThan(0);
    expect(conflicts).toHaveLength(3);
    expect(conflicts.map((c) => c.type)).toContain('requires_review');
  });
});
