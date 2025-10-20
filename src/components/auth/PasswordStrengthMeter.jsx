import React, { useMemo } from 'react';

import { evaluatePasswordStrength } from '../../utils/validationUtils';
import useTranslations from '../../hooks/useTranslations';

const LABEL_KEYS = {
  'Muy débil': 'passwordStrength.labels.veryWeak',
  Débil: 'passwordStrength.labels.weak',
  Aceptable: 'passwordStrength.labels.medium',
  Buena: 'passwordStrength.labels.strong',
  Excelente: 'passwordStrength.labels.veryStrong',
};

const SUGGESTION_KEYS = {
  'Introduce una contraseña con al menos 8 caracteres.': 'passwordStrength.suggestions.start',
  'Usa al menos 8 caracteres.': 'passwordStrength.suggestions.length8',
  'Aumenta la longitud a 12 caracteres o más.': 'passwordStrength.suggestions.length12',
  'Combina mayúsculas y minúsculas.': 'passwordStrength.suggestions.case',
  'Añade números para reforzarla.': 'passwordStrength.suggestions.numbers',
  'Incluye símbolos como !, %, # o similares.': 'passwordStrength.suggestions.symbols',
  'Evita repetir el mismo carácter varias veces seguidas.':
    'passwordStrength.suggestions.repetition',
  'Evita palabras comunes o secuencias previsibles.': 'passwordStrength.suggestions.common',
};

/**
 * Barra visual para indicar la fuerza de la contraseña durante el registro.
 */
export default function PasswordStrengthMeter({ password }) {
  const { t } = useTranslations();
  const strength = useMemo(() => evaluatePasswordStrength(password || ''), [password]);

  if (!password) {
    return null;
  }

  const labelKey = LABEL_KEYS[strength.label] || strength.label;
  const labelText = t(labelKey, { defaultValue: strength.label });

  return (
    <div className="mt-2" data-testid="password-strength-meter">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-text-soft,#6b7280)]">
        <span>{t('passwordStrength.title')}</span>
        <span className="font-medium" style={{ color: strength.color }}>
          {labelText}
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
          {strength.suggestions.map((suggestion) => {
            const key = SUGGESTION_KEYS[suggestion] || suggestion;
            return <li key={suggestion}>{t(key, { defaultValue: suggestion })}</li>;
          })}
        </ul>
      ) : null}
    </div>
  );
}
