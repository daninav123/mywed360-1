import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Divider reutilizable para separar formularios de las acciones sociales.
 */
export default function AuthDivider({ label }) {
  const { t } = useTranslation();
  const text = label ?? t('authLogin.social.divider', { defaultValue: 'or continue with' });

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center opacity-70">
        <span className="w-full border-t border-soft" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-2 bg-surface text-[color:var(--color-text-soft)] font-medium tracking-wide">
          {text}
        </span>
      </div>
    </div>
  );
}
