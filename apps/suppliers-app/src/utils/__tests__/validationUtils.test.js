import { describe, expect, it } from 'vitest';

import { evaluatePasswordStrength } from '../validationUtils';

describe('evaluatePasswordStrength', () => {
  it('returns baseline guidance for empty passwords', () => {
    const result = evaluatePasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('Muy débil');
    expect(result.suggestions).toContain('Introduce una contraseña con al menos 8 caracteres.');
  });

  it('flags weak passwords and suggests improvements', () => {
    const result = evaluatePasswordStrength('password');
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.label).toBe('Débil');
    expect(result.suggestions).toEqual(
      expect.arrayContaining([
        'Aumenta la longitud a 12 caracteres o más.',
        'Combina mayúsculas y minúsculas.',
        'Añade números para reforzarla.',
      ])
    );
  });

  it('reaches the highest tier for complex passwords', () => {
    const result = evaluatePasswordStrength('Str0ng!Passw0rd2025');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Excelente');
    expect(result.progress).toBeGreaterThanOrEqual(85);
    expect(result.suggestions.length).toBeLessThanOrEqual(4);
  });
});
