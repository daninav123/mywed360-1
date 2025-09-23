import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

/*
 * Wrapper de pruebas con los providers globales usados por la mayoría
 * de componentes de UI: React Router y tema de MUI.
 * Nota: no incluye AuthProvider; las pruebas que lo requieran deben mockear/useAuth
 * o envolver explícitamente con su propio provider.
 */
const theme = createTheme();

const AllProviders = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

export default AllProviders;
