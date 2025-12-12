import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Heart,
  Sparkles,
  X
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../hooks/useAuth';

/**
 * Checklist de Setup Inicial - Onboarding Mejorado
 * Muestra el progreso del usuario en la configuración inicial
 */
const SetupChecklist = ({ onDismiss }) => {
  const { activeWedding, weddingData } = useWedding();
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!activeWedding || !weddingData) return;

    const checklistTasks = [
      {
        id: 'basic_info',
        title: 'Completa la información básica',
        description: 'Nombres de la pareja, fecha y lugar de la boda',
        icon: Heart,
        completed: !!(
          weddingData?.weddingInfo?.brideAndGroom &&
          weddingData?.weddingInfo?.weddingDate &&
          weddingData?.weddingInfo?.celebrationPlace
        ),
        link: '/configuracion',
        category: 'Datos básicos'
      },
      {
        id: 'add_guests',
        title: 'Añade tus primeros invitados',
        description: 'Al menos 5 invitados para empezar',
        icon: Users,
        completed: (weddingData?.guestCount || 0) >= 5,
        link: '/invitados',
        category: 'Invitados'
      },
      {
        id: 'set_budget',
        title: 'Define tu presupuesto',
        description: 'Establece el presupuesto total de la boda',
        icon: DollarSign,
        completed: !!(weddingData?.budget?.total && weddingData.budget.total > 0),
        link: '/presupuesto',
        category: 'Finanzas'
      },
      {
        id: 'add_venue',
        title: 'Registra el lugar de celebración',
        description: 'Añade el local o espacio de la boda',
        icon: MapPin,
        completed: !!(weddingData?.venue || weddingData?.weddingInfo?.celebrationPlace),
        link: '/proveedores',
        category: 'Proveedores'
      },
      {
        id: 'create_seating',
        title: 'Crea tu plano de mesas',
        description: 'Diseña la distribución de invitados',
        icon: Circle,
        completed: !!(weddingData?.seatingPlan && Object.keys(weddingData.seatingPlan).length > 0),
        link: '/seating',
        category: 'Seating'
      },
      {
        id: 'set_tasks',
        title: 'Revisa las tareas generadas',
        description: 'Personaliza tu lista de tareas',
        icon: Calendar,
        completed: !!(weddingData?.tasksReviewed || (weddingData?.taskCount || 0) > 0),
        link: '/tareas',
        category: 'Planificación'
      },
      {
        id: 'explore_ai',
        title: 'Prueba el asistente IA',
        description: 'Haz tu primera consulta al asistente',
        icon: Sparkles,
        completed: !!(weddingData?.aiInteractions || 0) > 0,
        link: '/asistente',
        category: 'IA'
      }
    ];

    setTasks(checklistTasks);
  }, [activeWedding, weddingData]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Auto-dismiss cuando todo está completo
  useEffect(() => {
    if (progress === 100 && completedCount > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [progress, completedCount, onDismiss]);

  if (!activeWedding || completedCount === totalCount) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow border-2 border-purple-200 overflow-hidden">
      {/* Header */}
      <div 
        className="bg-[var(--color-primary)] text-white px-4 py-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
            <div>
              <h3 className="font-semibold text-lg">Primeros Pasos</h3>
              <p className="text-xs text-purple-100">
                {completedCount} de {totalCount} completados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold">{progress}%</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss?.();
              }}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100">
        <div 
          className="bg-[var(--color-primary)] h-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist */}
      {isExpanded && (
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <a
                key={task.id}
                href={task.link}
                className={`block p-3 rounded-lg border-2 transition-all ${
                  task.completed
                    ? 'bg-green-50 border-green-200 opacity-75'
                    : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${task.completed ? 'text-green-500' : 'text-gray-400'}`}>
                    {task.completed ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${task.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {task.description}
                    </p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                      {task.category}
                    </span>
                  </div>
                  {!task.completed && (
                    <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Footer con mensaje motivacional */}
      {isExpanded && progress < 100 && (
        <div className="px-4 py-3 bg-purple-50 border-t border-purple-100">
          <p className="text-sm text-purple-700 text-center">
            {progress === 0 && '¡Empieza completando tu información básica! 🎉'}
            {progress > 0 && progress < 30 && '¡Buen comienzo! Sigue así 💪'}
            {progress >= 30 && progress < 60 && '¡Vas por buen camino! 🌟'}
            {progress >= 60 && progress < 90 && '¡Casi lo tienes! 🚀'}
            {progress >= 90 && '¡Solo falta un paso más! 🎊'}
          </p>
        </div>
      )}

      {/* Mensaje de completado */}
      {isExpanded && progress === 100 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200">
          <p className="text-sm text-green-700 text-center font-medium">
            ✨ ¡Configuración inicial completada! Ya estás listo para planificar tu boda perfecta.
          </p>
        </div>
      )}
    </div>
  );
};

export default SetupChecklist;
