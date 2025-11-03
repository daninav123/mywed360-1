import { Zap, BarChart2, RefreshCw, Save, Trash2, Clock } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import useTranslations from '../../hooks/useTranslations';
import { useEmailMonitoring } from '../../hooks/useEmailMonitoring';
import { templateCache } from '../../services/TemplateCacheService';
import {
  runCacheBenchmark,
  generateCacheReport,
  testCategoryPreloading,
} from '../../utils/CacheDiagnostics';
import { Card, Button, Progress, Tabs, TabsContent, TabsList, TabsTrigger } from '../ui';

/**
 * Panel para visualizar y analizar el rendimiento de la caché de plantillas
 * Disponible solo para administradores del sistema
 */
const CachePerformancePanel = () => {
  const { t } = useTranslations();
  // Estados
  const [cacheReport, setCacheReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [preloadResults, setPreloadResults] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Hooks
  const { measureCachePerformance } = useEmailMonitoring();

  // Cargar informe actual de caché
  const loadCacheReport = useCallback(() => {
    setLoading(true);
    try {
      const report = generateCacheReport();
      setCacheReport(report);
      // Registrar en monitoreo
      measureCachePerformance('report_generated', 0, {
        hitRatio: report.stats.hitRatio,
        entries: report.memory.entryCount,
      });
    } catch (error) {
      console.error('Error generando informe de caché:', error);
    } finally {
      setLoading(false);
    }
  }, [measureCachePerformance]);

  // Cargar informe inicial y categorías
  useEffect(() => {
    loadCacheReport();

    const cacheStats = templateCache.getCacheStats();
    if (cacheStats.categoryHits) {
      const categoryList = Object.keys(cacheStats.categoryHits);
      const fallbackCategory = t('admin.cachePerformance.preload.uncategorized');
      setCategories(categoryList.length ? categoryList : [fallbackCategory]);
      setSelectedCategory(categoryList[0] || fallbackCategory);
    }
  }, [t, loadCacheReport]);

  // Iniciar prueba de rendimiento
  const handleRunBenchmark = useCallback(async () => {
    setBenchmarkLoading(true);
    try {
      // Ejecutar benchmark y guardar resultados
      const results = await runCacheBenchmark([], 3); // 3 iteraciones por defecto
      setBenchmarkResults(results);

      // Registrar métricas
      measureCachePerformance('benchmark', 0, {
        improvementPercent: results.improvement.percent,
        timesSaved: results.improvement.timesSaved,
      });
    } catch (error) {
      console.error('Error ejecutando benchmark:', error);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [measureCachePerformance]);

  // Probar precarga de categoría
  const handleTestPreloading = useCallback(async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      const results = await testCategoryPreloading(selectedCategory);
      setPreloadResults(results);

      // Registrar métricas
      measureCachePerformance('preload_test', 0, {
        category: selectedCategory,
        templatesLoaded: results.templatesLoaded,
      });
    } catch (error) {
      console.error(`Error probando precarga de categoría ${selectedCategory}:`, error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, measureCachePerformance]);

  // Limpiar toda la caché
  const handleClearCache = useCallback(() => {
    if (window.confirm(t('admin.cachePerformance.confirmClear'))) {
      templateCache.clearAll();
      loadCacheReport();

      // Registrar evento
      measureCachePerformance('clear_all', 0);
    }
  }, [loadCacheReport, measureCachePerformance]);

  // Formatear un número con dos decimales
  const formatNumber = (num) => Number(num).toFixed(2);
  const formatMsValue = (value) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return t('admin.cachePerformance.common.msValue', { value: formatNumber(numeric) });
    }
    return t('admin.cachePerformance.common.msValue', { value });
  };

  // Renderizar gráfico básico de barras para efectividad
  const renderEffectivenessBar = () => {
    if (!cacheReport) return null;

    const hitRatio = parseFloat(cacheReport.stats.hitRatio);

    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>{t('admin.cachePerformance.stats.effectiveness')}</span>
          <span className="font-medium">{hitRatio}%</span>
        </div>
        <Progress value={hitRatio} className="h-2" />
      </div>
    );
  };

  // Renderizar resultados de benchmark
  const renderBenchmarkResults = () => {
    if (!benchmarkResults) return null;

    const { withCache, withoutCache, improvement } = benchmarkResults;

    return (
      <div className="mt-6 space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium">
          {t('admin.cachePerformance.benchmark.resultsTitle')}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-600">
              {t('admin.cachePerformance.benchmark.withCache.title')}
            </h4>
            <p className="text-sm">
              {t('admin.cachePerformance.benchmark.withCache.totalTime')}{' '}
              <span className="font-medium">{formatMsValue(withCache.totalTime)}</span>
            </p>
            <p className="text-sm">
              {t('admin.cachePerformance.benchmark.withCache.avgTime')}{' '}
              <span className="font-medium">{formatMsValue(withCache.avgTime)}</span>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-600">
              {t('admin.cachePerformance.benchmark.withoutCache.title')}
            </h4>
            <p className="text-sm">
              {t('admin.cachePerformance.benchmark.withoutCache.totalTime')}{' '}
              <span className="font-medium">{formatMsValue(withoutCache.totalTime)}</span>
            </p>
            <p className="text-sm">
              {t('admin.cachePerformance.benchmark.withoutCache.avgTime')}{' '}
              <span className="font-medium">{formatMsValue(withoutCache.avgTime)}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-100">
          <h4 className="font-medium text-green-700 flex items-center gap-2">
            <Zap size={16} />
            {t('admin.cachePerformance.benchmark.improvement.title')}
          </h4>
          <p className="mt-2 text-sm">
            {t('admin.cachePerformance.benchmark.improvement.timeSaved')}{' '}
            <span className="font-medium">{formatMsValue(improvement.timesSaved)}</span>
          </p>
          <p className="text-sm">
            {t('admin.cachePerformance.benchmark.improvement.percent')}{' '}
            <span className="font-medium text-green-600">{formatNumber(improvement.percent)}%</span>
          </p>
        </div>
      </div>
    );
  };

  // Renderizar resultados de precarga
  const renderPreloadResults = () => {
    if (!preloadResults) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-700">
          {t('admin.cachePerformance.preload.resultsTitle', {
            category: preloadResults.category,
          })}
        </h4>
        <p className="mt-1 text-sm">
          {t('admin.cachePerformance.preload.summary', {
            count: preloadResults.templatesLoaded,
            duration: preloadResults.duration,
          })}
        </p>

        {preloadResults.templates.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">
              {t('admin.cachePerformance.preload.templatesLabel')}
            </p>
            <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {preloadResults.templates.map((template) => (
                <li key={template.id} className="text-gray-700">
                  {template.name || template.id}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!cacheReport) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">{t('admin.cachePerformance.noData.title')}</h2>
          <Button variant="outline" size="sm" onClick={loadCacheReport} disabled={loading}>
            {loading
              ? t('admin.cachePerformance.noData.loading')
              : t('admin.cachePerformance.noData.load')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-medium">{t('admin.cachePerformance.title')}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCacheReport} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t('admin.cachePerformance.actions.refresh')}
          </Button>

          <Button variant="destructive" size="sm" onClick={handleClearCache} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-1" />
            {t('admin.cachePerformance.actions.clear')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="mb-4">
          <TabsTrigger value="stats">{t('admin.cachePerformance.tabs.stats')}</TabsTrigger>
          <TabsTrigger value="benchmark">{t('admin.cachePerformance.tabs.benchmark')}</TabsTrigger>
          <TabsTrigger value="preload">{t('admin.cachePerformance.tabs.preload')}</TabsTrigger>
          <TabsTrigger value="config">{t('admin.cachePerformance.tabs.config')}</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estadísticas generales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('admin.cachePerformance.stats.title')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-600">{t('admin.cachePerformance.stats.hits')}</p>
                  <p className="text-2xl font-bold text-blue-600">{cacheReport.stats.hits}</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {t('admin.cachePerformance.stats.misses')}
                  </p>
                  <p className="text-2xl font-bold text-amber-600">{cacheReport.stats.misses}</p>
                </div>
              </div>

              {renderEffectivenessBar()}

              <div className="mt-4 space-y-2">
                <p className="text-sm">
                  {t('admin.cachePerformance.stats.avgHitTimeLabel')}{' '}
                  <span className="font-medium">{formatMsValue(cacheReport.stats.avgHitTime)}</span>
                </p>
                <p className="text-sm">
                  {t('admin.cachePerformance.stats.avgMissTimeLabel')}{' '}
                  <span className="font-medium">
                    {formatMsValue(cacheReport.stats.avgMissTime)}
                  </span>
                </p>
                <p className="text-sm">
                  {t('admin.cachePerformance.stats.avgSavedTimeLabel')}{' '}
                  <span className="font-medium text-green-600">
                    {formatMsValue(cacheReport.stats.avgTimeSaved)}
                  </span>
                </p>
              </div>
            </div>

            {/* Uso de caché por categoría */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t('admin.cachePerformance.stats.usageByCategory')}
              </h3>

              <div className="max-h-64 overflow-y-auto space-y-3">
                {Object.entries(cacheReport.usage.byCategory).map(([category, data]) => (
                  <div key={category} className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium mb-1">{category}</p>
                    <div className="flex justify-between text-sm">
                      <span>
                        {t('admin.cachePerformance.stats.totalAccesses', { count: data.total })}
                      </span>
                      <span>
                        <span className="text-green-600">
                          {t('admin.cachePerformance.stats.hitsCount', { count: data.hits })}
                        </span>{' '}
                        /
                        <span className="text-amber-600">
                          {t('admin.cachePerformance.stats.missesCount', { count: data.misses })}
                        </span>
                      </span>
                    </div>
                    {data.total > 0 && (
                      <Progress value={(data.hits / data.total) * 100} className="h-1.5 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Estado de la caché */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('admin.cachePerformance.state.title')}</h3>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {t('admin.cachePerformance.state.memoryEntries')}
                  </p>
                  <p className="text-xl font-medium">{cacheReport.memory.entryCount}</p>

                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">
                      {t('admin.cachePerformance.state.categoryDistribution')}
                    </p>
                    {Object.entries(cacheReport.memory.byCategory).map(([category, count]) => (
                      <p key={category} className="text-xs flex justify-between">
                        <span>{category}:</span>
                        <span className="font-medium">{count}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {t('admin.cachePerformance.state.localStorageSize')}
                  </p>
                  <p className="text-xl font-medium">{cacheReport.localStorage.sizeFormatted}</p>
                </div>
              </div>
            </div>

            {/* Plantillas más utilizadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('admin.cachePerformance.templates.title')}</h3>

              <div className="space-y-2">
                {cacheReport.usage.topTemplates.length > 0 ? (
                  cacheReport.usage.topTemplates.map((template, index) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {template.name || template.id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {t('admin.cachePerformance.templates.usageCount', {
                          count: template.useCount,
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    {t('admin.cachePerformance.templates.empty')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="benchmark">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{t('admin.cachePerformance.benchmark.title')}</h3>

              <Button onClick={handleRunBenchmark} disabled={benchmarkLoading}>
                {benchmarkLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('admin.cachePerformance.benchmark.running')}
                  </>
                ) : (
                  <>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    {t('admin.cachePerformance.benchmark.run')}
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              {t('admin.cachePerformance.benchmark.description')}
            </p>

            {renderBenchmarkResults()}
          </div>
        </TabsContent>

        <TabsContent value="preload">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                {t('admin.cachePerformance.preload.title')}
              </h3>

              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {t('admin.cachePerformance.preload.categoryLabel')}
                  </label>
                  <select
                    id="category"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={loading}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleTestPreloading} disabled={loading || !selectedCategory}>
                  {loading
                    ? t('admin.cachePerformance.preload.testing')
                    : t('admin.cachePerformance.preload.test')}
                </Button>
              </div>

              {renderPreloadResults()}
            </div>

            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium flex items-center gap-2">
                <Clock size={16} />
                {t('admin.cachePerformance.preload.aboutTitle')}
              </h4>
              <p className="mt-2 text-sm text-gray-600">
                {t('admin.cachePerformance.preload.aboutParagraph1')}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {t('admin.cachePerformance.preload.aboutParagraph2')}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="space-y-6">
            <h3 className="text-lg font-medium">{t('admin.cachePerformance.config.title')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(cacheReport.config).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{key}</p>
                  <p className="text-sm mt-1">
                    {typeof value === 'boolean'
                      ? value
                        ? t('admin.cachePerformance.config.enabled')
                        : t('admin.cachePerformance.config.disabled')
                      : String(value)}
                  </p>
                </div>
              ))}
            </div>

            {/* Opciones avanzadas de configuración - para futura implementación */}
            <div className="mt-8 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  {t('admin.cachePerformance.config.advancedTitle')}
                </h3>
                <Button variant="outline" disabled>
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.cachePerformance.config.save')}
                </Button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {t('admin.cachePerformance.config.advancedDescription')}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CachePerformancePanel;
