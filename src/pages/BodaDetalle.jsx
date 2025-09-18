import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import PageWrapper from '../components/PageWrapper';

function formatDateEs(dateVal) {
  if (!dateVal) return '';
  try {
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('es-ES');
    return new Date(dateVal).toLocaleDateString('es-ES');
  } catch {
    return '';
  }
}

export default function BodaDetalle() {
  const { id } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const DESIGN_ITEMS = [
    { key: 'web', label: 'Página web' },
    { key: 'invitacion', label: 'Invitaciones' },
    { key: 'seating', label: 'Seating plan' },
    { key: 'menu', label: 'Menú' },
    { key: 'logo', label: 'Logo' },
  ];

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'weddings', id), (snap) => {
      const data = snap.exists() ? snap.data() : {};
      setWedding({
        id: snap.id,
        name: data.name || data.coupleName || 'Boda sin nombre',
        date: data.weddingDate || data.date || '',
        location: data.location || data.venue || '',
        progress: Number.isFinite(data.progress) ? data.progress : 0,
        guests: Array.isArray(data.guests) ? data.guests : [],
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
        designs: Array.isArray(data.designs) ? data.designs : [],
        documents: Array.isArray(data.documents) ? data.documents : [],
      });
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id]);

  if (loading) return <p>Cargando detalle...</p>;
  if (!wedding) return <p>No se encontró la boda.</p>;

  const pendingTasks = (wedding.tasks || []).filter(t => !t.done).length;

  return (
    <PageWrapper title={wedding.name?.trim() ? wedding.name : 'Boda sin nombre'} className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-[var(--color-accent)] hover:underline">
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <p className="text-muted mt-1">
        {formatDateEs(wedding.date)}{wedding.location ? ` • ${wedding.location}` : ''}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card className="text-center cursor-pointer" onClick={() => navigate('/invitados')}>
          <p className="text-sm text-muted">Invitados</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{(wedding.guests || []).length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-muted">Tareas pendientes</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{pendingTasks}</p>
        </Card>
        <Card className="text-center cursor-pointer" onClick={() => navigate('/proveedores')}>
          <p className="text-sm text-muted">Proveedores</p>
          <p className="text-2xl font-bold text-[color:var(--color-text)]">{(wedding.suppliers || []).length}</p>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progreso</span>
          <span className="font-medium">{wedding.progress}%</span>
        </div>
        <Progress value={wedding.progress} className="h-3" />
      </div>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Diseños</h2>
        <ul className="space-y-1">
          {DESIGN_ITEMS.map((item) => {
            const done = (wedding.designs || []).some((d) => String(d.type || '').toLowerCase().includes(item.key));
            return (
              <li key={item.key} className="flex items-center bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
                {done ? (
                  <CheckCircle className="text-[var(--color-success)] w-5 h-5 mr-2" />
                ) : (
                  <Circle className="text-[color:var(--color-text)]/40 w-5 h-5 mr-2" />
                )}
                <span className={done ? 'text-[var(--color-success)] font-medium' : 'text-body'}>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Documentos</h2>
        <ul className="space-y-1">
          {(wedding.documents || []).map((d) => (
            <li key={d.id || d.name} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
              <span>{d.name}</span>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
              )}
            </li>
          ))}
          {(!wedding.documents || wedding.documents.length === 0) && (
            <li className="text-sm text-muted">Sin documentos</li>
          )}
        </ul>
      </section>
    </PageWrapper>
  );
}

