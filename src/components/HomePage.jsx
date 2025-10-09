import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
const normalizeLang = (l) =>
  String(l || 'es')
    .toLowerCase()
    .match(/^[a-z]{2}/)?.[0] || 'es';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// import anterior eliminado: useUserContext
import { getBackendBase } from '@/utils/backendBase.js';

import ExternalImage from './ExternalImage';
import Input from './Input';
import Nav from './Nav';
import PlannerDashboard from './PlannerDashboard';
import ProviderSearchModal from './ProviderSearchModal';
import { useAuth } from '../hooks/useAuth'; // Nuevo sistema
import { Card } from './ui/Card';
import { Progress } from './ui/Progress';

import {
  User,
  DollarSign,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
} from 'lucide-react';

import useFinance from '../hooks/useFinance';
import { fetchWeddingNews } from '../services/blogService';
import { fetchWall } from '../services/wallService';

export default function HomePage() {
  // Todo se maneja con modales locales
  const [noteText, setNoteText] = useState('');
  const [guest, setGuest] = useState({ name: '', side: 'novia', contact: '' });
  const [newMovement, setNewMovement] = useState({
    concept: '',
    amount: 0,
    date: '',
    type: 'expense',
  });
  const [activeModal, setActiveModal] = useState(null);
  // Hook de autenticacin unificado
  const { hasRole, userProfile, currentUser } = useAuth();

  // Derivados equivalentes al antiguo UserContext
  const role = userProfile?.role || 'particular';
  const displayName =
    userProfile?.name ||
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '';
  const weddingName = localStorage.getItem('mywed360_active_wedding_name') || '';
  const progress = Number(localStorage.getItem('mywed360_progress') || 0);
  const logoUrl = userProfile?.logoUrl || '';

  // Datos derivados ya calculados ms arriba
  const email = currentUser?.email || '';

  // Si el usuario es Wedding Planner mostramos dashboard especfico
  if (role === 'planner') {
    return <PlannerDashboard />;
  }
  const galleryRef = useRef(null);
  const [newsPosts, setNewsPosts] = useState([]);
  const [categoryImages, setCategoryImages] = useState([]);
  const { i18n } = useTranslation();
  const lang = normalizeLang(i18n.language);
  const backendBase = getBackendBase();
  // Visual mode toggle similar a Blog
  const visualMode = useMemo(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      if (usp.has('visual')) return usp.get('visual') !== '0';
      if (typeof localStorage !== 'undefined' && localStorage.getItem('newsVisual') === '1') return true;
      if (import.meta?.env?.VITE_NEWS_VISUAL === '1') return true;
    } catch {}
    return false;
  }, []);

  // Cargar primera imagen de cada categora
  useEffect(() => {
    const categories = ['decoracin', 'cctel', 'banquete', 'ceremonia'];
    Promise.all(categories.map((cat) => fetchWall(1, cat)))
      .then((results) => {
        const imgs = results
          .map((arr, i) => {
            const first = arr[0];
            if (first) return { src: first.url, alt: categories[i] };
            return null;
          })
          .filter(Boolean);
        setCategoryImages(imgs);
      })
      .catch(console.error);
  }, []);

  // Cargar ltimas noticias (mx 3 por dominio y 4 con imagen)
  useEffect(() => {
    const loadNews = async () => {
      const desired = 4;
      let page = 1;
      const results = [];
      const domainCounts = {};
      const PER_DOMAIN_LIMIT = 1;
      let consecutiveErrors = 0;

      const hasHttpImage = (p) => typeof p?.image === 'string' && /^https?:\/\//i.test(p.image);
      const isLikelyCover = (url, feedSource) => {
        try {
          const u = new URL(url);
          const host = u.hostname.replace(/^www\./, '').toLowerCase();
          const path = (u.pathname || '').toLowerCase();
          if (/\.svg(\?|$)/i.test(url)) return false;
          const blockHosts = new Set(['gstatic.com', 'ssl.gstatic.com', 'googleusercontent.com']);
          if (host === 'news.google.com' || blockHosts.has(host)) return false;
          const patterns = ['logo', 'favicon', 'sprite', 'placeholder', 'default', 'brand', 'apple-touch-icon', 'android-chrome'];
          if (patterns.some((p) => path.includes(p))) return false;
          return true;
        } catch { return true; }
      };
      while (results.length < desired && page <= 20) {
        try {
          const batch = await fetchWeddingNews(page, 10, lang);
          consecutiveErrors = 0;
          for (const post of batch) {
            if (!post?.url || !hasHttpImage(post)) continue;
            if (visualMode && !isLikelyCover(post.image, post.feedSource)) continue;
            const dom = (() => {
              try {
                return new URL(post.url).hostname.replace(/^www\./, '');
              } catch {
                return 'unk';
              }
            })();
            if ((domainCounts[dom] || 0) >= PER_DOMAIN_LIMIT) continue;
            if (results.some((x) => x.url === post.url)) continue;
            domainCounts[dom] = (domainCounts[dom] || 0) + 1;
            results.push(post);
            if (results.length >= desired) break;
          }
        } catch (err) {
          console.error(err);
          consecutiveErrors++;
          if (consecutiveErrors >= 3 && results.length) break;
        } finally {
          page++;
        }
      }

      // Sin fallback a EN: respetar idioma del usuario

      // Sin placeholders: solo mantener items con imagen real (ya filtrado arriba)
      setNewsPosts(results.slice(0, desired));
    };
    loadNews();
  }, [lang]);

  const handleRedoTutorial = useCallback(async () => {
    if (!confirm('Esto eliminar datos locales y crear una nueva boda de prueba. Continuar?'))
      return;
    try {
      // 1. Limpiar almacenamiento y marcar flag para mostrar tutorial
      localStorage.clear();
      localStorage.setItem('forceOnboarding', '1');

      toast.success('Tutorial reiniciado: recargando...');
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo reiniciar el tutorial');
    }
  }, []);
  const scrollAmount = 300;

  const scrollPrev = useCallback(() => {
    galleryRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }, []);

  const scrollNext = useCallback(() => {
    galleryRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, []);

  // --- Mtricas dinmicas (memoizadas para performance) ---
  const guestsMetrics = useMemo(() => {
    try {
      const guestsArr = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
      const confirmedCount = guestsArr.filter(
        (g) => (g.response || g.status || '').toLowerCase() === 'confirmado'
      ).length;
      return { guestsArr, confirmedCount, totalGuests: guestsArr.length };
    } catch {
      return { guestsArr: [], confirmedCount: 0, totalGuests: 0 };
    }
  }, []);

  const tasksMetrics = useMemo(() => {
    try {
      const tasksCompletedMap = JSON.parse(localStorage.getItem('tasksCompleted') || '{}');
      const meetingsArr = JSON.parse(localStorage.getItem('mywed360Meetings') || '[]');
      const longTasksArr = JSON.parse(localStorage.getItem('lovendaLongTasks') || '[]');
      const allTasks = [...meetingsArr, ...longTasksArr];
      const tasksTotal = allTasks.length;
      const tasksCompleted = allTasks.filter((t) => tasksCompletedMap[t.id]).length;
      return { tasksTotal, tasksCompleted };
    } catch {
      return { tasksTotal: 0, tasksCompleted: 0 };
    }
  }, []);

  const providersMetrics = useMemo(() => {
    try {
      const providersArr = JSON.parse(localStorage.getItem('lovendaProviders') || '[]');
      const providersTotalNeeded = 8; // puede venir de ajustes
      const providersAssigned = providersArr.length;
      return { providersAssigned, providersTotalNeeded };
    } catch {
      return { providersAssigned: 0, providersTotalNeeded: 8 };
    }
  }, []);

  const { stats: financeStats } = useFinance();
  const financeSpent = Number(financeStats?.totalSpent || 0);
  const budgetTotal = Number(financeStats?.totalBudget || 0);

  const statsNovios = useMemo(
    () => [
      { label: 'Invitados confirmados', value: guestsMetrics.confirmedCount, icon: Users },
      {
        label: 'Presupuesto gastado',
        value:
          `${financeSpent.toLocaleString()}` +
          (budgetTotal ? ` / ${budgetTotal.toLocaleString()}` : ''),
        icon: DollarSign,
      },
      {
        label: 'Proveedores contratados',
        value: `${providersMetrics.providersAssigned} / ${providersMetrics.providersTotalNeeded}`,
        icon: User,
      },
      {
        label: 'Tareas completadas',
        value: `${tasksMetrics.tasksCompleted} / ${tasksMetrics.tasksTotal}`,
        icon: Calendar,
      },
    ],
    [guestsMetrics, financeSpent, providersMetrics, tasksMetrics, budgetTotal]
  );

  const statsPlanner = useMemo(
    () => [
      { label: 'Tareas asignadas', value: `${tasksMetrics.tasksTotal}`, icon: Calendar },
      { label: 'Proveedores asignados', value: providersMetrics.providersAssigned, icon: User },
      { label: 'Invitados confirmados', value: guestsMetrics.confirmedCount, icon: Users },
      {
        label: 'Presupuesto gastado',
        value:
          `${financeSpent.toLocaleString()}` +
          (budgetTotal ? ` / ${budgetTotal.toLocaleString()}` : ''),
        icon: DollarSign,
      },
    ],
    [guestsMetrics, financeSpent, providersMetrics, tasksMetrics, budgetTotal]
  );

  const statsCommon = useMemo(
    () => (role === 'particular' ? statsNovios : statsPlanner),
    [role, statsNovios, statsPlanner]
  );

  return (
    <React.Fragment>
      {/* Botn solo visible en desarrollo */}
      {true && (
        <button
          onClick={handleRedoTutorial}
          className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-[100]"
        >
          Rehacer tutorial
        </button>
      )}
      <div className="relative flex flex-col h-full bg-[var(--color-bg)] pb-16">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent)] rounded-full opacity-20 transform translate-x-1/2 -translate-y-1/2" />

        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="page-title">
              Bienvenidos, {weddingName}
              {weddingName && displayName ? ' y ' : ''}
              {displayName}
            </h1>
            <p className="text-4xl font-bold text-[color:var(--color-text)]">
              Cada detalle hace tu boda inolvidable
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/diseno-web"
              state={{ focus: 'generator' }}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-transform hover:-translate-y-0.5"
            >
              Publica tu sitio
            </Link>
            <img
              src={`${import.meta.env.BASE_URL}logo-app.png`}
              alt="Logo de la boda"
              className="w-32 h-32 object-contain"
            />
          </div>
        </header>

        {/* Progress Section */}
        <section className="z-10 w-full p-6">
          <Card className="bg-[var(--color-surface)]/70 backdrop-blur-md p-4 w-full">
            <p className="text-sm text-[color:var(--color-text)]/70 mb-2">Progreso de tareas</p>
            <Progress
              className="h-4 rounded-full w-full"
              value={progress}
              max={100}
              variant={progress >= 100 ? 'success' : progress >= 80 ? 'primary' : 'destructive'}
            />
            <p className="mt-2 text-sm font-medium text-[color:var(--color-text)]">
              {progress}% completado
            </p>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="z-10 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {[
            { key: 'proveedor', label: 'Buscar proveedor', icon: User },
            { key: 'invitado', label: 'Añadir invitado', icon: Users },
            { key: 'movimiento', label: 'Añadir movimiento', icon: DollarSign },
            { key: 'nota', label: 'Nueva nota', icon: Plus },
          ].map((action, idx) => {
            const Icon = action.icon;
            return (
              <Card
                key={idx}
                role="button"
                onClick={() => setActiveModal(action.key)}
                className="flex items-center justify-between p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="text-[var(--color-primary)]" />
                  <span className="text-[color:var(--color-text)] font-medium">{action.label}</span>
                </div>
                <ChevronRight className="text-[color:var(--color-text)]/50" />
              </Card>
            );
          })}
        </section>

        {/* Stats Cards */}
        <section className="z-10 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-grow">
          {statsCommon.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card
                key={idx}
                className="p-4 bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition transform hover:scale-105"
              >
                <div className="flex items-center space-x-2">
                  <Icon className="text-[var(--color-primary)]" />
                  <p className="text-sm text-[color:var(--color-text)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-extrabold text-[var(--color-primary)] mt-2">
                  {stat.value}
                </p>
              </Card>
            );
          })}
        </section>

        {/* Inspiration Gallery */}
        <section className="z-10 p-6 pb-12 relative">
          <div className="flex justify-between items-center mb-4">
            <Link to="/inspiracion">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Inspiracin para tu boda
              </button>
            </Link>
            <div className="flex space-x-2">
              <button
                onClick={scrollPrev}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronLeft className="text-[var(--color-primary)]" />
              </button>
              <button
                onClick={scrollNext}
                className="p-2 rounded-full bg-[var(--color-surface)]/80 backdrop-blur-md"
              >
                <ChevronRight className="text-[var(--color-primary)]" />
              </button>
            </div>
          </div>
          <div
            ref={galleryRef}
            className="flex space-x-4 overflow-x-auto pb-4 snap-x scrollbar-hide"
          >
            {categoryImages.map((img, idx) => (
              <div
                key={idx}
                className="snap-start flex-shrink-0 w-64 h-64 relative rounded-lg overflow-hidden"
              >
                <ExternalImage
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition transform hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <p className="text-white font-medium">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog Section */}
        <section className="z-10 p-6 pb-2">
          <div className="flex justify-between items-center mb-4">
            <Link to="/blog">
              <button className="text-xl font-bold text-[var(--color-text)] hover:text-[var(--color-primary)]">
                Blog
              </button>
            </Link>
          </div>
          {newsPosts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {newsPosts.map((post) => (
                <Card
                  key={post.id}
                  onClick={() => window.open(post.url, '_blank')}
                  className="cursor-pointer p-0 overflow-hidden bg-[var(--color-surface)]/80 backdrop-blur-md hover:shadow-lg transition"
                >
                  {post.image && (
                    <ExternalImage
                      src={post.image}
                      alt={post.title}
                      className="w-full h-40 object-cover"
                      requireCover={true}
                      minWidth={visualMode ? 900 : 600}
                      minHeight={visualMode ? 500 : 300}
                      extraBlockHosts={post.feedSource === 'google-news' ? ['news.google.com','gstatic.com','ssl.gstatic.com','googleusercontent.com'] : []}
                    />
                  )}
                  <div className="p-4 space-y-1">
                    <h3 className="font-semibold text-[color:var(--color-text)] line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text)]/70 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="pt-2 text-xs text-[var(--color-text)]/60 border-t border-[var(--color-text)]/10">
                      Fuente:{' '}
                      {post.source ||
                        (post.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Nav active="home" />
      </div>

      {/* Modales */}
      {activeModal === 'proveedor' && <ProviderSearchModal onClose={() => setActiveModal(null)} />}

      {activeModal === 'invitado' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Añadir Invitado</h2>
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Parte de</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded"
                    value={guest.side}
                    onChange={(e) => setGuest({ ...guest, side: e.target.value })}
                  >
                    <option value="novia">Novia</option>
                    <option value="novio">Novio</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <Input
                  label="Contacto"
                  value={guest.contact}
                  onChange={(e) => setGuest({ ...guest, contact: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const guests = JSON.parse(localStorage.getItem('mywed360Guests') || '[]');
                  guests.push({ ...guest, id: Date.now() });
                  localStorage.setItem('mywed360Guests', JSON.stringify(guests));
                  setGuest({ name: '', side: 'novia', contact: '' });
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'movimiento' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nuevo Movimiento</h2>
            <div className="space-y-4">
              <Input
                label="Concepto"
                value={newMovement.concept}
                onChange={(e) => setNewMovement({ ...newMovement, concept: e.target.value })}
              />
              <Input
                label="Cantidad ()"
                type="number"
                value={newMovement.amount}
                onChange={(e) =>
                  setNewMovement({ ...newMovement, amount: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Fecha"
                type="date"
                value={newMovement.date}
                onChange={(e) => setNewMovement({ ...newMovement, date: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({ ...newMovement, type: e.target.value })}
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const movs = JSON.parse(localStorage.getItem('quickMovements') || '[]');
                  movs.push({ ...newMovement, id: Date.now() });
                  localStorage.setItem('quickMovements', JSON.stringify(movs));
                  setNewMovement({ concept: '', amount: 0, date: '', type: 'expense' });
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'nota' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Nueva Nota</h2>
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded h-32"
                placeholder="Escribe tu nota aqu..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-[var(--color-text)] border border-[var(--color-text)]/20 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const notes = JSON.parse(localStorage.getItem('lovendaNotes') || '[]');
                  notes.push({ text: noteText, id: Date.now() });
                  localStorage.setItem('lovendaNotes', JSON.stringify(notes));
                  setNoteText('');
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

