import React from 'react';
import HomePage from '../components/HomePage';
import { prefetchModule } from '../utils/prefetch';

export default function Home() {
  React.useEffect(() => {
    // Prefetch bandeja de email en segundo plano (si red lo permite)
    prefetchModule('UnifiedEmail', () => import('./UnifiedEmail'));
    // Prefetch de vistas frecuentes
    prefetchModule('Proveedores', () => import('./Proveedores'));
    prefetchModule('Invitados', () => import('./Invitados'));
  }, []);
  return (
    <>
      <HomePage />
    </>
  );
}
