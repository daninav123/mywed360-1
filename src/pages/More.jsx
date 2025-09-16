import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Users, Briefcase, Clock, User, Layers } from 'lucide-react';
import { prefetchModule } from '../utils/prefetch';
import * as Push from '../services/PushService';

export default function More() {
  const [openMenu, setOpenMenu] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const pfInvitados = () => prefetchModule('Invitados', () => import('./Invitados'));
  const pfSeating = () => prefetchModule('SeatingPlanRefactored', () => import('../components/seating/SeatingPlanRefactored.jsx'));
  const pfProveedores = () => prefetchModule('Proveedores', () => import('./Proveedores'));
  const pfContratos = () => prefetchModule('Contratos', () => import('./Contratos'));
  const pfProtocolo = () => prefetchModule('ProtocoloLayout', () => import('./protocolo/ProtocoloLayout'));
  const pfDisenoWeb = () => prefetchModule('DisenoWeb', () => import('./DisenoWeb'));
  const pfDisenos = () => prefetchModule('DisenosLayout', () => import('./disenos/DisenosLayout'));
  const pfIdeas = () => prefetchModule('Ideas', () => import('./Ideas'));
  const pfInspiration = () => prefetchModule('Inspiration', () => import('./Inspiration'));
  const pfBlog = () => prefetchModule('Blog', () => import('./Blog'));

  // --- Prefetch grouped menus (evita error de función no definida) ---
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
    pfInspiration();
    pfBlog();
  };
  // --- Push notifications setup ---
  useEffect(() => {
    try {
      const sup = Push.isSupported();
      setPushSupported(sup);
      if (sup) {
        Push.getSubscription()
          .then((sub) => setPushEnabled(!!sub))
          .catch(() => {});
      }
    } catch {}
  }, []);

  const handleTogglePush = async () => {
    if (!pushSupported) return;
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await Push.unsubscribe();
        setPushEnabled(false);
      } else {
        await Push.subscribe();
        setPushEnabled(true);
      }
    } catch (e) {
      console.warn('Push toggle error', e);
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestPush = async () => {
    try {
      await Push.sendTest();
    } catch {}
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Más</h1>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
        <button onClick={() => setOpenMenu(openMenu==='invitados'?null:'invitados')} className="bg-white p-4 rounded shadow hover:shadow-md flex flex-col text-left w-full">
          <Users size={32} className="text-blue-600 mb-2" />
          <h2 className="font-semibold mb-1">Invitados</h2>
          <p className="text-sm text-gray-600">Gestiona invitados y seating plan.</p>
        </button>
        {openMenu==='invitados' && (
          <div className="absolute bg-white border border-gray-200 rounded shadow mt-2 w-full z-10" onMouseEnter={pfInvitadosMenu} onFocus={pfInvitadosMenu} onTouchStart={pfInvitadosMenu}>
            <Link to="/invitados" className="block px-4 py-2 hover:bg-gray-100">Gestión de invitados</Link>
            <Link to="/invitados/seating" className="block px-4 py-2 hover:bg-gray-100">Seating plan</Link>

          </div>
        )}
      </div>
        <div className="relative">
        <button onClick={() => setOpenMenu(openMenu==='proveedores'?null:'proveedores')} className="bg-white p-4 rounded shadow hover:shadow-md flex flex-col text-left w-full">
          <Briefcase size={32} className="text-blue-600 mb-2" />
          <h2 className="font-semibold mb-1">Proveedores</h2>
          <p className="text-sm text-gray-600">Gestiona proveedores y contratos.</p>
        </button>
        {openMenu==='proveedores' && (
          <div className="absolute bg-white border border-gray-200 rounded shadow mt-2 w-full z-10" onMouseEnter={pfProveedoresMenu} onFocus={pfProveedoresMenu} onTouchStart={pfProveedoresMenu}>
            <Link to="/proveedores" className="block px-4 py-2 hover:bg-gray-100">Gestión de proveedores</Link>
              <Link to="/proveedores/contratos" className="block px-4 py-2 hover:bg-gray-100">Contratos</Link>
            
          </div>
        )}
      </div>
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu==='protocolo'?null:'protocolo')} className="bg-white p-4 rounded shadow hover:shadow-md flex flex-col text-left w-full">
            <Clock size={32} className="text-blue-600 mb-2" />
          <h2 className="font-semibold mb-1">Protocolo</h2>
            <p className="text-sm text-gray-600">Momentos especiales, Timing, Checklist y Documentos legales</p>
          </button>
          {openMenu==='protocolo' && (
            <div className="absolute bg-white border border-gray-200 rounded shadow mt-2 w-full z-10" onMouseEnter={pfProtocoloMenu} onFocus={pfProtocoloMenu} onTouchStart={pfProtocoloMenu}>
              <Link to="/protocolo/momentos-especiales" className="block px-4 py-2 hover:bg-gray-100">Momentos especiales</Link>
              <Link to="/protocolo/timing" className="block px-4 py-2 hover:bg-gray-100">Timing</Link>
              <Link to="/protocolo/checklist" className="block px-4 py-2 hover:bg-gray-100">Checklist</Link>
              <Link to="/protocolo/ayuda-ceremonia" className="block px-4 py-2 hover:bg-gray-100">Ayuda Ceremonia</Link>
              <Link to="/protocolo/documentos" className="block px-4 py-2 hover:bg-gray-100">Documentos</Link>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu==='extras'?null:'extras')} className="bg-white p-4 rounded shadow hover:shadow-md flex flex-col text-left w-full">
            <Layers size={32} className="text-blue-600 mb-2" />
            <h2 className="font-semibold mb-1">Extras</h2>
            <p className="text-sm text-gray-600">Diseño web e ideas</p>
          </button>
          {openMenu==='extras' && (
            <div className="absolute bg-white border border-gray-200 rounded shadow mt-2 w-full z-10" onMouseEnter={pfExtrasMenu} onFocus={pfExtrasMenu} onTouchStart={pfExtrasMenu}>
              <Link to="/diseno-web" className="block px-4 py-2 hover:bg-gray-100">Diseño Web</Link>
              <Link to="/disenos" className="block px-4 py-2 hover:bg-gray-100">Diseños</Link>
              <Link to="/ideas" className="block px-4 py-2 hover:bg-gray-100">Ideas</Link>
              <Link to="/inspiracion" className="block px-4 py-2 hover:bg-gray-100">Galería de Inspiración</Link>
              <Link to="/blog" className="block px-4 py-2 hover:bg-gray-100">Blog</Link>
            </div>
          )}
        </div>
      </div>

      {/* Notificaciones Push */}
      <div className="bg-white rounded shadow p-4 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold mb-1">Notificaciones Push</h2>
            <p className="text-sm text-gray-600">
              {pushSupported ? 'Recibe avisos de nuevos correos y eventos.' : 'Este navegador no soporta notificaciones push.'}
            </p>
          </div>
          {pushSupported && (
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded ${pushEnabled ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} ${pushBusy ? 'opacity-60' : ''}`}
                onClick={handleTogglePush}
                disabled={pushBusy}
              >
                {pushEnabled ? 'Desactivar' : 'Activar'}
              </button>
              <button className="px-3 py-1 rounded border" onClick={handleTestPush} disabled={!pushEnabled || pushBusy}>
                Probar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
