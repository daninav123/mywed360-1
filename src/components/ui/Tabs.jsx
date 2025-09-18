import React, { createContext, useContext, useState, useId } from 'react';

// Contexto para compartir el valor actual de la pestaña
const TabsContext = createContext({ value: '', setValue: () => {} });

/**
 * Componente raíz de Tabs.
 * @param {string} defaultValue - Valor inicial de la pestaña seleccionada.
 */
export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  className = '',
}) {
    // Soporta modo controlado y no controlado.
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (val) => {
    if (isControlled) {
      onValueChange?.(val);
    } else {
      setInternalValue(val);
    }
  };
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/** Lista de pestañas (encabezados) */
export function TabsList({ children, className = '' }) {
  return <div role="tablist" className={className}>{children}</div>;
}

/**
 * Gatillo (botón) para cambiar de pestaña.
 * @param {string} value - Valor asociado a esta pestaña.
 */
export function TabsTrigger({ value, children, className = '' }) {
  const { value: current, setValue } = useContext(TabsContext);
  const isActive = current === value;
  const tabId = `tab-${value}`;
  const panelId = `panel-${value}`;
  return (
    <button
      id={tabId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      className={`${className} px-3 py-2 transition-colors ${
        isActive
          ? 'font-semibold text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
          : 'text-[color:var(--color-text)]/60 hover:text-[color:var(--color-text)]'
      } focus:outline-none focus:ring-2 ring-primary rounded-t`}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
}

/**
 * Contenido asociado a una pestaña.
 * Solo se renderiza si su valor coincide con la pestaña seleccionada.
 */
export function TabsContent({ value, children, className = '' }) {
  const { value: current } = useContext(TabsContext);
  if (current !== value) return null;
  const tabId = `tab-${value}`;
  const panelId = `panel-${value}`;
  return (
    <div id={panelId} role="tabpanel" aria-labelledby={tabId} className={className}>
      {children}
    </div>
  );
}
