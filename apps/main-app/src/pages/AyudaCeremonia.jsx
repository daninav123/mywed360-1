import { MessageSquare, Clock, RefreshCcw, User, Mail, Moon, LogOut } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/ui/LanguageSelector';
import Nav from '../components/Nav';
import NotificationCenter from '../components/NotificationCenter';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../hooks/useAuth.jsx';
import useWeddingData from '../hooks/useWeddingData';
import { EVENT_TYPE_LABELS } from '../config/eventStyles';
const CEREMONY_MOMENTS = [
  { name: 'Ceremonia', items: ['Entrada', 'Lectura de votos', 'Intercambio de anillos'] },
  { name: 'Cocktail', items: ['Aperitivos', 'Brindis'] },
  { name: 'Banquete', items: ['Primer plato', 'Segundo plato', 'Postre'] },
  { name: 'Fiesta', items: ['Primer baile', 'DJ set', 'Cierre'] },
];

const GENERIC_MOMENTS = [
  { name: 'Bienvenida', items: ['Introducción', 'Mensaje del anfitrión', 'Agenda del día'] },
  { name: 'Actividad principal', items: ['Presentación', 'Dinámica', 'Reconocimientos'] },
  { name: 'Celebración', items: ['Brindis', 'Entretenimiento', 'Cierre del evento'] },
];

export default function AyudaCeremonia() {
  const { t } = useTranslation('pages');
  const { userProfile, hasRole, isLoading, logout: logoutUnified } = useAuth();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const allowed =
    hasRole('owner', 'pareja', 'assistant', 'ayudante', 'planner', 'wedding_planner', 'admin') ||
    userProfile?.role === 'assistant';

  const { info: activeWedding, loading: loadingWedding } = useActiveWeddingInfo();
  const eventType = (activeWedding?.eventType || 'boda').toLowerCase();
  const eventLabel = EVENT_TYPE_LABELS[eventType] || 'Evento';
  const isBoda = eventType === 'boda';
  const pageTitle = isBoda ? 'Ayuda Ceremonia' : 'Guion del evento';
  const sectionTitle = isBoda ? 'Momentos de la ceremonia' : 'Momentos destacados';
  const blocks = useMemo(() => (isBoda ? CEREMONY_MOMENTS : GENERIC_MOMENTS), [isBoda]);

  const [selectedMoment, setSelectedMoment] = useState('');
  const [text, setText] = useState('');
  const [versions, setVersions] = useState([]);
  const [previewTime, setPreviewTime] = useState(0);

  useEffect(() => {
    if (text) {
      const words = text.trim().split(/\s+/).length;
      const speed = 200;
      setPreviewTime((words / speed).toFixed(2));
    } else {
      setPreviewTime(0);
    }
  }, [text]);

  const handleSaveVersion = () => {
    if (!text.trim()) return;
    const version = { id: Date.now(), timestamp: new Date().toISOString(), text, moment: selectedMoment };
    setVersions((prev) => [version, ...prev]);
  };

  const handleRevert = (version) => {
    setText(version.text);
    setSelectedMoment(version.moment);
  };

  const handleAIAdjust = () => {
    // console.log('Ajustar con IA:', text);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm " className="text-secondary">
        Validando permisos…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6 text-sm " className="text-danger">
        Acceso denegado. Este asistente está disponible para owners, planners y asistentes del evento.
      </div>
    );
  }

  if (loadingWedding) {
    return (
      <div className="p-6 text-sm " className="text-secondary">
        Cargando datos del evento…
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
    <PageWrapper>
      <p className="text-sm text-muted mb-4">
        {isBoda
          ? 'Genera lecturas y guiones dinámicos para tu ceremonia.'
          : `Configura el guion del ${eventLabel.toLowerCase()} y comparte fragmentos con tu equipo.`}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <label className="text-sm font-medium">Momento:</label>
        <select
          value={selectedMoment}
          onChange={(e) => setSelectedMoment(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">Selecciona momento</option>
          {blocks.flatMap((block) =>
            block.items.map((item) => (
              <option key={`${block.name}-${item}`} value={`${block.name}|${item}`}>
                {block.name} - {item}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium block mb-1">{sectionTitle}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 border rounded p-2 text-sm"
          placeholder={t('ceremony.searchPlaceholder')} 
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleAIAdjust}
          className="bg-purple-600 text-white px-3 py-1 rounded flex items-center text-sm"
        >
          <MessageSquare className="mr-1" size={16} /> Ajustar con IA
        </button>
        <button
          onClick={handleSaveVersion}
          className=" text-white px-3 py-1 rounded flex items-center text-sm" style={{ backgroundColor: 'var(--color-success)' }}
        >
          <RefreshCcw className="mr-1" size={16} /> Guardar versión
        </button>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="font-semibold text-base">Vista previa</h3>
        <div className="flex items-center gap-1 text-sm " className="text-secondary">
          <Clock size={14} />
          <span>Tiempo estimado: {previewTime} min</span>
        </div>
        <div
          className={`p-3 border rounded text-sm ${
            previewTime <= 2 ? 'bg-green-100' : previewTime <= 3 ? 'bg-blue-100' : 'bg-red-100'
          }`}
        >
          {text.trim() || 'Sin texto.'}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-base mb-2">Historial de versiones</h3>
        <ul className="space-y-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between border rounded px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {new Date(version.timestamp).toLocaleString('es-ES')}
                </p>
                {version.moment && <p className="" className="text-muted">{version.moment.replace('|', ' · ')}</p>}
              </div>
              <button
                onClick={() => handleRevert(version)}
                className=" hover:underline text-sm" className="text-primary"
              >
                Revertir
              </button>
            </li>
          ))}
          {versions.length === 0 && (
            <li className="text-sm " className="text-muted">Aún no has guardado versiones.</li>
          )}
        </ul>
      </div>
    
    
  );
}
