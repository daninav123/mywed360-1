import React, { useEffect, useMemo, useState } from 'react';

import Modal from '../Modal';

const INVITES_STORAGE_KEY = 'maloveapp_team_invites';
const CODES_STORAGE_KEY = 'maloveapp_team_codes';

const DEFAULT_PLANNERS = [
  {
    id: 'planner-demo-1',
    name: 'Maria Lopez',
    city: 'Madrid',
    rating: 4.9,
    weddingsActive: 2,
    tags: ['boho', 'destination'],
    specialties: [],
    email: 'maria.lopez@demo-planners.test',
    phone: '',
    website: '',
  },
  {
    id: 'planner-demo-2',
    name: 'Claudia Vila',
    city: 'Barcelona',
    rating: 4.7,
    weddingsActive: 1,
    tags: ['urbano', 'moderno'],
    specialties: [],
    email: 'claudia.vila@demo-planners.test',
    phone: '',
    website: '',
  },
  {
    id: 'planner-demo-3',
    name: 'Daniel Romero',
    city: 'Valencia',
    rating: 4.8,
    weddingsActive: 3,
    tags: ['clásico', 'premium'],
    specialties: [],
    email: 'daniel.romero@demo-planners.test',
    phone: '',
    website: '',
  },
];

function readLocalStorage(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function normalizePlannerList(data) {
  if (!Array.isArray(data) || !data.length) return null;
  return data.map((planner, index) => ({
    id: planner.id || `planner-${index}`,
    name: planner.name || planner.displayName || `Planner ${index + 1}`,
    city: planner.city || planner.location || planner.baseCity || 'Ciudad',
    rating:
      typeof planner.rating === 'number'
        ? planner.rating
        : typeof planner.score === 'number'
        ? planner.score
        : null,
    weddingsActive:
      typeof planner.weddingsActive === 'number'
        ? planner.weddingsActive
        : typeof planner.activeWeddings === 'number'
        ? planner.activeWeddings
        : 0,
    tags: Array.isArray(planner.tags) ? planner.tags : Array.isArray(planner.styles) ? planner.styles : [],
    specialties: Array.isArray(planner.specialties)
      ? planner.specialties
      : Array.isArray(planner.services)
      ? planner.services
      : [],
    email: planner.email || planner.contactEmail || '',
    phone: planner.phone || planner.contactPhone || '',
    website: planner.website || planner.site || '',
  }));
}

export default function WeddingTeamModal({ open, onClose, weddingId, weddingName = 'Boda' }) {
  const [tab, setTab] = useState('planners');
  const [inviteFeedback, setInviteFeedback] = useState(null);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [plannerCandidates, setPlannerCandidates] = useState(DEFAULT_PLANNERS);
  const [plannersLoading, setPlannersLoading] = useState(false);
  const [plannersError, setPlannersError] = useState('');

  useEffect(() => {
    if (!open) return;
    let aborted = false;

    const loadPlanners = async () => {
      setPlannersLoading(true);
      setPlannersError('');
      try {
        // Permitir inyección de planners desde el harness de test (Cypress onBeforeLoad)
        if (typeof window !== 'undefined') {
          const injected = window.__TEAM_STUB__ && Array.isArray(window.__TEAM_STUB__.planners)
            ? window.__TEAM_STUB__.planners
            : null;
          if (!aborted && injected && injected.length) {
            const normalizedInjected = normalizePlannerList(injected);
            if (normalizedInjected && normalizedInjected.length) {
              setPlannerCandidates(normalizedInjected);
              setPlannersLoading(false);
              return; // No llamar al backend si se han inyectado planners de pruebas
            }
          }
        }

        const params = new URLSearchParams();
        if (weddingId) params.append('weddingId', weddingId);
        const url = `/api/planners/suggestions${params.size ? `?${params.toString()}` : ''}`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        if (aborted) return;
        const normalized = normalizePlannerList(payload);
        if (normalized && normalized.length) {
          setPlannerCandidates(normalized);
        } else {
          setPlannerCandidates(DEFAULT_PLANNERS);
          setPlannersError('No encontramos planners publicados aún. Mostramos opciones de demostración.');
        }
      } catch (error) {
        if (!aborted) {
          console.warn('[WeddingTeamModal] planner suggestions failed', error);
          setPlannerCandidates(DEFAULT_PLANNERS);
          setPlannersError('No pudimos cargar planners recomendados. Mostramos opciones de demostración.');
        }
      } finally {
        if (!aborted) setPlannersLoading(false);
      }
    };

    loadPlanners();
    return () => {
      aborted = true;
    };
  }, [open, weddingId]);

  const storedCodes = useMemo(() => {
    const codes = readLocalStorage(CODES_STORAGE_KEY, {});
    return codes && weddingId ? codes[weddingId] : null;
  }, [open, weddingId]);

  useEffect(() => {
    if (!open) return;
    if (storedCodes) {
      setGeneratedCode(storedCodes.code || null);
      setExpiresAt(storedCodes.expiresAt || null);
    } else {
      setGeneratedCode(null);
      setExpiresAt(null);
    }
    setInviteFeedback(null);
  }, [open, storedCodes]);

  const handleInvitePlanner = (planner) => {
    const entry = {
      weddingId,
      plannerId: planner.id,
      plannerEmail: planner.email,
      plannerName: planner.name,
      source: 'marketplace',
      timestamp: new Date().toISOString(),
    };
    const existing = readLocalStorage(INVITES_STORAGE_KEY, []);
    const updated = Array.isArray(existing) ? [...existing, entry] : [entry];
    writeLocalStorage(INVITES_STORAGE_KEY, updated);
    setInviteFeedback(`invitacion enviada a ${planner.name}`);
  };

  const generateCode = () => {
    const code = `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const existing = readLocalStorage(CODES_STORAGE_KEY, {});
    const payload = { ...(existing || {}) };
    payload[weddingId] = { code, expiresAt: expiration, role: 'planner' };
    writeLocalStorage(CODES_STORAGE_KEY, payload);
    setGeneratedCode(code);
    setExpiresAt(expiration);
    setInviteFeedback('Codigo generado y guardado para compartir.');
  };

  const tabs = [
    { id: 'planners', label: 'Seleccionar planner' },
    { id: 'code', label: 'codigo para planner externo' },
    { id: 'assistants', label: 'Invitar assistant' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Gestionar equipo - ${weddingName}`}
      size="xl"
      data-testid="wedding-team-modal"
    >
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              tab === t.id
                ? 'bg-[var(--color-primary)]/20 text-[color:var(--color-text)]'
                : 'bg-transparent text-[color:var(--color-text)]/70 hover:bg-[var(--color-primary)]/10'
            }`}
            onClick={() => {
              setTab(t.id);
              setInviteFeedback(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'planners' && (
        <div className="space-y-4" data-testid="marketplace-pane">
          <p className="text-sm text-[color:var(--color-text)]/70">
            Elige un planner certificado en la plataforma. Se enviara una invitacion automatica con los
            detalles de la boda.
          </p>
          {plannersError ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {plannersError}
            </div>
          ) : null}
          {plannersLoading ? (
            <div className="text-sm text-[color:var(--color-text)]/60">Cargando planners…</div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2" data-testid="marketplace-grid">
            {plannerCandidates.map((planner) => {
              const ratingText =
                typeof planner.rating === 'number' ? `${planner.rating.toFixed(1)} ★` : '';
              const tags = Array.isArray(planner.tags) ? planner.tags : [];
              const specialties = Array.isArray(planner.specialties) ? planner.specialties : [];
              return (
                <div
                  key={planner.id}
                  className="border border-[color:var(--color-border)] rounded-lg p-4 space-y-2 shadow-sm bg-[var(--color-surface)]"
                  data-testid="planner-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-semibold text-[color:var(--color-text)]">
                        {planner.name}
                      </h4>
                      <span className="text-xs text-[color:var(--color-text)]/60">
                        {planner.city}
                        {ratingText ? ` | ${ratingText}` : ''}
                      </span>
                    </div>
                    <span className="text-xs text-[color:var(--color-text)]/50">
                      {planner.weddingsActive} bodas activas
                    </span>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1" data-testid="planner-tags">
                      {tags.map((tag) => (
                        <span
                          key={`${planner.id}-${tag}`}
                          className="text-[10px] uppercase tracking-wide bg-[var(--color-primary)]/10 text-[color:var(--color-text)]/70 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {specialties.length > 0 && (
                    <div className="text-xs text-[color:var(--color-text)]/60">
                      Especialidades: {specialties.join(', ')}
                    </div>
                  )}
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-sm font-semibold bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)]/80 transition"
                    onClick={() => handleInvitePlanner(planner)}
                    data-testid="invite-planner"
                  >
                    Invitar planner
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'code' && (
        <div className="space-y-4" data-testid="code-pane">
          <p className="text-sm text-[color:var(--color-text)]/70">
            Comparte este codigo con tu wedding planner externo. Podra introducirlo en su cuenta para vincularse
            automaticamente a la boda.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)]/80 transition text-sm font-semibold"
              onClick={generateCode}
              data-testid="generate-code"
            >
              {generatedCode ? 'Regenerar codigo' : 'Generar codigo'}
            </button>
            {generatedCode ? (
              <div className="text-sm font-mono bg-[var(--color-accent)]/20 px-3 py-2 rounded-md">
                <span data-testid="generated-code">{generatedCode}</span>
                {expiresAt ? (
                  <span className="ml-2 text-xs text-[color:var(--color-text)]/60" data-testid="code-expiration">
                    expira: {new Date(expiresAt).toLocaleDateString('es-ES')}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {tab === 'assistants' && (
        <div className="space-y-4" data-testid="assistant-pane">
          <p className="text-sm text-[color:var(--color-text)]/70">
            Los planners pueden sumar assistants internos para ayudar en la ejecucion diaria. Proximamente
            habilitaremos invitaciones automaticas desde aqui.
          </p>
          <div className="border border-dashed border-[color:var(--color-border)] rounded-lg p-4 text-sm text-[color:var(--color-text)]/60">
            Esta seccion esta en fase de diseno. Usala como referencia en tests y documentacion.
          </div>
        </div>
      )}

      {inviteFeedback ? (
        <div
          className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          data-testid="invite-feedback"
        >
          {inviteFeedback}
        </div>
      ) : null}
    </Modal>
  );
}
