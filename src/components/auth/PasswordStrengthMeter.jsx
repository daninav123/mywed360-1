import React, { useMemo } from 'react';

import { evaluatePasswordStrength } from '../../utils/validationUtils';

/**
 * Barra visual para indicar la fuerza de la contraseña durante el registro.
 */
export default function PasswordStrengthMeter({ password }) {
  const strength = useMemo(() => evaluatePasswordStrength(password || ''), [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2" data-testid="password-strength-meter">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-text-soft,#6b7280)]">
        <span>Seguridad de la contraseña</span>
        <span className="font-medium" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>
      <div className="mt-1 h-2 rounded bg-[color:var(--color-border-soft,#e5e7eb)] overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${strength.progress}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      {strength.suggestions?.length ? (
        <ul className="mt-2 text-xs text-[color:var(--color-text-soft,#6b7280)] space-y-1 list-disc list-inside">
          {strength.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
