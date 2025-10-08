import {
  collection,
  onSnapshot,
  query,
  where,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageWrapper from '../components/PageWrapper';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import PageTabs from '../components/ui/PageTabs';
import { Progress } from '../components/ui/Progress';
import WeddingFormModal from '../components/WeddingFormModal';
import { useWedding } from '../context/WeddingContext';
import { db } from '../firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { performanceMonitor } from '../services/PerformanceMonitor';
import { createWedding } from '../services/WeddingService';

export default function Bodas() {
  const { currentUser, userProfile } = useAuth();
  const { activeWedding, setActiveWedding } = useWedding();
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tab, setTab] = useState('active');
  const navigate = useNavigate();

  const crearBoda = async (values) => {
    try {
      const weddingId = await createWedding(currentUser.uid, {
        name: values.name,
        weddingDate: values.date || '',
        location: values.location || '',
        banquetPlace: values.banquetPlace || '',
        ownerIds: [],
        plannerIds: [currentUser.uid],
        progress: 0,
        active: true,
        createdFrom: 'planner_dashboard',
      });
      performanceMonitor.logEvent('wedding_created', {
        weddingId,
        role: userProfile?.role || 'planner',
        source: 'planner_dashboard',
      });
      setActiveWedding(weddingId);
      navigate(`/bodas/${weddingId}`);
    } catch (err) {
      console.error('Error creando nueva boda:', err);
      alert('No se pudo crear la boda. Revise permisos.');
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, 'weddings'),
      where('plannerIds', 'array-contains', currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Enriquecer con weddingInfo del primer owner si faltan campos
      Promise.all(
        data.map(async (w) => {
          if ((w.name && w.weddingDate) || !Array.isArray(w.ownerIds) || w.ownerIds.length === 0)
            return w;
          try {
            const ownerId = w.ownerIds[0];
            const profileSnap = await getDoc(doc(db, 'users', ownerId));
            if (profileSnap.exists()) {
              const info = profileSnap.data().weddingInfo || {};
              return {
                ...w,
                name: w.name || info.coupleName || 'Boda sin nombre',
                date: w.weddingDate || info.date || '',
                location: w.location || info.celebrationPlace || info.ceremonyLocation || '',
              };
            }
          } catch (e) {
            console.warn('No se pudo obtener weddingInfo del owner', e);
          }
          return w;
        })
      ).then((list) => {
        const ordered = list.sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
        setWeddings(
          ordered.map((w) => ({
            id: w.id,
            name: w.name || 'Boda sin nombre',
            date: w.weddingDate || w.date || '',
            location: w.location || '',
            progress: w.progress ?? 0,
            active: w.active ?? true,
          }))
        );
        setLoading(false);
      });
    });
    return () => unsub();
  }, [currentUser]);

  const handleToggleActive = async (wed) => {
    const nextActive = !wed.active;
    const confirmMessage = nextActive
      ? '¿Restaurar esta boda y volver a marcarla como activa?'
      : '¿Archivar esta boda? Podrás restaurarla más adelante.';
    if (!window.confirm(confirmMessage)) return;
    try {
      const wedRef = doc(db, 'weddings', wed.id);
      await updateDoc(wedRef, {
        active: nextActive,
        archivedAt: nextActive ? deleteField() : serverTimestamp(),
      });
      if (currentUser?.uid) {
        const subRef = doc(db, 'users', currentUser.uid, 'weddings', wed.id);
        await setDoc(
          subRef,
          {
            active: nextActive,
            archivedAt: nextActive ? deleteField() : new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      performanceMonitor.logEvent(nextActive ? 'wedding_restored' : 'wedding_archived', {
        weddingId: wed.id,
        role: userProfile?.role || 'planner',
        source: 'planner_dashboard',
      });
      if (!nextActive && activeWedding === wed.id) {
        setActiveWedding('');
      }
    } catch (err) {
      console.error('No se pudo actualizar el estado de la boda', err);
      alert('No se pudo actualizar el estado de la boda. Intenta nuevamente.');
    }
  };

  const activeWeddings = weddings.filter((w) => w.active !== false);
  const archivedWeddings = weddings.filter((w) => w.active === false);
  const weddingsToShow = tab === 'active' ? activeWeddings : archivedWeddings;

  if (loading) {
    return <p>Cargando bodas...</p>;
  }

  return (
    <PageWrapper
      title="Mis Bodas"
      actions={
        userProfile?.role === 'planner' ? (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            + Crear nueva boda
          </Button>
        ) : null
      }
      className="max-w-7xl mx-auto"
    >
      {/* Tabs */}
      <PageTabs
        value={tab}
        onChange={setTab}
        options={[
          { id: 'active', label: 'Bodas activas' },
          { id: 'archived', label: 'Bodas archivadas' },
        ]}
        className="mb-4"
      />

      {weddingsToShow.length === 0 ? (
        <p>No tienes bodas asignadas todavía.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {weddingsToShow.map((wed) => (
            <Card
              key={wed.id}
              className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
              onClick={() => {
                setActiveWedding(wed.id);
                navigate(`/bodas/${wed.id}`);
              }}
            >
              <div className="space-y-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--color-text)]">
                      {wed.name}
                    </h2>
                    <p className="text-sm text-muted">
                      {wed.date} · {wed.location}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      wed.active !== false
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {wed.active !== false ? 'Activa' : 'Archivada'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="absolute top-0 right-0 translate-y-10"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleActive(wed);
                  }}
                >
                  {wed.active !== false ? 'Archivar' : 'Restaurar'}
                </Button>
              </div>
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progreso</span>
                  <span className="font-medium">{wed.progress}%</span>
                </div>
                <Progress value={wed.progress} className="h-2" />
              </div>
            </Card>
          ))}
        </div>
      )}
      <WeddingFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={crearBoda}
      />
    </PageWrapper>
  );
}
