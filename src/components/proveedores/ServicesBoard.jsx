import { Camera, Utensils, Music2, Flower2, Video, Sparkles, ShoppingBag } from 'lucide-react';
import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';

const serviceIcon = (service = '') => {
  const { t } = useTranslations();

  const s = String(service || '').toLowerCase();
  if (s.includes('foto')) return Camera;
  if (s.includes('video')) return Video;
  if (s.includes('cater') || s.includes('comida')) return Utensils;
  if (s.includes('musi') || s.includes('dj')) return Music2;
  if (s.includes('flor') || s.includes('deco')) return Flower2;
  return ShoppingBag;
};

const statusMeta = (estado = '') => {
  const e = String(estado || '').toLowerCase();
  if (e.includes('contrat')) return { color: '#16a34a20', border: '#16a34a', label: 'Contratado' };
  if (e.includes('presup')) return { color: '#0ea5e920', border: '#0ea5e9', label: 'Presupuestos' };
  if (e.includes('negoci') || e.includes('contact')) return { color: '#f59e0b20', border: '#f59e0b', label: 'En proceso' };
  if (e.includes('rechaz')) return { color: '#ef444420', border: '#ef4444', label: 'Rechazado' };
  return { color: 'transparent', border: '#9ca3af', label: t('common.vacio') };
};

export default function ServicesBoard({ proveedores = [], onOpenSearch, onOpenNew, onOpenAI }) {
  // Agrupar por servicio
  const byService = (proveedores || []).reduce((m, p) => {
    const key = p.service || p.servicio || 'Otros';
    if (!m.has(key)) m.set(key, []);
    m.get(key).push(p);
    return m;
  }, new Map());

  const cards = Array.from(byService.entries()).map(([serv, list]) => {
    // Estado dominante por este servicio (simple: el "más avanzado")
    const rank = (estado = '') => {
      const e = String(estado || '').toLowerCase();
      if (e.includes('contrat')) return 4;
      if (e.includes('presup')) return 3;
      if (e.includes('negoci') || e.includes('contact')) return 2;
      if (e.includes('rechaz')) return 0;
      return 1; // vacío / nuevo
    };
    const best = list.reduce((acc, p) => (rank(p.estado || p.status) > rank(acc?.estado || acc?.status) ? p : acc), list[0] || {});
    const meta = statusMeta(best?.estado || best?.status);

    // Totales financieros (si existen campos)
    const asignado = list.reduce(
      (s, p) => s + (parseFloat(p.assignedBudget ?? p.presupuestoAsignado) || 0),
      0
    );
    const gastado = list.reduce((s, p) => s + (parseFloat(p.spent ?? p.gastado) || 0), 0);

    const Icon = serviceIcon(serv);
    const nextAction = best?.nextAction || best?.proximaAccion || '';
    return { serv, meta, asignado, gastado, list, Icon, next: nextAction };
  });

  // Servicios "vacíos" (si se desea mostrar placeholders): omitido por simplicidad

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.serv} className="rounded-lg border p-4 bg-white/80" style={{ borderColor: c.meta.border, background: c.meta.color }}>
          <div className="flex items-center gap-2 mb-2">
            <c.Icon className="h-5 w-5" />
            <div className="font-semibold">{c.serv}</div>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: c.meta.border }}>{c.meta.label}</span>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-4">
            <div>
              <div className="font-medium">Asignado</div>
              <div>€ {c.asignado.toFixed(0)}</div>
            </div>
            <div>
              <div className="font-medium">Gastado</div>
              <div>€ {c.gastado.toFixed(0)}</div>
            </div>
            {c.next && (
              <div className="ml-auto">
                <div className="font-medium">Próxima acción</div>
                <div className="truncate max-w-[140px]" title={c.next}>{c.next}</div>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => onOpenSearch?.(c.serv)}>Buscar</button>
            <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => onOpenAI?.(c.serv)}>IA</button>
            <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50 ml-auto" onClick={() => onOpenNew?.(c.serv)}>Añadir</button>
          </div>
        </div>
      ))}
    </div>
  );
}
