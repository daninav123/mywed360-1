import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Plus, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  FileText,
  Sparkles
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getBackendUrl } from '../config';

/**
 * 🎓 Panel de Administración de Entrenamiento de IA
 * 
 * Permite al admin:
 * - Añadir ejemplos de presupuestos manualmente
 * - Ver estadísticas de precisión de IA
 * - Ver campos más corregidos por usuarios
 * - Monitorear mejora progresiva de la IA
 */
const AdminAITraining = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    emailBody: '',
    categoryName: '',
    supplierName: '',
    totalPrice: '',
    servicesIncluded: '',
    paymentTerms: '',
    deliveryTime: '',
    additionalNotes: '',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/quote-validation/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/quote-validation/manual-example`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          servicesIncluded: formData.servicesIncluded.split('\n').filter(s => s.trim()),
          totalPrice: formData.totalPrice ? parseFloat(formData.totalPrice) : null,
          adminUserId: 'admin', // TODO: obtener del auth context
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Ejemplo añadido correctamente. La IA lo usará para aprender.');
        setFormData({
          emailBody: '',
          categoryName: '',
          supplierName: '',
          totalPrice: '',
          servicesIncluded: '',
          paymentTerms: '',
          deliveryTime: '',
          additionalNotes: '',
        });
        setShowAddForm(false);
        loadStats();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error añadiendo ejemplo:', error);
      alert('Error al añadir el ejemplo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="" style={{ color: 'var(--color-text-secondary)' }}>Cargando estadísticas de IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold " style={{ color: 'var(--color-text)' }}>Entrenamiento de IA</h1>
              <p className=" mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Mejora continua del análisis de presupuestos
              </p>
            </div>
          </div>
          
          <Button
            variant="primary"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            Añadir Ejemplo Manual
          </Button>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" style={{ color: 'var(--color-text-secondary)' }}>Precisión General</p>
              <p className="text-3xl font-bold " style={{ color: 'var(--color-success)' }}>
                {stats?.overallAccuracy || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 " style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
            {stats?.perfect || 0} presupuestos perfectos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" style={{ color: 'var(--color-text-secondary)' }}>Total Validados</p>
              <p className="text-3xl font-bold " style={{ color: 'var(--color-primary)' }}>
                {stats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 " style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
            Presupuestos revisados por usuarios
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" style={{ color: 'var(--color-text-secondary)' }}>Con Correcciones</p>
              <p className="text-3xl font-bold text-amber-600">
                {stats?.withCorrections || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
            La IA está aprendiendo de estos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" style={{ color: 'var(--color-text-secondary)' }}>Objetivo</p>
              <p className="text-3xl font-bold text-purple-600">95%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs  mt-2" style={{ color: 'var(--color-muted)' }}>
            Meta de precisión automática
          </p>
        </Card>
      </div>

      {/* Formulario de Añadir Ejemplo */}
      {showAddForm && (
        <Card className="p-6 mb-8 border-2 border-blue-200">
          <h3 className="text-xl font-bold  mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <FileText className="w-5 h-5 " style={{ color: 'var(--color-primary)' }} />
            Añadir Ejemplo Manual de Presupuesto
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                  Categoría *
                </label>
                <select
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="Música">Música</option>
                  <option value="Fotografía">Fotografía</option>
                  <option value="Catering">Catering</option>
                  <option value="Decoración">Decoración</option>
                  <option value="Floristería">Floristería</option>
                  <option value="Videografía">Videografía</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                  Nombre del Proveedor
                </label>
                <input
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('admin.aiTraining.questionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                  Precio Total (€)
                </label>
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder="1500"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                  Tiempo de Entrega
                </label>
                <input
                  type="text"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                  placeholder={t('admin.aiTraining.searchPlaceholder')} del evento"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                Texto del Email / Presupuesto *
              </label>
              <textarea
                value={formData.emailBody}
                onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                rows={6}
                placeholder={t('admin.aiTraining.searchPlaceholder')} completo del presupuesto..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                Servicios Incluidos (uno por línea)
              </label>
              <textarea
                value={formData.servicesIncluded}
                onChange={(e) => setFormData({ ...formData, servicesIncluded: e.target.value })}
                className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                rows={4}
                placeholder="DJ 4 horas&#10;Equipo de sonido&#10;Luces LED"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold  mb-2" style={{ color: 'var(--color-text)' }}>
                Condiciones de Pago
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-4 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--color-border)' }}
                placeholder={t('admin.aiTraining.responsePlaceholder')}, 50% día del evento"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="primary" leftIcon={<Plus className="w-5 h-5" />}>
                Guardar Ejemplo
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Precisión por Campo */}
      <Card className="p-6">
        <h3 className="text-xl font-bold  mb-6 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <BarChart3 className="w-5 h-5 " style={{ color: 'var(--color-primary)' }} />
          Precisión por Campo
        </h3>

        {stats?.mostCorrectedFields?.length > 0 ? (
          <div className="space-y-4">
            {stats.mostCorrectedFields.map(({ field, count }) => {
              const fieldData = stats.fieldAccuracy[field];
              const accuracy = fieldData?.accuracy || 0;
              
              return (
                <div key={field}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold  capitalize" style={{ color: 'var(--color-text)' }}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`text-sm font-bold ${
                      accuracy >= 95 ? 'text-green-600' :
                      accuracy >= 80 ? 'text-blue-600' :
                      accuracy >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all ${
                        accuracy >= 95 ? 'bg-green-500' :
                        accuracy >= 80 ? 'bg-blue-500' :
                        accuracy >= 60 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <p className="text-xs  mt-1" style={{ color: 'var(--color-muted)' }}>
                    {count} correcciones de {stats.total} presupuestos
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 " style={{ color: 'var(--color-muted)' }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aún no hay suficientes datos para mostrar estadísticas por campo.</p>
            <p className="text-sm mt-1">Los usuarios deben validar más presupuestos.</p>
          </div>
        )}
      </Card>

      {/* Nota informativa */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 Cómo funciona:</strong> Cuando los usuarios corrigen datos extraídos por la IA 
          y los validan, el sistema aprende automáticamente. Los ejemplos perfectos (sin correcciones) 
          se usan como "golden examples" para mejorar futuras extracciones mediante few-shot learning.
        </p>
      </div>
    </div>
  );
};

export default AdminAITraining;
