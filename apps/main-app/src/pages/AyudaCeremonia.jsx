import { MessageSquare, Clock, RefreshCcw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../hooks/useAuth';
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
  const { userProfile, hasRole, isLoading } = useAuth();
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
      <div className="p-6 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
        Validando permisos…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6 text-sm " style={{ color: 'var(--color-danger)' }}>
        Acceso denegado. Este asistente está disponible para owners, planners y asistentes del evento.
      </div>
    );
  }

  if (loadingWedding) {
    return (
      <div className="p-6 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
        Cargando datos del evento…
      </div>
    );
  }

  return (
    
      
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
        <div className="flex items-center gap-1 text-sm " style={{ color: 'var(--color-text-secondary)' }}>
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
                {version.moment && <p className="" style={{ color: 'var(--color-muted)' }}>{version.moment.replace('|', ' · ')}</p>}
              </div>
              <button
                onClick={() => handleRevert(version)}
                className=" hover:underline text-sm" style={{ color: 'var(--color-primary)' }}
              >
                Revertir
              </button>
            </li>
          ))}
          {versions.length === 0 && (
            <li className="text-sm " style={{ color: 'var(--color-muted)' }}>Aún no has guardado versiones.</li>
          )}
        </ul>
      </div>
    
    
  );
}
