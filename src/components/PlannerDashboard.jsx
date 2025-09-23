import { Briefcase, AlertCircle, CheckSquare, Building2 } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Card } from './ui/Card';
import { useWedding } from '../context/WeddingContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';

// Tarjeta reutilizable
const DashCard = ({ to, icon: Icon, title, count }) => (
  <Link to={to} className="flex-1 min-w-[150px]">
    <Card className="flex flex-col items-center hover:bg-gray-50 transition-colors">
      <Icon className="w-8 h-8 text-rose-500 mb-2" />
      <span className="text-lg font-semibold mb-1 text-gray-800">{title}</span>
      {typeof count === 'number' && (
        <span className="text-2xl font-bold text-gray-700">{count}</span>
      )}
    </Card>
  </Link>
);

export default function PlannerDashboard() {
  /*
   * Panel para Wedding Planner alineado visualmente con el Dashboard particular.
   * Se envuelve en un contenedor con paddings y ancho máximo, igual que el Dashboard estándar.
   */
  const { weddings, activeWedding } = useWedding();
  const { data: meetings = [] } = useFirestoreCollection('meetings', []);
  const { data: suppliersList = [] } = useFirestoreCollection('suppliers', []);
  const activeWeddings = Array.isArray(weddings) ? weddings.length : 0;
  const alerts = 0; // pendiente de implementar alertas reales
  const pendingTasks = Array.isArray(meetings) ? meetings.filter((m) => !m.completed).length : 0;
  const suppliers = Array.isArray(suppliersList) ? suppliersList.length : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Wedding Planner</h1>

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <DashCard to="/bodas" icon={Briefcase} title="Bodas activas" count={activeWeddings} />
        <DashCard to="/alertas" icon={AlertCircle} title="Alertas" count={alerts} />
        <DashCard to="/tasks" icon={CheckSquare} title="Tareas" count={pendingTasks} />
        <DashCard to="/proveedores" icon={Building2} title="Proveedores" count={suppliers} />
      </div>

      {/* Galería de inspiración / imágenes */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Inspiración reciente</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-full h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>

      {/* Blogs destacados */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Blogs destacados</h2>
        <ul className="space-y-2">
          {[1, 2, 3].map((n) => (
            <li key={n} className="bg-white rounded shadow p-3 hover:bg-gray-50">
              <Link to={`/blog/post-${n}`}>Título del blog {n}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
