import React, { useMemo } from 'react';

import { evaluatePasswordStrength } from '../../utils/validationUtils';
import useTranslations from '../../hooks/useTranslations';

const LABEL_KEYS = {
  {t('common.muy_debil')}: 'passwordStrength.labels.veryWeak',
  Débil: 'passwordStrength.labels.weak',
  Aceptable: 'passwordStrength.labels.medium',
  Buena: 'passwordStrength.labels.strong',
  Excelente: 'passwordStrength.labels.veryStrong',
};

const SUGGESTION_KEYS = {
  {t('common.introduce_una_contrasena_con_menos')}: 'passwordStrength.suggestions.start',
  'Usa al menos 8 caracteres.': 'passwordStrength.suggestions.length8',
  {t('common.aumenta_longitud_caracteres_mas')}: 'passwordStrength.suggestions.length12',
  {t('common.combina_mayusculas_minusculas')}: 'passwordStrength.suggestions.case',
  {t('common.anade_numeros_para_reforzarla')}: 'passwordStrength.suggestions.numbers',
  {t('common.incluye_simbolos_como_similares')}: 'passwordStrength.suggestions.symbols',
  {t('common.evita_repetir_mismo_caracter_varias')}:
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
