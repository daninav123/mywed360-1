import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import Button from './Button';

/**
 * PageWrapper encapsula la estructura común de página: título fuera de los cards
 * y contenedor principal con paddings y espacio vertical.
 * Props:
 *  - title: string (título principal)
 *  - actions: ReactNode (botones u otros elementos a la derecha del título)
 *  - className: clases tailwind opcionales para el contenedor principal
 *  - children: contenido de la página (Cards y secciones)
 */
export default function PageWrapper({ title, actions = null, className = '', children }) {
  const { t } = useTranslation();
  const brand = t('app.brandName', { defaultValue: 'Lovenda' });
  const pageTitle = title ? `${title} · ${brand}` : brand;

  return (
    <div className={`p-4 md:p-6 space-y-8 ${className}`}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="og:site_name" content={brand} />
        {title && <meta name="og:title" content={String(title)} />}
      </Helmet>
      {(title || actions) && (
        <div className="page-header">
          {title && <h1 className="page-title mr-auto">{title}</h1>}
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
