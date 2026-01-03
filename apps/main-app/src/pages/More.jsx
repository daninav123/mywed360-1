import { Users, Briefcase, Clock, Layers, User, Heart, Mail, Moon, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';

import useTranslations from '../hooks/useTranslations';
import { prefetchModule } from '../utils/prefetch';
import LanguageSelector from '../components/ui/LanguageSelector';
import NotificationCenter from '../components/NotificationCenter';
import DarkModeToggle from '../components/DarkModeToggle';
import Nav from '../components/Nav';
import { useAuth } from '../hooks/useAuth.jsx';
// PushService import removed; push controls moved out to Notification Center

export default function More() {
  const [openMenu, setOpenMenu] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const { t } = useTranslations();
  const { logout: logoutUnified } = useAuth();
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
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        {/* Botones superiores derechos */}
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          
          <div className="relative" data-user-menu>
            <button
              onClick={() => setOpenUserMenu(!openUserMenu)}
              className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
              title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })}
              style={{
                backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            
            {openUserMenu && (
              <div 
                className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1"
                style={{
                  minWidth: '220px',
                  border: '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  zIndex: 9999,
                }}
              >
                <div className="px-2 py-1">
                  <NotificationCenter />
                </div>

                <Link
                  to="/perfil"
                  onClick={() => setOpenUserMenu(false)}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 mr-3" />
                  {t('navigation.profile', { defaultValue: 'Perfil' })}
                </Link>

                <Link
                  to="/email"
                  onClick={() => setOpenUserMenu(false)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                >
                  <Mail className="w-4 h-4 mr-3" />
                  {t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
                </Link>

                <div 
                  className="px-3 py-2.5 rounded-xl transition-all duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center" className="text-body">
                      <Moon className="w-4 h-4 mr-3" />
                      {t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}
                    </span>
                    <DarkModeToggle className="ml-2" />
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
                
                <button
                  onClick={() => {
                    logoutUnified();
                    setOpenUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center"
                  className="text-danger"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
                </button>
              </div>
            )}
          </div>
        </div>
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
            {/* Título con líneas decorativas */}
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
              }}>Más Herramientas</h1>
              <div style={{
                width: '60px',
                height: '1px',
                background: 'linear-gradient(to left, transparent, #D4A574)',
              }} />
            </div>
            
            {/* Subtítulo como tag uppercase */}
            <p style={{
              fontFamily: "'DM Sans', 'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 0,
            }}>{t('common:inspiration.weddingManagement')}</p>
          </div>
        </header>

        {/* Contenido */}
        <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'invitados' ? null : 'invitados')}
            className="flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #EEF2F7',
              padding: '24px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#E8F5E9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Users size={24} style={{ color: '#4A9B5F' }} />
            </div>
            <h2 style={{
              color: '#1F2937',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
              {t('pages.more.sections.guests.title')}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
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
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.guests.links.guests')}
              </Link>
              <Link
                to="/invitados/seating"
                className="block px-4 py-3 transition-colors"
                className="text-body"
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
            className="flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #EEF2F7',
              padding: '24px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#E8F4FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Briefcase size={24} style={{ color: '#5EBBFF' }} />
            </div>
            <h2 style={{
              color: '#1F2937',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
              {t('pages.more.sections.providers.title')}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
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
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.providers.links.providers')}
              </Link>
              <Link
                to="/proveedores/contratos"
                className="block px-4 py-3 transition-colors"
                className="text-body"
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
            className="flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #EEF2F7',
              padding: '24px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#FFF3E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Clock size={24} style={{ color: '#FF9800' }} />
            </div>
            <h2 style={{
              color: '#1F2937',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
              {t('pages.more.sections.protocol.title')}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
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
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.specialMoments')}
              </Link>
              <Link
                to="/protocolo/timing"
                className="block px-4 py-3 transition-colors"
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.timing')}
              </Link>
              <Link
                to="/checklist"
                className="block px-4 py-3 transition-colors"
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.checklist')}
              </Link>
              <Link
                to="/protocolo/ayuda-ceremonia"
                className="block px-4 py-3 transition-colors"
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.protocol.links.ceremonyHelp')}
              </Link>
              <Link
                to="/protocolo/documentos"
                className="block px-4 py-3 transition-colors"
                className="text-body"
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
            className="flex flex-col text-left w-full transition-all duration-200"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid #EEF2F7',
              padding: '24px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#F3E5F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Layers size={24} style={{ color: '#AB47BC' }} />
            </div>
            <h2 style={{
              color: '#1F2937',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '6px',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
              {t('pages.more.sections.extras.title')}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: "'DM Sans', 'Inter', sans-serif",
            }}>
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
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.web')}
              </Link>
              <Link 
                to="/editor-disenos" 
                className="block px-4 py-3 font-medium transition-colors"
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.designEditor', { defaultValue: 'Editor de Diseños' })}
              </Link>
              <Link 
                to="/disenos" 
                className="block px-4 py-3 text-sm transition-colors"
                className="text-secondary"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.designs')} (Legacy)
              </Link>
              <Link 
                to="/ideas" 
                className="block px-4 py-3 transition-colors"
                className="text-body"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {t('pages.more.sections.extras.links.ideas')}
              </Link>
              <Link 
                to="/momentos" 
                className="block px-4 py-3 transition-colors"
                className="text-body"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
        <Link
          to="/info-boda"
          className="flex flex-col text-left transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #EEF2F7',
            padding: '24px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FCE4EC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Heart size={24} style={{ color: '#C97C8F' }} />
          </div>
          <h2 style={{
            color: '#1F2937',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '6px',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {t('pages.more.sections.weddingInfo.title', { defaultValue: 'Información de la Boda' })}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {t('pages.more.sections.weddingInfo.description', {
              defaultValue: 'Configura fecha, lugar, menú, FAQs y más',
            })}
          </p>
        </Link>

        <Link
          to="/perfil"
          className="flex flex-col text-left transition-all duration-200"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #EEF2F7',
            padding: '24px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FFF4E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <User size={24} style={{ color: '#D4A574' }} />
          </div>
          <h2 style={{
            color: '#1F2937',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '6px',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {t('pages.more.sections.profile.title')}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {t('pages.more.sections.profile.description')}
          </p>
        </Link>
      </div>

      {/* Notificaciones Push removidas para evitar duplicidad con el centro de notificaciones */}

      {/* Content */}
      <div className="mt-6">
        <Outlet />
        </div>
      </div>
      </div>
      </div>
      </div>
      {/* Bottom Navigation */}
      <Nav active="more" />
    </>
  );
}
