import { Users, Briefcase, Clock, Layers, User, Heart } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

import useTranslations from '../hooks/useTranslations';
import { prefetchModule } from '../utils/prefetch';
// PushService import removed; push controls moved out to Notification Center

export default function More() {
  const [openMenu, setOpenMenu] = useState(null);
  const { t } = useTranslations();
  // Push controls removed from this page to avoid duplication

  // Prefetch helpers
  const pfInvitados = () => prefetchModule('Invitados', () => import('./Invitados'));
  const pfSeating = () => prefetchModule('SeatingPlan', () => import('./SeatingPlan'));
  const pfProveedores = () => prefetchModule('Proveedores', () => import('./Proveedores'));
  const pfContratos = () => prefetchModule('Contratos', () => import('./Contratos'));
  const pfProtocolo = () =>
    prefetchModule('ProtocoloLayout', () => import('./protocolo/ProtocoloLayout'));
  const pfDisenoWeb = () => prefetchModule('DisenoWeb', () => import('./DisenoWeb'));
  const pfDisenos = () => prefetchModule('DisenosLayout', () => import('./disenos/DisenosLayout'));
  const pfIdeas = () => prefetchModule('Ideas', () => import('./Ideas'));
  const pfMomentos = () => prefetchModule('Momentos', () => import('./Momentos'));

  // Grouped prefetch on hover/focus/touch
  const pfInvitadosMenu = () => {
    pfInvitados();
    pfSeating();
  };
  const pfProveedoresMenu = () => {
    pfProveedores();
    pfContratos();
  };
  const pfProtocoloMenu = () => {
    pfProtocolo();
  };
  const pfExtrasMenu = () => {
    pfDisenoWeb();
    pfDisenos();
    pfIdeas();
    pfMomentos();
  };

  // Push handlers removed

  return (
    <div className="p-6 md:p-8 space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 
          className="text-3xl font-bold"
          style={{
            color: 'var(--color-text)',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {t('pages.more.title')}
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Accede a todas las funcionalidades de tu boda
        </p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'invitados' ? null : 'invitados')}
            className="p-6 flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--color-border-soft)';
            }}
          >
            <Users size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
            <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {t('pages.more.sections.guests.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('pages.more.sections.guests.description')}
            </p>
          </button>
          {openMenu === 'invitados' && (
            <div
              className="absolute w-full z-10 mt-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
              onMouseEnter={pfInvitadosMenu}
              onFocus={pfInvitadosMenu}
              onTouchStart={pfInvitadosMenu}
            >
              <Link 
                to="/invitados" 
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.guests.links.guests')}
              </Link>
              <Link
                to="/invitados/seating"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.guests.links.seating')}
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'proveedores' ? null : 'proveedores')}
            className="p-6 flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--color-border-soft)';
            }}
          >
            <Briefcase size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
            <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {t('pages.more.sections.providers.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('pages.more.sections.providers.description')}
            </p>
          </button>
          {openMenu === 'proveedores' && (
            <div
              className="absolute w-full z-10 mt-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
              onMouseEnter={pfProveedoresMenu}
              onFocus={pfProveedoresMenu}
              onTouchStart={pfProveedoresMenu}
            >
              <Link 
                to="/proveedores" 
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.providers.links.providers')}
              </Link>
              <Link
                to="/proveedores/contratos"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.providers.links.contracts')}
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'protocolo' ? null : 'protocolo')}
            className="p-6 flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--color-border-soft)';
            }}
          >
            <Clock size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
            <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {t('pages.more.sections.protocol.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('pages.more.sections.protocol.description')}
            </p>
          </button>
          {openMenu === 'protocolo' && (
            <div
              className="absolute w-full z-10 mt-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
              onMouseEnter={pfProtocoloMenu}
              onFocus={pfProtocoloMenu}
              onTouchStart={pfProtocoloMenu}
            >
              <Link
                to="/protocolo/momentos-especiales"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.specialMoments')}
              </Link>
              <Link
                to="/protocolo/timing"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.timing')}
              </Link>
              <Link
                to="/protocolo/checklist"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.checklist')}
              </Link>
              <Link
                to="/protocolo/ayuda-ceremonia"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.ceremonyHelp')}
              </Link>
              <Link
                to="/protocolo/documentos"
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.documents')}
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'extras' ? null : 'extras')}
            className="p-6 flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border-soft)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'var(--color-border-soft)';
            }}
          >
            <Layers size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
            <h2 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              {t('pages.more.sections.extras.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('pages.more.sections.extras.description')}
            </p>
          </button>
          {openMenu === 'extras' && (
            <div
              className="absolute w-full z-10 mt-2"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
              onMouseEnter={pfExtrasMenu}
              onFocus={pfExtrasMenu}
              onTouchStart={pfExtrasMenu}
            >
              <Link 
                to="/diseno-web" 
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.web')}
              </Link>
              <Link 
                to="/editor-disenos" 
                className="block px-4 py-3 font-medium transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.designEditor', { defaultValue: 'Editor de Diseños' })}
              </Link>
              <Link 
                to="/disenos" 
                className="block px-4 py-3 text-sm transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.designs')} (Legacy)
              </Link>
              <Link 
                to="/ideas" 
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.ideas')}
              </Link>
              <Link 
                to="/momentos" 
                className="block px-4 py-3 transition-colors"
                style={{ color: 'var(--color-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.moments')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Perfil y Configuración */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Link
          to="/info-boda"
          className="bg-[var(--color-surface)] border border-soft p-4 rounded shadow hover:shadow-md flex flex-col text-left transition-shadow"
        >
          <Heart size={32} className="text-primary mb-2" />
          <h2 className="font-semibold mb-1">
            {t('pages.more.sections.weddingInfo.title', { defaultValue: 'Información de la Boda' })}
          </h2>
          <p className="text-sm text-muted">
            {t('pages.more.sections.weddingInfo.description', {
              defaultValue: 'Configura fecha, lugar, menú, FAQs y más',
            })}
          </p>
        </Link>

        <Link
          to="/perfil"
          className="bg-[var(--color-surface)] border border-soft p-4 rounded shadow hover:shadow-md flex flex-col text-left transition-shadow"
        >
          <User size={32} className="text-primary mb-2" />
          <h2 className="font-semibold mb-1">
            {t('pages.more.sections.profile.title', { defaultValue: 'Perfil de Usuario' })}
          </h2>
          <p className="text-sm text-muted">
            {t('pages.more.sections.profile.description', {
              defaultValue: 'Tu cuenta, facturación y colaboradores',
            })}
          </p>
        </Link>
      </div>

      {/* Notificaciones Push removidas para evitar duplicidad con el centro de notificaciones */}

      {/* Content */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
