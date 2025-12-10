import React from 'react';

const Input = React.forwardRef(({ className = '', label, error, id, type, ...props }, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isTextarea = type === 'textarea';

  const sharedClasses = `w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 ${
    error ? 'border-[var(--color-danger)]' : 'border-[color:var(--color-text)]/20'
  } bg-[var(--color-surface)] text-[color:var(--color-text)]`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[color:var(--color-text)]/80 mb-1"
        >
          {label}
        </label>
      )}
      {isTextarea ? (
        <textarea
          id={inputId}
          ref={ref}
          className={`${sharedClasses} min-h-[120px]`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={{ '--tw-ring-color': error ? 'var(--color-danger)' : 'var(--color-primary)' }}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={sharedClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          style={{ '--tw-ring-color': error ? 'var(--color-danger)' : 'var(--color-primary)' }}
          {...props}
        />
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-[color:var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
