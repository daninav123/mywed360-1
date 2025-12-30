import React from 'react';
import { useTranslation } from 'react-i18next';
import HomePage2 from '../components/HomePage2';
import { prefetchModule } from '../utils/prefetch';

export default function Home2() {
  React.useEffect(() => {
    prefetchModule('UnifiedEmail', () => import('./UnifiedEmail'));
    prefetchModule('Proveedores', () => import('./Proveedores'));
    prefetchModule('Invitados', () => import('./Invitados'));
  }, []);
  
  return <HomePage2 />;
}
