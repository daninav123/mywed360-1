import { Clock, List, Music, FileText } from 'lucide-react';
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Protocolo() {
  const { t } = useTranslation();
  
  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
      <div className="mx-auto my-8" style={{
        maxWidth: '1024px',
        width: '100%',
        backgroundColor: '#FFFBF7',
        borderRadius: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden'
      }}>
        
        {/* Hero con degradado beige-dorado */}
        <header className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #FFF4E6 0%, #F8EFE3 50%, #E8D5C4 100%)',
          padding: '48px 32px 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, #D4A574)',
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                fontSize: '40px',
                fontWeight: 400,
                color: '#1F2937',
                letterSpacing: '-0.01em',
                margin: 0,
              }}>{t('protocol.title')}</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>Protocolo de Boda</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
<div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('protocol.title')}</h1>
      <nav className="flex space-x-4 mb-6 border-b pb-2 border-soft">
        <Link to="momentos" className="text-primary hover:underline">
          {t('protocol.nav.specialMoments')}
        </Link>
        <Link to="timing" className="text-primary hover:underline">
          {t('protocol.nav.timing')}
        </Link>
        <Link to="checklist" className="text-primary hover:underline">
          {t('protocol.nav.checklist')}
        </Link>
        <Link to="ayuda-ceremonia" className="text-primary hover:underline">
          {t('protocol.nav.ceremonyHelp')}
        </Link>
      </nav>
      <Outlet />
      </div>
    </div>
  );
}
