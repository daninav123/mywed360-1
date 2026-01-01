import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Componente colapsable genérico
 */
export default function Collapsible({ 
  title, 
  children, 
  defaultOpen = false,
  icon,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-[color:var(--color-border)] rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-[var(--color-surface)] hover:bg-[var(--color-text-5)] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="font-semibold text-body">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown size={20} className="text-muted" />
        ) : (
          <ChevronRight size={20} className="text-muted" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-[color:var(--color-border)] bg-[var(--color-surface)]">
          {children}
        </div>
      )}
    </div>
  );
}
