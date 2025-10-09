import React from 'react';

/**
 * Divider reutilizable para separar formularios de las acciones sociales.
 */
export default function AuthDivider({ label = 'o continúa con' }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center opacity-70">
        <span className="w-full border-t border-soft" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-2 bg-surface text-[color:var(--color-text-soft,#6b7280)] font-medium tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}
