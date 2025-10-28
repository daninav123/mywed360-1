import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Euro, 
  Mail, 
  Phone,
  MessageSquare,
  Send,
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * Vista de DETALLE de una solicitud de presupuesto
 * Permite ver toda la información y responder
 */
export default function SupplierRequestDetail() {
  const { id, requestId } = useParams();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [error, setError] = useState('');
  
  const [responseData, setResponseData] = useState({
    message: '',
    quotedPrice: { min: '', max: '', currency: 'EUR' },
    template: '',
  });
  
  // Plantillas predefinidas
  const templates = [
    {
      id: 'standard',
      name: 'Respuesta estándar',
      message: `Hola {coupleName},

Muchas gracias por contactarme para vuestra boda el {weddingDate} en {location}. 

Me encantaría ser parte de vuestro día especial. Os adjunto mi propuesta de presupuesto que se ajusta a vuestras necesidades.

¿Cuándo podríamos hacer una videollamada para conoceros mejor y resolver todas vuestras dudas?

Quedo a vuestra disposición.

Un saludo,`
    },
    {
      id: 'availability',
      name: 'Consultar disponibilidad',
      message: `Hola {coupleName},

He visto que vuestra boda es el {weddingDate} en {location}. 

Déjame confirmar mi disponibilidad para esa fecha y os envío un presupuesto detallado en las próximas horas.

Mientras tanto, ¿podéis contarme más sobre vuestro estilo de boda y qué buscáis exactamente?

Gracias,`
    },
    {
      id: 'detailed',
      name: 'Presupuesto detallado',
      message: `Hola {coupleName},

Os envío mi propuesta para vuestra boda el {weddingDate} en {location}.

PAQUETES DISPONIBLES:
• Paquete Básico: Desde {minPrice}€
• Paquete Premium: Desde {maxPrice}€

Cada paquete incluye [detallar servicios].

¿Os gustaría que nos reunamos para personalizar la propuesta según vuestras necesidades?

Saludos,`
    },
    {
      id: 'more_info',
      name: 'Solicitar más información',
      message: `Hola {coupleName},

Me interesa mucho vuestra boda en {location}. Para enviaros un presupuesto ajustado, me gustaría conocer un poco más:

• ¿Cuál es vuestro estilo de boda? (clásico, moderno, rústico, etc.)
• ¿Tenéis alguna referencia o inspiración?
• ¿Qué servicios específicos necesitáis?

Con esta información podré prepararos una propuesta perfecta para vosotros.

Un abrazo,`
    }
  ];
  
  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('supplier_token');
    if (!token) {
      navigate('/supplier/login');
      return;
    }
    
    fetchRequestDetail();
  }, [requestId]);
  
  const fetchRequestDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('supplier_token');
          navigate('/supplier/login');
          return;
        }
        throw new Error('Error cargando solicitud');
      }
      
      const data = await response.json();
      setRequest(data.request);
      
      // Si aún no está respondida, mostrar formulario
      if (data.request.status === 'new' || data.request.status === 'viewed') {
        setShowResponseForm(true);
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApplyTemplate = (template) => {
    let message = template.message;
    
    // Reemplazar variables
    if (request) {
      message = message
        .replace(/{coupleName}/g, request.coupleName || 'pareja')
        .replace(/{weddingDate}/g, request.weddingDate || 'fecha pendiente')
        .replace(/{location}/g, request.location?.city || 'ubicación')
        .replace(/{minPrice}/g, responseData.quotedPrice.min || 'XXX')
        .replace(/{maxPrice}/g, responseData.quotedPrice.max || 'XXX');
    }
    
    setResponseData({ ...responseData, message, template: template.id });
  };
  
  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!responseData.message.trim()) {
      alert('Escribe un mensaje antes de enviar');
      return;
    }
    
    setResponding(true);
    
    try {
      const token = localStorage.getItem('supplier_token');
      const response = await fetch(`/api/supplier-dashboard/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: responseData.message,
          quotedPrice: responseData.quotedPrice.min || responseData.quotedPrice.max ? {
            min: Number(responseData.quotedPrice.min) || 0,
            max: Number(responseData.quotedPrice.max) || 0,
            currency: responseData.quotedPrice.currency
          } : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Error enviando respuesta');
      }
      
      alert('✅ Respuesta enviada correctamente');
      navigate(`/supplier/dashboard/${id}`);
      
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    } finally {
      setResponding(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando solicitud...</p>
        </div>
      </div>
    );
  }
  
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Solicitud no encontrada'}</p>
          <button
            onClick={() => navigate(`/supplier/dashboard/${id}`)}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const alreadyResponded = request.status === 'responded';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header con botón volver */}
        <button
          onClick={() => navigate(`/supplier/dashboard/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Volver al Dashboard
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna izquierda - Detalle de la solicitud */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card principal */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {request.coupleName}
                  </h1>
                  {request.status === 'new' && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      🆕 NUEVA
                    </span>
                  )}
                  {request.status === 'viewed' && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      👁️ VISTA
                    </span>
                  )}
                  {request.status === 'responded' && (
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                      ✓ RESPONDIDA
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <Clock size={16} className="inline mr-1" />
                  Recibida: {new Date(request.receivedAt).toLocaleString('es-ES')}
                </div>
              </div>
              
              {/* Información de la boda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar size={24} className="text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Fecha de la boda</p>
                    <p className="font-semibold text-gray-900">{request.weddingDate}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin size={24} className="text-indigo-600" />
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="font-semibold text-gray-900">{request.location?.city}</p>
                  </div>
                </div>
                
                {request.guestCount && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Users size={24} className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Invitados</p>
                      <p className="font-semibold text-gray-900">{request.guestCount}</p>
                    </div>
                  </div>
                )}
                
                {request.budget && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Euro size={24} className="text-indigo-600" />
                    <div>
                      <p className="text-sm text-gray-600">Presupuesto</p>
                      <p className="font-semibold text-gray-900">
                        {request.budget.min} - {request.budget.max} {request.budget.currency}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mensaje de la pareja */}
              {request.message && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare size={20} />
                    Mensaje de la pareja
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {request.message}
                  </p>
                </div>
              )}
              
              {/* Respuesta enviada (si ya respondió) */}
              {alreadyResponded && request.response && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Tu respuesta enviada
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {request.response.message}
                    </p>
                    {request.response.quotedPrice && (
                      <div className="text-sm text-gray-600">
                        <strong>Presupuesto cotizado:</strong>{' '}
                        {request.response.quotedPrice.min} - {request.response.quotedPrice.max}{' '}
                        {request.response.quotedPrice.currency}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Enviado: {new Date(request.respondedAt).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Formulario de respuesta */}
            {showResponseForm && !alreadyResponded && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Responder Solicitud
                </h2>
                
                <form onSubmit={handleSubmitResponse} className="space-y-6">
                  
                  {/* Plantillas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Usar plantilla (opcional)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleApplyTemplate(template)}
                          className={`px-4 py-3 text-left border rounded-lg hover:bg-indigo-50 transition-colors ${
                            responseData.template === template.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-300'
                          }`}
                        >
                          <FileText size={16} className="inline mr-2 text-indigo-600" />
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mensaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      value={responseData.message}
                      onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Escribe tu respuesta personalizada..."
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {responseData.message.length} caracteres
                    </p>
                  </div>
                  
                  {/* Presupuesto cotizado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Presupuesto cotizado (opcional)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Desde</label>
                        <input
                          type="number"
                          value={responseData.quotedPrice.min}
                          onChange={(e) => setResponseData({
                            ...responseData,
                            quotedPrice: { ...responseData.quotedPrice, min: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="1500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                        <input
                          type="number"
                          value={responseData.quotedPrice.max}
                          onChange={(e) => setResponseData({
                            ...responseData,
                            quotedPrice: { ...responseData.quotedPrice, max: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="2500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Moneda</label>
                        <select
                          value={responseData.quotedPrice.currency}
                          onChange={(e) => setResponseData({
                            ...responseData,
                            quotedPrice: { ...responseData.quotedPrice, currency: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botón enviar */}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={responding}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <Send size={20} />
                      {responding ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          {/* Columna derecha - Información de contacto */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              
              <div className="space-y-4">
                {request.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Mail size={20} className="text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a 
                        href={`mailto:${request.contactEmail}`}
                        className="font-medium text-indigo-600 hover:underline break-all"
                      >
                        {request.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
                
                {request.contactPhone && (
                  <div className="flex items-start gap-3">
                    <Phone size={20} className="text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <a 
                        href={`tel:${request.contactPhone}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {request.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h4 className="font-semibold mb-3">💡 Consejos</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Responde en menos de 24h para mayor conversión</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Personaliza el mensaje con el nombre de la pareja</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Propón una videollamada para conocerlos mejor</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
