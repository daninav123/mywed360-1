import React, { useState } from 'react';
import { FileText, Mail, Paperclip, Download, ExternalLink, CheckCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EditableField from './EditableField';

const QuoteDetailTabs = ({ quote, formatDate, onUpdateQuote, onMarkAsValidated }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [editedFields, setEditedFields] = useState({});
  const [localQuote, setLocalQuote] = useState(quote);

  const handleFieldUpdate = (fieldName, newValue) => {
    // Actualizar quote localmente
    setLocalQuote({ ...localQuote, [fieldName]: newValue });
    
    // Trackear qué campo se editó
    setEditedFields({ ...editedFields, [fieldName]: true });
    
    // Llamar callback para guardar en backend
    if (onUpdateQuote) {
      onUpdateQuote(quote.id, fieldName, newValue);
    }
  };

  const handleValidation = () => {
    const editedFieldsList = Object.keys(editedFields);
    
    if (onMarkAsValidated) {
      onMarkAsValidated(quote.id, {
        wasEdited: editedFieldsList.length > 0,
        editedFields: editedFieldsList,
        validatedAt: new Date().toISOString(),
      });
    }
  };

  const tabs = [
    { id: 'summary', label: 'Resumen', icon: FileText },
    { id: 'email', label: 'Email Original', icon: Mail },
    { id: 'attachments', label: 'Adjuntos', icon: Paperclip, count: quote.attachmentCount || 0 },
  ];

  return (
    <div className="mt-4 border-t pt-4">
      {/* Pestañas */}
      <div className="flex gap-2 mb-4 border-b">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de pestañas */}
      <div className="space-y-4">
        {activeTab === 'summary' && <SummaryTab quote={quote} />}
        {activeTab === 'email' && <EmailTab quote={quote} formatDate={formatDate} />}
        {activeTab === 'attachments' && <AttachmentsTab quote={quote} />}
      </div>
    </div>
  );
};

const SummaryTab = ({ quote }) => {
  return (
    <div className="space-y-4">
      {/* Precio principal */}
      {quote.totalPrice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium mb-1">Precio Total</p>
          <p className="text-3xl font-bold text-green-800">{quote.totalPrice}€</p>
          {quote.confidence && (
            <p className="text-xs text-green-600 mt-1">
              Confianza de extracción: {quote.confidence}%
            </p>
          )}
        </div>
      )}

      {/* Desglose de precios */}
      {quote.priceBreakdown && quote.priceBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Desglose de Precios
          </p>
          <div className="space-y-2">
            {quote.priceBreakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-gray-700">{item.concept}</span>
                <span className="font-semibold text-gray-900">{item.amount}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servicios incluidos */}
      {quote.servicesIncluded && quote.servicesIncluded.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Servicios Incluidos
          </p>
          <ul className="space-y-2">
            {quote.servicesIncluded.map((service, idx) => (
              <li key={idx} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-500 mt-1">✓</span>
                <span>{service}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extras disponibles */}
      {quote.extras && quote.extras.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            Extras Disponibles
          </p>
          <div className="flex flex-wrap gap-2">
            {quote.extras.map((extra, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm"
              >
                {extra}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Condiciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quote.paymentTerms && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              💳 Condiciones de Pago
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{quote.paymentTerms}</p>
          </div>
        )}

        {quote.deliveryTime && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              ⏱️ Disponibilidad
            </p>
            <p className="text-sm text-gray-600">{quote.deliveryTime}</p>
          </div>
        )}

        {quote.cancellationPolicy && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              🚫 Política de Cancelación
            </p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{quote.cancellationPolicy}</p>
          </div>
        )}

        {quote.warranty && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
              🛡️ Garantía
            </p>
            <p className="text-sm text-gray-600">{quote.warranty}</p>
          </div>
        )}
      </div>

      {/* Notas adicionales */}
      {quote.additionalNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">📝 Notas Adicionales</p>
          <p className="text-sm text-blue-900 whitespace-pre-line">{quote.additionalNotes}</p>
        </div>
      )}

      {/* Metadata */}
      {quote.analyzedAt && (
        <div className="text-xs text-gray-400 text-center pt-2 border-t">
          Analizado automáticamente el {new Date(quote.analyzedAt).toLocaleString('es-ES')}
          {quote.model && ` con ${quote.model}`}
        </div>
      )}
    </div>
  );
};

const EmailTab = ({ quote, formatDate }) => {
  return (
    <div className="space-y-4">
      {/* Cabecera del email */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 min-w-[80px]">Asunto:</span>
            <span className="text-gray-900">{quote.emailSubject || 'Sin asunto'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-700 min-w-[80px]">De:</span>
            <span className="text-gray-900">{quote.supplierEmail}</span>
          </div>
          {quote.receivedAt && (
            <div className="flex gap-2">
              <span className="font-semibold text-gray-700 min-w-[80px]">Fecha:</span>
              <span className="text-gray-600">
                {formatDate ? formatDate(quote.receivedAt) : new Date(quote.receivedAt).toLocaleString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cuerpo del email */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Mensaje:</p>
        <div className="bg-white rounded p-4 border border-gray-100">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {quote.emailBody || 'Sin contenido de email'}
          </pre>
        </div>
      </div>

      {/* Enlace al mail completo si existe */}
      {quote.mailId && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="w-4 h-4" />}
            onClick={() => {
              // Aquí podrías abrir el mail completo en un modal o ventana
              console.log('Abrir mail completo:', quote.mailId);
            }}
          >
            Ver email completo en bandeja de entrada
          </Button>
        </div>
      )}
    </div>
  );
};

const AttachmentsTab = ({ quote }) => {
  if (!quote.hasAttachments || !quote.attachmentCount || quote.attachmentCount === 0) {
    return (
      <div className="text-center py-12">
        <Paperclip className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">No hay adjuntos en este presupuesto</p>
        <p className="text-sm text-gray-500 mt-1">
          El presupuesto fue enviado en el cuerpo del email
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Este presupuesto incluye {quote.attachmentCount} archivo(s) adjunto(s)
      </p>

      {/* Lista de adjuntos */}
      {quote.attachments && quote.attachments.length > 0 ? (
        <div className="space-y-3">
          {quote.attachments.map((attachment, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <Paperclip className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {attachment.filename || `Adjunto ${idx + 1}`}
                    </p>
                    {attachment.size && (
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {attachment.url && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<ExternalLink className="w-4 h-4" />}
                        onClick={() => window.open(attachment.url, '_blank')}
                      >
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = attachment.url;
                          link.download = attachment.filename || 'adjunto';
                          link.click();
                        }}
                      >
                        Descargar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Preview del contenido si está disponible */}
              {attachment.text && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Vista previa del contenido:
                  </p>
                  <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                      {attachment.text.substring(0, 500)}
                      {attachment.text.length > 500 && '...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Los adjuntos están disponibles pero aún no se han procesado.
            Los archivos se encuentran almacenados en el email original.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuoteDetailTabs;
