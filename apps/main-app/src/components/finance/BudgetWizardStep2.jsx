import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Plus, X } from 'lucide-react';
import { Card, Button } from '../ui';

export default function BudgetWizardStep2({ data, onUpdate, wantedServices = [], t }) {
  const [customService, setCustomService] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const commonServices = [
    { key: 'catering', label: 'Catering', icon: '🍽️' },
    { key: 'lugares', label: 'Lugares', icon: '🏰' },
    { key: 'fotografia', label: 'Fotografía', icon: '📸' },
    { key: 'video', label: 'Vídeo', icon: '🎥' },
    { key: 'musica', label: 'Música', icon: '🎵' },
    { key: 'dj', label: 'DJ', icon: '🎧' },
    { key: 'flores-decoracion', label: 'Flores y Decoración', icon: '💐' },
    { key: 'decoracion', label: 'Decoración', icon: '✨' },
    { key: 'vestidos-trajes', label: 'Vestidos y Trajes', icon: '👗' },
    { key: 'belleza', label: 'Belleza', icon: '💄' },
    { key: 'joyeria', label: 'Joyería', icon: '💍' },
    { key: 'tartas', label: 'Tartas de Boda', icon: '🎂' },
    { key: 'invitaciones', label: 'Invitaciones', icon: '💌' },
    { key: 'detalles', label: 'Detalles de Boda', icon: '🎁' },
    { key: 'transporte', label: 'Transporte', icon: '🚗' },
    { key: 'animacion', label: 'Animación', icon: '🎪' },
    { key: 'iglesia', label: 'Iglesia', icon: '⛪' },
    { key: 'organizacion', label: 'Organización', icon: '📋' },
  ];

  useEffect(() => {
    const preselected = commonServices
      .filter(service => 
        wantedServices.some(ws => 
          ws.toLowerCase().includes(service.key) || 
          service.label.toLowerCase().includes(ws.toLowerCase())
        )
      )
      .map(s => s.label);
    
    const custom = wantedServices.filter(ws => 
      !commonServices.some(cs => 
        ws.toLowerCase().includes(cs.key) || 
        cs.label.toLowerCase().includes(ws.toLowerCase())
      )
    );

    if (data.selectedServices.length === 0 && (preselected.length > 0 || custom.length > 0)) {
      onUpdate({ selectedServices: [...preselected, ...custom] });
    }
  }, [wantedServices]);

  const toggleService = (serviceName) => {
    const isSelected = data.selectedServices.includes(serviceName);
    const updated = isSelected
      ? data.selectedServices.filter(s => s !== serviceName)
      : [...data.selectedServices, serviceName];
    
    onUpdate({ selectedServices: updated });
  };

  const addCustomService = () => {
    if (customService.trim() && !data.selectedServices.includes(customService.trim())) {
      onUpdate({ 
        selectedServices: [...data.selectedServices, customService.trim()] 
      });
      setCustomService('');
      setShowCustomInput(false);
    }
  };

  const removeCustomService = (serviceName) => {
    const updated = data.selectedServices.filter(s => s !== serviceName);
    onUpdate({ selectedServices: updated });
  };

  const isCommonService = (serviceName) => {
    return commonServices.some(cs => cs.label === serviceName);
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card className="p-4 bg-[var(--color-primary-10)] border-[color:var(--color-primary-30)]">
        <p className="text-sm text-[color:var(--color-primary)]">
          {t('finance.wizard.step2.info', { 
            defaultValue: 'Selecciona los servicios que necesitas para tu boda. Te ayudaremos a distribuir el presupuesto.' 
          })}
        </p>
      </Card>

      {/* Common Services Grid */}
      <div>
        <h4 className="text-sm font-semibold text-body mb-3">
          {t('finance.wizard.step2.commonServices', { defaultValue: 'Servicios Comunes' })}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commonServices.map((service) => {
            const isSelected = data.selectedServices.includes(service.label);
            return (
              <button
                key={service.key}
                type="button"
                onClick={() => toggleService(service.label)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-[color:var(--color-primary)] bg-[var(--color-primary-10)]'
                    : 'border-[color:var(--color-text-20)] hover:border-[color:var(--color-primary-30)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{service.icon}</span>
                  {isSelected ? (
                    <CheckCircle className="w-5 h-5 text-[color:var(--color-primary)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[color:var(--color-text-30)]" />
                  )}
                </div>
                <div className={`text-sm font-medium ${
                  isSelected ? 'text-[color:var(--color-primary)]' : 'text-body'
                }`}>
                  {service.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-body">
            {t('finance.wizard.step2.customServices', { defaultValue: 'Servicios Personalizados' })}
          </h4>
          {!showCustomInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              leftIcon={<Plus size={14} />}
            >
              {t('finance.wizard.step2.addCustom', { defaultValue: 'Añadir' })}
            </Button>
          )}
        </div>

        {showCustomInput && (
          <Card className="p-3 mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
                placeholder={t('finance.wizard.step2.customPlaceholder', { 
                  defaultValue: 'Ej: Animación infantil' 
                })}
                className="flex-1 px-3 py-2 border border-[color:var(--color-text-20)] rounded-md focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent bg-[var(--color-surface)] text-[color:var(--color-text)]"
                autoFocus
              />
              <Button size="sm" onClick={addCustomService}>
                {t('app.add', { defaultValue: 'Añadir' })}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomService('');
                }}
              >
                {t('app.cancel', { defaultValue: 'Cancelar' })}
              </Button>
            </div>
          </Card>
        )}

        {/* Lista de servicios personalizados seleccionados */}
        {data.selectedServices.filter(s => !isCommonService(s)).length > 0 && (
          <div className="space-y-2">
            {data.selectedServices
              .filter(s => !isCommonService(s))
              .map((service) => (
                <Card key={service} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[color:var(--color-success)]" />
                      <span className="text-sm font-medium text-body">{service}</span>
                    </div>
                    <button
                      onClick={() => removeCustomService(service)}
                      className="p-1 hover:bg-[var(--color-danger-10)] rounded-md text-[color:var(--color-danger)]"
                      aria-label={t('app.delete', { defaultValue: 'Eliminar' })}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Selected Count */}
      <Card className="p-4 bg-[var(--color-success-10)] border-[color:var(--color-success-30)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[color:var(--color-success)]">
            {t('finance.wizard.step2.selectedCount', { 
              count: data.selectedServices.length,
              defaultValue: `${data.selectedServices.length} servicios seleccionados` 
            })}
          </span>
          {data.selectedServices.length > 0 && (
            <CheckCircle className="w-5 h-5 text-[color:var(--color-success)]" />
          )}
        </div>
      </Card>
    </div>
  );
}
