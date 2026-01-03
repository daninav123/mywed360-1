/**
 * PhotoShotList - Lista de fotos para el fotógrafo
 * FASE 3.1.5 del WORKFLOW-USUARIO.md
 */
import React, { useState, useMemo } from 'react';
import { Camera, CheckCircle2, Circle, Download, Share2, Printer, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { SHOT_LIST_TEMPLATE, PRIORITY_LABELS, getTotalShots } from '../../data/shotListTemplates';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_LABELS[priority] || PRIORITY_LABELS.media;
  const colors = {
    red: 'bg-red-100 text-red-700 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    gray: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full border font-medium ${colors[config.color]}`}>
      {config.label}
    </span>
  );
};

const ShotItem = ({ shot, categoryId, completed, onToggle }) => {
  return (
    <div className={`border rounded-lg p-3 transition-all ${
      completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(categoryId, shot.id)}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
            completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {completed ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <Circle className="w-4 h-4 text-transparent" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {shot.name}
          </p>
          {shot.location && (
            <p className="text-xs text-gray-500 mt-1">📍 {shot.location}</p>
          )}
        </div>

        {!completed && <PriorityBadge priority={shot.priority} />}
      </div>
    </div>
  );
};

const CategoryCard = ({ category, categoryId, completedShots, onToggleShot, isExpanded, onToggleExpand }) => {
  const completed = category.shots.filter(shot => completedShots[categoryId]?.includes(shot.id)).length;
  const total = category.shots.length;
  const percentage = Math.round((completed / total) * 100);

  const colorClasses = {
    pink: 'from-pink-50 to-rose-50 border-pink-200',
    purple: 'from-purple-50 to-indigo-50 border-purple-200',
    red: 'from-red-50 to-rose-50 border-red-200',
    blue: 'from-blue-50 to-cyan-50 border-blue-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    yellow: 'from-yellow-50 to-amber-50 border-yellow-200',
    orange: 'from-orange-50 to-red-50 border-orange-200',
    gray: 'from-gray-50 to-slate-50 border-gray-200',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={onToggleExpand}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors bg-gradient-to-r ${colorClasses[category.color]}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800 text-base">{category.name}</h3>
              <p className="text-xs text-gray-600">{category.description}</p>
            </div>
          </div>
          
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-gray-700">
              {completed}/{total}
            </p>
            <p className="text-xs text-gray-500">{percentage}%</p>
          </div>
        </div>
      </button>

      <div className="h-1.5 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${
            percentage === 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isExpanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-2">
            {category.shots.map((shot) => (
              <ShotItem
                key={shot.id}
                shot={shot}
                categoryId={categoryId}
                completed={completedShots[categoryId]?.includes(shot.id)}
                onToggle={onToggleShot}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PhotoShotList({ completedShots = {}, onToggleShot, weddingCouple = '' }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['ceremonia', 'pareja']));
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let byPriority = { alta: 0, media: 0, baja: 0 };
    let byPriorityCompleted = { alta: 0, media: 0, baja: 0 };

    Object.entries(SHOT_LIST_TEMPLATE).forEach(([categoryId, category]) => {
      category.shots.forEach((shot) => {
        total++;
        byPriority[shot.priority]++;
        if (completedShots[categoryId]?.includes(shot.id)) {
          completed++;
          byPriorityCompleted[shot.priority]++;
        }
      });
    });

    return {
      total,
      completed,
      pending: total - completed,
      percentage: Math.round((completed / total) * 100),
      byPriority,
      byPriorityCompleted,
    };
  }, [completedShots]);

  const filteredCategories = useMemo(() => {
    if (priorityFilter === 'all') return SHOT_LIST_TEMPLATE;

    const filtered = {};
    Object.entries(SHOT_LIST_TEMPLATE).forEach(([categoryId, category]) => {
      const filteredShots = category.shots.filter(shot => shot.priority === priorityFilter);
      if (filteredShots.length > 0) {
        filtered[categoryId] = {
          ...category,
          shots: filteredShots,
        };
      }
    });
    return filtered;
  }, [priorityFilter]);

  const handleToggleCategory = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedCategories(new Set(Object.keys(filteredCategories)));
  };

  const handleCollapseAll = () => {
    setExpandedCategories(new Set());
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(18);
      doc.text('Shot List Fotográfico', 20, yPos);
      yPos += 10;

      if (weddingCouple) {
        doc.setFontSize(12);
        doc.text(`Boda: ${weddingCouple}`, 20, yPos);
        yPos += 10;
      }

      doc.setFontSize(10);
      doc.text(`Total: ${stats.completed}/${stats.total} fotos (${stats.percentage}%)`, 20, yPos);
      yPos += 15;

      Object.entries(SHOT_LIST_TEMPLATE).forEach(([categoryId, category]) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(`${category.icon} ${category.name}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(9);
        category.shots.forEach((shot) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }

          const isCompleted = completedShots[categoryId]?.includes(shot.id);
          const checkbox = isCompleted ? '☑' : '☐';
          const text = `${checkbox} ${shot.name} [${shot.priority.toUpperCase()}]`;
          
          doc.text(text, 25, yPos);
          yPos += 5;
        });

        yPos += 5;
      });

      doc.save(`shot-list-${weddingCouple || 'boda'}.pdf`);
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const handleShare = async () => {
    const text = `Shot List Fotográfico${weddingCouple ? ` - ${weddingCouple}` : ''}

${Object.entries(SHOT_LIST_TEMPLATE).map(([categoryId, category]) => 
  `${category.icon} ${category.name}\n${category.shots.map(shot => 
    `${completedShots[categoryId]?.includes(shot.id) ? '✓' : '○'} ${shot.name}`
  ).join('\n')}`
).join('\n\n')}

Progreso: ${stats.completed}/${stats.total} (${stats.percentage}%)`;

    if (navigator.share) {
      try {
        await navigator.share({ text, title: 'Shot List Fotográfico' });
        toast.success('Compartido correctamente');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
      } catch (error) {
        toast.error('Error al copiar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Shot List Fotográfico</h2>
              <p className="text-sm text-gray-600">Guía para tu fotógrafo</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{stats.percentage}%</div>
            <div className="text-xs text-gray-600">completado</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completadas</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {stats.byPriority.alta - stats.byPriorityCompleted.alta}
            </div>
            <div className="text-xs text-gray-600">Alta prioridad</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Expandir todas
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Colapsar todas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Prioridad:</span>
              {['all', 'alta', 'media', 'baja'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setPriorityFilter(priority)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    priorityFilter === priority
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {priority === 'all' ? 'Todas' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(filteredCategories).map(([categoryId, category]) => (
          <CategoryCard
            key={categoryId}
            category={category}
            categoryId={categoryId}
            completedShots={completedShots}
            onToggleShot={onToggleShot}
            isExpanded={expandedCategories.has(categoryId)}
            onToggleExpand={() => handleToggleCategory(categoryId)}
          />
        ))}
      </div>
    </div>
  );
}
