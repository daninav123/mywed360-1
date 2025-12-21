import React, { useMemo } from 'react';
import { ArrowRight, DollarSign, Info, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../ui';
import Collapsible from '../ui/Collapsible';
import { formatCurrency } from '../../utils/formatUtils';
import useTranslations from '../../hooks/useTranslations';
import { normalizeBudgetCategoryKey } from '../../utils/budgetCategories';

/**
 * Porcentaje del presupuesto total recomendado por categoría
 */
const CATEGORY_BUDGET_PERCENTAGES = {
  fotografia: 12,
  video: 10,
  catering: 35,
  dj: 5,
  musica: 5,
  lugares: 25,
  'flores-decoracion': 8,
  decoracion: 5,
  'vestidos-trajes': 15,
  belleza: 5,
  invitaciones: 2,
  transporte: 3,
  otros: 5,
};

/**
 * Componente para visualizar la distribución de presupuesto por categoría
 * Muestra presupuesto recomendado vs asignado con alertas
 */
export default function BudgetDistribution({ 
  providers = [], 
  totalBudget = 0,
  budgetCategories = [],
  onCategoryClick 
}) {
  const { t } = useTranslations();
  const navigate = useNavigate();

  const categoryData = useMemo(() => {
    const safeProviders = Array.isArray(providers) ? providers : [];
    const safeBudgetCategories = Array.isArray(budgetCategories) ? budgetCategories : [];

    // Presupuesto objetivo (Finanzas) por categoría normalizada
    const budgetMap = new Map();
    safeBudgetCategories.forEach((cat) => {
      const key = normalizeBudgetCategoryKey(cat?.name || '');
      if (!key) return;
      budgetMap.set(key, {
        name: String(cat?.name || key),
        amount: Number(cat?.amount) || 0,
      });
    });

    // Agrupar proveedores por categoría normalizada
    const grouped = {};
    safeProviders.forEach((provider) => {
      const rawCategory =
        provider?.service || provider?.servicio || provider?.category || provider?.categoria || 'otros';
      const key = normalizeBudgetCategoryKey(rawCategory) || 'otros';
      const assignedRaw = provider?.assignedBudget ?? provider?.presupuestoAsignado ?? provider?.budgetTarget ?? 0;
      const assigned = Number(assignedRaw) || 0;

      if (!grouped[key]) {
        grouped[key] = {
          category: key,
          label: String(rawCategory || key),
          providers: [],
          totalAssigned: 0,
        };
      }

      grouped[key].providers.push(provider);
      grouped[key].totalAssigned += assigned;
    });

    const keys = new Set([
      ...Object.keys(grouped),
      ...Array.from(budgetMap.keys()),
    ]);

    const result = Array.from(keys).map((key) => {
      const group = grouped[key] || { providers: [], totalAssigned: 0, label: key };
      const budgetInfo = budgetMap.get(key) || null;

      return {
        category: key,
        label: budgetInfo?.name || group.label || key,
        providers: group.providers,
        totalAssigned: group.totalAssigned,
        hasBudgetCategory: Boolean(budgetInfo),
      };
    });

    return result.sort((a, b) => {
      return (Number(b.totalAssigned) || 0) - (Number(a.totalAssigned) || 0);
    });
  }, [providers, budgetCategories, totalBudget]);

  const summary = useMemo(() => {
    const totalAssigned = categoryData.reduce((sum, cat) => sum + (Number(cat.totalAssigned) || 0), 0);
    const missingCategories = categoryData.filter(
      (cat) => (Number(cat.totalAssigned) || 0) > 0 && !cat.hasBudgetCategory
    ).length;
    
    return {
      totalAssigned,
      remaining: (Number(totalBudget) || 0) - totalAssigned,
      missingCategories,
    };
  }, [categoryData]);

  if (!totalBudget || totalBudget <= 0) {
    return (
      <Card className="p-6 bg-[var(--color-surface-80)]">
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-body font-medium mb-2">
            {t('suppliers.budgetDistribution.noBudget.title', { defaultValue: 'No hay presupuesto configurado' })}
          </p>
          <p className="text-sm text-muted">
            {t('suppliers.budgetDistribution.noBudget.description', { 
              defaultValue: 'Configura tu presupuesto total en Finanzas para ver la distribución' 
            })}
          </p>
          <div className="mt-5 flex justify-center">
            <Button
              onClick={() => navigate('/finance')}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {t('suppliers.budgetDistribution.cta.toFinance', { defaultValue: 'Ir a Finanzas' })}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <Card className="p-6 bg-[var(--color-surface-80)]">
        <h3 className="text-lg font-bold text-body mb-4">
          {t('suppliers.budgetDistribution.title', { defaultValue: 'Presupuesto (resumen)' })}
        </h3>

        <div className="flex items-start gap-3 bg-[var(--color-text-5)] rounded-lg p-4 mb-4">
          <Info className="w-5 h-5 text-muted mt-0.5" />
          <div className="text-sm text-muted">
            {t('suppliers.budgetDistribution.summary.note', {
              defaultValue:
                'Aquí ves una vista rápida. Para gastos, pagos y análisis detallado, ve a Finanzas.',
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Presupuesto Total */}
          <div className="bg-[var(--color-text-5)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-muted mb-1">
              {t('suppliers.budgetDistribution.summary.total', { defaultValue: 'Presupuesto Total' })}
            </p>
            <p className="text-2xl font-bold text-body">
              {formatCurrency(totalBudget)}
            </p>
            <p className="text-xs text-muted mt-1">
              {t('suppliers.budgetDistribution.summary.finanzasHint', {
                defaultValue: 'Gestiona el presupuesto en Finanzas',
              })}
            </p>
          </div>

          {/* Asignado a proveedores */}
          <div className="bg-[var(--color-text-5)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-muted mb-1">
              {t('suppliers.budgetDistribution.summary.assigned', { defaultValue: 'Asignado a proveedores' })}
            </p>
            <p className="text-2xl font-bold text-body">
              {formatCurrency(summary.totalAssigned)}
            </p>
            <p className="text-xs text-muted mt-1">
              {t('suppliers.budgetDistribution.summary.fromTotal', {
                defaultValue: 'desde Mis Servicios',
              })}
            </p>
          </div>

          {/* Restante */}
          <div className="bg-[var(--color-text-5)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-muted mb-1">
              {t('suppliers.budgetDistribution.summary.remaining', { defaultValue: 'Restante' })}
            </p>
            <p className="text-2xl font-bold text-body">
              {formatCurrency(Math.max(0, summary.remaining))}
            </p>
            <p className="text-xs text-muted mt-1">
              {summary.missingCategories > 0
                ? t('suppliers.budgetDistribution.summary.missingCategories', {
                    defaultValue: `${summary.missingCategories} categorías sin objetivo en Finanzas`,
                  })
                : t('suppliers.budgetDistribution.summary.categoriesOk', {
                    defaultValue: 'Categorías sincronizadas con Finanzas',
                  })}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/finance')}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            {t('suppliers.budgetDistribution.cta.toFinance', { defaultValue: 'Ver detalle en Finanzas' })}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/finance')}
          >
            {t('suppliers.budgetDistribution.cta.manageBudget', {
              defaultValue: 'Configurar presupuesto y categorías',
            })}
          </Button>
        </div>
      </Card>

      {/* Distribución por Categoría - Colapsable */}
      <Collapsible
        title={t('suppliers.budgetDistribution.byCategory', { defaultValue: 'Asignación por categoría' })}
        icon={<List className="w-5 h-5" />}
        defaultOpen={false}
      >
        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p>{t('suppliers.budgetDistribution.noCategories', { defaultValue: 'No hay proveedores con presupuesto asignado' })}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryData.map((cat) => {
              
              return (
                <div
                  key={cat.category}
                  className="bg-[var(--color-text-5)] rounded-lg p-4 hover:bg-[var(--color-text-10)] transition-colors cursor-pointer"
                  onClick={() => onCategoryClick?.(cat.category)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-body capitalize">
                          {t(`suppliers.categories.${cat.category}`, { defaultValue: cat.label || cat.category })}
                        </h5>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {cat.providers.length}{' '}
                        {cat.providers.length === 1
                          ? t('suppliers.budgetDistribution.provider', { defaultValue: 'proveedor' })
                          : t('suppliers.budgetDistribution.providers', { defaultValue: 'proveedores' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-body">
                        {formatCurrency(cat.totalAssigned)}
                      </p>
                      <p className="text-xs text-muted">
                        {t('suppliers.budgetDistribution.tapToView', {
                          defaultValue: 'Toca para ver proveedores',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Collapsible>
    </div>
  );
}
