import React, { createContext, useContext, useState, useEffect } from 'react';
import { TEMA_DEFAULT } from '../components/web/craft/themes';

const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Si no hay contexto, devolver tema por defecto
    return { tema: TEMA_DEFAULT };
  }
  return context;
};

export const ThemeProvider = ({ children, initialTema = TEMA_DEFAULT, externalTema }) => {
  const [tema, setTema] = useState(initialTema);

  // Sincronizar con tema externo cuando cambie
  useEffect(() => {
    if (externalTema) {
      console.log('🔄 ThemeProvider sincronizando con tema externo:', externalTema);
      setTema(externalTema);
    }
  }, [externalTema]);

  return <ThemeContext.Provider value={{ tema, setTema }}>{children}</ThemeContext.Provider>;
};
