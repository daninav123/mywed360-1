import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User, Mail, Moon, LogOut } from 'lucide-react';

import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import InvitationCanvas from '../components/invitations/InvitationCanvas';
import LayerPanel from '../components/invitations/LayerPanel';
import PropertyPanel from '../components/invitations/PropertyPanel';
import TemplateGallery from '../components/invitations/TemplateGallery';
import Toolbar from '../components/invitations/Toolbar';
import { useAuth } from '../hooks/useAuth.jsx';
import useHistory from '../hooks/useHistory';
import { exportElementToPdf } from '../utils/pdfExport';
function InvitationDesigner() {
  const { t } = useTranslation();
  const { logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [template, setTemplate] = useState(null);
  // scale for zoom
  const [scale, setScale] = useState(1);
  const canvasRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  // history for elements on canvas
  const [elements, setElementsHistory, { undo, redo, canUndo, canRedo }] = useHistory([]);

  const handleZoomIn = () => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)));

  const setElements = (updater) => {
    setElementsHistory(updater);
  };

  const handleAddText = () => {
    const id = Date.now();
    setElements((prev) => [...prev, { id, type: 'text', content: 'Nuevo texto', x: 50, y: 50 }]);
    setSelectedId(id);
  };

  const handleAddImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const id = Date.now();
        setElements((prev) => [...prev, { id, type: 'image', src: reader.result, x: 50, y: 50 }]);
        setSelectedId(id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleExportPdf = () => {
    if (canvasRef.current) {
      exportElementToPdf(canvasRef.current);
    }
  };

  if (!template) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Selecciona una plantilla</h1>
        <TemplateGallery placeholder={t('invitationDesigner.datePlaceholder')} onSelect={setTemplate} />
      </div>
    );
  }

  return (
    <>
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
    <div className="flex flex-col md:flex-row h-screen">
      {/* Side panels */}
      <aside className="md:w-60 border-r p-2 overflow-y-auto  shadow-md" className="bg-surface">
        <Toolbar
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onAddText={handleAddText}
          onAddImage={handleAddImage}
          onExportPdf={handleExportPdf}
        />
        <LayerPanel />
        <PropertyPanel
          placeholder={t('invitationDesigner.messagePlaceholder')} element={elements.find((el) => el.id === selectedId)}
          updateElement={(mutator) =>
            setElements((prev) =>
              prev.map((el) =>
                el.id === selectedId
                    ? mutator(el)
                    : { ...el, placeholder: t('invitationDesigner.titlePlaceholder'), ...mutator }
                  : el
                )
              )
            }
            scale={scale}
          />
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col items-center justify-center " className="bg-page">
          <InvitationCanvas
            ref={canvasRef}
            template={template}
            elements={elements}
            selectedId={selectedId}
            onSelectElement={setSelectedId}
            scale={scale}
          />
        </main>
      </div>
      <Nav />
    </>
  );
}

export default InvitationDesigner;
