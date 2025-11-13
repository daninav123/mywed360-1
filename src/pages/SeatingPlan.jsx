import React, { useState, useEffect } from 'react';

import SeatingPlanRefactored from '../components/seating/SeatingPlanRefactored.jsx';
import SeatingPlanModern from '../components/seating/SeatingPlanModern.jsx';

export default function SeatingPlan() {
  // Feature flag para el nuevo diseño
  const [useModernDesign, setUseModernDesign] = useState(() => {
    // FORZAR limpieza y usar diseño clásico
    const saved = localStorage.getItem('seating_modern_design');

    // Si está en 'true', limpiar automáticamente
    if (saved === 'true') {
      console.log('🧹 AUTO-LIMPIEZA: Removiendo flag de diseño moderno');
      localStorage.removeItem('seating_modern_design');
      console.log('✅ Usando diseño clásico por defecto');
      return false;
    }

    // DESACTIVADO POR DEFECTO - usar diseño clásico que está completamente funcional
    return false; // ← SIEMPRE false = diseño clásico
  });

  // Toggle con atajo de teclado: Ctrl+Shift+M
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        setUseModernDesign((prev) => {
          const newValue = !prev;
          localStorage.setItem('seating_modern_design', String(newValue));
          console.log('🎨 Diseño moderno:', newValue ? 'ACTIVADO' : 'DESACTIVADO');
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Renderizar diseño según preferencia
  if (useModernDesign) {
    return <SeatingPlanModern />;
  }

  return <SeatingPlanRefactored />;
}

// Force reload - timestamp: 2025-11-13 01:06
