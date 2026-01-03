import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Upload,
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  
  // Estados para comparación de presupuestos
  const [comparisonMode, setComparisonMode] = useState(false);
  const [quoteA, setQuoteA] = useState(null);
  const [quoteB, setQuoteB] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [selectedFactors, setSelectedFactors] = useState([]);
  const [comparisonNotes, setComparisonNotes] = useState('');
  const [savingComparison, setSavingComparison] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:4004/api/quote-validation/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    console.log('🔍 [AdminAITraining] handleFileSelect llamado');
    const file = e.target.files[0];
    
    if (!file) {
      console.log('❌ [AdminAITraining] No se seleccionó archivo');
      return;
    }
    
    console.log('🔍 [AdminAITraining] Archivo seleccionado:', file.name, file.size, 'bytes');
    
    // Validaciones
    if (file.type !== 'application/pdf') {
      console.log('❌ [AdminAITraining] Tipo incorrecto:', file.type);
      alert('❌ Error: Solo se permiten archivos PDF');
      return;
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('❌ [AdminAITraining] Archivo muy grande:', file.size);
      alert(`❌ Error: El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo permitido: 10MB`);
      return;
    }
    
    if (file.size < 1000) {
      console.log('❌ [AdminAITraining] Archivo muy pequeño:', file.size);
      alert('❌ Error: El archivo parece estar vacío o corrupto');
      return;
    }
    
    console.log('✅ [AdminAITraining] Validaciones pasadas, procesando...');
    setPdfFile(file);
    handlePdfUpload(file);
  };

  const handlePdfUpload = async (file) => {
    console.log('📤 [AdminAITraining] Iniciando upload de PDF...');
    console.log('📤 [AdminAITraining] Archivo:', file.name, file.size, 'bytes');
    
    setUploading(true);
    setExtractedData(null);
    
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      console.log('📤 [AdminAITraining] FormData creado, enviando a backend...');
      
      // Timeout de 60 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch('http://localhost:4004/api/admin/ai-training/extract-pdf', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('📥 [AdminAITraining] Respuesta del backend:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📥 [AdminAITraining] Datos recibidos:', result);
      
      if (result.success && result.data) {
        console.log('✅ [AdminAITraining] Extracción exitosa');
        
        // Validar que al menos tenga categoría o proveedor
        if (!result.data.categoryName && !result.data.supplierName) {
          alert('⚠️ Advertencia: No se pudo extraer información básica del PDF. Revisa los datos extraídos.');
        }
        
        setExtractedData(result.data);
      } else {
        console.log('❌ [AdminAITraining] Error en extracción:', result.error);
        throw new Error(result.error || 'No se pudieron extraer datos');
      }
    } catch (error) {
      console.error('❌ [AdminAITraining] Error:', error);
      
      if (error.name === 'AbortError') {
        alert('⏱️ Timeout: El proceso tomó demasiado tiempo (>60s). Intenta con un PDF más pequeño.');
      } else if (error.message.includes('Failed to fetch')) {
        alert('🌐 Error de conexión: No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      } else if (error.message.includes('Rate limit')) {
        alert('⏳ Límite de peticiones alcanzado. Espera unos segundos e intenta de nuevo.');
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveExample = async () => {
    if (!extractedData) return;
    
    try {
      const response = await fetch('http://localhost:4004/api/quote-validation/manual-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extractedData,
          adminUserId: 'admin',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Ejemplo añadido correctamente. La IA lo usará para aprender.');
        setExtractedData(null);
        setPdfFile(null);
        loadStats();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error guardando ejemplo:', error);
      alert('Error al guardar el ejemplo');
    }
  };

  const handleStartComparison = () => {
    if (!extractedData) {
      alert('⚠️ Primero debes subir y extraer un presupuesto');
      return;
    }
    
    if (!quoteA) {
      // Primer presupuesto
      setQuoteA(extractedData);
      alert('✅ Presupuesto A guardado. Ahora sube el presupuesto B para comparar.');
      setExtractedData(null);
      setPdfFile(null);
    } else {
      // Segundo presupuesto - iniciar comparación
      setQuoteB(extractedData);
      setComparisonMode(true);
      setExtractedData(null);
      setPdfFile(null);
    }
  };

  const toggleFactor = (factor) => {
    if (selectedFactors.includes(factor)) {
      setSelectedFactors(selectedFactors.filter(f => f !== factor));
    } else {
      setSelectedFactors([...selectedFactors, factor]);
    }
  };

  const handleSaveComparison = async () => {
    if (!selectedWinner) {
      alert('⚠️ Selecciona qué presupuesto es mejor');
      return;
    }

    if (selectedFactors.length === 0) {
      alert('⚠️ Selecciona al menos un factor que influyó en tu decisión');
      return;
    }

    setSavingComparison(true);

    try {
      const response = await fetch('http://localhost:4004/api/admin/ai-training/save-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteA,
          quoteB,
          winner: selectedWinner,
          factors: selectedFactors,
          notes: comparisonNotes,
          adminUserId: 'admin',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ ¡Comparación guardada! La IA aprenderá de tu decisión.');
        
        // Reset
        setComparisonMode(false);
        setQuoteA(null);
        setQuoteB(null);
        setSelectedWinner(null);
        setSelectedFactors([]);
        setComparisonNotes('');
        loadStats();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error guardando comparación:', error);
      alert('Error al guardar la comparación');
    } finally {
      setSavingComparison(false);
    }
  };

  const handleCancelComparison = () => {
    if (window.confirm('¿Seguro que quieres cancelar la comparación?')) {
      setComparisonMode(false);
      setQuoteA(null);
      setQuoteB(null);
      setSelectedWinner(null);
      setSelectedFactors([]);
      setComparisonNotes('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="" className="text-secondary">Cargando estadísticas de IA...</p>
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
              <h1 className="text-3xl font-bold " className="text-body">Entrenamiento de IA</h1>
              <p className=" mt-1" className="text-secondary">
                Mejora continua del análisis de presupuestos
              </p>
            </div>
          </div>
          
          <div>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              id="pdf-upload-input"
              className="hidden"
            />
            <label
              htmlFor="pdf-upload-input"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2  text-white rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Upload className="w-5 h-5" />
              Subir PDF de Presupuesto
            </label>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" className="text-secondary">Precisión General</p>
              <p className="text-3xl font-bold " className="text-success">
                {stats?.overallAccuracy || 0}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 " className="text-success" />
            </div>
          </div>
          <p className="text-xs  mt-2" className="text-muted">
            {stats?.perfect || 0} presupuestos perfectos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" className="text-secondary">Total Validados</p>
              <p className="text-3xl font-bold " className="text-primary">
                {stats?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 " className="text-primary" />
            </div>
          </div>
          <p className="text-xs  mt-2" className="text-muted">
            Presupuestos revisados por usuarios
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" className="text-secondary">Con Correcciones</p>
              <p className="text-3xl font-bold text-amber-600">
                {stats?.withCorrections || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs  mt-2" className="text-muted">
            La IA está aprendiendo de estos
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm  mb-1" className="text-secondary">Objetivo</p>
              <p className="text-3xl font-bold text-purple-600">95%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-xs  mt-2" className="text-muted">
            Meta de precisión automática
          </p>
        </Card>
      </div>

      {/* Área de procesamiento de PDF */}
      {uploading && (
        <Card className="p-8 mb-8 border-2 border-blue-200">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4  animate-spin" className="text-primary" />
            <h3 className="text-xl font-bold  mb-2" className="text-body">Procesando PDF con IA...</h3>
            <p className="" className="text-secondary">
              La IA está extrayendo todos los datos del presupuesto
            </p>
          </div>
        </Card>
      )}

      {/* Datos extraídos del PDF */}
      {extractedData && (
        <Card className="p-6 mb-8 border-2 border-green-200 bg-green-50">
          <h3 className="text-xl font-bold  mb-4 flex items-center gap-2" className="text-body">
            <CheckCircle className="w-5 h-5 " className="text-success" />
            Datos Extraídos del PDF
          </h3>
          
          <div className=" rounded-lg p-6 space-y-4" className="bg-surface">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Categoría
                </label>
                <p className=" font-medium" className="text-body">{extractedData.categoryName || 'No detectada'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Proveedor
                </label>
                <p className=" font-medium" className="text-body">{extractedData.supplierName || 'No detectado'}</p>
                {extractedData.supplierLegalName && (
                  <p className="text-xs  mt-1" className="text-muted">
                    Nombre legal: {extractedData.supplierLegalName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Precio Total
                </label>
                <p className=" font-medium text-lg " className="text-success" className="text-body">
                  {extractedData.totalPrice ? `${extractedData.totalPrice}€` : 'No detectado'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Tiempo de Entrega
                </label>
                <p className=" font-medium" className="text-body">{extractedData.deliveryTime || 'No detectado'}</p>
              </div>
            </div>

            {extractedData.servicesIncluded && extractedData.servicesIncluded.length > 0 && (
              <div>
                <label className="block text-sm font-semibold  mb-2" className="text-body">
                  Servicios Incluidos
                </label>
                <ul className="list-disc list-inside space-y-1 " className="text-body">
                  {extractedData.servicesIncluded.map((service, idx) => (
                    <li key={idx}>{service}</li>
                  ))}
                </ul>
              </div>
            )}

            {extractedData.paymentTerms && (
              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Condiciones de Pago
                </label>
                <p className="" className="text-body">{extractedData.paymentTerms}</p>
              </div>
            )}

            {extractedData.emailBody && (
              <div>
                <label className="block text-sm font-semibold  mb-1" className="text-body">
                  Contenido del Presupuesto
                </label>
                <div className=" p-4 rounded border  max-h-48 overflow-y-auto" className="border-default" className="bg-page">
                  <pre className="text-sm  whitespace-pre-wrap font-mono" className="text-body">
                    {extractedData.emailBody}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="primary" 
                leftIcon={<CheckCircle className="w-5 h-5" />}
                onClick={handleSaveExample}
              >
                Guardar como Ejemplo de Entrenamiento
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setExtractedData(null);
                  setPdfFile(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modo Comparación */}
      {comparisonMode && quoteA && quoteB && (
        <Card className="p-6 mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="text-2xl font-bold  mb-6 flex items-center gap-2" className="text-body">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Comparación de Presupuestos - Entrenamiento IA
          </h3>
          
          <p className="text-sm  mb-6" className="text-secondary">
            Compara estos dos presupuestos y selecciona cuál consideras mejor. La IA aprenderá de tu decisión.
          </p>

          {/* Comparación lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Presupuesto A */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              selectedWinner === 'A' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold " className="text-body">Presupuesto A</h4>
                <button
                  onClick={() => setSelectedWinner('A')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedWinner === 'A'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {selectedWinner === 'A' ? '✓ Mejor' : 'Elegir'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs " className="text-secondary">Proveedor</p>
                  <p className="text-sm font-semibold " className="text-body">{quoteA.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs " className="text-secondary">Categoría</p>
                  <p className="text-sm font-semibold " className="text-body">{quoteA.categoryName}</p>
                </div>
                <div>
                  <p className="text-xs " className="text-secondary">Precio</p>
                  <p className="text-2xl font-bold " className="text-success">{quoteA.totalPrice}€</p>
                </div>
                {quoteA.servicesIncluded?.length > 0 && (
                  <div>
                    <p className="text-xs  mb-1" className="text-secondary">Servicios ({quoteA.servicesIncluded.length})</p>
                    <ul className="text-sm  space-y-1" className="text-body">
                      {quoteA.servicesIncluded.slice(0, 3).map((service, idx) => (
                        <li key={idx}>• {service}</li>
                      ))}
                      {quoteA.servicesIncluded.length > 3 && (
                        <li className="" className="text-muted">+{quoteA.servicesIncluded.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}
                {quoteA.paymentTerms && (
                  <div>
                    <p className="text-xs " className="text-secondary">Condiciones de pago</p>
                    <p className="text-sm " className="text-body">{quoteA.paymentTerms}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Presupuesto B */}
            <div className={`p-4 rounded-lg border-2 transition-all ${
              selectedWinner === 'B' ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold " className="text-body">Presupuesto B</h4>
                <button
                  onClick={() => setSelectedWinner('B')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedWinner === 'B'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {selectedWinner === 'B' ? '✓ Mejor' : 'Elegir'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs " className="text-secondary">Proveedor</p>
                  <p className="text-sm font-semibold " className="text-body">{quoteB.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs " className="text-secondary">Categoría</p>
                  <p className="text-sm font-semibold " className="text-body">{quoteB.categoryName}</p>
                </div>
                <div>
                  <p className="text-xs " className="text-secondary">Precio</p>
                  <p className="text-2xl font-bold " className="text-success">{quoteB.totalPrice}€</p>
                </div>
                {quoteB.servicesIncluded?.length > 0 && (
                  <div>
                    <p className="text-xs  mb-1" className="text-secondary">Servicios ({quoteB.servicesIncluded.length})</p>
                    <ul className="text-sm  space-y-1" className="text-body">
                      {quoteB.servicesIncluded.slice(0, 3).map((service, idx) => (
                        <li key={idx}>• {service}</li>
                      ))}
                      {quoteB.servicesIncluded.length > 3 && (
                        <li className="" className="text-muted">+{quoteB.servicesIncluded.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}
                {quoteB.paymentTerms && (
                  <div>
                    <p className="text-xs " className="text-secondary">Condiciones de pago</p>
                    <p className="text-sm " className="text-body">{quoteB.paymentTerms}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Factores de decisión */}
          <div className=" rounded-lg p-4 mb-4" className="bg-surface">
            <h4 className="text-sm font-bold  mb-3" className="text-body">
              🎯 ¿Qué factores influyeron en tu decisión? (Selecciona todos los relevantes)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'mejor_precio', label: '💰 Mejor precio' },
                { id: 'mas_servicios', label: '✨ Más servicios incluidos' },
                { id: 'mejor_reputacion', label: '⭐ Mejor reputación' },
                { id: 'mejores_condiciones_pago', label: '💳 Mejores condiciones de pago' },
                { id: 'mas_flexible', label: '🔄 Más flexible/personalizable' },
                { id: 'mejor_tiempo_entrega', label: '⏱️ Mejor tiempo de entrega' },
                { id: 'mejor_calidad_precio', label: '📊 Mejor relación calidad-precio' },
                { id: 'mas_experiencia', label: '🏆 Más experiencia' },
                { id: 'mejor_cancelacion', label: '🛡️ Mejor política de cancelación' },
                { id: 'mas_transparente', label: '📋 Más transparente/detallado' },
                { id: 'mejor_garantias', label: '✓ Mejores garantías' },
                { id: 'intuicion', label: '💭 Intuición/feeling personal' },
              ].map(factor => (
                <button
                  key={factor.id}
                  onClick={() => toggleFactor(factor.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    selectedFactors.includes(factor.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {factor.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas adicionales */}
          <div className=" rounded-lg p-4 mb-4" className="bg-surface">
            <label className="block text-sm font-bold  mb-2" className="text-body">
              📝 Notas adicionales (opcional)
            </label>
            <textarea
              value={comparisonNotes}
              onChange={(e) => setComparisonNotes(e.target.value)}
              placeholder="Explica por qué elegiste este presupuesto..."
              className="w-full px-3 py-2 border  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" className="border-default"
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="ghost" 
              onClick={handleCancelComparison}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              leftIcon={<CheckCircle className="w-5 h-5" />}
              onClick={handleSaveComparison}
              disabled={!selectedWinner || selectedFactors.length === 0}
              loading={savingComparison}
            >
              {savingComparison ? 'Guardando...' : 'Guardar Comparación'}
            </Button>
          </div>
        </Card>
      )}

      {/* Indicador de presupuesto A guardado */}
      {quoteA && !comparisonMode && (
        <Card className="p-4 mb-6 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                ✅ Presupuesto A guardado: {quoteA.supplierName} - {quoteA.totalPrice}€
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Sube otro PDF para comparar
              </p>
            </div>
            <button
              onClick={() => setQuoteA(null)}
              className="px-3 py-1.5  text-white text-sm rounded-lg hover:bg-blue-700 transition-colors" style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {/* Precisión por Campo */}
      <Card className="p-6">
        <h3 className="text-xl font-bold  mb-6 flex items-center gap-2" className="text-body">
          <BarChart3 className="w-5 h-5 " className="text-primary" />
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
                    <span className="text-sm font-semibold  capitalize" className="text-body">
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
                  <p className="text-xs  mt-1" className="text-muted">
                    {count} correcciones de {stats.total} presupuestos
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 " className="text-muted">
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
