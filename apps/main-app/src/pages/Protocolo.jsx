import { Clock, List, Music, FileText, User, Mail, Moon, LogOut } from 'lucide-react';
import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Protocolo() {
  const { t } = useTranslation();
  const { logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  
  return (
    <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
      <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
        <LanguageSelector variant="minimal" />
        <div className="relative" data-user-menu>
          <button onClick={() => setOpenUserMenu(!openUserMenu)} className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center" title={t('navigation.userMenu', { defaultValue: 'Menú de usuario' })} style={{ backgroundColor: openUserMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)', border: `2px solid ${openUserMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`, boxShadow: openUserMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)' }}>
            <User className="w-5 h-5" style={{ color: openUserMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
          </button>
          {openUserMenu && (
            <div className="absolute right-0 mt-3 bg-[var(--color-surface)] p-2 space-y-1" style={{ minWidth: '220px', border: '1px solid var(--color-border-soft)', borderRadius: 'var(--radius-lg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
              <div className="px-2 py-1"><NotificationCenter /></div>
              <Link to="/perfil" onClick={() => setOpenUserMenu(false)} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <User className="w-4 h-4 mr-3" />{t('navigation.profile', { defaultValue: 'Perfil' })}
              </Link>
              <Link to="/email" onClick={() => setOpenUserMenu(false)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'} className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200" className="text-body">
                <Mail className="w-4 h-4 mr-3" />{t('navigation.emailInbox', { defaultValue: 'Buzón de Emails' })}
              </Link>
              <div className="px-3 py-2.5 rounded-xl transition-all duration-200" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div className="flex items-center justify-between"><span className="text-sm flex items-center" className="text-body"><Moon className="w-4 h-4 mr-3" />{t('navigation.darkMode', { defaultValue: 'Modo oscuro' })}</span><DarkModeToggle className="ml-2" /></div>
              </div>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
              <button onClick={() => { logoutUnified(); setOpenUserMenu(false); }} className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center" className="text-danger" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <LogOut className="w-4 h-4 mr-3" />{t('navigation.logout', { defaultValue: 'Cerrar sesión' })}
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
    </div>
      <Nav />
    </div>
  );
}
