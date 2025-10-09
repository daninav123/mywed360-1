import React from 'react';

import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function RegisterForm({
  email,
  password,
  role,
  onEmailChange,
  onPasswordChange,
  onRoleChange,
  onSubmit,
  isSubmitting,
  error,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="signup-email" className="text-sm font-medium text-[color:var(--color-text,#111827)]">
          Correo electrónico
        </label>
        <input
          id="signup-email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => onEmailChange?.(event.target.value)}
          className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-password" className="text-sm font-medium text-[color:var(--color-text,#111827)]">
          Contraseña
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(event) => onPasswordChange?.(event.target.value)}
          className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-role" className="text-sm font-medium text-[color:var(--color-text,#111827)]">
          Rol
        </label>
        <select
          id="signup-role"
          value={role}
          onChange={(event) => onRoleChange?.(event.target.value)}
          className="w-full rounded-md border border-soft bg-surface px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary,#6366f1)]"
        >
          <option value="particular">Particular</option>
          <option value="planner">Wedding Planner</option>
          <option value="assistant">Ayudante</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[color:var(--color-primary,#6366f1)] px-4 py-2 text-sm font-semibold text-[color:var(--color-on-primary,#ffffff)] transition-colors hover:bg-[color:var(--color-primary-dark,#4f46e5)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Creando cuenta…' : 'Registrarse'}
      </button>
    </form>
  );
}
