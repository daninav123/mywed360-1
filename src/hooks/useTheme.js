/**
 * useTheme - Hook para gestionar tema claro/oscuro
 */
import { useState, useEffect } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Leer preferencia guardada
    const saved = localStorage.getItem('seating_theme');
    if (saved) return saved;
    
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'dark'; // Por defecto oscuro
  });

  useEffect(() => {
    // Aplicar clase al documento
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Guardar preferencia
    localStorage.setItem('seating_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setDark = () => setTheme('dark');
  const setLight = () => setTheme('light');

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggleTheme,
    setDark,
    setLight,
  };
}
