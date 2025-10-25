import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Clock,
  Bell,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  X,
  BellOff,
  Settings,
  Calendar,
  Users,
  Music,
} from 'lucide-react';
import { toast } from 'react-toastify';

import PageWrapper from '../../components/PageWrapper';
import { Card } from '../../components/ui';
import { Button } from '../../components/ui';
import Badge from '../../components/ui/Badge';
import useTimeline from '../../hooks/useTimeline';
import { formatTime } from '../../utils/dateUtils';
import { useTranslations } from '../../hooks/useTranslations';

const Timeline = () => {
  const { t } = useTranslations();

  const {
    blocks,
    alerts,
    automaticAlerts,
    syncInProgress,
    updateBlock,
    addBlock,
    removeBlock,
    reorderBlocks,
    setBlockStatus,
    addAlert,
    acknowledgeAlert,
    removeAlert,
    setAutomaticAlerts,
    calculateBlockTiming,
    validateSchedule,
    getTimelineSummary,
    BLOCK_STATES,
    STATE_COLORS,
  } = useTimeline();

  const [expandedBlock, setExpandedBlock] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockData, setNewBlockData] = useState({
    name: '',
    startTime: '',
    endTime: '',
  });
  const [alertsExpanded, setAlertsExpanded] = useState(true);
  const [scheduleIssuesExpanded, setScheduleIssuesExpanded] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar hora actual cada minuto en modo live
  useEffect(() => {
    if (!liveMode) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [liveMode]);

  // Resumen del timeline
  const summary = useMemo(() => getTimelineSummary(), [getTimelineSummary]);

  // Validación de horarios
  const scheduleIssues = useMemo(() => validateSchedule(), [validateSchedule]);

  // Manejar drag & drop
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.index !== destination.index) {
      reorderBlocks(source.index, destination.index);
      toast.info('Bloques reordenados');
    }
  }, [reorderBlocks]);

  // Añadir nuevo bloque
  const handleAddBlock = useCallback(() => {
    const { name, startTime, endTime } = newBlockData;
    
    if (!name || !startTime || !endTime) {
      toast.error('Completa todos los campos del bloque');
      return;
    }

    // Validar formato de hora
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      toast.error({t('common.formato_hora_invalido_hhmm')});
      return;
    }

    addBlock(name, startTime, endTime);
    setNewBlockData({ name: '', startTime: '', endTime: '' });
    setShowAddBlock(false);
    toast.success(`Bloque "${name}" añadido`);
  }, [newBlockData, addBlock]);

  // Actualizar horarios de un bloque
  const handleUpdateBlockTime = useCallback((blockId, field, value) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(value)) {
      toast.error({t('common.formato_hora_invalido_hhmm')});
      return;
    }

    updateBlock(blockId, { [field]: value });
  }, [updateBlock]);

  // Cambiar estado del bloque
  const handleStatusChange = useCallback((blockId, status) => {
    setBlockStatus(blockId, status);
    
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const statusText = {
        [BLOCK_STATES.ON_TIME]: 'a tiempo',
        [BLOCK_STATES.SLIGHTLY_DELAYED]: 'con ligero retraso',
        [BLOCK_STATES.DELAYED]: 'retrasado',
      };
      toast.info(`${block.name} marcado como ${statusText[status]}`);
    }
  }, [setBlockStatus, blocks, BLOCK_STATES]);

  // Generar alerta manual
  const handleAddManualAlert = useCallback(() => {
    const message = prompt('Mensaje de la alerta:');
    if (message) {
      addAlert('info', message);
      toast.success({t('common.alerta_anadida')});
    }
  }, [addAlert]);

  // Renderizar badge de estado
  const renderStatusBadge = useCallback((status) => {
    const config = {
      [BLOCK_STATES.ON_TIME]: { type: 'success', label: 'A tiempo' },
      [BLOCK_STATES.SLIGHTLY_DELAYED]: { type: 'warning', label: 'Ligero retraso' },
      [BLOCK_STATES.DELAYED]: { type: 'error', label: 'Retrasado' },
    };

    const { type, label } = config[status] || { type: 'default', label: 'Desconocido' };
    
    return <Badge type={type}>{label}</Badge>;
  }, [BLOCK_STATES]);

  // Renderizar momento del timeline
  const renderMoment = useCallback((moment, index) => (
    <div key={moment.id} className="flex items-center gap-2 py-1 px-2 text-xs hover:bg-gray-50 rounded">
      <span className="text-gray-400 font-mono">{moment.time || '--:--'}</span>
      <span className="flex-1">
        {moment.title}
        {moment.song && <Music className="inline ml-1" size={10} />}
      </span>
      {moment.responsible && (
        <span className="text-gray-500 italic">({moment.responsible})</span>
      )}
      <Badge type={moment.status === 'confirmado' ? 'success' : 'default'} size="xs">
        {moment.status}
      </Badge>
    </div>
  ), []);

  return (
    <PageWrapper
      title={t('common.timeline_del_dia')}
      subtitle="Gestiona el cronograma completo del evento"
      icon={Clock}
    >
      {/* Panel de resumen */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Bloque activo</div>
            <div className="font-bold text-lg">
              {summary.activeBlock ? summary.activeBlock.name : 'Ninguno'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Estado general</div>
            <div className="font-bold text-lg">
              {summary.delayedBlocks.length === 0 ? (
                <span className="text-green-600">Todo a tiempo</span>
              ) : (
                <span className="text-yellow-600">
                  {summary.delayedBlocks.length} con retraso
                </span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Alertas activas</div>
            <div className="font-bold text-lg text-orange-600">
              {summary.unacknowledgedAlerts.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Hora actual</div>
            <div className="font-bold text-lg font-mono">
              {currentTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>

        {/* Controles generales */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={liveMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setLiveMode(!liveMode)}
          >
            {liveMode ? <Pause size={14} /> : <Play size={14} />}
            Modo {liveMode ? 'live' : {t('common.estatico')}}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutomaticAlerts(!automaticAlerts)}
          >
            {automaticAlerts ? <Bell size={14} /> : <BellOff size={14} />}
            Alertas {automaticAlerts ? {t('common.automaticas')} : 'manuales'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddManualAlert}
          >
            <Plus size={14} />
            Añadir alerta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            disabled={syncInProgress}
          >
            <RefreshCw size={14} className={syncInProgress ? 'animate-spin' : ''} />
            {syncInProgress ? 'Sincronizando...' : 'Recargar'}
          </Button>
        </div>
      </Card>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setAlertsExpanded(!alertsExpanded)}
          >
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              Alertas ({summary.unacknowledgedAlerts.length} activas)
            </h3>
            {alertsExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>

          {alertsExpanded && (
            <div className="mt-4 space-y-2">
              {alerts
                .filter(alert => !alert.acknowledged)
                .map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      alert.type === 'error' ? 'bg-red-50 border-red-200' :
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle 
                        className={
                          alert.type === 'error' ? 'text-red-500' :
                          alert.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        } 
                        size={20} 
                      />
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString('es-ES')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Marcar como vista"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar alerta"
                        type="button"
                        aria-label="Eliminar alerta"
                      >
                        <X size={20} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Problemas de horario */}
      {scheduleIssues.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setScheduleIssuesExpanded(!scheduleIssuesExpanded)}
          >
            <h3 className="font-semibold flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="text-yellow-600" size={20} />
              Problemas de horario detectados ({scheduleIssues.length})
            </h3>
            {scheduleIssuesExpanded ? <ChevronUp /> : <ChevronDown />}
          </div>

          {scheduleIssuesExpanded && (
            <div className="mt-4 space-y-2">
              {scheduleIssues.map((issue, index) => (
                <div key={index} className="text-sm text-yellow-800">
                  • {issue.message}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Timeline con drag & drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {blocks.map((block, index) => {
                const timing = calculateBlockTiming(block);
                const isExpanded = expandedBlock === block.id;
                const isEditing = editingBlock === block.id;

                return (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`mb-4 ${
                          snapshot.isDragging ? 'shadow-xl opacity-90' : ''
                        } ${
                          timing.isActive ? 'border-2 border-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              {...provided.dragHandleProps} 
                              className="cursor-grab"
                              title="Arrastrar para reordenar"
                            >
                              <GripVertical className="text-gray-400" />
                            </div>

                            <div>
                              <div className="font-semibold text-lg">{block.name}</div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={block.startTime}
                                      onChange={(e) => 
                                        handleUpdateBlockTime(block.id, 'startTime', e.target.value)
                                      }
                                      className="w-20 px-2 py-1 border rounded"
                                      placeholder="HH:MM"
                                    />
                                    <span>-</span>
                                    <input
                                      type="text"
                                      value={block.endTime}
                                      onChange={(e) => 
                                        handleUpdateBlockTime(block.id, 'endTime', e.target.value)
                                      }
                                      className="w-20 px-2 py-1 border rounded"
                                      placeholder="HH:MM"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Clock size={14} />
                                    <span className="font-mono">
                                      {block.startTime} - {block.endTime}
                                    </span>
                                  </>
                                )}

                                {timing.isActive && (
                                  <Badge type="info" size="sm">
                                    ACTIVO - {timing.minutesRemaining} min restantes
                                  </Badge>
                                )}
                                {timing.isPast && block.status === BLOCK_STATES.DELAYED && (
                                  <Badge type="error" size="sm">
                                    Excedido por {timing.minutesExceeded} min
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Selector de estado */}
                            <select
                              value={block.status}
                              onChange={(e) => handleStatusChange(block.id, e.target.value)}
                              className={`px-2 py-1 rounded text-sm border ${
                                block.status === BLOCK_STATES.ON_TIME ? 'border-green-400 bg-green-50' :
                                block.status === BLOCK_STATES.SLIGHTLY_DELAYED ? 'border-yellow-400 bg-yellow-50' :
                                'border-red-400 bg-red-50'
                              }`}
                            >
                              <option value={BLOCK_STATES.ON_TIME}>✅ A tiempo</option>
                              <option value={BLOCK_STATES.SLIGHTLY_DELAYED}>⚠️ Ligero retraso</option>
                              <option value={BLOCK_STATES.DELAYED}>❌ Retrasado</option>
                            </select>

                            {/* Botones de acción */}
                            <button
                              onClick={() => setEditingBlock(isEditing ? null : block.id)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title={isEditing ? 'Guardar' : 'Editar horarios'}
                            >
                              {isEditing ? <CheckCircle size={18} /> : <Edit2 size={18} />}
                            </button>

                            <button
                              onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                              title={isExpanded ? 'Contraer' : 'Expandir'}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {!['ceremonia', 'coctel', 'banquete', 'fiesta'].includes(block.id) && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar el bloque "${block.name}"?`)) {
                                    removeBlock(block.id);
                                    toast.success('Bloque eliminado');
                                  }
                                }}
                                className="p-1 text-gray-500 hover:text-red-600"
                                title="Eliminar bloque"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Momentos del bloque (expandido) */}
                        {isExpanded && block.moments.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <div className="text-sm font-medium mb-2 text-gray-700">
                              Momentos ({block.moments.length})
                            </div>
                            <div className="space-y-1">
                              {block.moments.map((moment, idx) => renderMoment(moment, idx))}
                            </div>
                          </div>
                        )}

                        {/* Resumen de momentos (contraído) */}
                        {!isExpanded && block.moments.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {block.moments.length} momentos · 
                            {block.moments.filter(m => m.status === 'confirmado').length} confirmados
                          </div>
                        )}
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Añadir nuevo bloque */}
      <Card className="border-dashed border-2 border-gray-300">
        {!showAddBlock ? (
          <button
            onClick={() => setShowAddBlock(true)}
            className="w-full py-4 text-gray-600 hover:text-blue-600 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Añadir nuevo bloque
          </button>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nombre del bloque"
                value={newBlockData.name}
                onChange={(e) => setNewBlockData({ ...newBlockData, name: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Hora inicio (HH:MM)"
                value={newBlockData.startTime}
                onChange={(e) => setNewBlockData({ ...newBlockData, startTime: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Hora fin (HH:MM)"
                value={newBlockData.endTime}
                onChange={(e) => setNewBlockData({ ...newBlockData, endTime: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddBlock} variant="primary" size="sm">
                  <CheckCircle size={16} />
                  Añadir
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddBlock(false);
                    setNewBlockData({ name: '', startTime: '', endTime: '' });
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  <X size={16} />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </PageWrapper>
  );
};

export default Timeline;
