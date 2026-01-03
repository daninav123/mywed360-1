import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Mail, Moon, LogOut } from 'lucide-react';
import LanguageSelector from '../../components/ui/LanguageSelector';
import NotificationCenter from '../../components/NotificationCenter';
import DarkModeToggle from '../../components/DarkModeToggle';
import Nav from '../../components/Nav';
import { useAuth } from '../../hooks/useAuth.jsx';

const SECTION_TITLES = {
  'momentos-especiales': 'Momentos Especiales',
  'musica-limpia': 'Música para tu Boda',
  timing: 'Timing',
  checklist: 'Checklist',
  'ayuda-ceremonia': 'Ayuda ceremonia',
};

const DEFAULT_SECTION = 'momentos-especiales';

const ProtocoloLayout = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const { logout: logoutUnified } = useAuth();

  useEffect(() => {
    if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
      navigate(`/protocolo/${DEFAULT_SECTION}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  const currentTitle = useMemo(() => {
    const entry = Object.entries(SECTION_TITLES).find(([path]) =>
      location.pathname.startsWith(`/protocolo/${path}`)
    );
    return entry ? entry[1] : 'Protocolo';
  }, [location.pathname]);

  if (location.pathname === '/protocolo' || location.pathname === '/protocolo/') {
    return (
      <div className="p-4 md:p-6" role="status" aria-live="polite">
        Cargando...
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col min-h-screen pb-20 overflow-y-auto" style={{ backgroundColor: '#EDE8E0' }}>
        {/* Botones superiores derechos */}
        <div className="absolute top-4 right-4 flex items-center space-x-3" style={{ zIndex: 100 }}>
          <LanguageSelector variant="minimal" />
          
          <div className="relative" data-user-menu>
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="w-11 h-11 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center"
              title="Menú de usuario"
              style={{
                backgroundColor: openMenu ? 'var(--color-lavender)' : 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${openMenu ? 'var(--color-primary)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: openMenu ? '0 4px 12px rgba(94, 187, 255, 0.3)' : '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <User className="w-5 h-5" style={{ color: openMenu ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
            </button>
            
            {openMenu && (
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
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="w-4 h-4 mr-3" />
                  Perfil
                </Link>

                <Link
                  to="/email"
                  onClick={() => setOpenMenu(false)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  className="flex items-center px-3 py-2.5 text-sm rounded-xl transition-all duration-200"
                  className="text-body"
                >
                  <Mail className="w-4 h-4 mr-3" />
                  Buzón de Emails
                </Link>

                <div 
                  className="px-3 py-2.5 rounded-xl transition-all duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-lavender)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center" className="text-body">
                      <Moon className="w-4 h-4 mr-3" />
                      Modo oscuro
                    </span>
                    <DarkModeToggle className="ml-2" />
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-soft)', margin: '8px 0' }}></div>
                
                <button
                  onClick={() => {
                    logoutUnified();
                    setOpenMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all duration-200 flex items-center"
                  className="text-danger"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-10)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Cerrar sesión
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
          <section className="p-4 md:p-6 flex flex-col gap-6" aria-labelledby="protocolo-heading">
      <div className="flex items-center justify-between gap-4">
        <h1 id="protocolo-heading" className="page-title">
          {currentTitle}
        </h1>
        <LanguageSelector variant="minimal" />
      </div>

      <div
        className="focus:outline-none focus-visible:ring-2 ring-primary"
        role="region"
        aria-label="Contenido de Protocolo"
      >
        <Outlet />
      </div>

      <p className="sr-only" data-testid="current-path">
        Ruta actual: {location.pathname}
      </p>
          </section>
        </div>
      </div>
      <Nav />
    </>
  );
});

export default ProtocoloLayout;
